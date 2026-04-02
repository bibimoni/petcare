import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet, PetGender, PetStatus } from './entities/pet.entity';
import { PetWeightHistory } from './entities/pet-weight-history.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CreatePetWeightHistoryDto } from './dto/create-pet-weight-history.dto';
import { Customer } from 'src/customers/entities/customer.entity';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(PetWeightHistory)
    private weightHistoryRepository: Repository<PetWeightHistory>,
  ) {}

  async findByCustomer(storeId: number, customerId: number): Promise<Pet[]> {
    const customer = await this.customerRepository.findOne({
      where: { customer_id: customerId, store_id: storeId },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
    const query = this.petRepository
      .createQueryBuilder('pet')
      .where('pet.store_id = :storeId', { storeId })
      .andWhere('pet.customer_id = :customerId', { customerId });

    query
      .leftJoinAndSelect('pet.weight_history', 'weight_history')
      .orderBy('pet.created_at', 'DESC');

    return query.getMany();
  }

  async findOneWithHistory(storeId: number, petId: number): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: {
        pet_id: petId,
        store_id: storeId,
      },
      relations: {
        weight_history: true,
        customer: true,
      },
      order: {
        weight_history: {
          recorded_date: 'DESC',
        },
      },
    });

    if (!pet) {
      throw new NotFoundException('Không tìm thấy thú cưng');
    }

    return pet;
  }

  async create(
    storeId: number,
    customerId: number,
    createPetDto: CreatePetDto,
  ): Promise<Pet> {
    const customer = await this.customerRepository.findOne({
      where: {
        customer_id: customerId,
        store_id: storeId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const petCount = await this.petRepository.count({
      where: {
        customer_id: customerId,
        store_id: storeId,
      },
    });

    const nextIndex = petCount + 1;

    const generatedPetCode = `${customer.phone}_${createPetDto.name}_${nextIndex}`;

    const pet = this.petRepository.create({
      ...createPetDto,
      pet_code: generatedPetCode,
      store_id: storeId,
      customer_id: customerId,
      status: createPetDto.status ?? PetStatus.ALIVE,
    });

    return await this.petRepository.save(pet);
  }

  async update(
    storeId: number,
    petId: number,
    updatePetDto: UpdatePetDto,
  ): Promise<Pet> {
    const pet = await this.findOne(storeId, petId);
    Object.assign(pet, updatePetDto);
    return await this.petRepository.save(pet);
  }

  async findOne(storeId: number, petId: number): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: {
        pet_id: petId,
        store_id: storeId,
      },
    });
    if (!pet) {
      throw new NotFoundException('Không tìm thấy thú cưng');
    }
    return pet;
  }

  async remove(storeId: number, petId: number): Promise<void> {
    const pet = await this.findOne(storeId, petId);
    await this.petRepository.delete({
      pet_id: pet.pet_id,
      store_id: pet.store_id,
    });
  }

  async addWeightRecord(
    storeId: number,
    petId: number,
    createWeightDto: CreatePetWeightHistoryDto,
  ): Promise<PetWeightHistory> {
    const pet = await this.findOne(storeId, petId);

    if (createWeightDto.weight <= 0) {
      throw new BadRequestException('Cân nặng phải là số dương');
    }

    const weightRecord = this.weightHistoryRepository.create({
      pet: pet,
      weight: createWeightDto.weight,
      notes: createWeightDto.notes,
    });

    return await this.weightHistoryRepository.save(weightRecord);
  }

  async getWeightHistory(
    storeId: number,
    petId: number,
    limit: number = 100,
  ): Promise<PetWeightHistory[]> {
    const pet = await this.findOne(storeId, petId);
    limit = Math.min(limit, 200);
    const history = await this.weightHistoryRepository.find({
      where: {
        pet_id: pet.pet_id,
        pet: { store_id: storeId },
      },
      order: {
        recorded_date: 'DESC',
      },
      take: limit,
    });

    return history;
  }
}
