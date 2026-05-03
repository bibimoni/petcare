/**
 * Orders E2E Test — Webhook Flow
 *
 * Luồng:
 *   1. Client → Server: POST /v1/orders (tạo đơn)
 *   2. Client → Server: POST /v1/orders/payment/intent (tạo Stripe PaymentIntent)
 *   3. Stripe → Server: POST /v1/stripe/webhook (payment_intent.succeeded)
 *   4. Client → Server: GET /v1/orders/:id/payment/status (polling kết quả)
 *
 * Mock: StripeService (không gọi Stripe API thật)
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
  BadRequestException,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DataSource } from 'typeorm';

import { ENTITIES, TEST_CONFIG } from './test-database.helper';
import { OrdersModule } from '../src/orders/orders.module';
import { StripeService } from '../src/orders/stripe.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { OrderStatus, PaymentStatus } from '../src/common/enum';
import { hashPassword } from '../src/common';

import { Store } from '../src/stores/entities/store.entity';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/roles/entities/role.entity';
import { Permission } from '../src/permissions/entities/permission.entity';
import { RolePermission } from '../src/roles/entities/role-permission.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Product } from '../src/categories/entities/product.entity';
import { Service as PetService } from '../src/categories/entities/service.entity';
import { Order } from '../src/orders/entities/order.entity';
import { Payment } from '../src/orders/entities/payment.entity';

// ── Mock StripeService ──
const mockStripeService = {
  createPaymentIntent: jest.fn(),
  createCheckoutSession: jest.fn(),
  retrievePaymentIntent: jest.fn(),
  confirmPaymentIntent: jest.fn(),
  cancelPaymentIntent: jest.fn(),
  refundCharge: jest.fn(),
  getChargeDetails: jest.fn(),
  constructWebhookEvent: jest.fn(),
};

describe('Orders E2E — Webhook Flow', () => {
  let app: INestApplication<App>;
  let module: TestingModule;
  let jwtService: JwtService;
  let ds: DataSource;
  let token: string;

  let storeId: number;
  let userId: number;
  let roleId: number;
  let productId: number;
  let serviceId: number;

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
        JwtModule.register({
          secret: TEST_CONFIG.JWT_SECRET,
          signOptions: { expiresIn: '1d' },
        }),
        OrdersModule,
      ],
      providers: [JwtStrategy],
    })
      .overrideProvider(StripeService)
      .useValue(mockStripeService)
      .compile();

    app = module.createNestApplication({ rawBody: true });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();

    jwtService = module.get(JwtService);
    ds = module.get(DataSource);
  }, 30000);

  afterAll(async () => await app.close());

  // ── SEED ──
  beforeEach(async () => {
    jest.clearAllMocks();
    orderCounter = 0;
    await ds.synchronize(true);

    const store = await ds.getRepository(Store).save({ name: 'E2E Store' });
    storeId = store.id;

    const perms = [
      'order.create',
      'order.view',
      'order.edit',
      'order.cancel',
      'order.refund',
      'order.view_all',
    ];
    const savedPerms = await ds.getRepository(Permission).save(
      perms.map((slug) => ({
        slug,
        scope: 'STORE',
        is_system_defined: true,
      })) as any,
    );

    const role = await ds
      .getRepository(Role)
      .save({ name: 'Admin', store_id: storeId });
    roleId = role.id;

    for (const p of savedPerms) {
      await ds
        .getRepository(RolePermission)
        .save({ role_id: roleId, permission_id: p.id });
    }

    const user = await ds.getRepository(User).save({
      full_name: 'Tester',
      email: 'test@e2e.com',
      password_hash: await hashPassword('Test@1234'),
      store_id: storeId,
      role_id: roleId,
      status: 'ACTIVE',
    } as any);
    userId = user.user_id;

    const cat = await ds.getRepository(Category).save({
      name: 'Food',
      store_id: storeId,
      type: 'PRODUCT',
    } as any);

    const prod = await ds.getRepository(Product).save({
      name: 'Dog Food',
      store_id: storeId,
      category_id: cat.category_id,
      cost_price: 10,
      sell_price: 25,
      stock_quantity: 50,
    } as any);
    productId = prod.product_id;

    const svc = await ds.getRepository(PetService).save({
      combo_name: 'Grooming',
      store_id: storeId,
      category_id: cat.category_id,
      price: 60,
    } as any);
    serviceId = svc.id;

    token = jwtService.sign({
      sub: userId,
      email: 'test@e2e.com',
      role_id: roleId,
      store_id: storeId,
      permissions: perms,
    });
  });

  // ── Helper: tạo order qua API (auto-creates checkout session) ──
  let orderCounter = 0;
  async function createOrder(items: any[]) {
    orderCounter++;
    mockStripeService.createCheckoutSession.mockResolvedValue({
      checkout_url: `https://checkout.stripe.com/pay/cs_test_${orderCounter}`,
      session_id: `cs_test_${orderCounter}`,
      payment_intent_id: `pi_test_${orderCounter}`,
    });
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items })
      .expect(201);
    const body = res.body; // { order, checkout_url, session_id }
    // Flatten: return order object with checkout_url attached
    return { ...body.order, checkout_url: body.checkout_url, session_id: body.session_id };
  }

  // ── Helper: tạo payment intent qua API ──
  async function createIntent(orderId: number) {
    mockStripeService.createPaymentIntent.mockResolvedValue({
      client_secret: `cs_${orderId}`,
      payment_intent_id: `pi_${orderId}`,
      amount: 100,
      currency: 'vnd',
    });
    const res = await request(app.getHttpServer())
      .post('/v1/orders/payment/intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_id: orderId })
      .expect(200);
    return res.body;
  }

  // ── Helper: gửi webhook event giả ──
  function sendWebhook(eventType: string, dataObject: any) {
    mockStripeService.constructWebhookEvent.mockReturnValue({
      id: `evt_test_${Date.now()}`,
      type: eventType,
      data: { object: dataObject },
    });

    return request(app.getHttpServer())
      .post('/v1/stripe/webhook')
      .set('stripe-signature', 'fake_sig_for_test')
      .send(dataObject);
  }

  // ── Helper: simulate full payment (checkout.session.completed → payment_intent.succeeded) ──
  async function simulatePayment(order: any) {
    await sendWebhook('checkout.session.completed', {
      id: order.session_id,
      payment_status: 'paid',
      payment_intent: `pi_test_${order.order_id}`,
    }).expect(200);

    mockStripeService.getChargeDetails.mockResolvedValue({ receipt_url: null });
    await sendWebhook('payment_intent.succeeded', {
      id: `pi_test_${order.order_id}`,
      latest_charge: `ch_${order.order_id}`,
      amount: Number(order.total_amount) * 100,
    }).expect(200);
  }

  // ═══════════════════════════════════════════════
  // FULL LIFECYCLE: Create → Webhooks → Confirm
  // ═══════════════════════════════════════════════
  describe('Full lifecycle', () => {
    it('should complete: POST /orders → webhooks → POST /orders/confirm → PAID', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 2 },
        { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
      ]);
      expect(order.status).toBe('PENDING');
      expect(Number(order.total_amount)).toBe(110);
      expect(order.checkout_url).toContain('https://checkout.stripe.com');

      // Simulate Stripe payment
      mockStripeService.getChargeDetails.mockResolvedValue({
        receipt_url: 'https://stripe.com/receipt/test',
      });

      await sendWebhook('checkout.session.completed', {
        id: order.session_id,
        payment_status: 'paid',
        payment_intent: `pi_test_${order.order_id}`,
      }).expect(200);

      await sendWebhook('payment_intent.succeeded', {
        id: `pi_test_${order.order_id}`,
        latest_charge: 'ch_test_123',
        amount: 11000,
      }).expect(200);

      // FE calls POST /orders/confirm
      const confirmRes = await request(app.getHttpServer())
        .post('/v1/orders/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: order.order_id })
        .expect(200);

      expect(confirmRes.body.status).toBe('PAID');
      expect(confirmRes.body.payment_status).toBe('COMPLETED');

      // Verify DB
      const dbOrder = await ds
        .getRepository(Order)
        .findOne({ where: { order_id: order.order_id } });
      expect(dbOrder!.status).toBe(OrderStatus.PAID);

      const dbPayment = await ds
        .getRepository(Payment)
        .findOne({ where: { order_id: order.order_id } });
      expect(dbPayment!.status).toBe(PaymentStatus.COMPLETED);
      expect(dbPayment!.stripe_charge_id).toBe('ch_test_123');

      const dbProduct = await ds
        .getRepository(Product)
        .findOne({ where: { product_id: productId } });
      expect(dbProduct!.stock_quantity).toBe(48);
    });
  });

  // ═══════════════════════════════════════════════
  // WEBHOOK: payment_intent.payment_failed
  // ═══════════════════════════════════════════════
  describe('Webhook: payment_intent.payment_failed', () => {
    it('should mark payment as FAILED', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 1 },
      ]);

      // WE NO LONGER SIMULATE checkout.session.completed here 
      // because a failed payment wouldn't have it.
      // The DB already has pi_test_${order.order_id} saved.

      await sendWebhook('payment_intent.payment_failed', {
        id: `pi_test_${order.order_id}`,
        last_payment_error: { message: 'Your card was declined' },
      }).expect(200);

      const confirmRes = await request(app.getHttpServer())
        .post('/v1/orders/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: order.order_id })
        .expect(200);

      expect(confirmRes.body.status).toBe('PENDING');
      expect(confirmRes.body.payment_status).toBe('FAILED');
    });
  });

  // ═══════════════════════════════════════════════
  // WEBHOOK: charge.refunded
  // ═══════════════════════════════════════════════
  describe('Webhook: charge.refunded', () => {
    it('should refund via webhook and restore stock', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 3 },
      ]);
      await simulatePayment(order);

      await sendWebhook('charge.refunded', {
        id: `ch_${order.order_id}`,
        payment_intent: `pi_test_${order.order_id}`,
      }).expect(200);

      const dbOrder = await ds
        .getRepository(Order)
        .findOne({ where: { order_id: order.order_id } });
      expect(dbOrder!.status).toBe(OrderStatus.CANCELLED);

      const dbProduct = await ds
        .getRepository(Product)
        .findOne({ where: { product_id: productId } });
      expect(dbProduct!.stock_quantity).toBe(50);
    });
  });

  // ═══════════════════════════════════════════════
  // WEBHOOK: idempotency
  // ═══════════════════════════════════════════════
  describe('Webhook idempotency', () => {
    it('should handle duplicate succeeded webhooks gracefully', async () => {
      const order = await createOrder([
        { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
      ]);

      await sendWebhook('checkout.session.completed', {
        id: order.session_id,
        payment_status: 'paid',
        payment_intent: `pi_test_${order.order_id}`,
      }).expect(200);

      mockStripeService.getChargeDetails.mockResolvedValue({ receipt_url: null });
      const payload = { id: `pi_test_${order.order_id}`, latest_charge: 'ch_dup', amount: 6000 };

      await sendWebhook('payment_intent.succeeded', payload).expect(200);
      await sendWebhook('payment_intent.succeeded', payload).expect(200);

      const dbOrder = await ds
        .getRepository(Order)
        .findOne({ where: { order_id: order.order_id } });
      expect(dbOrder!.status).toBe(OrderStatus.PAID);
    });
  });

  // ═══════════════════════════════════════════════
  // WEBHOOK: invalid signature
  // ═══════════════════════════════════════════════
  describe('Webhook: invalid signature', () => {
    it('should return 400 when signature verification fails', async () => {
      mockStripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Webhook signature verification failed');
      });
      await request(app.getHttpServer())
        .post('/v1/stripe/webhook')
        .set('stripe-signature', 'invalid_sig')
        .send({ type: 'payment_intent.succeeded' })
        .expect(400);
    });

    it('should return 400 when stripe-signature header is missing', async () => {
      await request(app.getHttpServer())
        .post('/v1/stripe/webhook')
        .send({ type: 'payment_intent.succeeded' })
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════
  // WEBHOOK: unknown payment intent
  // ═══════════════════════════════════════════════
  describe('Webhook: unknown payment intent', () => {
    it('should return 200 but ignore unknown intent', async () => {
      await sendWebhook('payment_intent.succeeded', {
        id: 'pi_nonexistent',
        latest_charge: 'ch_nope',
        amount: 1000,
      }).expect(200);
    });
  });

  // ═══════════════════════════════════════════════
  // POST /v1/orders — create + auto checkout
  // ═══════════════════════════════════════════════
  describe('POST /v1/orders', () => {
    it('should create order with product and return checkout_url', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 2 },
      ]);
      expect(Number(order.total_amount)).toBe(50);
      expect(order.order_details).toHaveLength(1);
      expect(order.checkout_url).toContain('https://checkout.stripe.com');
    });

    it('should create order with service', async () => {
      const order = await createOrder([
        { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
      ]);
      expect(Number(order.total_amount)).toBe(60);
    });

    it('should return 401 without JWT', async () => {
      await request(app.getHttpServer())
        .post('/v1/orders')
        .send({ items: [{ item_id: productId, item_type: 'PRODUCT', quantity: 1 }] })
        .expect(401);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: 9999, item_type: 'PRODUCT', quantity: 1 }] })
        .expect(404);
    });

    it('should return 400 for insufficient stock', async () => {
      await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ item_id: productId, item_type: 'PRODUCT', quantity: 9999 }] })
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════
  // POST /v1/orders/confirm
  // ═══════════════════════════════════════════════
  describe('POST /v1/orders/confirm', () => {
    it('should return PENDING before payment', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 1 },
      ]);
      const res = await request(app.getHttpServer())
        .post('/v1/orders/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: order.order_id })
        .expect(200);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.payment_status).toBe('PENDING');
    });

    it('should return PAID after payment', async () => {
      const order = await createOrder([
        { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
      ]);
      await simulatePayment(order);

      const res = await request(app.getHttpServer())
        .post('/v1/orders/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: order.order_id })
        .expect(200);
      expect(res.body.status).toBe('PAID');
      expect(res.body.payment_status).toBe('COMPLETED');
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .post('/v1/orders/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: 9999 })
        .expect(404);
    });
  });

  // ═══════════════════════════════════════════════
  // GET ALL ORDERS
  // ═══════════════════════════════════════════════
  describe('GET /v1/orders', () => {
    it('should return paginated orders', async () => {
      for (let i = 0; i < 3; i++) {
        await createOrder([{ item_id: serviceId, item_type: 'SERVICE', quantity: 1 }]);
      }
      const res = await request(app.getHttpServer())
        .get('/v1/orders?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════
  // CANCEL ORDER
  // ═══════════════════════════════════════════════
  describe('PATCH /v1/orders/:orderId/cancel', () => {
    it('should cancel order and restore stock', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 5 },
      ]);
      const res = await request(app.getHttpServer())
        .patch(`/v1/orders/${order.order_id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Changed mind' })
        .expect(200);
      expect(res.body.status).toBe('CANCELLED');

      const dbProduct = await ds
        .getRepository(Product)
        .findOne({ where: { product_id: productId } });
      expect(dbProduct!.stock_quantity).toBe(50);
    });

    it('should return 400 for already cancelled', async () => {
      const order = await createOrder([
        { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
      ]);
      await request(app.getHttpServer())
        .patch(`/v1/orders/${order.order_id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'first' })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/v1/orders/${order.order_id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'second' })
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════
  // REFUND (via API)
  // ═══════════════════════════════════════════════
  describe('POST /v1/orders/:orderId/refund', () => {
    it('should refund via API endpoint', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 2 },
      ]);
      await simulatePayment(order);

      mockStripeService.refundCharge.mockResolvedValue({ id: 're_test' });
      const res = await request(app.getHttpServer())
        .post(`/v1/orders/${order.order_id}/refund`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('REFUNDED');
    });

    it('should return 400 for non-paid order', async () => {
      const order = await createOrder([
        { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
      ]);
      await request(app.getHttpServer())
        .post(`/v1/orders/${order.order_id}/refund`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});

