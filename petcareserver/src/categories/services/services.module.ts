import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Service } from '../entities/service.entity';
import { Category } from '../entities/category.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Category])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [TypeOrmModule],
})
export class ServicesModule {}
