import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { PetWeightHistory } from './entities/pet-weight-history.entity';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { Customer } from 'src/customers/entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Pet, PetWeightHistory])],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [PetsService, TypeOrmModule],
})
export class PetsModule {}
