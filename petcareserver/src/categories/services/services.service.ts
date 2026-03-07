import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async findByService(storeId: number, serviceId: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: {
        id: serviceId,
        store_id: storeId,
      },
    });
    if (!service) {
      throw new BadRequestException('Service not found');
    }
    return service;
  }

  async create(storeID: number, createServiceDto: CreateServiceDto) {
    if (createServiceDto.min_weight && createServiceDto.max_weight) {
      if (createServiceDto.min_weight > createServiceDto.max_weight) {
        throw new BadRequestException(
          'Minimum weight cannot be greater than maximum weight',
        );
      }
    }
    const service = this.serviceRepository.create({
      ...createServiceDto,
      store_id: storeID,
    });
    return this.serviceRepository.save(service);
  }

  async updateService(
    storeId: number,
    serviceId: number,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.findByService(storeId, serviceId);
    if (updateServiceDto.min_weight && updateServiceDto.max_weight) {
      if (updateServiceDto.min_weight > updateServiceDto.max_weight) {
        throw new BadRequestException(
          'Minimum weight cannot be greater than maximum weight',
        );
      }
    }
    Object.assign(service, updateServiceDto);
    return await this.serviceRepository.save(service);
  }

  async getAll(storeId: number, categoryId: number): Promise<Service[]> {
    return this.serviceRepository.find({
      where: {
        store_id: storeId,
        category_id: categoryId,
      },
    });
  }

  async deleteService(storeId: number, serviceId: number): Promise<void> {
    const service = await this.findByService(storeId, serviceId);
    if (!service) {
      throw new BadRequestException('Service not found');
    }
    await this.serviceRepository.delete({
      id: service.id,
      store_id: service.store_id,
    });
  }
}
