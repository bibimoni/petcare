import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UserRole } from '../../common/enum';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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

  async createProduct(storeId: number, createProductDto: CreateProductDto) {
    if (
      createProductDto.min_stock_level &&
      createProductDto.stock_quantity < createProductDto.min_stock_level
    ) {
      throw new BadRequestException(
        'Stock quantity cannot be less than minimum stock level',
      );
    }

    if (
      createProductDto.expiry_date &&
      new Date(createProductDto.expiry_date) < new Date()
    ) {
      throw new BadRequestException('Expiry date cannot be in the past');
    }

    if (createProductDto.cost_price < createProductDto.sell_price) {
      throw new BadRequestException(
        'Cost price cannot be less than sell price',
      );
    }

    const product = this.productRepository.create({
      ...createProductDto,
      store_id: storeId,
    });
    return this.productRepository.save(product);
  }

  async updateProduct(
    storeId: number,
    productId: number,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.findByProduct(storeId, productId);

    if (
      updateProductDto.min_stock_level &&
      updateProductDto.stock_quantity &&
      updateProductDto.stock_quantity < updateProductDto.min_stock_level
    ) {
      throw new BadRequestException(
        'Stock quantity cannot be less than minimum stock level',
      );
    }

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
    return await this.productRepository.save(product);
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
    return products.reduce(
      (sum, p) => sum + Number(p.stock_quantity) * Number(p.cost_price),
      0,
    );
  }

  async getLowStockOrExpiringProducts(): Promise<Product[]> {
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 30);
    return this.productRepository.find({
      where: [{ stock_quantity: LessThan(5) }, { expiry_date: LessThan(soon) }],
    });
  }

  async getProductsByRole(role: UserRole) {
    const products = await this.productRepository.find();
    if (role === UserRole.ADMIN) {
      return products.map((p) => ({
        ...p,
        expected_profit: Number(p.sell_price) - Number(p.cost_price),
      }));
    }
    // Nhân viên chỉ thấy tên, số lượng tồn, giá bán
    return products.map(({ name, stock_quantity, sell_price }) => ({
      name,
      stock_quantity,
      sell_price,
    }));
  }
}
