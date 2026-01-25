import * as bcrypt from 'bcrypt';
import { createConnection } from 'typeorm';

import { User } from '../src/users/entities/user.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderDetail } from '../src/orders/entities/order-detail.entity';
import { Product } from '../src/products/entities/product.entity';
import { Category } from '../src/products/entities/category.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import { Pet } from '../src/customers/entities/pet.entity';
import { PetWeightHistory } from '../src/customers/entities/pet-weight-history.entity';
import { UserRole, UserStatus } from '../src/common/enum';

async function seedAdmin() {
  console.log('Connecting to database...');

  const connection = await createConnection({
    type: 'postgres',
    url: process.env.POSTGRES_URI || 'postgresql://postgres:password@localhost:5432/petcare_dev',
    entities: [
      User,
      Order,
      OrderDetail,
      Product,
      Category,
      Customer,
      Pet,
      PetWeightHistory,
    ],
    synchronize: true,
    ssl: process.env.POSTGRES_URI ? { rejectUnauthorized: false } : false,
  });

  const userRepository = connection.getRepository(User);

  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@petcare.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    console.log('Email: admin@petcare.com');
    await connection.close();
    return;
  }

  console.log('Creating admin user...');

  const hashedPassword = await bcrypt.hash('123456789', 10);

  const admin = userRepository.create({
    email: 'admin@petcare.com',
    password_hash: hashedPassword,
    full_name: 'Admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    is_claimed: true,
  });

  await userRepository.save(admin);

  console.log('Admin user created successfully');
  console.log('Email: admin@petcare.com');
  console.log('Password: 123456789');
  console.log('Role: ADMIN');
  console.log('Status: ACTIVE');

  await connection.close();
  console.log('Database connection closed');
}

seedAdmin()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
