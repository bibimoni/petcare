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

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
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
}
