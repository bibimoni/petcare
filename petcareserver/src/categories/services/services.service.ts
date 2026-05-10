import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service, ServiceStatus } from '../entities/service.entity';
import { Category } from '../entities/category.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import {
  ServiceHistory,
  ServiceHistoryAction,
} from '../entities/service-history.entity';

const SERVICE_TRACKED_FIELDS = [
  'combo_name',
  'price',
  'min_weight',
  'max_weight',
  'status',
  'category_id',
  'description',
] as const;

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(ServiceHistory)
    private readonly serviceHistoryRepository: Repository<ServiceHistory>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(
    storeId: number | null,
    isAdmin: boolean,
    filters?: { search?: string; category_id?: number; status?: ServiceStatus },
  ): Promise<Service[]> {
    const query = this.serviceRepository
      .createQueryBuilder('service')
      .orderBy('service.created_at', 'DESC');

    if (!isAdmin && storeId) {
      query.where('service.store_id = :storeId', { storeId });
    }

    if (filters?.search) {
      query.andWhere('service.combo_name ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.category_id) {
      query.andWhere('service.category_id = :categoryId', {
        categoryId: filters.category_id,
      });
    }

    if (filters?.status) {
      query.andWhere('service.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async findByService(storeId: number, serviceId: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: {
        id: serviceId,
        store_id: storeId,
      },
    });
    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }
    return service;
  }

  async create(
    storeID: number,
    createServiceDto: CreateServiceDto,
    performedBy?: number,
    performedByName?: string,
  ) {
    if (createServiceDto.min_weight && createServiceDto.max_weight) {
      if (createServiceDto.min_weight > createServiceDto.max_weight) {
        throw new BadRequestException(
          'Cân nặng tối thiểu không thể lớn hơn cân nặng tối đa',
        );
      }
    }

    const category = await this.categoryRepository.findOne({
      where: { category_id: createServiceDto.category_id, store_id: storeID },
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    const service = this.serviceRepository.create({
      ...createServiceDto,
      store_id: storeID,
    });
    const saved = await this.serviceRepository.save(service);

    await this.serviceHistoryRepository.save({
      service_id: saved.id,
      store_id: storeID,
      action: ServiceHistoryAction.CREATED,
      performed_by: performedBy ?? null,
      performed_by_name: performedByName ?? null,
      old_values: null,
      new_values: this.extractTrackedFields(saved),
    });

    return saved;
  }

  async updateService(
    storeId: number,
    serviceId: number,
    updateServiceDto: UpdateServiceDto,
    performedBy?: number,
    performedByName?: string,
  ): Promise<Service> {
    const service = await this.findByService(storeId, serviceId);
    if (updateServiceDto.min_weight && updateServiceDto.max_weight) {
      if (updateServiceDto.min_weight > updateServiceDto.max_weight) {
        throw new BadRequestException(
          'Cân nặng tối thiểu không thể lớn hơn cân nặng tối đa',
        );
      }
    }

    if (updateServiceDto.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { category_id: updateServiceDto.category_id, store_id: storeId },
      });
      if (!category) {
        throw new NotFoundException('Không tìm thấy danh mục');
      }
    }

    const oldValues = this.extractTrackedFields(service);

    Object.assign(service, updateServiceDto);
    const updated = await this.serviceRepository.save(service);

    await this.serviceHistoryRepository.save({
      service_id: updated.id,
      store_id: storeId,
      action: ServiceHistoryAction.UPDATED,
      performed_by: performedBy ?? null,
      performed_by_name: performedByName ?? null,
      old_values: oldValues,
      new_values: this.extractTrackedFields(updated),
    });

    return updated;
  }

  async getAll(storeId: number, categoryId: number): Promise<Service[]> {
    return this.serviceRepository.find({
      where: {
        store_id: storeId,
        category_id: categoryId,
      },
    });
  }

  async deleteService(
    storeId: number,
    serviceId: number,
    performedBy?: number,
    performedByName?: string,
  ): Promise<void> {
    const service = await this.findByService(storeId, serviceId);

    await this.serviceHistoryRepository.save({
      service_id: service.id,
      store_id: storeId,
      action: ServiceHistoryAction.DELETED,
      performed_by: performedBy ?? null,
      performed_by_name: performedByName ?? null,
      old_values: this.extractTrackedFields(service),
      new_values: null,
    });

    await this.serviceRepository.delete({
      id: service.id,
      store_id: service.store_id,
    });
  }

  async getHistory(storeId: number, serviceId: number) {
    return this.serviceHistoryRepository.find({
      where: { service_id: serviceId, store_id: storeId },
      order: { created_at: 'DESC' },
    });
  }

  private extractTrackedFields(service: Service): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key of SERVICE_TRACKED_FIELDS) {
      result[key] = (service as any)[key];
    }
    return result;
  }
}
