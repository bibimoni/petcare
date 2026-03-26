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
import { Pet } from '../pets/entities/pet.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,

    private cloudinaryService: CloudinaryService,
  ) {}
  async createCustomer(
    storeId: number,
    dto: CreateCustomerDto,
  ): Promise<Customer> {
    const customer = this.customerRepository.create({
      ...dto,
      store_id: storeId,
    });

    try {
      return await this.customerRepository.save(customer);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          'Số điện thoại này đã được đăng ký',
        );
      }

      throw error;
    }
  }

  async findAllByStore(storeId: number): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { store_id: storeId },
      relations: ['pets'],
      order: { full_name: 'ASC' },
    });
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

  async update(
    id: number,
    dto: UpdateCustomerDto,
    storeId: number,
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

    Object.assign(customer, dto);

    return this.customerRepository.save(customer);
  }

  async deleteCustomer(
    id: number,
    storeId: number,
  ): Promise<{ message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { customer_id: id, store_id: storeId },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

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
}
