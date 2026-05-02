import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

import {
  ENTITIES,
  TEST_CONFIG,
  User,
  Store,
  Role,
  RolePermission,
  Permission,
  Category,
  Product,
  Service,
  Customer,
  Pet,
  Order,
} from './test-database.helper';
import { AppModule } from '../src/app.module';
import { StripeService } from '../src/orders/stripe.service';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';
import { MailService } from '../src/mail/mail.service';
import { NotificationScheduler } from '../src/notifications/notification.scheduler';
import { UserStatus } from '../src/common/enum';
import { hashPassword } from '../src/common';

const mockStripe = {
  createPaymentIntent: jest.fn().mockResolvedValue({
    client_secret: 'cs_test_123',
    payment_intent_id: 'pi_test_123',
    amount: 2500,
    currency: 'usd',
  }),
  createCheckoutSession: jest.fn().mockResolvedValue({
    checkout_url: 'https://checkout.stripe.test/session',
    session_id: 'cs_test_123',
    payment_intent_id: 'pi_test_123',
  }),
  retrievePaymentIntent: jest.fn().mockResolvedValue({ status: 'succeeded' }),
  confirmPaymentIntent: jest.fn().mockResolvedValue({ status: 'succeeded' }),
  cancelPaymentIntent: jest.fn().mockResolvedValue({ status: 'canceled' }),
  refundCharge: jest.fn().mockResolvedValue({ id: 're_test_123', status: 'succeeded' }),
  getChargeDetails: jest.fn().mockResolvedValue({ id: 'ch_test_123' }),
  constructWebhookEvent: jest.fn(),
};

const mockCloudinary = {
  uploadFile: jest.fn().mockResolvedValue({ url: 'https://img.test/1.jpg' }),
  deleteFile: jest.fn().mockResolvedValue({ result: 'ok' }),
};

const mockMail = {
  sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
  sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
};

const mockScheduler = {
  registerStoreJob: jest.fn(),
  onDeleteCron: jest.fn(),
  onModuleInit: jest.fn(),
};

const ALL_PERMISSIONS = [
  'store.settings.manage',
  'store.view',
  'customer.view',
  'customer.manage',
  'customer.create',
  'customer.edit',
  'customer.delete',
  'pet.view',
  'pet.create',
  'pet.edit',
  'pet.delete',
  'product.view',
  'product.manage',
  'product.create',
  'product.edit',
  'product.delete',
  'inventory.view',
  'inventory.manage',
  'inventory.adjust',
  'service.view',
  'service.manage',
  'service.create',
  'service.edit',
  'service.delete',
  'order.view',
  'order.create',
  'order.edit',
  'order.cancel',
  'order.refund',
  'order.view_all',
  'staff.view',
  'staff.create',
  'staff.edit',
  'staff.delete',
  'staff.invite',
  'role.view',
  'role.create',
  'role.edit',
  'role.delete',
  'role.assign',
  'analytics.view',
  'reports.view',
  'reports.export',
  'category.manage',
  'category.create',
  'category.edit',
  'category.delete',
];

describe('Permissions E2E', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let ds: DataSource;

  let storeId: number;
  let adminRoleId: number;
  let categoryId: number;
  let productId: number;
  let serviceId: number;
  let customerId: number;
  let petId: number;
  let orderId: number;

  const makeToken = (userId: number, perms: string[]) =>
    jwtService.sign({
      sub: userId,
      email: 'test@perm.com',
      role_id: adminRoleId,
      role_name: 'TEST_ROLE',
      store_id: storeId,
      permissions: perms,
    });

  const makeSuperAdminToken = (userId: number) =>
    jwtService.sign({
      sub: userId,
      email: 'super@test.com',
      role_id: null,
      store_id: null,
      permissions: [],
    });

  let adminToken: string;
  let noPermToken: string;
  let superAdminToken: string;
  let adminUserId: number;
  let noPermUserId: number;
  let superAdminUserId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StripeService)
      .useValue(mockStripe)
      .overrideProvider(CloudinaryService)
      .useValue(mockCloudinary)
      .overrideProvider(MailService)
      .useValue(mockMail)
      .overrideProvider(NotificationScheduler)
      .useValue(mockScheduler)
      .compile();

    app = module.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();

    jwtService = module.get(JwtService);
    ds = module.get(DataSource);
  }, 60000);

  afterAll(async () => await app.close());

  beforeEach(async () => {
    jest.clearAllMocks();
    await ds.synchronize(true);

    const store = await ds.getRepository(Store).save({
      name: 'Perm Test Store',
      status: 'ACTIVE',
      phone: '+1-555-0000',
    } as any);
    storeId = store.id;

    const allPermSlugs = [
      ...ALL_PERMISSIONS,
      'system.users.manage',
      'system.stores.manage',
      'system.view_analytics',
      'system.manage_subscriptions',
    ];

    const permRepo = ds.getRepository(Permission);
    const savedPerms: Permission[] = [];
    for (const slug of allPermSlugs) {
      let perm = await permRepo.findOne({ where: { slug } as any });
      if (!perm) {
        perm = await permRepo.save({
          slug,
          scope: slug.startsWith('system.') ? 'SYSTEM' : 'STORE',
          is_system_defined: true,
          module: slug.split('.')[0],
        } as any);
      }
      savedPerms.push(perm);
    }

    const adminRole = await ds.getRepository(Role).save({
      name: 'Admin',
      store_id: storeId,
      is_editable: false,
      is_system_role: false,
    } as any);
    adminRoleId = adminRole.id;

    for (const p of savedPerms.filter((sp) => sp.scope === 'STORE')) {
      await ds.getRepository(RolePermission).save({
        role_id: adminRoleId,
        permission_id: p.id,
      });
    }

    const noPermRole = await ds.getRepository(Role).save({
      name: 'NoPerms',
      store_id: storeId,
      is_editable: true,
      is_system_role: false,
    } as any);

    const superAdminRole = await ds.getRepository(Role).save({
      name: 'SUPER_ADMIN',
      description: 'System Super Administrator',
      is_editable: false,
      is_system_role: true,
      store_id: null,
    } as any);

    for (const p of savedPerms) {
      const exists = await ds.getRepository(RolePermission).findOne({
        where: { role_id: superAdminRole.id, permission_id: p.id } as any,
      });
      if (!exists) {
        await ds.getRepository(RolePermission).save({
          role_id: superAdminRole.id,
          permission_id: p.id,
        });
      }
    }

    const adminUser = await ds.getRepository(User).save({
      full_name: 'Admin User',
      email: 'admin@perm.test',
      password_hash: await hashPassword('Test@1234'),
      store_id: storeId,
      role_id: adminRoleId,
      status: UserStatus.ACTIVE,
    } as any);
    adminUserId = adminUser.user_id;

    const noPermUser = await ds.getRepository(User).save({
      full_name: 'No Perms',
      email: 'noperm@perm.test',
      password_hash: await hashPassword('Test@1234'),
      store_id: storeId,
      role_id: noPermRole.id,
      status: UserStatus.ACTIVE,
    } as any);
    noPermUserId = noPermUser.user_id;

    const superAdminUser = await ds.getRepository(User).save({
      full_name: 'Super Admin',
      email: 'superadmin@perm.test',
      password_hash: await hashPassword('Test@1234'),
      store_id: null,
      role_id: superAdminRole.id,
      status: UserStatus.ACTIVE,
    } as any);
    superAdminUserId = superAdminUser.user_id;

    adminToken = makeToken(adminUserId, ALL_PERMISSIONS);
    noPermToken = makeToken(noPermUserId, []);
    superAdminToken = makeSuperAdminToken(superAdminUserId);

    const cat = await ds.getRepository(Category).save({
      name: 'Test Cat',
      store_id: storeId,
      type: 'PRODUCT',
    } as any);
    categoryId = cat.category_id;

    const prod = await ds.getRepository(Product).save({
      name: 'Test Product',
      store_id: storeId,
      category_id: categoryId,
      cost_price: 10,
      sell_price: 25,
      original_cost: 8,
      stock_quantity: 100,
    } as any);
    productId = prod.product_id;

    const svc = await ds.getRepository(Service).save({
      combo_name: 'Test Service',
      store_id: storeId,
      category_id: categoryId,
      price: 50,
      original_cost: 20,
    } as any);
    serviceId = svc.id;

    const cust = await ds.getRepository(Customer).save({
      full_name: 'Test Customer',
      store_id: storeId,
      phone: '+1-555-0100',
      email: 'cust@test.com',
    } as any);
    customerId = cust.customer_id;

    const pet = await ds.getRepository(Pet).save({
      name: 'Test Pet',
      store_id: storeId,
      customer_id: customerId,
      pet_code: 'PET-TEST-001',
      gender: 'MALE',
      status: 'ALIVE',
    } as any);
    petId = pet.pet_id;

    const order = await ds.getRepository(Order).save({
      store_id: storeId,
      customer_id: customerId,
      user_id: adminUserId,
      total_amount: 25,
      status: 'PENDING',
    } as any);
    orderId = order.order_id;
  });

  const ENDPOINT_TESTS: {
    label: string;
    requiredPerm: string;
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    body?: any;
    minStatus?: number;
    skipNoPerm?: boolean;
    skipWithPerm?: boolean;
    dynamicBody?: boolean;
  }[] = [
    {
      label: 'Analytics Dashboard',
      requiredPerm: 'analytics.view',
      method: 'GET',
      path: '/v1/analytics/dashboard',
    },
    {
      label: 'Analytics Pet Stats',
      requiredPerm: 'analytics.view',
      method: 'GET',
      path: '/v1/analytics/pets/stats',
    },
    {
      label: 'Analytics Order Stats',
      requiredPerm: 'analytics.view',
      method: 'GET',
      path: '/v1/analytics/orders/stats',
    },
    {
      label: 'Analytics Profit',
      requiredPerm: 'analytics.view',
      method: 'GET',
      path: '/v1/analytics/profit',
      skipWithPerm: true,
    },
    {
      label: 'Analytics Activities',
      requiredPerm: 'analytics.view',
      method: 'GET',
      path: '/v1/analytics/activities',
    },
    {
      label: 'Analytics Inventory Alerts',
      requiredPerm: 'inventory.view',
      method: 'GET',
      path: '/v1/analytics/inventory/alerts',
    },
    {
      label: 'Category List',
      requiredPerm: 'category.manage',
      method: 'GET',
      path: '/v1/categories',
    },
    {
      label: 'Category Create',
      requiredPerm: 'category.create',
      method: 'POST',
      path: '/v1/categories',
      body: { name: 'New Cat', type: 'PRODUCT' },
    },
    {
      label: 'Category Update',
      requiredPerm: 'category.edit',
      method: 'PATCH',
      path: '/v1/categories/1',
      body: { name: 'Updated' },
    },
    {
      label: 'Category Delete',
      requiredPerm: 'category.delete',
      method: 'DELETE',
      path: '/v1/categories/1',
    },
    {
      label: 'Product List',
      requiredPerm: 'product.view',
      method: 'GET',
      path: '/v1/products',
    },
    {
      label: 'Product Create',
      requiredPerm: 'product.create',
      method: 'POST',
      path: '/v1/products',
      body: {
        name: 'New Prod',
        category_id: 1,
        cost_price: 10000,
        sell_price: 20000,
        stock_quantity: 5,
      },
    },
    {
      label: 'Product Update',
      requiredPerm: 'product.edit',
      method: 'PATCH',
      path: '/v1/products/1',
      body: { name: 'Updated' },
    },
    {
      label: 'Product Delete',
      requiredPerm: 'product.delete',
      method: 'DELETE',
      path: '/v1/products/1',
    },
    {
      label: 'Product Alerts',
      requiredPerm: 'inventory.view',
      method: 'GET',
      path: '/v1/products/alerts',
    },
    {
      label: 'Product Count',
      requiredPerm: 'inventory.view',
      method: 'GET',
      path: '/v1/products/count-all-products',
    },
    {
      label: 'Product Inventory Value',
      requiredPerm: 'inventory.view',
      method: 'GET',
      path: '/v1/products/total/sum',
    },
    {
      label: 'Service List',
      requiredPerm: 'service.view',
      method: 'GET',
      path: '/v1/services',
    },
    {
      label: 'Service Create',
      requiredPerm: 'service.create',
      method: 'POST',
      path: '/v1/services',
      body: {
        combo_name: 'New Svc',
        category_id: 1,
        price: 50000,
      },
    },
    {
      label: 'Service Update',
      requiredPerm: 'service.edit',
      method: 'PATCH',
      path: '/v1/services/1',
      body: { combo_name: 'Updated' },
    },
    {
      label: 'Service Delete',
      requiredPerm: 'service.delete',
      method: 'DELETE',
      path: '/v1/services/1',
    },
    {
      label: 'Customer List',
      requiredPerm: 'customer.view',
      method: 'GET',
      path: '/v1/customers',
    },
    {
      label: 'Customer Create',
      requiredPerm: 'customer.create',
      method: 'POST',
      path: '/v1/customers',
      body: { full_name: 'New', phone: '+1-555-9999' },
    },
    {
      label: 'Customer Update',
      requiredPerm: 'customer.edit',
      method: 'PATCH',
      path: '/v1/customers/1',
      body: { full_name: 'Updated' },
    },
    {
      label: 'Customer Delete',
      requiredPerm: 'customer.delete',
      method: 'DELETE',
      path: '/v1/customers/1',
    },
    {
      label: 'Pet List',
      requiredPerm: 'pet.view',
      method: 'GET',
      path: '/v1/pets',
    },
    {
      label: 'Pet Create',
      requiredPerm: 'pet.create',
      method: 'POST',
      path: '/v1/pets/customer/1',
      body: { name: 'New Pet', gender: 'MALE', status: 'ALIVE' },
    },
    {
      label: 'Pet Update',
      requiredPerm: 'pet.edit',
      method: 'PATCH',
      path: '/v1/pets/1',
      body: { name: 'Updated Pet' },
    },
    {
      label: 'Pet Delete',
      requiredPerm: 'pet.delete',
      method: 'DELETE',
      path: '/v1/pets/1',
    },
    {
      label: 'Pet Weight History',
      requiredPerm: 'pet.view',
      method: 'GET',
      path: '/v1/pets/1/weight',
    },
    {
      label: 'Order List',
      requiredPerm: 'order.view',
      method: 'GET',
      path: '/v1/orders',
    },
    {
      label: 'Order Create',
      requiredPerm: 'order.create',
      method: 'POST',
      path: '/v1/orders',
      body: { items: [{ item_id: 1, item_type: 'PRODUCT', quantity: 1 }] },
    },
    {
      label: 'Order Payment Intent',
      requiredPerm: 'order.create',
      method: 'POST',
      path: '/v1/orders/payment/intent',
      body: { order_id: 1 },
      skipNoPerm: true,
      dynamicBody: true,
    },
    {
      label: 'Order Checkout',
      requiredPerm: 'order.create',
      method: 'POST',
      path: '/v1/orders/checkout',
      body: { order_id: 1 },
      skipNoPerm: true,
      dynamicBody: true,
    },
    {
      label: 'Order Cancel',
      requiredPerm: 'order.cancel',
      method: 'PATCH',
      path: '/v1/orders/1/cancel',
      body: { reason: 'test' },
    },
    {
      label: 'Order Refund',
      requiredPerm: 'order.refund',
      method: 'POST',
      path: '/v1/orders/1/refund',
      skipNoPerm: true,
      skipWithPerm: true,
    },
    {
      label: 'Store Staff List',
      requiredPerm: 'staff.view',
      method: 'GET',
      path: '/v1/stores/1/staff',
      skipNoPerm: true,
    },
    {
      label: 'Store Staff Invite',
      requiredPerm: 'staff.invite',
      method: 'POST',
      path: '/v1/stores/1/invite',
      body: {
        email: 'new@test.com',
        full_name: 'New Staff',
        role_id: 1,
      },
    },
    {
      label: 'Store Update',
      requiredPerm: 'store.settings.manage',
      method: 'PATCH',
      path: '/v1/stores/1',
      body: { name: 'Updated Store' },
    },
    {
      label: 'Role Create',
      requiredPerm: 'role.create',
      method: 'POST',
      path: '/v1/stores/1/roles',
      body: { name: 'New Role', description: 'Test', permission_ids: [] },
    },
    {
      label: 'Role Edit',
      requiredPerm: 'role.edit',
      method: 'PATCH',
      path: '/v1/stores/1/roles/2',
      body: { description: 'Updated desc' },
    },
    {
      label: 'Role Delete',
      requiredPerm: 'role.delete',
      method: 'DELETE',
      path: '/v1/stores/1/roles/9999',
      skipNoPerm: true,
      minStatus: 404,
    },
  ];

  describe('User WITH permission → 2xx', () => {
    for (const t of ENDPOINT_TESTS) {
      if (t.skipWithPerm) continue;
      it(`${t.method} ${t.path} (${t.label}) — has ${t.requiredPerm}`, async () => {
        const tokenWithPerm = makeToken(adminUserId, [t.requiredPerm]);
        const req = request(app.getHttpServer())
          [t.method.toLowerCase()](t.path)
          .set('Authorization', `Bearer ${tokenWithPerm}`);

        let body = t.body;
        if (t.dynamicBody && body) {
          body = { ...body, order_id: orderId };
        }

        if (body && t.method !== 'GET') req.send(body);

        const res = await req;
        if (t.minStatus) {
          expect(res.status).toBe(t.minStatus);
        } else {
          expect(res.status).toBeLessThan(400);
        }
      });
    }
  });

  describe('User WITHOUT permission → 403', () => {
    for (const t of ENDPOINT_TESTS) {
      if (t.skipNoPerm) continue;
      it(`${t.method} ${t.path} (${t.label}) — missing ${t.requiredPerm}`, async () => {
        const req = request(app.getHttpServer())
          [t.method.toLowerCase()](t.path)
          .set('Authorization', `Bearer ${noPermToken}`);

        if (t.body && t.method !== 'GET') req.send(t.body);

        const res = await req;
        expect(res.status).toBe(403);
      });
    }
  });

  describe('Superadmin (store_id=null) → bypasses store membership checks', () => {
    const superAdminEndpoints = [
      { method: 'GET', path: '/v1/analytics/dashboard', label: 'Analytics Dashboard' },
      { method: 'GET', path: '/v1/stores/1/staff', label: 'Store Staff' },
      { method: 'GET', path: '/v1/stores/1/roles', label: 'Store Roles' },
      { method: 'GET', path: '/v1/stores/1/roles/permissions', label: 'Role Permissions' },
      { method: 'GET', path: '/v1/products', label: 'Products' },
      { method: 'GET', path: '/v1/services', label: 'Services' },
      { method: 'GET', path: '/v1/customers', label: 'Customers' },
      { method: 'GET', path: '/v1/pets', label: 'Pets' },
      { method: 'GET', path: '/v1/orders', label: 'Orders' },
      { method: 'GET', path: '/v1/analytics/pets/stats', label: 'Pet Stats' },
      { method: 'GET', path: '/v1/analytics/orders/stats', label: 'Order Stats' },
      { method: 'GET', path: '/v1/analytics/activities', label: 'Activities' },
      { method: 'GET', path: '/v1/analytics/inventory/alerts', label: 'Inventory Alerts' },
    ];

    for (const ep of superAdminEndpoints) {
      it(`${ep.method} ${ep.path} (${ep.label}) — superadmin access`, async () => {
        const res = await request(app.getHttpServer())
          [ep.method.toLowerCase()](ep.path)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect((res) => {
            if (res.status >= 400) {
              throw new Error(
                `Superadmin got ${res.status} on ${ep.path}: ${res.body?.message}`,
              );
            }
          });

        expect(res.status).toBeLessThan(400);
      });
    }
  });

  describe('No auth token → 401', () => {
    const publicEndpoints = new Set([
      '/v1/auth/login',
      '/v1/auth/register',
      '/v1/stores',
      '/v1/stores/1',
      '/v1/stores/invitations/accept',
    ]);

    for (const t of ENDPOINT_TESTS) {
      if (publicEndpoints.has(t.path)) continue;
      it(`${t.method} ${t.path} — unauthenticated`, async () => {
        const req = request(app.getHttpServer())[t.method.toLowerCase()](
          t.path,
        );
        if (t.body && t.method !== 'GET') req.send(t.body);

        const res = await req;
        expect(res.status).toBe(401);
      });
    }
  });

  describe('Granular permission isolation', () => {
    const makeUserWithPerms = async (perms: string[]) => {
      const role = await ds.getRepository(Role).save({
        name: `Role_${perms.join('_')}`,
        store_id: storeId,
        is_editable: true,
        is_system_role: false,
      } as any);

      for (const slug of perms) {
        const perm = await ds.getRepository(Permission).findOne({
          where: { slug } as any,
        });
        if (perm) {
          await ds.getRepository(RolePermission).save({
            role_id: role.id,
            permission_id: perm.id,
          });
        }
      }

      const user = await ds.getRepository(User).save({
        full_name: `User_${perms.join('_')}`,
        email: `user_${perms.join('_')}@test.com`,
        password_hash: await hashPassword('Test@1234'),
        store_id: storeId,
        role_id: role.id,
        status: UserStatus.ACTIVE,
      } as any);

      return jwtService.sign({
        sub: user.user_id,
        email: user.email,
        role_id: role.id,
        store_id: storeId,
        permissions: perms,
      });
    };

    it('user with only pet.view can GET /pets but not POST /pets', async () => {
      const token = await makeUserWithPerms(['pet.view']);

      await request(app.getHttpServer())
        .get('/v1/pets')
        .set('Authorization', `Bearer ${token}`)
        .expect((res) => {
          expect(res.status).toBeLessThan(400);
        });

      await request(app.getHttpServer())
        .post('/v1/pets/customer/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X', gender: 'MALE', pet_code: 'X' })
        .expect(403);
    });

    it('user with only order.view can list orders but not create', async () => {
      const token = await makeUserWithPerms(['order.view']);

      await request(app.getHttpServer())
        .get('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect((res) => {
          expect(res.status).toBeLessThan(400);
        });

      await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: 1, item_type: 'PRODUCT', quantity: 1 }] })
        .expect(403);
    });

    it('user with only product.view can list but not delete products', async () => {
      const token = await makeUserWithPerms(['product.view']);

      await request(app.getHttpServer())
        .get('/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .expect((res) => {
          expect(res.status).toBeLessThan(400);
        });

      await request(app.getHttpServer())
        .delete('/v1/products/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('user with only customer.create can create but not delete', async () => {
      const token = await makeUserWithPerms(['customer.create']);

      await request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ full_name: 'New', phone: '+1-555-1111' })
        .expect((res) => {
          expect(res.status).toBeLessThan(400);
        });

      await request(app.getHttpServer())
        .delete('/v1/customers/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('user with only analytics.view can view dashboard but not inventory alerts', async () => {
      const token = await makeUserWithPerms(['analytics.view']);

      await request(app.getHttpServer())
        .get('/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect((res) => {
          expect(res.status).toBeLessThan(400);
        });

      await request(app.getHttpServer())
        .get('/v1/analytics/inventory/alerts')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('user with only inventory.view can see alerts but not analytics dashboard', async () => {
      const token = await makeUserWithPerms(['inventory.view']);

      await request(app.getHttpServer())
        .get('/v1/analytics/inventory/alerts')
        .set('Authorization', `Bearer ${token}`)
        .expect((res) => {
          expect(res.status).toBeLessThan(400);
        });

      await request(app.getHttpServer())
        .get('/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('user with role.create can create role but not edit', async () => {
      const token = await makeUserWithPerms(['role.create']);

      await request(app.getHttpServer())
        .post('/v1/stores/1/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'NewRole', description: 'Test', permission_ids: [] })
        .expect((res) => {
          expect(res.status).toBeLessThan(400);
        });

      await request(app.getHttpServer())
        .patch('/v1/stores/1/roles/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Hacked' })
        .expect(403);
    });
  });
});
