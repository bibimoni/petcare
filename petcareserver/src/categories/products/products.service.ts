import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import {
  ProductHistory,
  ProductHistoryAction,
} from '../entities/product-history.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';

const PRODUCT_TRACKED_FIELDS = [
  'name',
  'cost_price',
  'sell_price',
  'stock_quantity',
  'status',
  'category_id',
  'description',
  'image_url',
] as const;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductHistory)
    private readonly productHistoryRepository: Repository<ProductHistory>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    storeId: number | null,
    isAdmin: boolean,
    filters?: {
      search?: string;
      category_id?: number;
      status?: ProductStatus;
      low_stock?: boolean;
    },
  ): Promise<Product[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .orderBy('product.created_at', 'DESC');

    if (!isAdmin && storeId) {
      query.where('product.store_id = :storeId', { storeId });
    }

    if (filters?.search) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:search)', {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.category_id) {
      query.andWhere('product.category_id = :categoryId', {
        categoryId: filters.category_id,
      });
    }

    if (filters?.status) {
      query.andWhere('product.status = :status', { status: filters.status });
    }

    if (filters?.low_stock) {
      query.andWhere('product.stock_quantity <= product.min_stock_level');
    }

    return query.getMany();
  }

  async findByProduct(storeId: number, productId: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: {
        product_id: productId,
        store_id: storeId,
      },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return product;
  }

  async findProductByStaff(
    storeId: number,
    productId: number,
  ): Promise<Partial<Product>> {
    const product = await this.productRepository.findOne({
      where: {
        product_id: productId,
        store_id: storeId,
      },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const { cost_price: _cost_price, ...safeProduct } = product;
    return safeProduct;
  }

  async getProductsByCategory(
    storeId: number,
    categoryId: number,
  ): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        store_id: storeId,
        category_id: categoryId,
      },
    });
  }

  async countProducts(storeId: number): Promise<{ total: number }> {
    const total = await this.productRepository.count({
      where: { store_id: storeId },
    });
    return { total };
  }

  async createProduct(
    storeId: number,
    createProductDto: CreateProductDto,
    expiryWarningDays: number,
    performedBy?: number,
    performedByName?: string,
  ) {
    if (
      createProductDto.expiry_date &&
      new Date(createProductDto.expiry_date) < new Date()
    ) {
      throw new BadRequestException('Ngày hết hạn không thể trong quá khứ');
    }

    if (createProductDto.cost_price >= createProductDto.sell_price) {
      throw new BadRequestException(
        'Giá vốn không thể lớn hơn hoặc bằng giá bán',
      );
    }

    const category = await this.categoryRepository.findOne({
      where: { category_id: createProductDto.category_id, store_id: storeId },
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      store_id: storeId,
    });

    const savedProduct = await this.productRepository.save(product);

    await this.checkAndCreateNotifications(
      storeId,
      savedProduct,
      expiryWarningDays,
    );

    await this.productHistoryRepository.save({
      product_id: savedProduct.product_id,
      store_id: storeId,
      action: ProductHistoryAction.CREATED,
      performed_by: performedBy ?? null,
      performed_by_name: performedByName ?? null,
      old_values: null,
      new_values: this.extractTrackedFields(savedProduct),
    });

    return savedProduct;
  }

  async updateProduct(
    storeId: number,
    productId: number,
    updateProductDto: UpdateProductDto,
    expiryWarningDays: number,
    performedBy?: number,
    performedByName?: string,
  ): Promise<Product> {
    const product = await this.findByProduct(storeId, productId);

    if (
      updateProductDto.expiry_date &&
      new Date(updateProductDto.expiry_date) < new Date()
    ) {
      throw new BadRequestException('Ngày hết hạn không thể trong quá khứ');
    }

    const effectiveCostPrice =
      updateProductDto.cost_price ?? product.cost_price;
    const effectiveSellPrice =
      updateProductDto.sell_price ?? product.sell_price;

    if (effectiveCostPrice >= effectiveSellPrice) {
      throw new BadRequestException(
        'Giá vốn không thể lớn hơn hoặc bằng giá bán',
      );
    }

    if (updateProductDto.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { category_id: updateProductDto.category_id, store_id: storeId },
      });
      if (!category) {
        throw new NotFoundException('Không tìm thấy danh mục');
      }
    }

    const oldValues = this.extractTrackedFields(product);

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    await this.checkAndCreateNotifications(
      storeId,
      updatedProduct,
      expiryWarningDays,
    );

    await this.productHistoryRepository.save({
      product_id: updatedProduct.product_id,
      store_id: storeId,
      action: ProductHistoryAction.UPDATED,
      performed_by: performedBy ?? null,
      performed_by_name: performedByName ?? null,
      old_values: oldValues,
      new_values: this.extractTrackedFields(updatedProduct),
    });

    return updatedProduct;
  }

  async deleteProduct(
    storeId: number,
    productId: number,
    performedBy?: number,
    performedByName?: string,
  ): Promise<void> {
    const product = await this.findByProduct(storeId, productId);

    await this.productHistoryRepository.save({
      product_id: product.product_id,
      store_id: storeId,
      action: ProductHistoryAction.DELETED,
      performed_by: performedBy ?? null,
      performed_by_name: performedByName ?? null,
      old_values: this.extractTrackedFields(product),
      new_values: null,
    });

    await this.productRepository.delete({
      product_id: product.product_id,
      store_id: product.store_id,
    });
  }

  async getHistory(storeId: number, productId: number) {
    return this.productHistoryRepository.find({
      where: { product_id: productId, store_id: storeId },
      order: { created_at: 'DESC' },
    });
  }

  async getInventoryValue(storeId: number): Promise<number> {
    const products = await this.productRepository.find({
      where: { store_id: storeId },
    });

    return products.reduce((total, p) => {
      return total + Number(p.stock_quantity) * Number(p.cost_price);
    }, 0);
  }

  async getLowStockOrExpiringProducts(
    storeId: number,
    minStock: number,
    daysToExpiry: number,
  ): Promise<Product[]> {
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + daysToExpiry);

    return this.productRepository.find({
      where: [
        { store_id: storeId, stock_quantity: LessThan(minStock) },
        {
          store_id: storeId,
          expiry_date: Between(now, soon),
        },
      ],
    });
  }

  async geteachProductSum(storeId: number, categoryId: number) {
    const products = await this.productRepository.find({
      where: {
        store_id: storeId,
        category_id: categoryId,
      },
    });

    return products.map((p) => ({
      product_id: p.product_id,
      name: p.name,
      total_value: Number(p.stock_quantity) * Number(p.cost_price),
    }));
  }

  private extractTrackedFields(product: Product): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key of PRODUCT_TRACKED_FIELDS) {
      result[key] = (product as any)[key];
    }
    return result;
  }

  private async checkAndCreateNotifications(
    storeId: number,
    product: Product,
    expiryWarningDays: number,
  ): Promise<void> {
    try {
      if (product.stock_quantity === 0) {
        const alreadyNotified =
          await this.notificationsService.hasNotificationToday(
            storeId,
            product.product_id,
            NotificationType.OUT_OF_STOCK,
          );

        if (!alreadyNotified) {
          await this.notificationsService.createOutOfStockNotification(
            storeId,
            product,
          );
        }
      } else if (product.stock_quantity <= product.min_stock_level) {
        const alreadyNotified =
          await this.notificationsService.hasNotificationToday(
            storeId,
            product.product_id,
            NotificationType.LOW_STOCK,
          );

        if (!alreadyNotified) {
          await this.notificationsService.createLowStockNotification(
            storeId,
            product,
          );
        }
      }

      if (product.expiry_date) {
        const now = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysUntilExpiry = Math.floor(
          (product.expiry_date.getTime() - now.getTime()) / msPerDay,
        );

        if (daysUntilExpiry < 0) {
          const alreadyNotified =
            await this.notificationsService.hasNotificationToday(
              storeId,
              product.product_id,
              NotificationType.EXPIRED,
            );

          if (!alreadyNotified) {
            await this.notificationsService.createExpiredNotification(
              storeId,
              product,
            );
          }
        } else if (daysUntilExpiry <= expiryWarningDays) {
          const alreadyNotified =
            await this.notificationsService.hasNotificationToday(
              storeId,
              product.product_id,
              NotificationType.EXPIRY_WARNING,
            );

          if (!alreadyNotified) {
            await this.notificationsService.createExpiryWarningNotification(
              storeId,
              product,
            );
          }
        }
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
}
