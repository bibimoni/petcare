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
import { CustomerHistory, CustomerHistoryAction } from '../src/customers/entities/customer-history.entity';

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
    entities: [User, Order, OrderDetail, Product, Category, Service, Customer, Pet, PetWeightHistory, Store, Permission, Role, RolePermission, Notification, Payment, CustomerHistory],
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
  const customerHistoryRepository = connection.getRepository(CustomerHistory);

  // ── Ensure base data exists (store, roles, superadmin) ──
  console.log('\n=== Ensuring base data ===');

  let store = await storeRepository.findOne({ where: { name: 'Phòng Khám Thú Y Pet Haven' } });
  if (!store) {
    store = storeRepository.create({
      name: 'Phòng Khám Thú Y Pet Haven',
      status: StoreStatus.ACTIVE,
      phone: '028-1234-5678',
      address: '123 Nguyễn Văn Linh',
      city: 'Hồ Chí Minh',
      state: 'Hồ Chí Minh',
      country: 'Việt Nam',
      postal_code: '700000',
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
    superAdmin = userRepository.create({ email: 'superadmin@petcare.com', password_hash: hashedPassword, full_name: 'Quản Trị Hệ Thống PetCare', phone: '090-000-0001', status: UserStatus.ACTIVE, role_id: superAdminRole.id });
    superAdmin = await userRepository.save(superAdmin);
    console.log('Super admin created');
  }

  let storeAdmin = await userRepository.findOne({ where: { email: 'admin@pethaven.com' } });
  if (!storeAdmin) {
    storeAdmin = userRepository.create({ email: 'admin@pethaven.com', password_hash: hashedPassword, full_name: 'Nguyễn Thị Hương', phone: '090-000-0200', address: '456 Lê Văn Việt, Quận 9', store_id: store.id, role_id: storeAdminRole.id, status: UserStatus.ACTIVE });
    storeAdmin = await userRepository.save(storeAdmin);
    console.log('Store admin created');
  }

  // Create a staff user
  let staffUser = await userRepository.findOne({ where: { email: 'staff@pethaven.com' } });
  if (!staffUser) {
    const staffRole = roleRepository.create({ name: 'Nhân viên', description: 'Nhân viên phòng khám', is_editable: true, store_id: store.id, is_system_role: false });
    const savedStaffRole = await roleRepository.save(staffRole);
    const viewPerms = allStorePerms.filter(p => p.slug.endsWith('.view') || p.slug.endsWith('.manage'));
    for (const p of viewPerms.slice(0, 10)) {
      await rolePermissionRepository.save({ role_id: savedStaffRole.id, permission_id: p.id });
    }
    staffUser = userRepository.create({ email: 'staff@pethaven.com', password_hash: hashedPassword, full_name: 'Trần Văn Minh', phone: '090-000-0300', store_id: store.id, role_id: savedStaffRole.id, status: UserStatus.ACTIVE });
    staffUser = await userRepository.save(staffUser);
    console.log('Staff user created');
  }

  // Create an unaffiliated user (no store)
  let unaffiliatedUser = await userRepository.findOne({ where: { email: 'newuser@example.com' } });
  if (!unaffiliatedUser) {
    unaffiliatedUser = userRepository.create({ email: 'newuser@example.com', password_hash: hashedPassword, full_name: 'Lê Hoàng Nam', phone: '090-000-9999', status: UserStatus.ACTIVE });
    unaffiliatedUser = await userRepository.save(unaffiliatedUser);
    console.log('Unaffiliated user created');
  }

  // ── Seed Categories ──
  console.log('\n=== Seeding Categories ===');

  let productCategory = await categoryRepository.findOne({ where: { name: 'Sản phẩm chăm sóc lông', store_id: store.id } });
  if (!productCategory) {
    productCategory = categoryRepository.create({ name: 'Sản phẩm chăm sóc lông', type: CategoryType.PRODUCT, store_id: store.id });
    productCategory = await categoryRepository.save(productCategory);
  }

  let serviceCategory = await categoryRepository.findOne({ where: { name: 'Dịch vụ chải lông', store_id: store.id } });
  if (!serviceCategory) {
    serviceCategory = categoryRepository.create({ name: 'Dịch vụ chải lông', type: CategoryType.SERVICE, store_id: store.id });
    serviceCategory = await categoryRepository.save(serviceCategory);
  }

  let foodCategory = await categoryRepository.findOne({ where: { name: 'Thức ăn thú cưng', store_id: store.id } });
  if (!foodCategory) {
    foodCategory = categoryRepository.create({ name: 'Thức ăn thú cưng', type: CategoryType.PRODUCT, store_id: store.id });
    foodCategory = await categoryRepository.save(foodCategory);
  }

  console.log('Categories ready');

  // ── Seed Products ──
  console.log('\n=== Seeding Products ===');

  const productsData = [
    { name: 'Dầu tắm chó cao cấp', cost_price: 125000, sell_price: 375000, stock_quantity: 50, min_stock_level: 10, category_id: productCategory.category_id, status: 'ACTIVE' as any },
    { name: 'Bàn chải lông mèo', cost_price: 75000, sell_price: 300000, stock_quantity: 30, min_stock_level: 5, category_id: productCategory.category_id, status: 'ACTIVE' as any },
    { name: 'Sản phẩm sắp hết hàng', cost_price: 200000, sell_price: 500000, stock_quantity: 2, min_stock_level: 5, category_id: productCategory.category_id, status: 'ACTIVE' as any },
    { name: 'Sản phẩm hết hàng', cost_price: 250000, sell_price: 625000, stock_quantity: 0, min_stock_level: 3, category_id: productCategory.category_id, status: 'ACTIVE' as any },
    { name: 'Thức ăn sắp hết hạn', cost_price: 50000, sell_price: 200000, stock_quantity: 20, min_stock_level: 5, category_id: foodCategory.category_id, status: 'ACTIVE' as any, expiry_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
    { name: 'Thức ăn chó hữu cơ', cost_price: 375000, sell_price: 875000, stock_quantity: 100, min_stock_level: 20, category_id: foodCategory.category_id, status: 'ACTIVE' as any },
    { name: 'Sản phẩm đã ngưng bán', cost_price: 100000, sell_price: 250000, stock_quantity: 0, min_stock_level: 5, category_id: productCategory.category_id, status: 'ARCHIVED' as any },
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
    { combo_name: 'Tắm & chải lông cơ bản', price: 750000, min_weight: 1, max_weight: 15, category_id: serviceCategory.category_id, status: 'ACTIVE' as any, description: 'Dịch vụ chải lông cơ bản' },
    { combo_name: 'Gói chải lông đầy đủ', price: 1500000, min_weight: 5, max_weight: 50, category_id: serviceCategory.category_id, status: 'ACTIVE' as any, description: 'Chải lông đầy đủ kèm cắt móng' },
    { combo_name: 'Spa cao cấp', price: 2500000, min_weight: 1, max_weight: 80, category_id: serviceCategory.category_id, status: 'ACTIVE' as any, description: 'Trải nghiệm spa sang trọng' },
    { combo_name: 'Dịch vụ đã ngưng', price: 500000, category_id: serviceCategory.category_id, status: 'ARCHIVED' as any, description: 'Không còn cung cấp' },
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
    { full_name: 'Nguyễn Minh Anh', phone: '090-100-0001', email: 'minhanh@email.com', address: '100 Nguyễn Huệ, Quận 1' },
    { full_name: 'Trần Đức Bình', phone: '090-100-0002', email: 'ducbinh@email.com', address: '200 Lê Lợi, Quận 1' },
    { full_name: 'Lê Thu Cúc', phone: '090-100-0003', email: 'thucuc@email.com', address: '300 Hai Bà Trưng, Quận 3' },
    { full_name: 'Phạm Văn Đức', phone: '090-100-0004', email: 'vanduc@email.com', address: '400 Võ Văn Tần, Quận 3' },
    { full_name: 'Hoàng Thị Êmbơr', phone: '090-100-0005', email: 'embor@email.com', address: '500 Điện Biên Phủ, Bình Thạnh' },
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
    { name: 'Vàng', breed: 'Labrador', gender: 'MALE' as any, dob: new Date('2020-03-15'), customer_id: customers[0].customer_id, status: 'ALIVE' as any },
    { name: 'Mướp', breed: 'Mèo Ba Tư', gender: 'FEMALE' as any, dob: new Date('2019-07-20'), customer_id: customers[0].customer_id, status: 'ALIVE' as any },
    { name: 'Đen', breed: 'Béc Giê', gender: 'MALE' as any, dob: new Date('2021-01-10'), customer_id: customers[1].customer_id, status: 'ALIVE' as any },
    { name: 'Lam', breed: 'Mèo Xiêm', gender: 'FEMALE' as any, dob: new Date('2022-05-25'), customer_id: customers[2].customer_id, status: 'ALIVE' as any },
    { name: 'Sốc', breed: 'Bulldog', gender: 'MALE' as any, dob: new Date('2018-11-30'), customer_id: customers[3].customer_id, status: 'DECEASED' as any },
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

  const apr1 = new Date('2026-04-01T10:00:00');
  const apr5 = new Date('2026-04-05T11:30:00');
  const apr10 = new Date('2026-04-10T09:15:00');
  const apr15 = new Date('2026-04-15T14:00:00');
  const apr20 = new Date('2026-04-20T16:45:00');
  const apr25 = new Date('2026-04-25T10:30:00');
  const apr28 = new Date('2026-04-28T13:00:00');

  const ordersData = [
    { customer_id: customers[0].customer_id, status: OrderStatus.PAID, created_at: now, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[0].product_id, quantity: 2, unit_price: 375000, original_cost: 250000, subtotal: 750000 },
      { item_type: CategoryType.SERVICE, service_id: services[0].id, quantity: 1, unit_price: 750000, original_cost: 0, subtotal: 750000, pet_id: pets[0].pet_id },
    ]},
    { customer_id: customers[1].customer_id, status: OrderStatus.PAID, created_at: yesterday, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[1].product_id, quantity: 1, unit_price: 300000, original_cost: 75000, subtotal: 300000 },
      { item_type: CategoryType.SERVICE, service_id: services[1].id, quantity: 1, unit_price: 1500000, original_cost: 0, subtotal: 1500000, pet_id: pets[2].pet_id },
    ]},
    { customer_id: customers[2].customer_id, status: OrderStatus.PAID, created_at: lastWeek, items: [
      { item_type: CategoryType.SERVICE, service_id: services[2].id, quantity: 1, unit_price: 2500000, original_cost: 0, subtotal: 2500000, pet_id: pets[3].pet_id },
    ]},
    { customer_id: customers[3].customer_id, status: OrderStatus.PENDING, created_at: now, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[5].product_id, quantity: 3, unit_price: 875000, original_cost: 1125000, subtotal: 2625000 },
    ]},
    { customer_id: customers[4].customer_id, status: OrderStatus.CANCELLED, created_at: lastMonth, cancel_reason: 'Khách hàng đổi ý', items: [
      { item_type: CategoryType.PRODUCT, product_id: products[0].product_id, quantity: 1, unit_price: 375000, original_cost: 125000, subtotal: 375000 },
    ]},
    { customer_id: customers[0].customer_id, status: OrderStatus.PAID, created_at: lastMonth, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[5].product_id, quantity: 2, unit_price: 875000, original_cost: 750000, subtotal: 1750000 },
    ]},

    // ── April 2026 orders ──
    { customer_id: customers[0].customer_id, status: OrderStatus.PAID, created_at: apr1, items: [
      { item_type: CategoryType.SERVICE, service_id: services[1].id, quantity: 1, unit_price: 1500000, original_cost: 0, subtotal: 1500000, pet_id: pets[0].pet_id },
      { item_type: CategoryType.PRODUCT, product_id: products[5].product_id, quantity: 1, unit_price: 875000, original_cost: 375000, subtotal: 875000 },
    ]},
    { customer_id: customers[1].customer_id, status: OrderStatus.PAID, created_at: apr5, items: [
      { item_type: CategoryType.SERVICE, service_id: services[0].id, quantity: 1, unit_price: 750000, original_cost: 0, subtotal: 750000, pet_id: pets[2].pet_id },
    ]},
    { customer_id: customers[2].customer_id, status: OrderStatus.PAID, created_at: apr10, items: [
      { item_type: CategoryType.SERVICE, service_id: services[2].id, quantity: 1, unit_price: 2500000, original_cost: 0, subtotal: 2500000, pet_id: pets[3].pet_id },
      { item_type: CategoryType.PRODUCT, product_id: products[0].product_id, quantity: 2, unit_price: 375000, original_cost: 250000, subtotal: 750000 },
    ]},
    { customer_id: customers[3].customer_id, status: OrderStatus.PAID, created_at: apr15, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[5].product_id, quantity: 2, unit_price: 875000, original_cost: 750000, subtotal: 1750000 },
      { item_type: CategoryType.PRODUCT, product_id: products[1].product_id, quantity: 1, unit_price: 300000, original_cost: 75000, subtotal: 300000 },
    ]},
    { customer_id: customers[4].customer_id, status: OrderStatus.CANCELLED, created_at: apr15, cancel_reason: 'Khách hàng đổi lịch', items: [
      { item_type: CategoryType.SERVICE, service_id: services[1].id, quantity: 1, unit_price: 1500000, original_cost: 0, subtotal: 1500000, pet_id: pets[4].pet_id },
    ]},
    { customer_id: customers[0].customer_id, status: OrderStatus.PAID, created_at: apr20, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[0].product_id, quantity: 3, unit_price: 375000, original_cost: 375000, subtotal: 1125000 },
    ]},
    { customer_id: customers[1].customer_id, status: OrderStatus.PAID, created_at: apr25, items: [
      { item_type: CategoryType.SERVICE, service_id: services[0].id, quantity: 1, unit_price: 750000, original_cost: 0, subtotal: 750000, pet_id: pets[2].pet_id },
      { item_type: CategoryType.SERVICE, service_id: services[2].id, quantity: 1, unit_price: 2500000, original_cost: 0, subtotal: 2500000, pet_id: pets[2].pet_id },
    ]},
    { customer_id: customers[2].customer_id, status: OrderStatus.PAID, created_at: apr28, items: [
      { item_type: CategoryType.PRODUCT, product_id: products[5].product_id, quantity: 1, unit_price: 875000, original_cost: 375000, subtotal: 875000 },
    ]},
    { customer_id: customers[3].customer_id, status: OrderStatus.PAID, created_at: apr28, items: [
      { item_type: CategoryType.SERVICE, service_id: services[1].id, quantity: 1, unit_price: 1500000, original_cost: 0, subtotal: 1500000, pet_id: pets[4].pet_id },
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

  // ── Seed Customer History ──
  console.log('\n=== Seeding Customer History ===');

  const existingHistoryCount = await customerHistoryRepository.count({ where: { store_id: store.id } });
  if (existingHistoryCount === 0) {
    const historyEntries = [
      {
        customer_id: customers[0].customer_id,
        action: CustomerHistoryAction.CREATED,
        performed_by: storeAdmin.user_id,
        performed_by_name: storeAdmin.full_name,
        old_values: null,
        new_values: { full_name: 'Nguyễn Minh Anh', phone: '090-100-0001', email: 'minhanh@email.com', address: '100 Nguyễn Huệ, Quận 1', notes: null },
        created_at: new Date('2026-01-15T10:00:00'),
      },
      {
        customer_id: customers[0].customer_id,
        action: CustomerHistoryAction.UPDATED,
        performed_by: storeAdmin.user_id,
        performed_by_name: storeAdmin.full_name,
        old_values: { full_name: 'Nguyễn Minh Anh', phone: '090-100-0001', email: 'minhanh@email.com', address: '100 Nguyễn Huệ, Quận 1', notes: null },
        new_values: { full_name: 'Nguyễn Minh Anh', phone: '090-100-0001', email: 'minhanh.new@email.com', address: '100 Nguyễn Huệ, Quận 1', notes: 'Khách hàng VIP' },
        created_at: new Date('2026-02-20T14:30:00'),
      },
      {
        customer_id: customers[1].customer_id,
        action: CustomerHistoryAction.CREATED,
        performed_by: staffUser.user_id,
        performed_by_name: staffUser.full_name,
        old_values: null,
        new_values: { full_name: 'Trần Đức Bình', phone: '090-100-0002', email: 'ducbinh@email.com', address: '200 Lê Lợi, Quận 1', notes: null },
        created_at: new Date('2026-01-20T09:15:00'),
      },
      {
        customer_id: customers[1].customer_id,
        action: CustomerHistoryAction.UPDATED,
        performed_by: storeAdmin.user_id,
        performed_by_name: storeAdmin.full_name,
        old_values: { full_name: 'Trần Đức Bình', phone: '090-100-0002', email: 'ducbinh@email.com', address: '200 Lê Lợi, Quận 1', notes: null },
        new_values: { full_name: 'Trần Đức Bình', phone: '090-100-0002', email: 'ducbinh@email.com', address: '250 Lê Lợi, Lầu 3', notes: null },
        created_at: new Date('2026-03-10T11:00:00'),
      },
      {
        customer_id: customers[2].customer_id,
        action: CustomerHistoryAction.CREATED,
        performed_by: storeAdmin.user_id,
        performed_by_name: storeAdmin.full_name,
        old_values: null,
        new_values: { full_name: 'Lê Thu Cúc', phone: '090-100-0003', email: 'thucuc@email.com', address: '300 Hai Bà Trưng, Quận 3', notes: null },
        created_at: new Date('2026-02-05T16:45:00'),
      },
      {
        customer_id: customers[3].customer_id,
        action: CustomerHistoryAction.CREATED,
        performed_by: staffUser.user_id,
        performed_by_name: staffUser.full_name,
        old_values: null,
        new_values: { full_name: 'Phạm Văn Đức', phone: '090-100-0004', email: 'vanduc@email.com', address: '400 Võ Văn Tần, Quận 3', notes: null },
        created_at: new Date('2026-03-01T08:30:00'),
      },
      {
        customer_id: customers[3].customer_id,
        action: CustomerHistoryAction.UPDATED,
        performed_by: storeAdmin.user_id,
        performed_by_name: storeAdmin.full_name,
        old_values: { full_name: 'Phạm Văn Đức', phone: '090-100-0004', email: 'vanduc@email.com', address: '400 Võ Văn Tần, Quận 3', notes: null },
        new_values: { full_name: 'Phạm Văn Đức', phone: '090-100-0004', email: 'vanduc.pham@email.com', address: '400 Võ Văn Tần, Quận 3', notes: 'Dị ứng thịt gà' },
        created_at: new Date('2026-04-12T13:20:00'),
      },
      {
        customer_id: customers[4].customer_id,
        action: CustomerHistoryAction.CREATED,
        performed_by: storeAdmin.user_id,
        performed_by_name: storeAdmin.full_name,
        old_values: null,
        new_values: { full_name: 'Hoàng Thị Êmbơr', phone: '090-100-0005', email: 'embor@email.com', address: '500 Điện Biên Phủ, Bình Thạnh', notes: null },
        created_at: new Date('2026-03-15T10:00:00'),
      },
      {
        customer_id: customers[4].customer_id,
        action: CustomerHistoryAction.UPDATED,
        performed_by: staffUser.user_id,
        performed_by_name: staffUser.full_name,
        old_values: { full_name: 'Hoàng Thị Êmbơr', phone: '090-100-0005', email: 'embor@email.com', address: '500 Điện Biên Phủ, Bình Thạnh', notes: null },
        new_values: { full_name: 'Hoàng Thị Êm Bơr', phone: '090-100-0005', email: 'embor@email.com', address: '500 Điện Biên Phủ, Bình Thạnh', notes: null },
        created_at: new Date('2026-04-22T15:45:00'),
      },
      {
        customer_id: customers[0].customer_id,
        action: CustomerHistoryAction.UPDATED,
        performed_by: storeAdmin.user_id,
        performed_by_name: storeAdmin.full_name,
        old_values: { full_name: 'Nguyễn Minh Anh', phone: '090-100-0001', email: 'minhanh.new@email.com', address: '100 Nguyễn Huệ, Quận 1', notes: 'Khách hàng VIP' },
        new_values: { full_name: 'Nguyễn Minh Anh', phone: '090-100-0001', email: 'minhanh.new@email.com', address: '150 Nguyễn Huệ, Phòng A', notes: 'Khách hàng VIP' },
        created_at: new Date('2026-04-28T09:00:00'),
      },
    ];

    for (const entry of historyEntries) {
      const saved = await customerHistoryRepository.save(customerHistoryRepository.create({
        customer_id: entry.customer_id,
        store_id: store.id,
        action: entry.action,
        performed_by: entry.performed_by,
        performed_by_name: entry.performed_by_name,
        old_values: entry.old_values,
        new_values: entry.new_values,
      }) as any) as any;

      const placeholder = dbType === 'sqlite' ? '?' : '$1';
      const idPlaceholder = dbType === 'sqlite' ? '?' : '$2';
      await connection.query(
        `UPDATE customer_history SET created_at = ${placeholder} WHERE id = ${idPlaceholder}`,
        [entry.created_at, saved.id],
      );
    }
    console.log(`${historyEntries.length} customer history entries created`);
  } else {
    console.log(`Customer history already exists (${existingHistoryCount} entries)`);
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
