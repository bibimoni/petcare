import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { createConnection } from 'typeorm';

dotenv.config({ path: `${__dirname}/../.env` });

import { User } from '../src/users/entities/user.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderDetail } from '../src/orders/entities/order-detail.entity';
import { Product } from '../src/categories/entities/product.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Service } from '../src/categories/entities/service.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import { Pet } from '../src/pets/entities/pet.entity';
import { PetWeightHistory } from '../src/pets/entities/pet-weight-history.entity';
import { Store } from '../src/stores/entities/store.entity';
import { Permission } from '../src/permissions/entities/permission.entity';
import { Role } from '../src/roles/entities/role.entity';
import { RolePermission } from '../src/roles/entities/role-permission.entity';
import { Notification } from '../src/notifications/entities/notification.entity';
import { Payment } from '../src/orders/entities/payment.entity';

import { UserStatus, StoreStatus, CategoryType, OrderStatus, PaymentMethod, PaymentStatus } from '../src/common/enum';

import {
  ALL_SYSTEM_PERMISSIONS,
  ALL_STORE_PERMISSIONS,
  SYSTEM_ROLES,
  STORE_ROLES,
} from '../src/common/permissions';

async function seedAnalyticsData() {
  console.log('Connecting to database...');

  const dbType = (process.env.DB_TYPE || 'postgres') as 'postgres' | 'sqlite';

  const connectionOptions: any = {
    type: dbType,
    entities: [User, Order, OrderDetail, Product, Category, Service, Customer, Pet, PetWeightHistory, Store, Permission, Role, RolePermission, Notification, Payment],
    synchronize: true,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };

  if (dbType === 'sqlite') {
    connectionOptions.database = process.env.SQLITE_PATH || ':memory:';
  } else {
    connectionOptions.url = process.env.POSTGRES_URI || 'postgresql://postgres:password@localhost:5432/petcare_dev';
  }

  const connection = await createConnection(connectionOptions);

  console.log('Database connected successfully');

  const userRepository = connection.getRepository(User);
  const storeRepository = connection.getRepository(Store);
  const permissionRepository = connection.getRepository(Permission);
  const roleRepository = connection.getRepository(Role);
  const rolePermissionRepository = connection.getRepository(RolePermission);
  const categoryRepository = connection.getRepository(Category);
  const productRepository = connection.getRepository(Product);
  const serviceRepository = connection.getRepository(Service);
  const customerRepository = connection.getRepository(Customer);
  const petRepository = connection.getRepository(Pet);
  const orderRepository = connection.getRepository(Order);
  const orderDetailRepository = connection.getRepository(OrderDetail);
  const paymentRepository = connection.getRepository(Payment);

  // ── Ensure base data exists (store, roles, superadmin) ──
  console.log('\n=== Ensuring base data ===');

  let store = await storeRepository.findOne({ where: { name: 'Pet Haven Veterinary Clinic' } });
  if (!store) {
    store = storeRepository.create({
      name: 'Pet Haven Veterinary Clinic',
      status: StoreStatus.ACTIVE,
      phone: '+1-555-0100',
      address: '123 Happy Pets Boulevard',
      city: 'Los Angeles',
      state: 'California',
      country: 'United States',
      postal_code: '90001',
    });
    store = await storeRepository.save(store);
    console.log(`Store created: ${store.name} (ID: ${store.id})`);
  } else {
    console.log(`Store exists: ${store.name} (ID: ${store.id})`);
  }

  // Seed permissions if needed
  for (const slug of ALL_SYSTEM_PERMISSIONS) {
    const exists = await permissionRepository.findOne({ where: { slug } });
    if (!exists) await permissionRepository.save(permissionRepository.create({ slug, scope: 'SYSTEM' as any, description: `System permission: ${slug}`, module: slug.split('.')[1] || 'system', is_system_defined: true } as any));
  }
  for (const slug of ALL_STORE_PERMISSIONS) {
    const exists = await permissionRepository.findOne({ where: { slug } });
    if (!exists) await permissionRepository.save(permissionRepository.create({ slug, scope: 'STORE' as any, description: `Store permission: ${slug}`, module: slug.split('.')[0], is_system_defined: true } as any));
  }

  const allSystemPerms = await permissionRepository.findBy({ scope: 'SYSTEM' as any });
  const allStorePerms = await permissionRepository.findBy({ scope: 'STORE' as any });

  let superAdminRole = await roleRepository.findOne({ where: { name: SYSTEM_ROLES.SUPER_ADMIN, is_system_role: true } });
  if (!superAdminRole) {
    superAdminRole = roleRepository.create({ name: SYSTEM_ROLES.SUPER_ADMIN, description: 'System Super Administrator', is_editable: false, store_id: null as any, is_system_role: true });
    superAdminRole = await roleRepository.save(superAdminRole);
    for (const p of [...allSystemPerms, ...allStorePerms]) {
      await rolePermissionRepository.save({ role_id: superAdminRole.id, permission_id: p.id });
    }
    console.log('Super admin role created');
  }

  let storeAdminRole = await roleRepository.findOne({ where: { name: STORE_ROLES.ADMIN, store_id: store.id } });
  if (!storeAdminRole) {
    storeAdminRole = roleRepository.create({ name: STORE_ROLES.ADMIN, description: 'Store Administrator', is_editable: false, store_id: store.id, is_system_role: false });
    storeAdminRole = await roleRepository.save(storeAdminRole);
    for (const p of allStorePerms) {
      await rolePermissionRepository.save({ role_id: storeAdminRole.id, permission_id: p.id });
    }
    console.log('Store admin role created');
  }

  const hashedPassword = await bcrypt.hash('Admin@123456', 10);

  let superAdmin = await userRepository.findOne({ where: { email: 'superadmin@petcare.com' } });
  if (!superAdmin) {
    superAdmin = userRepository.create({ email: 'superadmin@petcare.com', password_hash: hashedPassword, full_name: 'PetCare Super Admin', phone: '+1-555-0001', status: UserStatus.ACTIVE, role_id: superAdminRole.id });
    superAdmin = await userRepository.save(superAdmin);
    console.log('Super admin created');
  }

  let storeAdmin = await userRepository.findOne({ where: { email: 'admin@pethaven.com' } });
  if (!storeAdmin) {
    storeAdmin = userRepository.create({ email: 'admin@pethaven.com', password_hash: hashedPassword, full_name: 'Sarah Johnson', phone: '+1-555-0200', address: '456 Staff Quarters', store_id: store.id, role_id: storeAdminRole.id, status: UserStatus.ACTIVE });
    storeAdmin = await userRepository.save(storeAdmin);
    console.log('Store admin created');
  }

  // Create a staff user
  let staffUser = await userRepository.findOne({ where: { email: 'staff@pethaven.com' } });
  if (!staffUser) {
    const staffRole = roleRepository.create({ name: 'Staff', description: 'Regular staff', is_editable: true, store_id: store.id, is_system_role: false });
    const savedStaffRole = await roleRepository.save(staffRole);
    const viewPerms = allStorePerms.filter(p => p.slug.endsWith('.view') || p.slug.endsWith('.manage'));
    for (const p of viewPerms.slice(0, 10)) {
      await rolePermissionRepository.save({ role_id: savedStaffRole.id, permission_id: p.id });
    }
    staffUser = userRepository.create({ email: 'staff@pethaven.com', password_hash: hashedPassword, full_name: 'Mike Chen', phone: '+1-555-0300', store_id: store.id, role_id: savedStaffRole.id, status: UserStatus.ACTIVE });
    staffUser = await userRepository.save(staffUser);
    console.log('Staff user created');
  }

  // Create an unaffiliated user (no store)
  let unaffiliatedUser = await userRepository.findOne({ where: { email: 'newuser@example.com' } });
  if (!unaffiliatedUser) {
    unaffiliatedUser = userRepository.create({ email: 'newuser@example.com', password_hash: hashedPassword, full_name: 'John Doe', phone: '+1-555-9999', status: UserStatus.ACTIVE });
    unaffiliatedUser = await userRepository.save(unaffiliatedUser);
    console.log('Unaffiliated user created');
  }

  // ── Seed Categories ──
  console.log('\n=== Seeding Categories ===');

  let productCategory = await categoryRepository.findOne({ where: { name: 'Grooming Products', store_id: store.id } });
  if (!productCategory) {
    productCategory = categoryRepository.create({ name: 'Grooming Products', type: CategoryType.PRODUCT, store_id: store.id });
    productCategory = await categoryRepository.save(productCategory);
  }

  let serviceCategory = await categoryRepository.findOne({ where: { name: 'Grooming Services', store_id: store.id } });
  if (!serviceCategory) {
    serviceCategory = categoryRepository.create({ name: 'Grooming Services', type: CategoryType.SERVICE, store_id: store.id });
    serviceCategory = await categoryRepository.save(serviceCategory);
  }

  let foodCategory = await categoryRepository.findOne({ where: { name: 'Pet Food', store_id: store.id } });
  if (!foodCategory) {
    foodCategory = categoryRepository.create({ name: 'Pet Food', type: CategoryType.PRODUCT, store_id: store.id });
    foodCategory = await categoryRepository.save(foodCategory);
  }

  console.log('Categories ready');

  // ── Seed Products ──
  console.log('\n=== Seeding Products ===');

  const productsData = [
    { name: 'Premium Dog Shampoo', cost_price: 5, sell_price: 15, stock_quantity: 50, min_stock_level: 10, category_id: productCategory.category_id, status: 'ACTIVE' as any },
    { name: 'Cat Brush Pro', cost_price: 3, sell_price: 12, stock_quantity: 30, min_stock_level: 5, category_id: productCategory.category_id, status: 'ACTIVE' as any },
    { name: 'Low Stock Item', cost_price: 8, sell_price: 20, stock_quantity: 2, min_stock_level: 5, category_id: productCategory.category_id, status: 'ACTIVE' as any },
    { name: 'Out of Stock Item', cost_price: 10, sell_price: 25, stock_quantity: 0, min_stock_level: 3, category_id: productCategory.category_id, status: 'ACTIVE' as any },
    { name: 'Expiring Soon Food', cost_price: 2, sell_price: 8, stock_quantity: 20, min_stock_level: 5, category_id: foodCategory.category_id, status: 'ACTIVE' as any, expiry_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
    { name: 'Organic Dog Food', cost_price: 15, sell_price: 35, stock_quantity: 100, min_stock_level: 20, category_id: foodCategory.category_id, status: 'ACTIVE' as any },
    { name: 'Archived Product', cost_price: 4, sell_price: 10, stock_quantity: 0, min_stock_level: 5, category_id: productCategory.category_id, status: 'ARCHIVED' as any },
  ];

  const products: Product[] = [];
  for (const pData of productsData) {
    let product = await productRepository.findOne({ where: { name: pData.name, store_id: store.id } });
    if (!product) {
      product = productRepository.create({ ...pData, store_id: store.id });
      product = await productRepository.save(product);
    }
    products.push(product);
  }
  console.log(`${products.length} products ready`);

  // ── Seed Services ──
  console.log('\n=== Seeding Services ===');

  const servicesData = [
    { combo_name: 'Basic Bath & Brush', price: 30, min_weight: 1, max_weight: 15, category_id: serviceCategory.category_id, status: 'ACTIVE' as any, description: 'Basic grooming service' },
    { combo_name: 'Full Grooming Package', price: 60, min_weight: 5, max_weight: 50, category_id: serviceCategory.category_id, status: 'ACTIVE' as any, description: 'Complete grooming with nail trim' },
    { combo_name: 'Premium Spa Treatment', price: 100, min_weight: 1, max_weight: 80, category_id: serviceCategory.category_id, status: 'ACTIVE' as any, description: 'Luxury spa experience' },
    { combo_name: 'Archived Service', price: 20, category_id: serviceCategory.category_id, status: 'ARCHIVED' as any, description: 'No longer offered' },
  ];

  const services: Service[] = [];
  for (const sData of servicesData) {
    let service = await serviceRepository.findOne({ where: { combo_name: sData.combo_name, store_id: store.id } });
    if (!service) {
      service = serviceRepository.create({ ...sData, store_id: store.id });
      service = await serviceRepository.save(service);
    }
    services.push(service);
  }
  console.log(`${services.length} services ready`);

  // ── Seed Customers & Pets ──
  console.log('\n=== Seeding Customers & Pets ===');

  const customersData = [
    { full_name: 'Alice Williams', phone: '+1-555-1001', email: 'alice@example.com', address: '100 Main St' },
    { full_name: 'Bob Brown', phone: '+1-555-1002', email: 'bob@example.com', address: '200 Oak Ave' },
    { full_name: 'Carol Davis', phone: '+1-555-1003', email: 'carol@example.com', address: '300 Pine Rd' },
    { full_name: 'David Lee', phone: '+1-555-1004', email: 'david@example.com', address: '400 Elm Blvd' },
    { full_name: 'Eva Martinez', phone: '+1-555-1005', email: 'eva@example.com', address: '500 Cedar Ln' },
  ];

  const customers: Customer[] = [];
  for (const cData of customersData) {
    let customer = await customerRepository.findOne({ where: { phone: cData.phone, store_id: store.id } });
    if (!customer) {
      customer = customerRepository.create({ ...cData, store_id: store.id });
      customer = await customerRepository.save(customer);
    }
    customers.push(customer);
  }

  const petsData = [
    { name: 'Buddy', breed: 'Labrador', gender: 'MALE' as any, dob: new Date('2020-03-15'), customer_id: customers[0].customer_id, status: 'ALIVE' as any },
    { name: 'Whiskers', breed: 'Persian Cat', gender: 'FEMALE' as any, dob: new Date('2019-07-20'), customer_id: customers[0].customer_id, status: 'ALIVE' as any },
    { name: 'Max', breed: 'German Shepherd', gender: 'MALE' as any, dob: new Date('2021-01-10'), customer_id: customers[1].customer_id, status: 'ALIVE' as any },
    { name: 'Luna', breed: 'Siamese Cat', gender: 'FEMALE' as any, dob: new Date('2022-05-25'), customer_id: customers[2].customer_id, status: 'ALIVE' as any },
    { name: 'Rocky', breed: 'Bulldog', gender: 'MALE' as any, dob: new Date('2018-11-30'), customer_id: customers[3].customer_id, status: 'DECEASED' as any },
  ];

  const pets: Pet[] = [];
  for (const pData of petsData) {
    let pet = await petRepository.findOne({ where: { name: pData.name, store_id: store.id, customer_id: pData.customer_id } });
    if (!pet) {
      const petCode = `${customers.find(c => c.customer_id === pData.customer_id)?.phone || '000'}_${pData.name}_1`;
      pet = petRepository.create({ ...pData, pet_code: petCode, store_id: store.id });
      pet = await petRepository.save(pet);
    }
    pets.push(pet);
  }
  console.log(`${customers.length} customers, ${pets.length} pets ready`);

  // ── Seed Orders ──
  console.log('\n=== Seeding Orders ===');

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const ordersData = [
    { customer_id: customers[0].customer_id, status: OrderStatus.PAID, created_at: now, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[0].product_id, quantity: 2, unit_price: 15, original_cost: 10, subtotal: 30 },
      { item_type: CategoryType.SERVICE, service_id: services[0].id, quantity: 1, unit_price: 30, original_cost: 0, subtotal: 30, pet_id: pets[0].pet_id },
    ]},
    { customer_id: customers[1].customer_id, status: OrderStatus.PAID, created_at: yesterday, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[1].product_id, quantity: 1, unit_price: 12, original_cost: 3, subtotal: 12 },
      { item_type: CategoryType.SERVICE, service_id: services[1].id, quantity: 1, unit_price: 60, original_cost: 0, subtotal: 60, pet_id: pets[2].pet_id },
    ]},
    { customer_id: customers[2].customer_id, status: OrderStatus.PAID, created_at: lastWeek, items: [
      { item_type: CategoryType.SERVICE, service_id: services[2].id, quantity: 1, unit_price: 100, original_cost: 0, subtotal: 100, pet_id: pets[3].pet_id },
    ]},
    { customer_id: customers[3].customer_id, status: OrderStatus.PENDING, created_at: now, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[5].product_id, quantity: 3, unit_price: 35, original_cost: 45, subtotal: 105 },
    ]},
    { customer_id: customers[4].customer_id, status: OrderStatus.CANCELLED, created_at: lastMonth, cancel_reason: 'Customer changed mind', items: [
      { item_type: CategoryType.PRODUCT, product_id: products[0].product_id, quantity: 1, unit_price: 15, original_cost: 5, subtotal: 15 },
    ]},
    { customer_id: customers[0].customer_id, status: OrderStatus.PAID, created_at: lastMonth, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[5].product_id, quantity: 2, unit_price: 35, original_cost: 30, subtotal: 70 },
    ]},
  ];

  for (const oData of ordersData) {
    const existing = await orderRepository.findOne({
      where: { store_id: store.id, customer_id: oData.customer_id, status: oData.status, created_at: oData.created_at as any },
    });
    if (existing) continue;

    const totalAmount = oData.items.reduce((sum, i) => sum + i.subtotal, 0);
    const order = orderRepository.create({
      store_id: store.id,
      user_id: storeAdmin.user_id,
      customer_id: oData.customer_id,
      total_amount: totalAmount,
      status: oData.status,
      cancel_reason: (oData as any).cancel_reason || null,
      created_at: oData.created_at,
    } as any);
    const savedOrder = await orderRepository.save(order) as unknown as Order;

    for (const item of oData.items) {
      await orderDetailRepository.save(orderDetailRepository.create({
        order_id: savedOrder.order_id,
        ...item,
      }));
    }

    if (oData.status === OrderStatus.PAID) {
      await paymentRepository.save(paymentRepository.create({
        order_id: savedOrder.order_id,
        payment_method: PaymentMethod.CASH,
        amount: totalAmount,
        status: PaymentStatus.COMPLETED,
      }));
    }

    console.log(`Order #${savedOrder.order_id} created (${oData.status}, ${totalAmount})`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('ANALYTICS SEED COMPLETED SUCCESSFULLY');
  console.log('='.repeat(50));
  console.log('\nCredentials:');
  console.log('  Super Admin: superadmin@petcare.com / Admin@123456');
  console.log('  Store Admin: admin@pethaven.com / Admin@123456');
  console.log('  Staff:       staff@pethaven.com / Admin@123456');
  console.log('  Unaffiliated: newuser@example.com / Admin@123456');
  console.log('');

  await connection.close();
}

seedAnalyticsData()
  .then(() => { console.log('Done'); process.exit(0); })
  .catch((error) => { console.error('Seeding failed:', error); process.exit(1); });

// npx ts-node scripts/seed-analytics.ts
