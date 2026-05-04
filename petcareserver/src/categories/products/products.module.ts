import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { ProductHistory } from '../entities/product-history.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, ProductHistory]), NotificationsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule],
})
export class ProductsModule {}
