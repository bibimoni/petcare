import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Pet } from './entities/pet.entity';
import { PetWeightHistory } from './entities/pet-weight-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Pet, PetWeightHistory])],
  exports: [TypeOrmModule],
})
export class CustomersModule {}
