import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { NotificationsService } from '../../notifications/notifications.service';

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

  async createProduct(storeId: number, createProductDto: CreateProductDto) {
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

    await this.checkAndCreateNotifications(storeId, product);

    return this.productRepository.save(product);
  }

  async updateProduct(
    storeId: number,
    productId: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findByProduct(storeId, productId);
    if (
      updateProductDto.expiry_date &&
      new Date(updateProductDto.expiry_date) < new Date()
    ) {
      throw new BadRequestException('Expiry date cannot be in the past');
    }

    if (
      updateProductDto.cost_price &&
      updateProductDto.sell_price &&
      updateProductDto.cost_price < updateProductDto.sell_price
    ) {
      throw new BadRequestException(
        'Cost price cannot be less than sell price',
      );
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    await this.checkAndCreateNotifications(storeId, updatedProduct);

    return updatedProduct;
  }

  async deleteProduct(storeId: number, productId: number): Promise<void> {
    const product = await this.findByProduct(storeId, productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    await this.productRepository.delete({
      product_id: product.product_id,
      store_id: product.store_id,
    });
  }

  async getInventoryValue(): Promise<number> {
    const products = await this.productRepository.find();
    return products.reduce((total, p) => {
      return total + Number(p.stock_quantity) * Number(p.cost_price);
    }, 0);
  }

  async getLowStockOrExpiringProducts(): Promise<Product[]> {
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 30);
    return this.productRepository.find({
      where: [{ stock_quantity: LessThan(3) }, { expiry_date: LessThan(soon) }],
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
  ): Promise<void> {
    try {
      if (product.stock_quantity === 0) {
        await this.notificationsService.createOutOfStockNotification(
          storeId,
          product,
        );
      }

      if (product.stock_quantity <= product.min_stock_level) {
        await this.notificationsService.createLowStockNotification(
          storeId,
          product,
        );
      }

      if (product.expiry_date) {
        const now = new Date();
        const daysUntilExpiry = Math.floor(
          (product.expiry_date.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
          await this.notificationsService.createExpiryWarningNotification(
            storeId,
            product,
          );
        }
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
}
