import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Pet } from './entities/pet.entity';
import { PetWeightHistory } from './entities/pet-weight-history.entity';
<<<<<<< HEAD
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Pet, PetWeightHistory]),
    CloudinaryModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [TypeOrmModule, CustomersService],
=======

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Pet, PetWeightHistory])],
  exports: [TypeOrmModule],
>>>>>>> 01e097d (fix: change directory backend frontend)
})
export class CustomersModule {}
