import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrdersService } from '../src/orders/orders.service';
import { OrderHistory, OrderHistoryAction } from '../src/orders/entities/order-history.entity';
import { ProductHistory, ProductHistoryAction } from '../src/categories/entities/product-history.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderDetail } from '../src/orders/entities/order-detail.entity';
import { Payment } from '../src/orders/entities/payment.entity';
import { Product } from '../src/categories/entities/product.entity';
import { Service } from '../src/categories/entities/service.entity';
import { OrderStatus, PaymentStatus, CategoryType } from '../src/common/enum';
import { StripeService } from '../src/orders/stripe.service';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryRunner } from 'typeorm';
import { Reflector } from '@nestjs/core';

describe('OrdersService - Audit Logging', () => {
  let service: OrdersService;
  let orderHistoryRepo: jest.Mocked<any>;
  let productHistoryRepo: jest.Mocked<any>;
  let ordersRepo: jest.Mocked<any>;
  let productsRepo: jest.Mocked<any>;
  let paymentsRepo: jest.Mocked<any>;
  let orderDetailsRepo: jest.Mocked<any>;
  let servicesRepo: jest.Mocked<any>;
  let stripeService: jest.Mocked<any>;
  let queryRunner: any;

  beforeEach(async () => {
    orderHistoryRepo = { save: jest.fn().mockResolvedValue({}) };
    productHistoryRepo = { save: jest.fn().mockResolvedValue({}) };
    ordersRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    productsRepo = { findOne: jest.fn() };
    paymentsRepo = { findOne: jest.fn() };
    orderDetailsRepo = { find: jest.fn() };
    servicesRepo = { findOne: jest.fn() };
    stripeService = { cancelPaymentIntent: jest.fn() };

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        find: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          setParameter: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        }),
      },
    };

    const dataSource = { createQueryRunner: jest.fn().mockReturnValue(queryRunner) };
    const configService = { get: jest.fn().mockReturnValue('http://localhost:3000') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: 'OrderRepository', useValue: ordersRepo },
        { provide: 'OrderDetailRepository', useValue: orderDetailsRepo },
        { provide: 'PaymentRepository', useValue: paymentsRepo },
        { provide: 'ProductRepository', useValue: productsRepo },
        { provide: 'ServiceRepository', useValue: servicesRepo },
        { provide: 'OrderHistoryRepository', useValue: orderHistoryRepo },
        { provide: 'ProductHistoryRepository', useValue: productHistoryRepo },
        { provide: StripeService, useValue: stripeService },
        { provide: ConfigService, useValue: configService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('cancelOrder - audit logging', () => {
    const orderId = 1;
    const storeId = 10;
    const reason = 'Customer request';
    const userId = 5;

    it('should write OrderHistory with CANCELLED action after successful cancel', async () => {
      ordersRepo.findOne.mockResolvedValue({
        order_id: orderId,
        store_id: storeId,
        status: OrderStatus.PENDING,
        cancel_reason: null,
      });
      paymentsRepo.findOne.mockResolvedValue(null);
      queryRunner.manager.find.mockResolvedValue([
        { item_type: CategoryType.SERVICE, service_id: 1, quantity: 1, product_id: null },
      ]);
      queryRunner.manager.save.mockImplementation((_, entity) => {
        Object.assign(entity, { order_id: orderId });
        return entity;
      });

      await service.cancelOrder(orderId, storeId, reason, userId);

      expect(orderHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: orderId,
          store_id: storeId,
          action: OrderHistoryAction.CANCELLED,
          performed_by: userId,
          old_values: expect.objectContaining({ status: OrderStatus.PENDING }),
          new_values: expect.objectContaining({
            status: OrderStatus.CANCELLED,
            cancel_reason: reason,
          }),
        }),
      );
    });

    it('should write ProductHistory with STOCK_CHANGED for each product item in cancelled order', async () => {
      ordersRepo.findOne.mockResolvedValue({
        order_id: orderId,
        store_id: storeId,
        status: OrderStatus.PENDING,
        cancel_reason: null,
      });
      paymentsRepo.findOne.mockResolvedValue(null);
      queryRunner.manager.find.mockResolvedValue([
        { item_type: CategoryType.PRODUCT, product_id: 100, quantity: 3 },
        { item_type: CategoryType.SERVICE, service_id: 1, quantity: 1, product_id: null },
      ]);
      productsRepo.findOne.mockResolvedValue({ product_id: 100, stock_quantity: 15 });
      queryRunner.manager.save.mockImplementation((_, entity) => entity);

      await service.cancelOrder(orderId, storeId, reason, userId);

      expect(productHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          product_id: 100,
          store_id: storeId,
          action: ProductHistoryAction.STOCK_CHANGED,
          performed_by: userId,
          old_values: { stock_quantity: 12 },
          new_values: { stock_quantity: 15 },
        }),
      );
    });

    it('should not write ProductHistory for service-only orders on cancel', async () => {
      ordersRepo.findOne.mockResolvedValue({
        order_id: orderId,
        store_id: storeId,
        status: OrderStatus.PENDING,
      });
      paymentsRepo.findOne.mockResolvedValue(null);
      queryRunner.manager.find.mockResolvedValue([
        { item_type: CategoryType.SERVICE, service_id: 1, quantity: 1, product_id: null },
      ]);
      queryRunner.manager.save.mockImplementation((_, entity) => entity);

      await service.cancelOrder(orderId, storeId, reason, userId);

      expect(productHistoryRepo.save).not.toHaveBeenCalled();
    });

    it('should not write audit logs if cancel transaction fails', async () => {
      ordersRepo.findOne.mockResolvedValue({
        order_id: orderId,
        store_id: storeId,
        status: OrderStatus.PENDING,
      });
      paymentsRepo.findOne.mockResolvedValue(null);
      queryRunner.manager.find.mockRejectedValue(new Error('DB error'));

      await expect(service.cancelOrder(orderId, storeId, reason, userId)).rejects.toThrow();

      expect(orderHistoryRepo.save).not.toHaveBeenCalled();
      expect(productHistoryRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('refundOrder - audit logging', () => {
    const orderId = 1;
    const storeId = 10;

    it('should write OrderHistory with REFUNDED action after successful refund', async () => {
      ordersRepo.findOne.mockResolvedValue({
        order_id: orderId,
        store_id: storeId,
        status: OrderStatus.PAID,
        total_amount: 100,
      });
      paymentsRepo.findOne.mockResolvedValue({
        payment_id: 1,
        order_id: orderId,
        status: PaymentStatus.COMPLETED,
        stripe_charge_id: 'ch_test123',
      });
      queryRunner.manager.find.mockResolvedValue([
        { item_type: CategoryType.SERVICE, service_id: 1, quantity: 1, product_id: null },
      ]);
      queryRunner.manager.save.mockImplementation((_, entity) => entity);
      stripeService.refundCharge = jest.fn().mockResolvedValue({});

      await service.refundOrder(orderId, storeId);

      expect(orderHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: orderId,
          store_id: storeId,
          action: OrderHistoryAction.REFUNDED,
          old_values: expect.objectContaining({ status: OrderStatus.PAID }),
          new_values: expect.objectContaining({
            status: OrderStatus.CANCELLED,
            cancel_reason: 'Refunded',
          }),
        }),
      );
    });

    it('should write ProductHistory STOCK_CHANGED for each product item in refunded order', async () => {
      ordersRepo.findOne.mockResolvedValue({
        order_id: orderId,
        store_id: storeId,
        status: OrderStatus.PAID,
        total_amount: 200,
      });
      paymentsRepo.findOne.mockResolvedValue({
        payment_id: 1,
        order_id: orderId,
        status: PaymentStatus.COMPLETED,
        stripe_charge_id: 'ch_test123',
      });
      queryRunner.manager.find.mockResolvedValue([
        { item_type: CategoryType.PRODUCT, product_id: 50, quantity: 5 },
      ]);
      productsRepo.findOne.mockResolvedValue({ product_id: 50, stock_quantity: 25 });
      queryRunner.manager.save.mockImplementation((_, entity) => entity);
      stripeService.refundCharge = jest.fn().mockResolvedValue({});

      await service.refundOrder(orderId, storeId);

      expect(productHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          product_id: 50,
          store_id: storeId,
          action: ProductHistoryAction.STOCK_CHANGED,
          old_values: { stock_quantity: 20 },
          new_values: { stock_quantity: 25 },
        }),
      );
    });

    it('should not write audit logs if refund transaction fails', async () => {
      ordersRepo.findOne.mockResolvedValue({
        order_id: orderId,
        store_id: storeId,
        status: OrderStatus.PAID,
        total_amount: 100,
      });
      paymentsRepo.findOne.mockResolvedValue({
        payment_id: 1,
        status: PaymentStatus.COMPLETED,
        stripe_charge_id: 'ch_test123',
      });
      queryRunner.manager.find.mockRejectedValue(new Error('DB error'));

      await expect(service.refundOrder(orderId, storeId)).rejects.toThrow();

      expect(orderHistoryRepo.save).not.toHaveBeenCalled();
      expect(productHistoryRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('handleChargeRefunded - audit logging', () => {
    it('should write OrderHistory REFUNDED for Stripe webhook refund', async () => {
      const paymentIntentId = 'pi_test123';
      paymentsRepo.findOne.mockResolvedValue({
        payment_id: 1,
        order_id: 1,
        status: PaymentStatus.COMPLETED,
        stripe_payment_intent_id: paymentIntentId,
      });
      ordersRepo.findOne.mockResolvedValue({
        order_id: 1,
        store_id: 10,
      });
      queryRunner.manager.find.mockResolvedValue([
        { item_type: CategoryType.SERVICE, service_id: 1, quantity: 1, product_id: null },
      ]);
      queryRunner.manager.save.mockImplementation((_, entity) => entity);

      await service.handleChargeRefunded(paymentIntentId);

      expect(orderHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: 1,
          store_id: 10,
          action: OrderHistoryAction.REFUNDED,
          new_values: expect.objectContaining({
            cancel_reason: 'Refunded via Stripe',
          }),
        }),
      );
    });

    it('should write ProductHistory STOCK_CHANGED for products in webhook refund', async () => {
      const paymentIntentId = 'pi_test123';
      paymentsRepo.findOne.mockResolvedValue({
        payment_id: 1,
        order_id: 1,
        status: PaymentStatus.COMPLETED,
        stripe_payment_intent_id: paymentIntentId,
      });
      ordersRepo.findOne.mockResolvedValue({
        order_id: 1,
        store_id: 10,
      });
      queryRunner.manager.find.mockResolvedValue([
        { item_type: CategoryType.PRODUCT, product_id: 20, quantity: 2 },
      ]);
      productsRepo.findOne.mockResolvedValue({ product_id: 20, stock_quantity: 30 });
      queryRunner.manager.save.mockImplementation((_, entity) => entity);

      await service.handleChargeRefunded(paymentIntentId);

      expect(productHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          product_id: 20,
          store_id: 10,
          action: ProductHistoryAction.STOCK_CHANGED,
          old_values: { stock_quantity: 28 },
          new_values: { stock_quantity: 30 },
        }),
      );
    });
  });

  describe('getHistory', () => {
    it('should return order history for a given order in store', async () => {
      const mockHistory = [
        { id: 1, order_id: 1, store_id: 10, action: OrderHistoryAction.CANCELLED },
        { id: 2, order_id: 1, store_id: 10, action: OrderHistoryAction.REFUNDED },
      ];
      orderHistoryRepo.find = jest.fn().mockResolvedValue(mockHistory);

      const result = await service.getHistory(10, 1);

      expect(orderHistoryRepo.find).toHaveBeenCalledWith({
        where: { order_id: 1, store_id: 10 },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockHistory);
    });
  });
});

describe('OrderHistory Entity', () => {
  it('should have correct OrderHistoryAction enum values', () => {
    expect(OrderHistoryAction.CREATED).toBe('CREATED');
    expect(OrderHistoryAction.CANCELLED).toBe('CANCELLED');
    expect(OrderHistoryAction.PAID).toBe('PAID');
    expect(OrderHistoryAction.REFUNDED).toBe('REFUNDED');
  });
});

describe('ProductHistoryAction - STOCK_CHANGED', () => {
  it('should have STOCK_CHANGED in ProductHistoryAction enum', () => {
    expect(ProductHistoryAction.STOCK_CHANGED).toBe('STOCK_CHANGED');
    expect(ProductHistoryAction.CREATED).toBe('CREATED');
    expect(ProductHistoryAction.UPDATED).toBe('UPDATED');
    expect(ProductHistoryAction.DELETED).toBe('DELETED');
  });
});
