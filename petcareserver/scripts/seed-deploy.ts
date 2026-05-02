import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: `${__dirname}/../.env` });

import { User } from '../src/users/entities/user.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderDetail } from '../src/orders/entities/order-detail.entity';
import { Product } from '../src/categories/entities/product.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Service } from '../src/categories/entities/service.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import { Pet, PetGender, PetStatus } from '../src/pets/entities/pet.entity';
import { PetWeightHistory } from '../src/pets/entities/pet-weight-history.entity';
import { Store } from '../src/stores/entities/store.entity';
import { Permission } from '../src/permissions/entities/permission.entity';
import { Role } from '../src/roles/entities/role.entity';
import { RolePermission } from '../src/roles/entities/role-permission.entity';
import { Notification } from '../src/notifications/entities/notification.entity';
import { Payment } from '../src/orders/entities/payment.entity';
import { ProductStatus } from '../src/categories/entities/product.entity';
import { ServiceStatus } from '../src/categories/entities/service.entity';

import {
  UserStatus,
  StoreStatus,
  CategoryType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PermissionScope,
} from '../src/common/enum';

import {
  ALL_SYSTEM_PERMISSIONS,
  ALL_STORE_PERMISSIONS,
  SYSTEM_ROLES,
  STORE_ROLES,
} from '../src/common/permissions';

import {
  NotificationType,
  NotificationStatus,
} from '../src/notifications/entities/notification.entity';

const STORE_NAME = 'Trung Tâm Thú Cưng Paw Paradise';
const DEFAULT_PASSWORD = 'PawParadise@123';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(
    10 + Math.floor(Math.random() * 8),
    Math.floor(Math.random() * 60),
    0,
    0,
  );
  return d;
}

async function seedDeploy() {
  console.log('Connecting to database...');

  const dbType = (process.env.DB_TYPE || 'postgres') as 'postgres' | 'sqlite';

  const dataSourceOptions: any = {
    type: dbType,
    entities: [
      User,
      Order,
      OrderDetail,
      Product,
      Category,
      Service,
      Customer,
      Pet,
      PetWeightHistory,
      Store,
      Permission,
      Role,
      RolePermission,
      Notification,
      Payment,
    ],
    synchronize: true,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  };

  if (dbType === 'sqlite') {
    dataSourceOptions.database = process.env.SQLITE_PATH || ':memory:';
  } else {
    dataSourceOptions.url =
      process.env.POSTGRES_URI ||
      'postgresql://postgres:password@localhost:5432/petcare_dev';
  }

  const dataSource = new DataSource(dataSourceOptions);
  const connection = await dataSource.initialize();

  console.log('Database connected successfully');

  const userRepo = connection.getRepository(User);
  const storeRepo = connection.getRepository(Store);
  const permRepo = connection.getRepository(Permission);
  const roleRepo = connection.getRepository(Role);
  const rpRepo = connection.getRepository(RolePermission);
  const catRepo = connection.getRepository(Category);
  const prodRepo = connection.getRepository(Product);
  const svcRepo = connection.getRepository(Service);
  const custRepo = connection.getRepository(Customer);
  const petRepo = connection.getRepository(Pet);
  const weightRepo = connection.getRepository(PetWeightHistory);
  const orderRepo = connection.getRepository(Order);
  const odRepo = connection.getRepository(OrderDetail);
  const payRepo = connection.getRepository(Payment);
  const notifRepo = connection.getRepository(Notification);

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ══════════════════════════════════════════════════
  // 1. STORE
  // ══════════════════════════════════════════════════
  console.log('\n=== Seeding Store ===');

  let store = await storeRepo.findOne({ where: { name: STORE_NAME } });
  if (!store) {
    store = storeRepo.create({
      name: STORE_NAME,
      status: StoreStatus.ACTIVE,
      phone: '028-7700-1234',
      address: '889 Nguyễn Kiệm',
      city: 'Hồ Chí Minh',
      state: 'Hồ Chí Minh',
      country: 'Việt Nam',
      postal_code: '700000',
    });
    store = await storeRepo.save(store);
    console.log(`Store created: ${store.name} (ID: ${store.id})`);
  } else {
    console.log(`Store exists: ${store.name} (ID: ${store.id})`);
  }

  // ══════════════════════════════════════════════════
  // 2. PERMISSIONS
  // ══════════════════════════════════════════════════
  console.log('\n=== Seeding Permissions ===');

  for (const slug of ALL_SYSTEM_PERMISSIONS) {
    const exists = await permRepo.findOne({ where: { slug } });
    if (!exists)
      await permRepo.save(
        permRepo.create({
          slug,
          scope: PermissionScope.SYSTEM,
          description: `System permission: ${slug}`,
          module: slug.split('.')[1] || 'system',
          is_system_defined: true,
        }),
      );
  }
  for (const slug of ALL_STORE_PERMISSIONS) {
    const exists = await permRepo.findOne({ where: { slug } });
    if (!exists)
      await permRepo.save(
        permRepo.create({
          slug,
          scope: PermissionScope.STORE,
          description: `Store permission: ${slug}`,
          module: slug.split('.')[0],
          is_system_defined: true,
        }),
      );
  }

  const allSystemPerms = await permRepo.findBy({
    scope: PermissionScope.SYSTEM,
  });
  const allStorePerms = await permRepo.findBy({ scope: PermissionScope.STORE });
  console.log(
    `Permissions ready: ${allSystemPerms.length} system, ${allStorePerms.length} store`,
  );

  // ══════════════════════════════════════════════════
  // 3. SUPER ADMIN (ensure exists)
  // ══════════════════════════════════════════════════
  console.log('\n=== Ensuring Super Admin ===');

  let superAdminRole = await roleRepo.findOne({
    where: { name: SYSTEM_ROLES.SUPER_ADMIN, is_system_role: true },
  });
  if (!superAdminRole) {
    superAdminRole = roleRepo.create({
      name: SYSTEM_ROLES.SUPER_ADMIN,
      description: 'System Super Administrator',
      is_editable: false,
      store_id: null as any,
      is_system_role: true,
    });
    superAdminRole = await roleRepo.save(superAdminRole);
    for (const p of [...allSystemPerms, ...allStorePerms]) {
      await rpRepo.save({ role_id: superAdminRole.id, permission_id: p.id });
    }
  }

  let superAdmin = await userRepo.findOne({
    where: { email: 'superadmin@petcare.com' },
  });
  if (!superAdmin) {
    superAdmin = userRepo.create({
      email: 'superadmin@petcare.com',
      password_hash: hashedPassword,
      full_name: 'Quản Trị Hệ Thống PetCare',
      phone: '+1-555-0001',
      status: UserStatus.ACTIVE,
      role_id: superAdminRole.id,
    });
    superAdmin = await userRepo.save(superAdmin);
  }
  console.log(`Super admin: ${superAdmin.email}`);

  // ══════════════════════════════════════════════════
  // 4. STORE ROLES
  // ══════════════════════════════════════════════════
  console.log('\n=== Seeding Store Roles ===');

  const roleDefinitions = [
    {
      name: STORE_ROLES.ADMIN,
      description: 'Store Administrator',
      permissions: allStorePerms,
    },
    {
      name: 'MANAGER',
      description: 'Store Manager',
      filter: (s: string) =>
        !s.includes('.delete') &&
        !s.includes('staff.invite') &&
        !s.includes('role.'),
    },
    {
      name: 'VETERINARIAN',
      description: 'Veterinarian',
      filter: (s: string) =>
        s.startsWith('pet.') ||
        s.startsWith('customer.') ||
        s.startsWith('order.view') ||
        s.startsWith('analytics.') ||
        s.startsWith('reports.'),
    },
    {
      name: 'GROOMER',
      description: 'Pet Groomer',
      filter: (s: string) =>
        s.startsWith('pet.') ||
        s.startsWith('service.') ||
        s.startsWith('order.view') ||
        s.startsWith('order.create'),
    },
    {
      name: 'RECEPTIONIST',
      description: 'Front Desk Receptionist',
      filter: (s: string) =>
        s.startsWith('customer.') ||
        s.startsWith('order.') ||
        s.startsWith('pet.view') ||
        s.startsWith('pet.create') ||
        s.startsWith('analytics.') ||
        s.startsWith('reports.'),
    },
    {
      name: 'CASHIER',
      description: 'Cashier',
      filter: (s: string) =>
        s.startsWith('order.') ||
        s.startsWith('customer.view') ||
        s.startsWith('product.view') ||
        s.startsWith('service.view') ||
        s.startsWith('pet.view'),
    },
  ];

  const storeRoles: Record<string, Role> = {};

  for (const def of roleDefinitions) {
    let role = await roleRepo.findOne({
      where: { name: def.name, store_id: store.id },
    });
    if (!role) {
      role = roleRepo.create({
        name: def.name,
        description: def.description,
        is_editable: def.name !== STORE_ROLES.ADMIN,
        store_id: store.id,
        is_system_role: false,
      });
      role = await roleRepo.save(role);

      const perms = def.permissions
        ? def.permissions
        : allStorePerms.filter((p) => def.filter(p.slug));

      for (const p of perms) {
        await rpRepo.save({ role_id: role.id, permission_id: p.id });
      }
      console.log(`Role created: ${role.name} (${perms.length} permissions)`);
    } else {
      console.log(`Role exists: ${role.name}`);
    }
    storeRoles[def.name] = role;
  }

  // ══════════════════════════════════════════════════
  // 5. STAFF USERS
  // ══════════════════════════════════════════════════
  console.log('\n=== Seeding Staff Users ===');

  const staffData = [
    {
      full_name: 'Nguyễn Hoàng Anh',
      email: 'hoanganh@pawparadise.vn',
      phone: '090-7101-000',
      role: 'ADMIN',
      status: UserStatus.ACTIVE,
    },
    {
      full_name: 'Trần Quang Minh',
      email: 'quangminh@pawparadise.vn',
      phone: '090-7102-000',
      role: 'MANAGER',
      status: UserStatus.ACTIVE,
    },
    {
      full_name: 'BS. Lê Thị Phương',
      email: 'thiphuong@pawparadise.vn',
      phone: '090-7103-000',
      role: 'VETERINARIAN',
      status: UserStatus.ACTIVE,
    },
    {
      full_name: 'Phạm Quốc Tuấn',
      email: 'quoctuan@pawparadise.vn',
      phone: '090-7104-000',
      role: 'GROOMER',
      status: UserStatus.ACTIVE,
    },
    {
      full_name: 'Ngô Thị Bích',
      email: 'thibich@pawparadise.vn',
      phone: '090-7105-000',
      role: 'RECEPTIONIST',
      status: UserStatus.ACTIVE,
    },
    {
      full_name: 'Lý Văn Tài',
      email: 'vantai@pawparadise.vn',
      phone: '090-7106-000',
      role: 'CASHIER',
      status: UserStatus.ACTIVE,
    },
    {
      full_name: 'Đỗ Thanh Hà',
      email: 'thanhhha@pawparadise.vn',
      phone: '090-7107-000',
      role: 'GROOMER',
      status: UserStatus.ACTIVE,
    },
    {
      full_name: 'Vũ Đình Long',
      email: 'dinhlong@pawparadise.vn',
      phone: '090-7108-000',
      role: 'VETERINARIAN',
      status: UserStatus.LOCKED,
    },
  ];

  const staffUsers: User[] = [];

  for (const s of staffData) {
    const fullName = s.full_name;
    let existingUser = await userRepo.findOne({ where: { email: s.email } });
    if (!existingUser) {
      const newUser = userRepo.create({
        full_name: fullName,
        email: s.email,
        phone: s.phone,
        password_hash: hashedPassword,
        store_id: store.id,
        role_id: storeRoles[s.role].id,
        status: s.status,
      } as any);
      existingUser = await userRepo.save(newUser as any);
      console.log(`  Created: ${fullName} (${s.role})`);
    } else {
      console.log(`  Exists: ${fullName} (${s.role})`);
    }
    staffUsers.push(existingUser!);
  }

  // ══════════════════════════════════════════════════
  // 6. CATEGORIES
  // ══════════════════════════════════════════════════
  console.log('\n=== Seeding Categories ===');

  const categoryDefs = [
    { name: 'Sản phẩm chải lông chó', type: CategoryType.PRODUCT },
    { name: 'Sản phẩm chải lông mèo', type: CategoryType.PRODUCT },
    { name: 'Thức ăn & phần thưởng', type: CategoryType.PRODUCT },
    { name: 'Phụ kiện thú cưng', type: CategoryType.PRODUCT },
    { name: 'Sức khỏe & Y tế', type: CategoryType.PRODUCT },
    { name: 'Dịch vụ tắm & chải lông', type: CategoryType.SERVICE },
    { name: 'Khám sức khỏe', type: CategoryType.SERVICE },
    { name: 'Lưu trú & Chăm sóc ban ngày', type: CategoryType.SERVICE },
    { name: 'Huấn luyện', type: CategoryType.SERVICE },
  ];

  const categories: Record<string, Category> = {};

  for (const cd of categoryDefs) {
    let cat = await catRepo.findOne({
      where: { name: cd.name, store_id: store.id },
    });
    if (!cat) {
      cat = catRepo.create({
        name: cd.name,
        type: cd.type,
        store_id: store.id,
      });
      cat = await catRepo.save(cat);
    }
    categories[cd.name] = cat;
  }
  console.log(`${categoryDefs.length} categories ready`);

  // ══════════════════════════════════════════════════
  // 7. PRODUCTS
  // ══════════════════════════════════════════════════
  console.log('\n=== Seeding Products ===');

  const productDefs = [
    {
      name: 'Dầu tắm chó hữu cơ',
      cost_price: 150000,
      sell_price: 450000,
      stock_quantity: 45,
      min_stock_level: 10,
      cat: 'Sản phẩm chải lông chó',
    },
    {
      name: 'Dầu xả chó con',
      cost_price: 100000,
      sell_price: 350000,
      stock_quantity: 30,
      min_stock_level: 8,
      cat: 'Sản phẩm chải lông chó',
    },
    {
      name: 'Bàn chải lông rụng',
      cost_price: 200000,
      sell_price: 550000,
      stock_quantity: 25,
      min_stock_level: 5,
      cat: 'Sản phẩm chải lông chó',
    },
    {
      name: 'Găng tay chải lông mèo',
      cost_price: 75000,
      sell_price: 250000,
      stock_quantity: 40,
      min_stock_level: 10,
      cat: 'Sản phẩm chải lông mèo',
    },
    {
      name: 'Dầu tắm mèo con',
      cost_price: 125000,
      sell_price: 375000,
      stock_quantity: 3,
      min_stock_level: 8,
      cat: 'Sản phẩm chải lông mèo',
    },
    {
      name: 'Thức ăn chó cao cấp (5kg)',
      cost_price: 500000,
      sell_price: 1125000,
      stock_quantity: 60,
      min_stock_level: 15,
      cat: 'Thức ăn & phần thưởng',
    },
    {
      name: 'Thức ăn khô mèo con (2kg)',
      cost_price: 300000,
      sell_price: 700000,
      stock_quantity: 35,
      min_stock_level: 10,
      cat: 'Thức ăn & phần thưởng',
    },
    {
      name: 'Bánh thưởng răng miệng',
      cost_price: 75000,
      sell_price: 225000,
      stock_quantity: 80,
      min_stock_level: 20,
      cat: 'Thức ăn & phần thưởng',
    },
    {
      name: 'Snack cá hồi huấn luyện',
      cost_price: 125000,
      sell_price: 300000,
      stock_quantity: 55,
      min_stock_level: 15,
      cat: 'Thức ăn & phần thưởng',
    },
    {
      name: 'Vòng cổ da chó',
      cost_price: 175000,
      sell_price: 500000,
      stock_quantity: 20,
      min_stock_level: 5,
      cat: 'Phụ kiện thú cưng',
    },
    {
      name: 'Giường mèo êm ái',
      cost_price: 375000,
      sell_price: 1000000,
      stock_quantity: 12,
      min_stock_level: 3,
      cat: 'Phụ kiện thú cưng',
    },
    {
      name: 'Đồ chơi tương tác',
      cost_price: 200000,
      sell_price: 450000,
      stock_quantity: 4,
      min_stock_level: 8,
      cat: 'Phụ kiện thú cưng',
    },
    {
      name: 'Thuốc phòng rận & ve',
      cost_price: 250000,
      sell_price: 750000,
      stock_quantity: 50,
      min_stock_level: 15,
      cat: 'Sức khỏe & Y tế',
    },
    {
      name: 'Bổ sung khớp',
      cost_price: 300000,
      sell_price: 875000,
      stock_quantity: 25,
      min_stock_level: 10,
      cat: 'Sức khỏe & Y tế',
    },
    {
      name: 'Viên vitamin',
      cost_price: 150000,
      sell_price: 450000,
      stock_quantity: 0,
      min_stock_level: 10,
      cat: 'Sức khỏe & Y tế',
    },
    {
      name: 'Dung dịch vệ sinh tai',
      cost_price: 100000,
      sell_price: 300000,
      stock_quantity: 30,
      min_stock_level: 8,
      cat: 'Sức khỏe & Y tế',
      expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Xịt làm dịu',
      cost_price: 125000,
      sell_price: 400000,
      stock_quantity: 18,
      min_stock_level: 5,
      cat: 'Sức khỏe & Y tế',
    },
  ];

  const products: Product[] = [];

  for (const pd of productDefs) {
    let product = await prodRepo.findOne({
      where: { name: pd.name, store_id: store.id },
    });
    if (!product) {
      product = prodRepo.create({
        name: pd.name,
        cost_price: pd.cost_price,
        sell_price: pd.sell_price,
        stock_quantity: pd.stock_quantity,
        min_stock_level: pd.min_stock_level,
        category_id: categories[pd.cat].category_id,
        store_id: store.id,
        status: ProductStatus.ACTIVE,
        ...(pd.expiry_date ? { expiry_date: pd.expiry_date } : {}),
      });
      product = await prodRepo.save(product);
    }
    products.push(product);
  }
  console.log(`${products.length} products ready`);

  // ══════════════════════════════════════════════════
  // 8. SERVICES
  // ══════════════════════════════════════════════════
  console.log('\n=== Seeding Services ===');

  const serviceDefs = [
    {
      combo_name: 'Tắm & sấy cơ bản',
      price: 625000,
      min_weight: 1,
      max_weight: 50,
      cat: 'Dịch vụ tắm & chải lông',
      desc: 'Tắm đơn giản với sấy khô',
    },
    {
      combo_name: 'Gói chải lông đầy đủ',
      price: 1375000,
      min_weight: 3,
      max_weight: 60,
      cat: 'Dịch vụ tắm & chải lông',
      desc: 'Tắm, cắt tỉa, cắt móng, vệ sinh tai',
    },
    {
      combo_name: 'Spa cao cấp',
      price: 2250000,
      min_weight: 1,
      max_weight: 80,
      cat: 'Dịch vụ tắm & chải lông',
      desc: 'Spa sang trọng với liệu pháp hương thơm',
    },
    {
      combo_name: 'Đánh răng bổ sung',
      price: 375000,
      min_weight: 1,
      max_weight: 80,
      cat: 'Dịch vụ tắm & chải lông',
      desc: 'Vệ sinh răng miệng khi chải lông',
    },
    {
      combo_name: 'Khám sức khỏe tổng quát',
      price: 1125000,
      min_weight: 1,
      max_weight: 100,
      cat: 'Khám sức khỏe',
      desc: 'Khám sức khỏe định kỳ',
    },
    {
      combo_name: 'Gói tiêm phòng',
      price: 1625000,
      min_weight: 1,
      max_weight: 100,
      cat: 'Khám sức khỏe',
      desc: 'Tiêm chủng + tư vấn',
    },
    {
      combo_name: 'Khám sức khỏe thú cưng lớn tuổi',
      price: 2000000,
      min_weight: 1,
      max_weight: 100,
      cat: 'Khám sức khỏe',
      desc: 'Khám sàng lọc sức khỏe toàn diện cho thú cưng lớn tuổi',
    },
    {
      combo_name: 'Lưu trú ban ngày',
      price: 875000,
      min_weight: 1,
      max_weight: 40,
      cat: 'Lưu trú & Chăm sóc ban ngày',
      desc: 'Chăm sóc ban ngày có giám sát',
    },
    {
      combo_name: 'Lưu trú qua đêm',
      price: 1375000,
      min_weight: 1,
      max_weight: 40,
      cat: 'Lưu trú & Chăm sóc ban ngày',
      desc: 'Chăm sóc 24 giờ kèm dắt đi dạo',
    },
    {
      combo_name: 'Huấn luyện chó con (4 buổi)',
      price: 3000000,
      min_weight: 1,
      max_weight: 20,
      cat: 'Huấn luyện',
      desc: 'Huấn luyện tuân lệnh cơ bản cho chó con',
    },
    {
      combo_name: 'Sửa hành vi',
      price: 2125000,
      min_weight: 1,
      max_weight: 60,
      cat: 'Huấn luyện',
      desc: 'Giải quyết các vấn đề hành vi cụ thể',
    },
  ];

  const services: Service[] = [];

  for (const sd of serviceDefs) {
    let service = await svcRepo.findOne({
      where: { combo_name: sd.combo_name, store_id: store.id },
    });
    if (!service) {
      service = svcRepo.create({
        combo_name: sd.combo_name,
        price: sd.price,
        min_weight: sd.min_weight,
        max_weight: sd.max_weight,
        category_id: categories[sd.cat].category_id,
        store_id: store.id,
        status: ServiceStatus.ACTIVE,
        description: sd.desc,
      });
      service = await svcRepo.save(service);
    }
    services.push(service);
  }
  console.log(`${services.length} services ready`);

  // ══════════════════════════════════════════════════
  // 9. CUSTOMERS & PETS
  // ══════════════════════════════════════════════════
  console.log('\n=== Seeding Customers & Pets ===');

  const customerDefs = [
    {
      full_name: 'Nguyễn Thảo Anh',
      phone: '090-8001-000',
      email: 'thaoanh@email.com',
      address: '100 Nguyễn Trãi, Quận 5',
    },
    {
      full_name: 'Lê Minh Tuấn',
      phone: '090-8002-000',
      email: 'minhtuan@email.com',
      address: '202 Trần Hưng Đạo, Quận 5',
    },
    {
      full_name: 'Phạm Thị Ngọc',
      phone: '090-8003-000',
      email: 'thingoc@email.com',
      address: '303 Lý Thường Kiệt, Quận 10',
    },
    {
      full_name: 'Hoàng Đức Hải',
      phone: '090-8004-000',
      email: 'duchai@email.com',
      address: '404 Cách Mạng Tháng 8, Quận 10',
    },
    {
      full_name: 'Trần Thị Bích Thủy',
      phone: '090-8005-000',
      email: 'bichthuy@email.com',
      address: '505 Trần Quang Khải, Quận 1',
    },
    {
      full_name: 'Vũ Đình Phong',
      phone: '090-8006-000',
      email: 'dinhphong@email.com',
      address: '606 Nguyễn Đình Chiểu, Quận 3',
    },
    {
      full_name: 'Đinh Thị Mai',
      phone: '090-8007-000',
      email: 'thimai@email.com',
      address: '707 Hoàng Văn Thụ, Phú Nhuận',
    },
    {
      full_name: 'Bùi Quang Huy',
      phone: '090-8008-000',
      email: 'quanghuy@email.com',
      address: '808 Phan Xích Long, Phú Nhuận',
    },
    {
      full_name: 'Ngô Thị Hạnh',
      phone: '090-8009-000',
      email: 'thihanh@email.com',
      address: '909 Phan Văn Trị, Gò Vấp',
    },
    {
      full_name: 'Trương Văn Khánh',
      phone: '090-8010-000',
      email: 'vankhanh@email.com',
      address: '1010 Quang Trung, Gò Vấp',
    },
    {
      full_name: 'Lý Thị Cẩm',
      phone: '090-8011-000',
      email: 'thicam@email.com',
      address: '1111 Nguyễn Thái Sơn, Gò Vấp',
    },
    {
      full_name: 'Đặng Quang Vinh',
      phone: '090-8012-000',
      email: 'quangvinh@email.com',
      address: '1212 Lê Đức Thọ, Phú Nhuận',
    },
  ];

  const customers: Customer[] = [];

  for (const cd of customerDefs) {
    let customer = await custRepo.findOne({
      where: { phone: cd.phone, store_id: store.id },
    });
    if (!customer) {
      customer = custRepo.create({ ...cd, store_id: store.id });
      customer = await custRepo.save(customer);
    }
    customers.push(customer);
  }

  const petDefs = [
    {
      name: 'Copper',
      breed: 'Golden Retriever',
      gender: PetGender.MALE,
      dob: new Date('2021-03-10'),
      customerIdx: 0,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Bella',
      breed: 'Labrador',
      gender: PetGender.FEMALE,
      dob: new Date('2020-07-22'),
      customerIdx: 0,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Milo',
      breed: 'Phốc Sóc',
      gender: PetGender.MALE,
      dob: new Date('2022-01-15'),
      customerIdx: 1,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Mun',
      breed: 'Mèo Ba Tư',
      gender: PetGender.FEMALE,
      dob: new Date('2021-09-03'),
      customerIdx: 2,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Rocky',
      breed: 'Béc Giê',
      gender: PetGender.MALE,
      dob: new Date('2019-11-28'),
      customerIdx: 3,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Cleo',
      breed: 'Mèo Xiêm',
      gender: PetGender.FEMALE,
      dob: new Date('2022-04-17'),
      customerIdx: 3,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Vằn',
      breed: 'Rottweiler',
      gender: PetGender.MALE,
      dob: new Date('2018-06-05'),
      customerIdx: 4,
      status: PetStatus.DECEASED,
    },
    {
      name: 'Nala',
      breed: 'Mèo Maine Coon',
      gender: PetGender.FEMALE,
      dob: new Date('2023-02-14'),
      customerIdx: 5,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Thần',
      breed: 'Doberman',
      gender: PetGender.MALE,
      dob: new Date('2020-12-01'),
      customerIdx: 6,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Mèo Mập',
      breed: 'Mèo Anh Lông Ngắn',
      gender: PetGender.MALE,
      dob: new Date('2021-08-20'),
      customerIdx: 7,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Cún',
      breed: 'Beagle',
      gender: PetGender.FEMALE,
      dob: new Date('2022-10-08'),
      customerIdx: 8,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Lửa',
      breed: 'Mèo Bengal',
      gender: PetGender.MALE,
      dob: new Date('2023-05-30'),
      customerIdx: 9,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Bông',
      breed: 'Pomeranian',
      gender: PetGender.FEMALE,
      dob: new Date('2022-07-12'),
      customerIdx: 10,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Đủ',
      breed: 'Bulldog',
      gender: PetGender.MALE,
      dob: new Date('2019-03-25'),
      customerIdx: 11,
      status: PetStatus.ALIVE,
    },
    {
      name: 'Simba',
      breed: 'Mèo Abyssinian',
      gender: PetGender.MALE,
      dob: new Date('2022-11-09'),
      customerIdx: 11,
      status: PetStatus.ALIVE,
    },
  ];

  const pets: Pet[] = [];

  for (const pd of petDefs) {
    const customer = customers[pd.customerIdx];
    const petCode = `${customer.phone}_${pd.name}_1`;
    let pet = await petRepo.findOne({
      where: { pet_code: petCode, store_id: store.id },
    });
    if (!pet) {
      pet = petRepo.create({
        name: pd.name,
        breed: pd.breed,
        gender: pd.gender,
        dob: pd.dob,
        customer_id: customer.customer_id,
        pet_code: petCode,
        store_id: store.id,
        status: pd.status,
      });
      pet = await petRepo.save(pet);
    }
    pets.push(pet);
  }

  // Seed weight history for pets
  for (const pet of pets.slice(0, 10)) {
    const existingWeights = await weightRepo.findOne({
      where: { pet_id: pet.pet_id },
    });
    if (!existingWeights) {
      const baseWeight = pet.breed?.includes('Cat') ? 4 : 20;
      for (let i = 0; i < 3; i++) {
        const weight = baseWeight + Math.random() * 5 + i * 0.8;
        const recordedDate = daysAgo(90 - i * 30);
        const savedWeight = await weightRepo.save(
          weightRepo.create({
            pet_id: pet.pet_id,
            weight: Math.round(weight * 10) / 10,
            notes: i === 0 ? 'Initial checkup' : `Follow-up visit ${i}`,
          }),
        );
        if (dbType === 'sqlite') {
          await connection.query(
            `UPDATE pet_weight_history SET recorded_date = ? WHERE id = ?`,
            [recordedDate, savedWeight.id],
          );
        } else {
          await connection.query(
            `UPDATE pet_weight_history SET recorded_date = $1 WHERE id = $2`,
            [recordedDate, savedWeight.id],
          );
        }
      }
    }
  }

  console.log(`${customers.length} customers, ${pets.length} pets ready`);

  // ══════════════════════════════════════════════════
  // 10. ORDERS (rich spread across time for analytics)
  // ══════════════════════════════════════════════════
  console.log('\n=== Seeding Orders ===');

  const activeStaff = staffUsers.filter((u) => u.status === UserStatus.ACTIVE);

  type OrderDef = {
    customerIdx: number;
    status: OrderStatus;
    daysAgo: number;
    items: {
      item_type: CategoryType;
      productIdx?: number;
      serviceIdx?: number;
      quantity: number;
      petIdx?: number;
    }[];
    cancel_reason?: string;
  };

  const orderDefs: OrderDef[] = [
    // Today - paid orders
    {
      customerIdx: 0,
      status: OrderStatus.PAID,
      daysAgo: 0,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 0, quantity: 2 },
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 1,
          quantity: 1,
          petIdx: 0,
        },
      ],
    },
    {
      customerIdx: 1,
      status: OrderStatus.PAID,
      daysAgo: 0,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 0,
          quantity: 1,
          petIdx: 2,
        },
        { item_type: CategoryType.PRODUCT, productIdx: 7, quantity: 1 },
      ],
    },
    {
      customerIdx: 2,
      status: OrderStatus.PAID,
      daysAgo: 0,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 4,
          quantity: 1,
          petIdx: 3,
        },
      ],
    },

    // Yesterday
    {
      customerIdx: 3,
      status: OrderStatus.PAID,
      daysAgo: 1,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 2,
          quantity: 1,
          petIdx: 4,
        },
      ],
    },
    {
      customerIdx: 4,
      status: OrderStatus.PAID,
      daysAgo: 1,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 5, quantity: 2 },
        { item_type: CategoryType.PRODUCT, productIdx: 8, quantity: 3 },
      ],
    },
    {
      customerIdx: 5,
      status: OrderStatus.PENDING,
      daysAgo: 1,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 7,
          quantity: 1,
          petIdx: 7,
        },
      ],
    },

    // 3 days ago
    {
      customerIdx: 6,
      status: OrderStatus.PAID,
      daysAgo: 3,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 9,
          quantity: 1,
          petIdx: 8,
        },
        { item_type: CategoryType.PRODUCT, productIdx: 12, quantity: 1 },
      ],
    },
    {
      customerIdx: 7,
      status: OrderStatus.PAID,
      daysAgo: 3,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 3, quantity: 2 },
        { item_type: CategoryType.PRODUCT, productIdx: 2, quantity: 1 },
      ],
    },

    // 5 days ago
    {
      customerIdx: 8,
      status: OrderStatus.PAID,
      daysAgo: 5,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 5,
          quantity: 1,
          petIdx: 10,
        },
      ],
    },
    {
      customerIdx: 9,
      status: OrderStatus.CANCELLED,
      daysAgo: 5,
      items: [{ item_type: CategoryType.PRODUCT, productIdx: 9, quantity: 1 }],
      cancel_reason: 'Khách hàng đổi ý',
    },

    // 7 days ago
    {
      customerIdx: 10,
      status: OrderStatus.PAID,
      daysAgo: 7,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 1,
          quantity: 1,
          petIdx: 12,
        },
        { item_type: CategoryType.PRODUCT, productIdx: 6, quantity: 1 },
      ],
    },
    {
      customerIdx: 11,
      status: OrderStatus.PAID,
      daysAgo: 7,
      items: [{ item_type: CategoryType.PRODUCT, productIdx: 13, quantity: 2 }],
    },
    {
      customerIdx: 0,
      status: OrderStatus.PAID,
      daysAgo: 7,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 0,
          quantity: 1,
          petIdx: 1,
        },
      ],
    },

    // 10 days ago
    {
      customerIdx: 1,
      status: OrderStatus.PAID,
      daysAgo: 10,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 8,
          quantity: 1,
          petIdx: 2,
        },
      ],
    },
    {
      customerIdx: 2,
      status: OrderStatus.PAID,
      daysAgo: 10,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 0, quantity: 3 },
        { item_type: CategoryType.PRODUCT, productIdx: 8, quantity: 2 },
      ],
    },

    // 14 days ago
    {
      customerIdx: 3,
      status: OrderStatus.PAID,
      daysAgo: 14,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 6,
          quantity: 1,
          petIdx: 5,
        },
      ],
    },
    {
      customerIdx: 4,
      status: OrderStatus.CANCELLED,
      daysAgo: 14,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 2,
          quantity: 1,
          petIdx: 6,
        },
      ],
      cancel_reason: 'Thú cưng ốm, đổi lịch',
    },
    {
      customerIdx: 5,
      status: OrderStatus.PAID,
      daysAgo: 14,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 5, quantity: 1 },
        { item_type: CategoryType.PRODUCT, productIdx: 7, quantity: 2 },
      ],
    },

    // 20 days ago
    {
      customerIdx: 6,
      status: OrderStatus.PAID,
      daysAgo: 20,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 12, quantity: 2 },
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 4,
          quantity: 1,
          petIdx: 8,
        },
      ],
    },
    {
      customerIdx: 7,
      status: OrderStatus.PAID,
      daysAgo: 20,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 10,
          quantity: 1,
          petIdx: 9,
        },
      ],
    },

    // 25 days ago
    {
      customerIdx: 8,
      status: OrderStatus.PAID,
      daysAgo: 25,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 1,
          quantity: 1,
          petIdx: 10,
        },
        { item_type: CategoryType.PRODUCT, productIdx: 11, quantity: 1 },
      ],
    },
    {
      customerIdx: 9,
      status: OrderStatus.PAID,
      daysAgo: 25,
      items: [{ item_type: CategoryType.PRODUCT, productIdx: 16, quantity: 2 }],
    },

    // 30 days ago
    {
      customerIdx: 10,
      status: OrderStatus.PAID,
      daysAgo: 30,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 5,
          quantity: 1,
          petIdx: 12,
        },
        { item_type: CategoryType.PRODUCT, productIdx: 8, quantity: 3 },
      ],
    },
    {
      customerIdx: 11,
      status: OrderStatus.PAID,
      daysAgo: 30,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 0,
          quantity: 1,
          petIdx: 13,
        },
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 3,
          quantity: 1,
          petIdx: 13,
        },
      ],
    },
    {
      customerIdx: 0,
      status: OrderStatus.PAID,
      daysAgo: 30,
      items: [{ item_type: CategoryType.PRODUCT, productIdx: 5, quantity: 1 }],
    },

    // ── April 2026 dedicated orders (daysAgo 2-31 from May 2) ──
    {
      customerIdx: 0,
      status: OrderStatus.PAID,
      daysAgo: 2,
      items: [
        { item_type: CategoryType.SERVICE, serviceIdx: 1, quantity: 1, petIdx: 0 },
        { item_type: CategoryType.PRODUCT, productIdx: 5, quantity: 1 },
      ],
    },
    {
      customerIdx: 1,
      status: OrderStatus.PAID,
      daysAgo: 4,
      items: [
        { item_type: CategoryType.SERVICE, serviceIdx: 4, quantity: 1, petIdx: 2 },
      ],
    },
    {
      customerIdx: 2,
      status: OrderStatus.PAID,
      daysAgo: 6,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 0, quantity: 2 },
        { item_type: CategoryType.SERVICE, serviceIdx: 0, quantity: 1, petIdx: 3 },
      ],
    },
    {
      customerIdx: 3,
      status: OrderStatus.PAID,
      daysAgo: 8,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 5, quantity: 2 },
        { item_type: CategoryType.PRODUCT, productIdx: 7, quantity: 3 },
      ],
    },
    {
      customerIdx: 4,
      status: OrderStatus.CANCELLED,
      daysAgo: 9,
      items: [
        { item_type: CategoryType.SERVICE, serviceIdx: 2, quantity: 1, petIdx: 6 },
      ],
      cancel_reason: 'Khách hàng đổi lịch',
    },
    {
      customerIdx: 5,
      status: OrderStatus.PAID,
      daysAgo: 11,
      items: [
        { item_type: CategoryType.SERVICE, serviceIdx: 5, quantity: 1, petIdx: 7 },
      ],
    },
    {
      customerIdx: 6,
      status: OrderStatus.PAID,
      daysAgo: 13,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 12, quantity: 2 },
        { item_type: CategoryType.PRODUCT, productIdx: 8, quantity: 1 },
      ],
    },
    {
      customerIdx: 7,
      status: OrderStatus.PAID,
      daysAgo: 15,
      items: [
        { item_type: CategoryType.SERVICE, serviceIdx: 1, quantity: 1, petIdx: 9 },
        { item_type: CategoryType.PRODUCT, productIdx: 3, quantity: 1 },
      ],
    },
    {
      customerIdx: 8,
      status: OrderStatus.PAID,
      daysAgo: 17,
      items: [
        { item_type: CategoryType.SERVICE, serviceIdx: 6, quantity: 1, petIdx: 10 },
      ],
    },
    {
      customerIdx: 9,
      status: OrderStatus.PAID,
      daysAgo: 19,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 5, quantity: 1 },
        { item_type: CategoryType.PRODUCT, productIdx: 0, quantity: 2 },
      ],
    },
    {
      customerIdx: 10,
      status: OrderStatus.PAID,
      daysAgo: 21,
      items: [
        { item_type: CategoryType.SERVICE, serviceIdx: 0, quantity: 1, petIdx: 12 },
        { item_type: CategoryType.SERVICE, serviceIdx: 3, quantity: 1, petIdx: 12 },
      ],
    },
    {
      customerIdx: 11,
      status: OrderStatus.PAID,
      daysAgo: 23,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 13, quantity: 1 },
        { item_type: CategoryType.PRODUCT, productIdx: 16, quantity: 2 },
      ],
    },
    {
      customerIdx: 0,
      status: OrderStatus.PAID,
      daysAgo: 25,
      items: [
        { item_type: CategoryType.SERVICE, serviceIdx: 2, quantity: 1, petIdx: 1 },
      ],
    },
    {
      customerIdx: 2,
      status: OrderStatus.PAID,
      daysAgo: 27,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 6, quantity: 2 },
        { item_type: CategoryType.PRODUCT, productIdx: 8, quantity: 1 },
      ],
    },
    {
      customerIdx: 4,
      status: OrderStatus.PAID,
      daysAgo: 29,
      items: [
        { item_type: CategoryType.SERVICE, serviceIdx: 7, quantity: 1, petIdx: 6 },
      ],
    },
    {
      customerIdx: 6,
      status: OrderStatus.PAID,
      daysAgo: 31,
      items: [
        { item_type: CategoryType.SERVICE, serviceIdx: 9, quantity: 1, petIdx: 8 },
        { item_type: CategoryType.PRODUCT, productIdx: 0, quantity: 1 },
      ],
    },

    // 45 days ago
    {
      customerIdx: 1,
      status: OrderStatus.PAID,
      daysAgo: 45,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 2,
          quantity: 1,
          petIdx: 2,
        },
      ],
    },
    {
      customerIdx: 3,
      status: OrderStatus.PAID,
      daysAgo: 45,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 9, quantity: 2 },
        { item_type: CategoryType.PRODUCT, productIdx: 10, quantity: 1 },
      ],
    },

    // 60 days ago
    {
      customerIdx: 5,
      status: OrderStatus.PAID,
      daysAgo: 60,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 1,
          quantity: 1,
          petIdx: 7,
        },
        { item_type: CategoryType.PRODUCT, productIdx: 14, quantity: 1 },
      ],
    },
    {
      customerIdx: 7,
      status: OrderStatus.PAID,
      daysAgo: 60,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 6,
          quantity: 1,
          petIdx: 9,
        },
      ],
    },
    {
      customerIdx: 9,
      status: OrderStatus.CANCELLED,
      daysAgo: 60,
      items: [{ item_type: CategoryType.PRODUCT, productIdx: 1, quantity: 1 }],
      cancel_reason: 'Tìm được nơi rẻ hơn',
    },

    // 90 days ago
    {
      customerIdx: 0,
      status: OrderStatus.PAID,
      daysAgo: 90,
      items: [
        {
          item_type: CategoryType.SERVICE,
          serviceIdx: 4,
          quantity: 1,
          petIdx: 0,
        },
        { item_type: CategoryType.PRODUCT, productIdx: 12, quantity: 2 },
      ],
    },
    {
      customerIdx: 2,
      status: OrderStatus.PAID,
      daysAgo: 90,
      items: [
        { item_type: CategoryType.PRODUCT, productIdx: 5, quantity: 3 },
        { item_type: CategoryType.PRODUCT, productIdx: 7, quantity: 2 },
      ],
    },
  ];

  let orderCount = 0;

  for (const od of orderDefs) {
    const customer = customers[od.customerIdx];
    const createdBy =
      activeStaff[Math.floor(Math.random() * activeStaff.length)];

    let totalAmount = 0;
    const orderItems = od.items.map((item) => {
      let unitPrice = 0;
      let originalCost = 0;

      if (
        item.item_type === CategoryType.PRODUCT &&
        item.productIdx !== undefined
      ) {
        unitPrice = products[item.productIdx].sell_price;
        originalCost = products[item.productIdx].cost_price * item.quantity;
      } else if (
        item.item_type === CategoryType.SERVICE &&
        item.serviceIdx !== undefined
      ) {
        unitPrice = services[item.serviceIdx].price;
        originalCost = 0;
      }

      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;

      return {
        item_type: item.item_type,
        product_id:
          item.productIdx !== undefined
            ? products[item.productIdx].product_id
            : null,
        service_id:
          item.serviceIdx !== undefined ? services[item.serviceIdx].id : null,
        pet_id: item.petIdx !== undefined ? pets[item.petIdx].pet_id : null,
        quantity: item.quantity,
        unit_price: unitPrice,
        original_cost: originalCost,
        subtotal,
      };
    });

    const orderDate = daysAgo(od.daysAgo);

    const order = orderRepo.create({
      store_id: store.id,
      user_id: createdBy.user_id,
      customer_id: customer.customer_id,
      total_amount: totalAmount,
      status: od.status,
      cancel_reason: od.cancel_reason || null,
    } as any);

    const savedOrder = (await orderRepo.save(order)) as unknown as Order;

    if (dbType === 'sqlite') {
      await connection.query(
        `UPDATE orders SET created_at = ? WHERE order_id = ?`,
        [orderDate, savedOrder.order_id],
      );
    } else {
      await connection.query(
        `UPDATE orders SET created_at = $1 WHERE order_id = $2`,
        [orderDate, savedOrder.order_id],
      );
    }

    for (const item of orderItems) {
      await odRepo.save(
        odRepo.create({
          order_id: savedOrder.order_id,
          ...item,
        } as any),
      );
    }

    if (od.status === OrderStatus.PAID) {
      const paymentMethod =
        Math.random() > 0.5 ? PaymentMethod.CASH : PaymentMethod.STRIPE;
      await payRepo.save(
        payRepo.create({
          order_id: savedOrder.order_id,
          payment_method: paymentMethod,
          amount: totalAmount,
          status: PaymentStatus.COMPLETED,
        }),
      );
    }

    orderCount++;
    if (orderCount % 10 === 0) console.log(`  ${orderCount} orders created...`);
  }

  console.log(`${orderCount} orders created`);

  // ══════════════════════════════════════════════════
  // 11. NOTIFICATIONS
  // ══════════════════════════════════════════════════
  console.log('\n=== Seeding Notifications ===');

  const notificationDefs = [
    {
      type: NotificationType.LOW_STOCK,
      title: 'Cảnh báo tồn kho thấp',
      message: 'Đồ chơi tương tác sắp hết (còn 4)',
      productIdx: 11,
      status: NotificationStatus.UNREAD,
    },
    {
      type: NotificationType.LOW_STOCK,
      title: 'Cảnh báo tồn kho thấp',
      message: 'Dầu tắm mèo con sắp hết (còn 3)',
      productIdx: 4,
      status: NotificationStatus.UNREAD,
    },
    {
      type: NotificationType.OUT_OF_STOCK,
      title: 'Hết hàng',
      message: 'Viên vitamin đã hết hàng',
      productIdx: 14,
      status: NotificationStatus.UNREAD,
    },
    {
      type: NotificationType.EXPIRY_WARNING,
      title: 'Cảnh báo hạn sử dụng',
      message: 'Dung dịch vệ sinh tai hết hạn trong 15 ngày',
      productIdx: 15,
      status: NotificationStatus.UNREAD,
    },
    {
      type: NotificationType.LOW_STOCK,
      title: 'Cảnh báo tồn kho thấp',
      message: 'Dầu xả chó con sắp hết',
      productIdx: 1,
      status: NotificationStatus.READ,
    },
    {
      type: NotificationType.LOW_STOCK,
      title: 'Cảnh báo tồn kho thấp',
      message: 'Vòng cổ da chó sắp hết (còn 20)',
      productIdx: 9,
      status: NotificationStatus.READ,
    },
    {
      type: NotificationType.EXPIRED,
      title: 'Sản phẩm hết hạn',
      message: 'Một sản phẩm đã hết hạn và cần loại bỏ',
      productIdx: 14,
      status: NotificationStatus.READ,
    },
  ];

  for (const nd of notificationDefs) {
    const existing = await notifRepo.findOne({
      where: { title: nd.title, message: nd.message, store_id: store.id },
    });
    if (!existing) {
      await notifRepo.save(
        notifRepo.create({
          store_id: store.id,
          product_id: products[nd.productIdx].product_id,
          type: nd.type,
          status: nd.status,
          title: nd.title,
          message: nd.message,
          product_name: products[nd.productIdx].name,
        }),
      );
    }
  }
  console.log(`${notificationDefs.length} notifications ready`);

  // ══════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('  DEPLOY SEED COMPLETED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`\n  Store: ${store.name} (ID: ${store.id})`);
  console.log(`  Roles: ${Object.keys(storeRoles).join(', ')}`);
  console.log(`  Staff: ${staffUsers.length} users`);
  console.log(`  Categories: ${categoryDefs.length}`);
  console.log(`  Products: ${products.length}`);
  console.log(`  Services: ${services.length}`);
  console.log(`  Customers: ${customers.length}`);
  console.log(`  Pets: ${pets.length}`);
  console.log(`  Orders: ${orderCount}`);
  console.log(`  Notifications: ${notificationDefs.length}`);
  console.log('\n  All passwords: ' + DEFAULT_PASSWORD);
  console.log('='.repeat(60));

  await dataSource.destroy();
}

seedDeploy()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
