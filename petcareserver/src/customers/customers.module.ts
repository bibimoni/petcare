import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerHistory } from './entities/customer-history.entity';
import { Pet } from '../pets/entities/pet.entity';
import { PetWeightHistory } from '../pets/entities/pet-weight-history.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { Product } from '../categories/entities/product.entity';
import { Service } from '../categories/entities/service.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerHistory,
      Pet,
      PetWeightHistory,
      Order,
      OrderDetail,
      Product,
      Service,
    ]),
    CloudinaryModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [TypeOrmModule, CustomersService],
})
export class CustomersModule {}
