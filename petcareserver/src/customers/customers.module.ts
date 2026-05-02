import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerHistory } from './entities/customer-history.entity';
import { Pet } from '../pets/entities/pet.entity';
import { PetWeightHistory } from '../pets/entities/pet-weight-history.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerHistory, Pet, PetWeightHistory]),
    CloudinaryModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [TypeOrmModule, CustomersService],
})
export class CustomersModule {}
