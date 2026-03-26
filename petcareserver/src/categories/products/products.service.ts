import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByProduct(storeId: number, productId: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: {
        product_id: productId,
        store_id: storeId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
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
      throw new NotFoundException('Product not found');
    }

    const { cost_price: undefined, ...safeProduct } = product;
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

  async createProduct(
    storeId: number,
    createProductDto: CreateProductDto,
    expiryWarningDays: number,
  ) {
    if (
      createProductDto.expiry_date &&
      new Date(createProductDto.expiry_date) < new Date()
    ) {
      throw new BadRequestException('Expiry date cannot be in the past');
    }

    if (createProductDto.cost_price >= createProductDto.sell_price) {
      throw new BadRequestException(
        'Cost price cannot be greater than or equal to sell price',
      );
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

    return savedProduct;
  }

  async updateProduct(
    storeId: number,
    productId: number,
    updateProductDto: UpdateProductDto,
    expiryWarningDays: number,
  ): Promise<Product> {
    const product = await this.findByProduct(storeId, productId);

    if (
      updateProductDto.expiry_date &&
      new Date(updateProductDto.expiry_date) < new Date()
    ) {
      throw new BadRequestException('Expiry date cannot be in the past');
    }

    const effectiveCostPrice =
      updateProductDto.cost_price ?? product.cost_price;
    const effectiveSellPrice =
      updateProductDto.sell_price ?? product.sell_price;

    if (effectiveCostPrice >= effectiveSellPrice) {
      throw new BadRequestException(
        'Cost price cannot be greater than or equal to sell price',
      );
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    await this.checkAndCreateNotifications(
      storeId,
      updatedProduct,
      expiryWarningDays,
    );

    return updatedProduct;
  }

  async deleteProduct(storeId: number, productId: number): Promise<void> {
    const product = await this.findByProduct(storeId, productId);

    await this.productRepository.delete({
      product_id: product.product_id,
      store_id: product.store_id,
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
          // Sản phẩm đã hết hạn
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
          // Sản phẩm sắp hết hạn
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
