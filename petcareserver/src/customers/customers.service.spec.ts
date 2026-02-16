// import { Test, TestingModule } from '@nestjs/testing';
// import { CustomersService } from './customers.service';
// import { CustomersController } from './customers.controller';
// import { Repository } from 'typeorm';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { Customer } from './entities/customer.entity';
// import { BadRequestException, NotFoundException } from '@nestjs/common';

// describe('CustomersService', () => {
//   let service: CustomersService;
//   let repository: Repository<Customer>;

//   const mockCustomerRepository = {
//     create: jest.fn(),
//     save: jest.fn(),
//     findOne: jest.fn(),
//     findAndCount: jest.fn(),
//     update: jest.fn(),
//     softDelete: jest.fn(),
//     restore: jest.fn(),
//     createQueryBuilder: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         CustomersService,
//         {
//           provide: getRepositoryToken(Customer),
//           useValue: mockCustomerRepository,
//         },
//       ],
//     }).compile();

//     service = module.get<CustomersService>(CustomersService);
//     repository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('create', () => {
//     it('should create a new customer', async () => {
//       const storeId = 1;
//       const createCustomerDto = {
//         full_name: 'Nguyễn Văn A',
//         phone: '0912345678',
//         email: 'test@mail.com',
//       };

//       const mockCustomer = { customer_id: 1, store_id: storeId, ...createCustomerDto };

//       mockCustomerRepository.findOne.mockResolvedValue(null);
//       mockCustomerRepository.create.mockReturnValue(mockCustomer);
//       mockCustomerRepository.save.mockResolvedValue(mockCustomer);

//       const result = await service.create(storeId, createCustomerDto);

//       expect(result).toEqual(mockCustomer);
//       expect(mockCustomerRepository.findOne).toHaveBeenCalled();
//       expect(mockCustomerRepository.create).toHaveBeenCalled();
//       expect(mockCustomerRepository.save).toHaveBeenCalled();
//     });

//     it('should throw error if phone already exists', async () => {
//       const storeId = 1;
//       const createCustomerDto = {
//         full_name: 'Nguyễn Văn A',
//         phone: '0912345678',
//       };

//       const existingCustomer = {
//         customer_id: 1,
//         phone: '0912345678',
//         store_id: storeId,
//       };

//       mockCustomerRepository.findOne.mockResolvedValue(existingCustomer);

//       await expect(service.create(storeId, createCustomerDto)).rejects.toThrow(
//         BadRequestException,
//       );
//     });
//   });

//   describe('findAll', () => {
//     it('should return paginated customers', async () => {
//       const storeId = 1;
//       const mockCustomers = [
//         { customer_id: 1, full_name: 'Nguyễn Văn A', phone: '0912345678' },
//         { customer_id: 2, full_name: 'Trần Thị B', phone: '0987654321' },
//       ];

//       mockCustomerRepository.findAndCount.mockResolvedValue([mockCustomers, 2]);

//       const result = await service.findAll(storeId, 1, 10);

//       expect(result.data).toEqual(mockCustomers);
//       expect(result.total).toBe(2);
//       expect(result.page).toBe(1);
//     });
//   });

//   describe('remove (Soft Delete)', () => {
//     it('should soft delete a customer', async () => {
//       const storeId = 1;
//       const customerId = 1;

//       const mockCustomer = {
//         customer_id: customerId,
//         store_id: storeId,
//         full_name: 'Test',
//       };

//       mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
//       mockCustomerRepository.softDelete.mockResolvedValue({ affected: 1 });

//       await service.remove(storeId, customerId);

//       expect(mockCustomerRepository.softDelete).toHaveBeenCalledWith({
//         customer_id: customerId,
//         store_id: storeId,
//       });
//     });

//     it('should throw error if customer not found', async () => {
//       const storeId = 1;
//       const customerId = 999;

//       mockCustomerRepository.findOne.mockResolvedValue(null);

//       await expect(service.remove(storeId, customerId)).rejects.toThrow(
//         NotFoundException,
//       );
//     });
//   });

//   describe('update', () => {
//     it('should update a customer', async () => {
//       const storeId = 1;
//       const customerId = 1;
//       const updateCustomerDto = {
//         full_name: 'Tên mới',
//         phone: '0901234567',
//       };

//       const mockCustomer = {
//         customer_id: customerId,
//         store_id: storeId,
//         full_name: 'Tên cũ',
//         phone: '0912345678',
//       };

//       const updatedCustomer = { ...mockCustomer, ...updateCustomerDto };

//       mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
//       mockCustomerRepository.save.mockResolvedValue(updatedCustomer);

//       const result = await service.update(storeId, customerId, updateCustomerDto);

//       expect(result.full_name).toBe('Tên mới');
//     });

//     it('should throw error if new phone already exists', async () => {
//       const storeId = 1;
//       const customerId = 1;
//       const newPhone = '0987654321';

//       const mockCustomer = {
//         customer_id: customerId,
//         store_id: storeId,
//         phone: '0912345678',
//       };

//       const existingCustomerWithNewPhone = {
//         customer_id: 2,
//         store_id: storeId,
//         phone: newPhone,
//       };

//       mockCustomerRepository.findOne
//         .mockResolvedValueOnce(mockCustomer) // First call: find customer to update
//         .mockResolvedValueOnce(existingCustomerWithNewPhone); // Second call: check if phone exists

//       await expect(
//         service.update(storeId, customerId, { phone: newPhone }),
//       ).rejects.toThrow(BadRequestException);
//     });
//   });

//   describe('search', () => {
//     it('should search customers by keyword', async () => {
//       const storeId = 1;
//       const keyword = 'nguyễn';

//       const mockCustomers = [
//         { customer_id: 1, full_name: 'Nguyễn Văn A', phone: '0912345678' },
//       ];

//       const queryBuilder = {
//         where: jest.fn().mockReturnThis(),
//         andWhere: jest.fn().mockReturnThis(),
//         orderBy: jest.fn().mockReturnThis(),
//         take: jest.fn().mockReturnThis(),
//         getMany: jest.fn().mockResolvedValue(mockCustomers),
//       };

//       mockCustomerRepository.createQueryBuilder.mockReturnValue(queryBuilder);

//       const result = await service.search(storeId, keyword);

//       expect(result).toEqual(mockCustomers);
//       expect(queryBuilder.where).toHaveBeenCalled();
//       expect(queryBuilder.andWhere).toHaveBeenCalled();
//     });
//   });
// });

// describe('CustomersController', () => {
//   let controller: CustomersController;
//   let service: CustomersService;

//   const mockCustomersService = {
//     create: jest.fn(),
//     findAll: jest.fn(),
//     findOne: jest.fn(),
//     update: jest.fn(),
//     remove: jest.fn(),
//     restore: jest.fn(),
//     search: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [CustomersController],
//       providers: [
//         {
//           provide: CustomersService,
//           useValue: mockCustomersService,
//         },
//       ],
//     }).compile();

//     controller = module.get<CustomersController>(CustomersController);
//     service = module.get<CustomersService>(CustomersService);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('create', () => {
//     it('should call service.create with correct parameters', async () => {
//       const storeId = '1';
//       const createCustomerDto = {
//         full_name: 'Test',
//         phone: '0912345678',
//       };

//       mockCustomersService.create.mockResolvedValue({ customer_id: 1 });

//       const result = await controller.create(storeId, createCustomerDto);

//       expect(mockCustomersService.create).toHaveBeenCalledWith(1, createCustomerDto);
//       expect(result.customer_id).toBe(1);
//     });
//   });

//   describe('findAll', () => {
//     it('should call service.findAll with pagination', async () => {
//       const storeId = '1';
//       const page = '2';
//       const limit = '20';

//       mockCustomersService.findAll.mockResolvedValue({ data: [], total: 50 });

//       await controller.findAll(storeId, page, limit);

//       expect(mockCustomersService.findAll).toHaveBeenCalledWith(1, 2, 20);
//     });
//   });

//   describe('remove', () => {
//     it('should call service.remove and return success message', async () => {
//       const storeId = '1';
//       const customerId = '1';

//       mockCustomersService.remove.mockResolvedValue(undefined);

//       const result = await controller.remove(storeId, customerId);

//       expect(result.message).toBe('Xóa khách hàng thành công');
//     });
//   });
// });
