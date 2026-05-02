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

    app = module.createNestApplication();
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
    const savedPerms = await ds
      .getRepository(Permission)
      .save(
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
    userId = (user as any).user_id;

    const cat = await ds.getRepository(Category).save({
      name: 'Food',
      store_id: storeId,
      type: 'PRODUCT',
    } as any);

    const prod = await ds.getRepository(Product).save({
      name: 'Dog Food',
      store_id: storeId,
      category_id: (cat as any).category_id,
      cost_price: 10,
      sell_price: 25,
      stock_quantity: 50,
    } as any);
    productId = (prod as any).product_id;

    const svc = await ds.getRepository(PetService).save({
      combo_name: 'Grooming',
      store_id: storeId,
      category_id: (cat as any).category_id,
      price: 60,
    } as any);
    serviceId = (svc as any).id;

    token = jwtService.sign({
      sub: userId,
      email: 'test@e2e.com',
      role_id: roleId,
      store_id: storeId,
      permissions: perms,
    });
  });

  // ── Helper: tạo order qua API ──
  async function createOrder(items: any[]) {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items })
      .expect(201);
    return res.body;
  }

  // ── Helper: tạo payment intent qua API ──
  async function createIntent(orderId: number) {
    mockStripeService.createPaymentIntent.mockResolvedValue({
      client_secret: `cs_${orderId}`,
      payment_intent_id: `pi_${orderId}`,
      amount: 100,
      currency: 'usd',
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
    // Mock constructWebhookEvent trả về event object
    mockStripeService.constructWebhookEvent.mockReturnValue({
      id: `evt_test_${Date.now()}`,
      type: eventType,
      data: { object: dataObject },
    });

    return request(app.getHttpServer())
      .post('/v1/stripe/webhook')
      .set('stripe-signature', 'fake_sig_for_test')
      .send(dataObject); // body content doesn't matter — constructWebhookEvent is mocked
  }

  // ═══════════════════════════════════════════════
  // FULL LIFECYCLE: Create → Intent → Webhook Succeeded → Check Status
  // ═══════════════════════════════════════════════
  describe('Full lifecycle (webhook)', () => {
    it('should complete order via webhook: Create → Intent → Webhook succeeded → PAID', async () => {
      // 1. Create order
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 2 },
        { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
      ]);
      expect(order.status).toBe('PENDING');
      expect(Number(order.total_amount)).toBe(110); // 25*2 + 60

      // 2. Create payment intent
      const intent = await createIntent(order.order_id);
      expect(intent.payment_intent_id).toBe(`pi_${order.order_id}`);

      // 3. Stripe sends webhook: payment_intent.succeeded
      mockStripeService.getChargeDetails.mockResolvedValue({
        receipt_url: 'https://stripe.com/receipt/test',
      });

      await sendWebhook('payment_intent.succeeded', {
        id: `pi_${order.order_id}`,
        latest_charge: 'ch_test_123',
        amount: 11000, // cents
      }).expect(200);

      // 4. Client polls payment status
      const statusRes = await request(app.getHttpServer())
        .get(`/v1/orders/${order.order_id}/payment/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(statusRes.body.order_status).toBe('PAID');
      expect(statusRes.body.payment_status).toBe('COMPLETED');

      // 5. Verify DB directly
      const dbOrder = await ds
        .getRepository(Order)
        .findOne({ where: { order_id: order.order_id } });
      expect(dbOrder!.status).toBe(OrderStatus.PAID);

      const dbPayment = await ds
        .getRepository(Payment)
        .findOne({ where: { order_id: order.order_id } });
      expect(dbPayment!.status).toBe(PaymentStatus.COMPLETED);
      expect(dbPayment!.stripe_charge_id).toBe('ch_test_123');
      expect(dbPayment!.stripe_receipt_url).toBe(
        'https://stripe.com/receipt/test',
      );

      // 6. Stock should have decreased
      const dbProduct = await ds
        .getRepository(Product)
        .findOne({ where: { product_id: productId } });
      expect(dbProduct!.stock_quantity).toBe(48); // 50 - 2
    });
  });

  // ═══════════════════════════════════════════════
  // WEBHOOK: payment_intent.payment_failed
  // ═══════════════════════════════════════════════
  describe('Webhook: payment_intent.payment_failed', () => {
    it('should mark payment as FAILED when Stripe sends failure', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 1 },
      ]);
      await createIntent(order.order_id);

      await sendWebhook('payment_intent.payment_failed', {
        id: `pi_${order.order_id}`,
        last_payment_error: { message: 'Your card was declined' },
      }).expect(200);

      // Payment should be FAILED, order stays PENDING
      const statusRes = await request(app.getHttpServer())
        .get(`/v1/orders/${order.order_id}/payment/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(statusRes.body.order_status).toBe('PENDING');
      expect(statusRes.body.payment_status).toBe('FAILED');
    });
  });

  // ═══════════════════════════════════════════════
  // WEBHOOK: charge.refunded
  // ═══════════════════════════════════════════════
  describe('Webhook: charge.refunded', () => {
    it('should refund via webhook and restore stock', async () => {
      // Create + pay via webhook
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 3 },
      ]);
      await createIntent(order.order_id);
      mockStripeService.getChargeDetails.mockResolvedValue({
        receipt_url: null,
      });

      await sendWebhook('payment_intent.succeeded', {
        id: `pi_${order.order_id}`,
        latest_charge: 'ch_refund_test',
        amount: 7500,
      }).expect(200);

      // Now Stripe sends refund webhook
      await sendWebhook('charge.refunded', {
        id: 'ch_refund_test',
        payment_intent: `pi_${order.order_id}`,
      }).expect(200);

      // Verify
      const dbOrder = await ds
        .getRepository(Order)
        .findOne({ where: { order_id: order.order_id } });
      expect(dbOrder!.status).toBe(OrderStatus.CANCELLED);

      const dbPayment = await ds
        .getRepository(Payment)
        .findOne({ where: { order_id: order.order_id } });
      expect(dbPayment!.status).toBe(PaymentStatus.REFUNDED);

      // Stock restored: 50 - 3 + 3 = 50
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
      await createIntent(order.order_id);
      mockStripeService.getChargeDetails.mockResolvedValue({
        receipt_url: null,
      });

      const webhookPayload = {
        id: `pi_${order.order_id}`,
        latest_charge: 'ch_dup',
        amount: 6000,
      };

      // Send same webhook twice
      await sendWebhook('payment_intent.succeeded', webhookPayload).expect(200);
      await sendWebhook('payment_intent.succeeded', webhookPayload).expect(200);

      // Should still be PAID (not error)
      const dbOrder = await ds
        .getRepository(Order)
        .findOne({ where: { order_id: order.order_id } });
      expect(dbOrder!.status).toBe(OrderStatus.PAID);
    });
  });

  // ═══════════════════════════════════════════════
  // CHECKOUT SESSION FLOW
  // ═══════════════════════════════════════════════
  describe('Checkout Session Flow', () => {
    // Helper: create checkout session
    async function createCheckout(orderId: number) {
      mockStripeService.createCheckoutSession.mockResolvedValue({
        checkout_url: `https://checkout.stripe.com/pay/cs_test_${orderId}`,
        session_id: `cs_test_${orderId}`,
        payment_intent_id: `pi_checkout_${orderId}`,
      });
      const res = await request(app.getHttpServer())
        .post('/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: orderId })
        .expect(200);
      return res.body;
    }

    it('should create checkout session and return checkout_url', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 2 },
      ]);

      const checkout = await createCheckout(order.order_id);

      expect(checkout.checkout_url).toContain('https://checkout.stripe.com');
      expect(checkout.session_id).toBe(`cs_test_${order.order_id}`);
      expect(checkout.order_id).toBe(order.order_id);
      expect(checkout.amount).toBe(50); // 25*2
    });

    it('should complete full checkout flow: Create → Checkout → checkout.session.completed → payment_intent.succeeded → PAID', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 1 },
        { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
      ]);

      const checkout = await createCheckout(order.order_id);

      // Stripe sends checkout.session.completed (links session → PI)
      await sendWebhook('checkout.session.completed', {
        id: `cs_test_${order.order_id}`,
        payment_status: 'paid',
        payment_intent: `pi_checkout_${order.order_id}`,
      }).expect(200);

      // Then Stripe sends payment_intent.succeeded
      mockStripeService.getChargeDetails.mockResolvedValue({
        receipt_url: 'https://stripe.com/receipt/checkout_test',
      });

      await sendWebhook('payment_intent.succeeded', {
        id: `pi_checkout_${order.order_id}`,
        latest_charge: 'ch_checkout_123',
        amount: 8500,
      }).expect(200);

      // Verify order is PAID
      const statusRes = await request(app.getHttpServer())
        .get(`/v1/orders/${order.order_id}/payment/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(statusRes.body.order_status).toBe('PAID');
      expect(statusRes.body.payment_status).toBe('COMPLETED');
    });

    it('should reuse existing checkout session (idempotent)', async () => {
      const order = await createOrder([
        { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
      ]);

      const first = await createCheckout(order.order_id);

      // Second call should return same session
      const res = await request(app.getHttpServer())
        .post('/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: order.order_id })
        .expect(200);

      expect(res.body.session_id).toBe(first.session_id);
      // createCheckoutSession should only be called once
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for already paid order', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 1 },
      ]);
      await createCheckout(order.order_id);

      // Simulate payment succeeded
      mockStripeService.getChargeDetails.mockResolvedValue({ receipt_url: null });
      await sendWebhook('payment_intent.succeeded', {
        id: `pi_checkout_${order.order_id}`,
        latest_charge: 'ch_paid',
        amount: 2500,
      }).expect(200);

      // Try to checkout again → should fail
      await request(app.getHttpServer())
        .post('/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: order.order_id })
        .expect(400);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .post('/v1/orders/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ order_id: 9999 })
        .expect(404);
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
    it('should return 200 but ignore unknown intent (no DB record)', async () => {
      await sendWebhook('payment_intent.succeeded', {
        id: 'pi_nonexistent',
        latest_charge: 'ch_nope',
        amount: 1000,
      }).expect(200);
      // No error — just warns and returns
    });
  });

  // ═══════════════════════════════════════════════
  // CREATE ORDER (unchanged from before)
  // ═══════════════════════════════════════════════
  describe('POST /v1/orders', () => {
    it('should create order with product', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 2 },
      ]);
      expect(Number(order.total_amount)).toBe(50);
      expect(order.order_details).toHaveLength(1);
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
        .send({
          items: [{ item_id: productId, item_type: 'PRODUCT', quantity: 1 }],
        })
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
        .send({
          items: [{ item_id: productId, item_type: 'PRODUCT', quantity: 9999 }],
        })
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════
  // GET ALL ORDERS
  // ═══════════════════════════════════════════════
  describe('GET /v1/orders', () => {
    it('should return paginated orders', async () => {
      for (let i = 0; i < 3; i++) {
        await createOrder([
          { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
        ]);
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
      expect(dbProduct!.stock_quantity).toBe(50); // restored
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
  // PAYMENT STATUS (replaces old confirm)
  // ═══════════════════════════════════════════════
  describe('GET /v1/orders/:orderId/payment/status', () => {
    it('should return PENDING before webhook', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 1 },
      ]);
      await createIntent(order.order_id);

      const res = await request(app.getHttpServer())
        .get(`/v1/orders/${order.order_id}/payment/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.order_status).toBe('PENDING');
      expect(res.body.payment_status).toBe('PENDING');
      expect(res.body.payment_intent_id).toBe(`pi_${order.order_id}`);
    });

    it('should return null payment_status when no intent created', async () => {
      const order = await createOrder([
        { item_id: serviceId, item_type: 'SERVICE', quantity: 1 },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/v1/orders/${order.order_id}/payment/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.payment_status).toBeNull();
      expect(res.body.payment_intent_id).toBeNull();
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/v1/orders/9999/payment/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ═══════════════════════════════════════════════
  // REFUND (via API, not webhook)
  // ═══════════════════════════════════════════════
  describe('POST /v1/orders/:orderId/refund', () => {
    it('should refund via API endpoint', async () => {
      const order = await createOrder([
        { item_id: productId, item_type: 'PRODUCT', quantity: 2 },
      ]);
      await createIntent(order.order_id);
      mockStripeService.getChargeDetails.mockResolvedValue({
        receipt_url: null,
      });

      await sendWebhook('payment_intent.succeeded', {
        id: `pi_${order.order_id}`,
        latest_charge: 'ch_api_refund',
        amount: 5000,
      }).expect(200);

      mockStripeService.refundCharge.mockResolvedValue({ id: 're_test' });

      const res = await request(app.getHttpServer())
        .post(`/v1/orders/${order.order_id}/refund`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('REFUNDED');
      expect(mockStripeService.refundCharge).toHaveBeenCalledWith(
        'ch_api_refund',
      );
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
