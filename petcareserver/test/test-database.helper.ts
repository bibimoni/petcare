import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigModule } from '@nestjs/config';

import { User } from '../src/users/entities/user.entity';
import { Store } from '../src/stores/entities/store.entity';
import { Role } from '../src/roles/entities/role.entity';
import { RolePermission } from '../src/roles/entities/role-permission.entity';
import { Invitation } from '../src/stores/entities/invitation.entity';
import { Notification } from '../src/notifications/entities/notification.entity';
import { Permission } from '../src/permissions/entities/permission.entity';
import { Product } from '../src/categories/entities/product.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Service } from '../src/categories/entities/service.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderDetail } from '../src/orders/entities/order-detail.entity';
import { Payment } from '../src/orders/entities/payment.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import { Pet } from '../src/pets/entities/pet.entity';
import { PetWeightHistory } from '../src/pets/entities/pet-weight-history.entity';

export const ENTITIES = [
  User,
  Store,
  Role,
  RolePermission,
  Invitation,
  Notification,
  Permission,
  Product,
  Category,
  Service,
  Order,
  OrderDetail,
  Payment,
  Customer,
  Pet,
  PetWeightHistory,
];

export {
  User,
  Store,
  Role,
  RolePermission,
  Invitation,
  Notification,
  Permission,
  Product,
  Category,
  Service,
  Order,
  OrderDetail,
  Payment,
  Customer,
  Pet,
  PetWeightHistory,
};

export {
  UserStatus,
  StoreStatus,
  InvitationStatus,
  PermissionScope,
} from '../src/common/enum';

export const TEST_CONFIG = {
  POSTGRES_URI: 'sqlite::memory:',
  CLD_CLOUD_NAME: 'test',
  CLD_API_KEY: 'test',
  CLD_API_SECRET: 'test',
  EMAIL_HOST: 'smtp.test.com',
  EMAIL_PORT: '587',
  EMAIL_USER: 'test@test.com',
  GOOGLE_APP_PASSWORD: 'test',
  FRONTEND_URL: 'http://localhost:3000',
  JWT_SECRET: 'test-secret-key',
  JWT_EXPIRES_IN: '1d',
  NODE_ENV: 'test',
  STRIPE_SECRET_KEY: 'sk_test_fake_key_for_testing',
  STRIPE_PUBLIC_KEY: 'pk_test_fake_key_for_testing',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_fake_key_for_testing',
};

export const getTypeOrmTestConfig = () => ({
  type: 'sqlite' as const,
  database: ':memory:',
  entities: ENTITIES,
  synchronize: true,
  dropSchema: true,
});

export interface RepositoryMap {
  User: Repository<User>;
  Store: Repository<Store>;
  Role: Repository<Role>;
  RolePermission: Repository<RolePermission>;
  Invitation: Repository<Invitation>;
  Notification: Repository<Notification>;
  Permission: Repository<Permission>;
  Product: Repository<Product>;
  Category: Repository<Category>;
  Service: Repository<Service>;
  Order: Repository<Order>;
  OrderDetail: Repository<OrderDetail>;
  Payment: Repository<Payment>;
  Customer: Repository<Customer>;
  Pet: Repository<Pet>;
  PetWeightHistory: Repository<PetWeightHistory>;
}

export function getTestRepository<T extends keyof RepositoryMap>(
  module: TestingModule,
  entity: T,
): RepositoryMap[T] {
  const entityMap: Record<keyof RepositoryMap, any> = {
    User,
    Store,
    Role,
    RolePermission,
    Invitation,
    Notification,
    Permission,
    Product,
    Category,
    Service,
    Order,
    OrderDetail,
    Payment,
    Customer,
    Pet,
    PetWeightHistory,
  };

  return module.get(getRepositoryToken(entityMap[entity]));
}

export async function createTestApp(modules: any[] = []): Promise<{
  app: INestApplication;
  module: TestingModule;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => TEST_CONFIG],
      }),
      TypeOrmModule.forRootAsync({
        useFactory: () => getTypeOrmTestConfig(),
      }),
      TypeOrmModule.forFeature(ENTITIES),
      ...modules,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.init();

  return { app, module: moduleFixture };
}

export async function cleanDatabase(module: TestingModule): Promise<void> {
  const repositories = [
    getTestRepository(module, 'Notification'),
    getTestRepository(module, 'Invitation'),
    getTestRepository(module, 'Payment'),
    getTestRepository(module, 'OrderDetail'),
    getTestRepository(module, 'Order'),
    getTestRepository(module, 'PetWeightHistory'),
    getTestRepository(module, 'Pet'),
    getTestRepository(module, 'Customer'),
    getTestRepository(module, 'Product'),
    getTestRepository(module, 'Service'),
    getTestRepository(module, 'Category'),
    getTestRepository(module, 'RolePermission'),
    getTestRepository(module, 'Permission'),
    getTestRepository(module, 'Role'),
    getTestRepository(module, 'User'),
    getTestRepository(module, 'Store'),
  ];

  for (const repo of repositories) {
    await repo.clear();
  }
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}
