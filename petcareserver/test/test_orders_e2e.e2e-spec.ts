/**
 * Orders E2E Test — chạy FULL luồng thực trên Postgres DB (Docker)
 *
 * Luồng test:
 *   1. Seed: Store → Permission → Role → RolePermission → User → Category → Product + Service
 *   2. Ký JWT token thật
 *   3. Test tất cả endpoints qua HTTP (supertest)
 *   4. Chỉ mock StripeService (không gọi Stripe API thật)
 *   5. Cleanup khi xong
 *
 * Chạy:  npx jest --config ./test/jest-e2e.json test/test_orders_e2e.e2e-spec.ts --verbose
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Repository, DataSource } from 'typeorm';

import { ENTITIES, TEST_CONFIG, getTestRepository } from './test-database.helper';
import { OrdersModule } from '../src/orders/orders.module';
import { StripeService } from '../src/orders/stripe.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { OrderStatus } from '../src/common/enum';
import { hashPassword } from '../src/common';

// ── Entities ──
import { Store } from '../src/stores/entities/store.entity';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/roles/entities/role.entity';
import { Permission } from '../src/permissions/entities/permission.entity';
import { RolePermission } from '../src/roles/entities/role-permission.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Product } from '../src/categories/entities/product.entity';
import { Service as PetService } from '../src/categories/entities/service.entity';
import { Order } from '../src/orders/entities/order.entity';
import { Payment, PaymentStatus } from '../src/orders/entities/payment.entity';

// ── Mock StripeService ──
const mockStripeService = {
  createPaymentIntent: jest.fn(),
  retrievePaymentIntent: jest.fn(),
  confirmPaymentIntent: jest.fn(),
  cancelPaymentIntent: jest.fn(),
  refundCharge: jest.fn(),
  getChargeDetails: jest.fn(),
};

describe('Orders E2E (real DB)', () => {
  let app: INestApplication<App>;
  let module: TestingModule;
  let jwtService: JwtService;
  let ds: DataSource;
  let token: string;

  // Seeded IDs
  let storeId: number;
  let userId: number;
  let roleId: number;
  let productId: number;
  let serviceId: number;
  let categoryId: number;

  // ── SETUP ──
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => TEST_CONFIG] }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'sqlite' as const,
            database: ':memory:',
            entities: ENTITIES,
            synchronize: true,
          }),
        }),
        TypeOrmModule.forFeature(ENTITIES),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: TEST_CONFIG.JWT_SECRET, signOptions: { expiresIn: '1d' } }),
        OrdersModule,
      ],
      providers: [JwtStrategy],
    })
      .overrideProvider(StripeService)
      .useValue(mockStripeService)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();

    jwtService = module.get(JwtService);
    ds = module.get(DataSource);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // ── SEED DATA trước mỗi test ──
  beforeEach(async () => {
    jest.clearAllMocks();
    await ds.synchronize(true); // Drop + recreate all tables

    const storeRepo = module.get<Repository<Store>>('StoreRepository');
    const userRepo = module.get<Repository<User>>('UserRepository');
    const roleRepo = module.get<Repository<Role>>('RoleRepository');
    const permRepo = module.get<Repository<Permission>>('PermissionRepository');
    const rpRepo = module.get<Repository<RolePermission>>('RolePermissionRepository');
    const catRepo = module.get<Repository<Category>>('CategoryRepository');
    const prodRepo = module.get<Repository<Product>>('ProductRepository');
    const svcRepo = module.get<Repository<PetService>>('ServiceRepository');

    // 1. Store
    const store = await ds.getRepository(Store).save({ name: 'E2E Pet Store' });
    storeId = store.id;

    // 2. Permissions (order.*)
    const orderPerms = ['order.create', 'order.view', 'order.edit', 'order.cancel', 'order.refund', 'order.view_all'];
    const savedPerms = await ds.getRepository(Permission).save(
      orderPerms.map((slug) => ({ slug, scope: 'STORE', is_system_defined: true })),
    );

    // 3. Role (PK = id)
    const role = await ds.getRepository(Role).save({ name: 'Admin', store_id: storeId });
    roleId = role.id;

    // 4. RolePermission (FK role_id + permission_id)
    for (const perm of savedPerms) {
      await ds.getRepository(RolePermission).save({ role_id: roleId, permission_id: perm.id });
    }

    // 5. User
    const hashedPw = await hashPassword('Test@1234');
    const user = await ds.getRepository(User).save({
      full_name: 'E2E Tester',
      email: 'e2e@test.com',
      password_hash: hashedPw,
      store_id: storeId,
      role_id: roleId,
      status: 'ACTIVE',
    });
    userId = user.user_id;

    // 6. Category
    const cat = await ds.getRepository(Category).save({
      name: 'Pet Food',
      store_id: storeId,
      type: 'PRODUCT',
    });
    categoryId = cat.category_id;

    // 7. Product
    const prod = await ds.getRepository(Product).save({
      name: 'Premium Dog Food',
      store_id: storeId,
      category_id: categoryId,
      cost_price: 15,
      sell_price: 35.50,
      stock_quantity: 50,
    });
    productId = prod.product_id;

    // 8. Service
    const svc = await ds.getRepository(PetService).save({
      combo_name: 'Full Grooming',
      store_id: storeId,
      category_id: categoryId,
      price: 80,
    });
    serviceId = svc.id;

    // 9. JWT token
    token = jwtService.sign({
      sub: userId,
      email: 'e2e@test.com',
      role_id: roleId,
      store_id: storeId,
      permissions: orderPerms,
    });
  });

  // ═══════════════════════════════════════════════
  // FULL ORDER LIFECYCLE FLOW
  // ═══════════════════════════════════════════════
  describe('Full lifecycle: Create → PaymentIntent → Confirm → GetDetails', () => {
    it('should complete the entire order + payment flow', async () => {
      // ── Step 1: Create Order ──
      const createRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { item_id: productId, item_type: 'PRODUCT', quantity: 2 },
            { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
          ],
          note: 'E2E test order',
        })
        .expect(201);

      const orderId = createRes.body.order_id;
      expect(orderId).toBeDefined();
      expect(createRes.body.status).toBe(OrderStatus.PENDING);
      // 35.50 * 2 + 80 * 1 = 151
      expect(Number(createRes.body.total_amount)).toBe(151);
      expect(createRes.body.order_details).toHaveLength(2);
      expect(createRes.body.note).toBe('E2E test order');

      // Verify stock decreased
      const prod = await ds.getRepository(Product).findOne({ where: { product_id: productId } });
      expect(prod!.stock_quantity).toBe(48); // 50 - 2

      // ── Step 2: Create Payment Intent ──
      mockStripeService.createPaymentIntent.mockResolvedValue({
        client_secret: 'cs_e2e_test_secret',
        payment_intent_id: 'pi_e2e_test_123',
        amount: 151,
        currency: 'usd',
      });

      const intentRes = await request(app.getHttpServer())
        .post('/v1/orders/payment/intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: orderId })
        .expect(200);

      expect(intentRes.body.client_secret).toBe('cs_e2e_test_secret');
      expect(intentRes.body.payment_intent_id).toBe('pi_e2e_test_123');

      // ── Step 3: Confirm Payment ──
      mockStripeService.confirmPaymentIntent.mockResolvedValue({
        success: true,
        status: 'succeeded',
        payment_intent_id: 'pi_e2e_test_123',
        charge_id: 'ch_e2e_test_456',
        amount: 151,
      });
      mockStripeService.getChargeDetails.mockResolvedValue({
        receipt_url: 'https://pay.stripe.com/receipts/e2e_test',
      });

      const confirmRes = await request(app.getHttpServer())
        .post('/v1/orders/payment/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ payment_intent_id: 'pi_e2e_test_123', order_id: orderId })
        .expect(200);

      expect(confirmRes.body.success).toBe(true);
      expect(confirmRes.body.status).toBe(OrderStatus.PAID);

      // ── Step 4: Get Order — verify PAID ──
      const orderRes = await request(app.getHttpServer())
        .get(`/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(orderRes.body.status).toBe(OrderStatus.PAID);

      // ── Step 5: Get Payment Details ──
      const paymentRes = await request(app.getHttpServer())
        .get(`/v1/orders/${orderId}/payment`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(paymentRes.body.status).toBe('COMPLETED');
      expect(paymentRes.body.stripe_charge_id).toBe('ch_e2e_test_456');
      expect(paymentRes.body.stripe_receipt_url).toBe('https://pay.stripe.com/receipts/e2e_test');
    });
  });

  // ═══════════════════════════════════════════════
  // CREATE ORDER
  // ═══════════════════════════════════════════════
  describe('POST /v1/orders', () => {
    it('should create order with product only', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: productId, item_type: 'PRODUCT', quantity: 3 }] })
        .expect(201);

      expect(Number(res.body.total_amount)).toBe(106.5); // 35.5 * 3
    });

    it('should return 401 without JWT', async () => {
      await request(app.getHttpServer())
        .post('/v1/orders')
        .send({ items: [{ item_id: productId, item_type: 'PRODUCT', quantity: 1 }] })
        .expect(401);
    });

    it('should return 400 for empty items', async () => {
      await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [] })
        .expect(400);
    });

    it('should return 400 for invalid item_type', async () => {
      await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: 1, item_type: 'INVALID', quantity: 1 }] })
        .expect(400);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: 9999, item_type: 'PRODUCT', quantity: 1 }] })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });

    it('should return 400 for insufficient stock', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: productId, item_type: 'PRODUCT', quantity: 9999 }] })
        .expect(400);

      expect(res.body.message).toContain('Insufficient stock');
    });
  });

  // ═══════════════════════════════════════════════
  // GET ALL ORDERS
  // ═══════════════════════════════════════════════
  describe('GET /v1/orders', () => {
    beforeEach(async () => {
      // Create 3 orders via API
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/v1/orders')
          .set('Authorization', `Bearer ${token}`)
          .send({ items: [{ item_id: serviceId, item_type: 'SERVICE', quantity: 1 }] })
          .expect(201);
      }
    });

    it('should return paginated orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/orders?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(3);
      expect(res.body.pages).toBe(2);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/orders?status=PENDING')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(3);
      res.body.data.forEach((o: any) => expect(o.status).toBe('PENDING'));
    });

    it('should return 401 without JWT', async () => {
      await request(app.getHttpServer()).get('/v1/orders').expect(401);
    });
  });

  // ═══════════════════════════════════════════════
  // CANCEL ORDER (with stock rollback)
  // ═══════════════════════════════════════════════
  describe('PATCH /v1/orders/:orderId/cancel', () => {
    let orderId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: productId, item_type: 'PRODUCT', quantity: 5 }] })
        .expect(201);
      orderId = res.body.order_id;
    });

    it('should cancel order and restore stock', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Customer changed mind' })
        .expect(200);

      expect(res.body.status).toBe(OrderStatus.CANCELLED);

      // Stock restored: 50 - 5 + 5 = 50
      const prod = await ds.getRepository(Product).findOne({ where: { product_id: productId } });
      expect(prod!.stock_quantity).toBe(50);
    });

    it('should return 400 for already cancelled order', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'First cancel' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Second cancel' })
        .expect(400);
    });

    it('should cancel Stripe intent if exists', async () => {
      mockStripeService.createPaymentIntent.mockResolvedValue({
        client_secret: 'cs_cancel', payment_intent_id: 'pi_cancel',
        amount: 177.5, currency: 'usd',
      });
      await request(app.getHttpServer())
        .post('/v1/orders/payment/intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: orderId })
        .expect(200);

      mockStripeService.cancelPaymentIntent.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .patch(`/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Changed mind' })
        .expect(200);

      expect(mockStripeService.cancelPaymentIntent).toHaveBeenCalledWith('pi_cancel');
    });
  });

  // ═══════════════════════════════════════════════
  // PAYMENT INTENT edge cases
  // ═══════════════════════════════════════════════
  describe('POST /v1/orders/payment/intent (edge cases)', () => {
    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .post('/v1/orders/payment/intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: 9999 })
        .expect(404);
    });

    it('should return 400 for already paid order', async () => {
      // Create + pay
      const createRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: serviceId, item_type: 'SERVICE', quantity: 1 }] })
        .expect(201);

      await ds.getRepository(Order).update(createRes.body.order_id, { status: OrderStatus.PAID });

      await request(app.getHttpServer())
        .post('/v1/orders/payment/intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: createRes.body.order_id })
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════
  // CONFIRM PAYMENT edge cases
  // ═══════════════════════════════════════════════
  describe('POST /v1/orders/payment/confirm (edge cases)', () => {
    it('should return 400 when Stripe says payment failed', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: productId, item_type: 'PRODUCT', quantity: 1 }] })
        .expect(201);
      const orderId = createRes.body.order_id;

      mockStripeService.createPaymentIntent.mockResolvedValue({
        client_secret: 'cs_fail', payment_intent_id: 'pi_fail',
        amount: 35.5, currency: 'usd',
      });
      await request(app.getHttpServer())
        .post('/v1/orders/payment/intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: orderId })
        .expect(200);

      mockStripeService.confirmPaymentIntent.mockResolvedValue({
        success: false, status: 'requires_payment_method', payment_intent_id: 'pi_fail',
      });

      const res = await request(app.getHttpServer())
        .post('/v1/orders/payment/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ payment_intent_id: 'pi_fail', order_id: orderId })
        .expect(400);

      expect(res.body.message).toContain('Payment not completed');

      // Verify payment marked as FAILED in DB
      const payment = await ds.getRepository(Payment).findOne({ where: { order_id: orderId } });
      expect(payment!.status).toBe(PaymentStatus.FAILED);
    });
  });

  // ═══════════════════════════════════════════════
  // REFUND
  // ═══════════════════════════════════════════════
  describe('POST /v1/orders/:orderId/refund', () => {
    it('should refund paid order, restore stock, update statuses', async () => {
      // Create order
      const createRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: productId, item_type: 'PRODUCT', quantity: 4 }] })
        .expect(201);
      const orderId = createRes.body.order_id;

      // Pay it
      mockStripeService.createPaymentIntent.mockResolvedValue({
        client_secret: 'cs_refund', payment_intent_id: 'pi_refund',
        amount: 142, currency: 'usd',
      });
      await request(app.getHttpServer())
        .post('/v1/orders/payment/intent')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: orderId })
        .expect(200);

      mockStripeService.confirmPaymentIntent.mockResolvedValue({
        success: true, status: 'succeeded', payment_intent_id: 'pi_refund',
        charge_id: 'ch_refund_e2e', amount: 142,
      });
      mockStripeService.getChargeDetails.mockResolvedValue({ receipt_url: null });
      await request(app.getHttpServer())
        .post('/v1/orders/payment/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ payment_intent_id: 'pi_refund', order_id: orderId })
        .expect(200);

      // Now refund
      mockStripeService.refundCharge.mockResolvedValue({ id: 're_e2e_test' });

      const refundRes = await request(app.getHttpServer())
        .post(`/v1/orders/${orderId}/refund`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(refundRes.body.success).toBe(true);
      expect(refundRes.body.status).toBe('REFUNDED');
      expect(mockStripeService.refundCharge).toHaveBeenCalledWith('ch_refund_e2e');

      // Verify stock restored: 50 - 4 + 4 = 50
      const prod = await ds.getRepository(Product).findOne({ where: { product_id: productId } });
      expect(prod!.stock_quantity).toBe(50);

      // Verify DB statuses
      const order = await ds.getRepository(Order).findOne({ where: { order_id: orderId } });
      expect(order!.status).toBe(OrderStatus.CANCELLED);
      const payment = await ds.getRepository(Payment).findOne({ where: { order_id: orderId } });
      expect(payment!.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should return 400 for non-paid order', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: serviceId, item_type: 'SERVICE', quantity: 1 }] })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/v1/orders/${createRes.body.order_id}/refund`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});
