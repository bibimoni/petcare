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
    return this.productRepository.save(product);
  }

  async updateProduct(
    storeId: number,
    productId: number,
    updateProductDto: UpdateProductDto,
  ) {
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
}
