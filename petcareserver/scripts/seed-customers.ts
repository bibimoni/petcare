import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Customer } from '../src/customers/entities/customer.entity';
import { Store } from '../src/stores/entities/store.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.POSTGRES_URI,
  entities: [Customer, Store],
  synchronize: false,
  logging: false,
});

async function seedCustomers() {
  await AppDataSource.initialize();

  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const customerRepository = queryRunner.manager.getRepository(Customer);
    const storeRepository = queryRunner.manager.getRepository(Store);

    const store = await storeRepository.findOne({
      where: { id: 1 },
    });

    if (!store) {
      throw new Error(
        'Store with ID 1 not found. Please create the store before running seed.',
      );
    }

    const customersData = [
      {
        full_name: 'Nguyễn Văn A',
        phone: '0912345678',
        email: 'nguyenvana@mail.com',
        address: 'Phú Nhuận, TP.HCM',
        last_visit: new Date('2024-02-10'),
        total_spend: 5000000,
        notes: 'Khách hàng VIP, có 2 thú cưng',
      },
      {
        full_name: 'Trần Thị B',
        phone: '0987654321',
        email: 'tranthib@mail.com',
        address: 'Quận 1, TP.HCM',
        last_visit: new Date('2024-02-12'),
        total_spend: 3500000,
        notes: 'Khách hàng thân thiết',
      },
      {
        full_name: 'Hoàng Minh C',
        phone: '0901234567',
        email: 'hoangminhc@mail.com',
        address: 'Quận 5, TP.HCM',
        last_visit: new Date('2024-02-08'),
        total_spend: 2500000,
        notes: 'Có 3 con mèo',
      },
      {
        full_name: 'Phạm Quốc D',
        phone: '0923456789',
        email: 'phamquocd@mail.com',
        address: 'Quận 4, TP.HCM',
        last_visit: new Date('2024-01-30'),
        total_spend: 1800000,
        notes: 'Thích dịch vụ spa cho chó',
      },
      {
        full_name: 'Vũ Thị E',
        phone: '0934567890',
        email: 'vuthie@mail.com',
        address: 'Quận 3, TP.HCM',
        last_visit: new Date('2024-02-14'),
        total_spend: 4200000,
        notes: 'Đặt lịch hàng tháng',
      },
      {
        full_name: 'Đinh Văn F',
        phone: '0945678901',
        email: 'dinhvanf@mail.com',
        address: 'Quận 1, TP.HCM',
        last_visit: new Date('2024-02-06'),
        total_spend: 2200000,
        notes: null,
      },
      {
        full_name: 'Ngô Thị G',
        phone: '0956789012',
        email: 'ngothig@mail.com',
        address: 'Quận 1, TP.HCM',
        last_visit: new Date('2024-02-11'),
        total_spend: 3800000,
        notes: 'Khách hàng mới',
      },
      {
        full_name: 'Bùi Minh H',
        phone: '0967890123',
        email: 'buiminh@mail.com',
        address: 'Biên Hòa, Đồng Nai',
        last_visit: new Date('2024-02-13'),
        total_spend: 2900000,
        notes: 'Khách từ Đồng Nai',
      },
      {
        full_name: 'Lý Công I',
        phone: '0978901234',
        email: 'lycong@mail.com',
        address: 'Tân Bình, TP.HCM',
        last_visit: new Date('2024-02-09'),
        total_spend: 1500000,
        notes: 'Khách hàng tiềm năng',
      },
      {
        full_name: 'Tô Thị K',
        phone: '0989012345',
        email: 'tothik@mail.com',
        address: 'Quận 5, TP.HCM',
        last_visit: new Date('2024-02-15'),
        total_spend: 6500000,
        notes: 'Khách hàng cao cấp, có 4 thú cưng',
      },
    ];

    const customers = customersData.map((data) =>
      customerRepository.create({
        ...data,
        store_id: store.id,
      }),
    );

    await customerRepository.save(customers);

    await queryRunner.commitTransaction();

    console.log(`Successfully seeded ${customers.length} customers`);
    console.log('Customer seeding completed!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Seeding failed:', error);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seedCustomers();
