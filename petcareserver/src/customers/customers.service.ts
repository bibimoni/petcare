import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  CustomerHistory,
  CustomerHistoryAction,
} from './entities/customer-history.entity';
import { Pet } from '../pets/entities/pet.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(CustomerHistory)
    private customerHistoryRepository: Repository<CustomerHistory>,

    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,

    private cloudinaryService: CloudinaryService,
  ) {}
  async createCustomer(
    storeId: number,
    dto: CreateCustomerDto,
    performedBy?: number,
  ): Promise<Customer> {
    const customer = this.customerRepository.create({
      ...dto,
      store_id: storeId,
    });

    try {
      const saved = await this.customerRepository.save(customer);

      await this.customerHistoryRepository.save({
        customer_id: saved.customer_id,
        store_id: storeId,
        action: CustomerHistoryAction.CREATED,
        performed_by: performedBy ?? null,
        old_values: null,
        new_values: {
          full_name: saved.full_name,
          phone: saved.phone,
          email: saved.email,
          address: saved.address,
          notes: saved.notes,
        },
      });

      return saved;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Số điện thoại này đã được đăng ký');
      }

      throw error;
    }
  }

  async findAllByStore(
    storeId: number | null,
    isAdmin: boolean,
    filters?: { search?: string; date_from?: string; date_to?: string },
  ): Promise<Customer[]> {
    const query = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.pets', 'pets')
      .orderBy('customer.full_name', 'ASC');

    if (!isAdmin && storeId) {
      query.where('customer.store_id = :storeId', { storeId });
    }

    if (filters?.search) {
      query.andWhere(
        '(customer.full_name ILIKE :search OR customer.phone ILIKE :search OR customer.email ILIKE :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    if (filters?.date_from) {
      const dateFrom = new Date(filters.date_from);
      if (!isNaN(dateFrom.getTime())) {
        query.andWhere('customer.created_at >= :dateFrom', {
          dateFrom,
        });
      }
    }

    if (filters?.date_to) {
      const dateTo = new Date(filters.date_to);
      if (!isNaN(dateTo.getTime())) {
        query.andWhere('customer.created_at <= :dateTo', {
          dateTo,
        });
      }
    }

    return query.getMany();
  }

  async findByPhone(storeId: number, phone: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: {
        store_id: storeId,
        phone: phone,
      },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    return customer;
  }

  async findById(storeId: number, customerId: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: {
        store_id: storeId,
        customer_id: customerId,
      },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    return customer;
  }

  async update(
    id: number,
    dto: UpdateCustomerDto,
    storeId: number,
    performedBy?: number,
  ): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { customer_id: id, store_id: storeId },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    if (dto.phone && dto.phone !== customer.phone) {
      const existed = await this.customerRepository.findOne({
        where: { phone: dto.phone, store_id: storeId },
      });

      if (existed) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    const oldValues = {
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
    };

    Object.assign(customer, dto);

    const saved = await this.customerRepository.save(customer);

    await this.customerHistoryRepository.save({
      customer_id: saved.customer_id,
      store_id: storeId,
      action: CustomerHistoryAction.UPDATED,
      performed_by: performedBy ?? null,
      old_values: oldValues,
      new_values: {
        full_name: saved.full_name,
        phone: saved.phone,
        email: saved.email,
        address: saved.address,
        notes: saved.notes,
      },
    });

    return saved;
  }

  async deleteCustomer(
    id: number,
    storeId: number,
    performedBy?: number,
  ): Promise<{ message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { customer_id: id, store_id: storeId },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    await this.customerHistoryRepository.save({
      customer_id: customer.customer_id,
      store_id: storeId,
      action: CustomerHistoryAction.DELETED,
      performed_by: performedBy ?? null,
      old_values: {
        full_name: customer.full_name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        notes: customer.notes,
      },
      new_values: null,
    });

    await this.customerRepository.softRemove(customer);

    return { message: 'Xóa khách hàng thành công' };
  }

  async uploadPetAvatar(
    pet_id: number,
    currentUserId: number,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }
    const pet = await this.petRepository.findOne({
      relations: {
        store: {
          users: true,
        },
      },
      where: { pet_id, store: { users: { user_id: currentUserId } } },
    });
    if (!pet) {
      throw new BadRequestException(
        'Không tìm thấy thú cưng hoặc bạn không có quyền cập nhật',
      );
    }

    const cloudinaryResp = await this.cloudinaryService.uploadFile(file);
    await this.petRepository.update(pet_id, {
      avatar_url: cloudinaryResp.secure_url,
      avatar_public_id: cloudinaryResp.public_id,
    });

    if (pet.avatar_public_id) {
      await this.cloudinaryService.deleteFile(pet.avatar_public_id);
    }

    return cloudinaryResp.secure_url;
  }

  async getHistory(
    storeId: number,
    customerId: number,
  ): Promise<CustomerHistory[]> {
    return this.customerHistoryRepository.find({
      where: { customer_id: customerId, store_id: storeId },
      relations: { performer: true },
      select: {
        id: true,
        customer_id: true,
        action: true,
        performed_by: true,
        old_values: true,
        new_values: true,
        created_at: true,
        performer: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
      order: { created_at: 'DESC' },
    });
  }
}
