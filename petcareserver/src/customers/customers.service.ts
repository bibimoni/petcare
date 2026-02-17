/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { Pet } from './entities/pet.entity';
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
    createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    const existed = await this.customerRepository.findOne({
      where: { phone: createCustomerDto.phone, store_id: storeId },
    });

    if (existed) {
      throw new ConflictException(
        'Customer with phone number ' +
          createCustomerDto.phone +
          ' in this store already exists',
      );
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      store_id: storeId,
    });

    return await this.customerRepository.save(customer);
  }

  async findAllByStore(storeId: number): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { store_id: storeId },
      relations: ['pets'],
      order: { created_at: 'DESC' },
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
      throw new NotFoundException('Customer not found');
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
      throw new NotFoundException('Customer not found');
    }

    if (dto.phone && dto.phone !== customer.phone) {
      const existed = await this.customerRepository.findOne({
        where: { phone: dto.phone, store_id: storeId },
      });

      if (existed) {
        throw new ConflictException('Phone already exists in this store');
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
      throw new NotFoundException('Customer not found');
    }

    await this.customerRepository.softRemove(customer);

    return { message: 'Customer deleted successfully' };
  }

  async uploadPetAvatar(
    pet_id: number,
    currentUserId: number,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
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
        'Pet not found or you do not have permission to update this pet',
      );
    }

    const cloudinaryResp = await this.cloudinaryService.uploadFile(file);
    await this.petRepository.update(pet_id, {
      avatar_url: cloudinaryResp.secure_url,
      avatar_public_id: cloudinaryResp.public_id,
    });

    return cloudinaryResp.secure_url;
  }
}
