import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Service } from '../entities/service.entity';
import { Category } from '../entities/category.entity';
import { ServiceHistory } from '../entities/service-history.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Category, ServiceHistory])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [TypeOrmModule],
})
export class ServicesModule {}
