import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Pet } from './entities/pet.entity';
import { PetWeightHistory } from './entities/pet-weight-history.entity';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Pet, PetWeightHistory])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService, TypeOrmModule],
})
export class CustomersModule {}
// @Module({
//   imports: [TypeOrmModule.forFeature([Customer, Pet, PetWeightHistory])],
//   exports: [TypeOrmModule],
// })
// export class CustomersModule {}