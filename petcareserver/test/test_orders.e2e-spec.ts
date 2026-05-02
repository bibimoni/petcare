import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../src/orders/orders.controller';
import { OrdersService } from '../src/orders/orders.service';
import { OrderStatus } from '../src/common/enum';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const mockOrdersService = {
  createOrder: jest.fn(),
  createPaymentIntent: jest.fn(),
  getPaymentStatus: jest.fn(),
  cancelOrder: jest.fn(),
  refundOrder: jest.fn(),
  getOrderHistory: jest.fn(),
  getOrder: jest.fn(),
  getPaymentDetails: jest.fn(),
};

const TEST_USER = {
  user_id: 1,
  store_id: 10,
  permissions: [
    'order.create',
    'order.view',
    'order.edit',
    'order.cancel',
    'order.refund',
  ],
};

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        Reflector,
      ],
    }).compile();
    controller = module.get(OrdersController);
  });

  beforeEach(() => jest.clearAllMocks());

  // ═══════════════════════════════════════════════
  // CREATE ORDER
  // ═══════════════════════════════════════════════
  describe('createOrder', () => {
    const dto = {
      items: [{ item_id: 1, item_type: 'PRODUCT' as any, quantity: 2 }],
      note: 'Test order',
    };

    it('should create order successfully', async () => {
      const expected = {
        order_id: 1,
        status: OrderStatus.PENDING,
        total_amount: 51,
      };
      mockOrdersService.createOrder.mockResolvedValue(expected);

      const result = await controller.createOrder(dto, TEST_USER);

      expect(result).toEqual(expected);
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith(dto, 10, 1);
    });

    it('should propagate NotFoundException for missing product', async () => {
      mockOrdersService.createOrder.mockRejectedValue(
        new NotFoundException('Product 999 not found in this store'),
      );
      await expect(controller.createOrder(dto, TEST_USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate BadRequestException for insufficient stock', async () => {
      mockOrdersService.createOrder.mockRejectedValue(
        new BadRequestException(
          'Insufficient stock for product "Dog Food". Available: 5',
        ),
      );
      await expect(controller.createOrder(dto, TEST_USER)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty items', async () => {
      mockOrdersService.createOrder.mockRejectedValue(
        new BadRequestException('items should not be empty'),
      );
      await expect(
        controller.createOrder({ items: [] } as any, TEST_USER),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════
  // GET ALL ORDERS
  // ═══════════════════════════════════════════════
  describe('getAllOrders', () => {
    it('should return paginated orders', async () => {
      const expected = {
        data: [{ order_id: 1 }],
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
      };
      mockOrdersService.getOrderHistory.mockResolvedValue(expected);

      const result = await controller.getAllOrders(TEST_USER, 1, 10);

      expect(result).toEqual(expected);
      expect(mockOrdersService.getOrderHistory).toHaveBeenCalledWith(
        10,
        false,
        undefined,
        1,
        10,
        {
          customer_id: undefined,
          date_from: undefined,
          date_to: undefined,
          item_type: undefined,
          max_amount: undefined,
          min_amount: undefined,
          payment_method: undefined,
        },
      );
    });

    it('should filter by status', async () => {
      const expected = { data: [], total: 0, page: 1, limit: 10, pages: 0 };
      mockOrdersService.getOrderHistory.mockResolvedValue(expected);

      const result = await controller.getAllOrders(
        TEST_USER,
        1,
        10,
        OrderStatus.PAID,
      );

      expect(mockOrdersService.getOrderHistory).toHaveBeenCalledWith(
        10,
        false,
        OrderStatus.PAID,
        1,
        10,
        {
          customer_id: undefined,
          date_from: undefined,
          date_to: undefined,
          item_type: undefined,
          max_amount: undefined,
          min_amount: undefined,
          payment_method: undefined,
        },
      );
      expect(result.data).toHaveLength(0);
    });

    it('should use custom pagination', async () => {
      mockOrdersService.getOrderHistory.mockResolvedValue({
        data: [],
        total: 50,
        page: 3,
        limit: 5,
        pages: 10,
      });

      await controller.getAllOrders(TEST_USER, 3, 5);

      expect(mockOrdersService.getOrderHistory).toHaveBeenCalledWith(
        10,
        false,
        undefined,
        3,
        5,
        {
          customer_id: undefined,
          date_from: undefined,
          date_to: undefined,
          item_type: undefined,
          max_amount: undefined,
          min_amount: undefined,
          payment_method: undefined,
        },
      );
    });
  });

  // ═══════════════════════════════════════════════
  // GET SINGLE ORDER
  // ═══════════════════════════════════════════════
  describe('getOrder', () => {
    it('should return order with details', async () => {
      const expected = {
        order_id: 1,
        status: OrderStatus.PENDING,
        total_amount: 100,
        order_details: [{ id: 1, item_type: 'PRODUCT', quantity: 2 }],
      };
      mockOrdersService.getOrder.mockResolvedValue(expected);

      const result = await controller.getOrder(1, TEST_USER);

      expect(result.order_id).toBe(1);
      expect(result.order_details).toHaveLength(1);
      expect(mockOrdersService.getOrder).toHaveBeenCalledWith(1, 10);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockOrdersService.getOrder.mockRejectedValue(
        new NotFoundException('Order 999 not found'),
      );
      await expect(controller.getOrder(999, TEST_USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for wrong store', async () => {
      mockOrdersService.getOrder.mockRejectedValue(
        new ForbiddenException('You do not have permission to view this order'),
      );
      await expect(controller.getOrder(1, TEST_USER)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ═══════════════════════════════════════════════
  // CREATE PAYMENT INTENT
  // ═══════════════════════════════════════════════
  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const expected = {
        client_secret: 'cs_test_123',
        payment_intent_id: 'pi_test_123',
        amount: 51,
        currency: 'usd',
      };
      mockOrdersService.createPaymentIntent.mockResolvedValue(expected);

      const result = await controller.createPaymentIntent(
        TEST_USER,
        { order_id: 1 },
        'usd',
      );

      expect(result.client_secret).toBe('cs_test_123');
      expect(result.payment_intent_id).toBe('pi_test_123');
      expect(mockOrdersService.createPaymentIntent).toHaveBeenCalledWith(
        1,
        10,
        'usd',
      );
    });

    it('should reuse existing PENDING intent (idempotent)', async () => {
      const intent = {
        client_secret: 'cs_existing',
        payment_intent_id: 'pi_existing',
        amount: 51,
        currency: 'usd',
      };
      mockOrdersService.createPaymentIntent.mockResolvedValue(intent);

      const r1 = await controller.createPaymentIntent(
        TEST_USER,
        { order_id: 1 },
        'usd',
      );
      const r2 = await controller.createPaymentIntent(
        TEST_USER,
        { order_id: 1 },
        'usd',
      );

      expect(r1.client_secret).toBe(r2.client_secret);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockOrdersService.createPaymentIntent.mockRejectedValue(
        new NotFoundException('Order 999 not found'),
      );
      await expect(
        controller.createPaymentIntent(TEST_USER, { order_id: 999 }, 'usd'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for already paid order', async () => {
      mockOrdersService.createPaymentIntent.mockRejectedValue(
        new BadRequestException('Order is already paid'),
      );
      await expect(
        controller.createPaymentIntent(TEST_USER, { order_id: 1 }, 'usd'),
      ).rejects.toThrow('Order is already paid');
    });

    it('should throw BadRequestException for cancelled order', async () => {
      mockOrdersService.createPaymentIntent.mockRejectedValue(
        new BadRequestException('Cannot pay for a cancelled order'),
      );
      await expect(
        controller.createPaymentIntent(TEST_USER, { order_id: 1 }, 'usd'),
      ).rejects.toThrow('Cannot pay for a cancelled order');
    });

    it('should throw ForbiddenException for wrong store', async () => {
      mockOrdersService.createPaymentIntent.mockRejectedValue(
        new ForbiddenException('You do not have permission'),
      );
      await expect(
        controller.createPaymentIntent(TEST_USER, { order_id: 1 }, 'usd'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════
  // GET PAYMENT STATUS (replaces confirmPayment)
  // ═══════════════════════════════════════════════
  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const expected = {
        order_id: 1,
        order_status: 'PENDING',
        payment_status: 'PENDING',
        payment_intent_id: 'pi_test',
        amount: 51,
      };
      mockOrdersService.getPaymentStatus.mockResolvedValue(expected);

      const result = await controller.getPaymentStatus(1, TEST_USER);

      expect(result.order_status).toBe('PENDING');
      expect(result.payment_status).toBe('PENDING');
      expect(mockOrdersService.getPaymentStatus).toHaveBeenCalledWith(1, 10);
    });

    it('should return PAID status after webhook processed', async () => {
      mockOrdersService.getPaymentStatus.mockResolvedValue({
        order_id: 1,
        order_status: 'PAID',
        payment_status: 'COMPLETED',
        payment_intent_id: 'pi_test',
        amount: 51,
      });

      const result = await controller.getPaymentStatus(1, TEST_USER);
      expect(result.order_status).toBe('PAID');
      expect(result.payment_status).toBe('COMPLETED');
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockOrdersService.getPaymentStatus.mockRejectedValue(
        new NotFoundException('Order 999 not found'),
      );
      await expect(controller.getPaymentStatus(999, TEST_USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for wrong store', async () => {
      mockOrdersService.getPaymentStatus.mockRejectedValue(
        new ForbiddenException('You do not have permission'),
      );
      await expect(controller.getPaymentStatus(1, TEST_USER)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ═══════════════════════════════════════════════
  // CANCEL ORDER
  // ═══════════════════════════════════════════════
  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const expected = {
        order_id: 1,
        status: OrderStatus.CANCELLED,
        cancel_reason: 'Customer request',
      };
      mockOrdersService.cancelOrder.mockResolvedValue(expected);

      const result = await controller.cancelOrder(
        1,
        'Customer request',
        TEST_USER,
      );

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.cancel_reason).toBe('Customer request');
      expect(mockOrdersService.cancelOrder).toHaveBeenCalledWith(
        1,
        10,
        'Customer request',
        1,
      );
    });

    it('should throw BadRequestException for already cancelled order', async () => {
      mockOrdersService.cancelOrder.mockRejectedValue(
        new BadRequestException('Order is already cancelled'),
      );
      await expect(
        controller.cancelOrder(1, 'reason', TEST_USER),
      ).rejects.toThrow('Order is already cancelled');
    });

    it('should throw BadRequestException for paid order', async () => {
      mockOrdersService.cancelOrder.mockRejectedValue(
        new BadRequestException(
          'Cannot cancel a paid order. Please request a refund instead.',
        ),
      );
      await expect(
        controller.cancelOrder(1, 'reason', TEST_USER),
      ).rejects.toThrow(/Cannot cancel a paid order/);
    });

    it('should throw ForbiddenException for wrong store', async () => {
      mockOrdersService.cancelOrder.mockRejectedValue(
        new ForbiddenException('You do not have permission'),
      );
      await expect(
        controller.cancelOrder(1, 'reason', TEST_USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockOrdersService.cancelOrder.mockRejectedValue(
        new NotFoundException('Order 999 not found'),
      );
      await expect(
        controller.cancelOrder(999, 'reason', TEST_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════
  // GET PAYMENT DETAILS
  // ═══════════════════════════════════════════════
  describe('getPaymentDetails', () => {
    it('should return payment details', async () => {
      const expected = {
        payment_id: 1,
        order_id: 1,
        payment_method: 'STRIPE',
        status: 'COMPLETED',
        stripe_payment_intent_id: 'pi_test',
      };
      mockOrdersService.getPaymentDetails.mockResolvedValue(expected);

      const result = await controller.getPaymentDetails(1, TEST_USER);

      expect(result.payment_method).toBe('STRIPE');
      expect(result.stripe_payment_intent_id).toBe('pi_test');
      expect(mockOrdersService.getPaymentDetails).toHaveBeenCalledWith(1, 10);
    });

    it('should throw NotFoundException when no payment exists', async () => {
      mockOrdersService.getPaymentDetails.mockRejectedValue(
        new NotFoundException('Payment not found for this order'),
      );
      await expect(controller.getPaymentDetails(1, TEST_USER)).rejects.toThrow(
        'Payment not found for this order',
      );
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockOrdersService.getPaymentDetails.mockRejectedValue(
        new NotFoundException('Order 999 not found'),
      );
      await expect(
        controller.getPaymentDetails(999, TEST_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════
  // REFUND ORDER
  // ═══════════════════════════════════════════════
  describe('refundOrder', () => {
    it('should refund a paid order successfully', async () => {
      const expected = {
        success: true,
        order_id: 1,
        refund_amount: 76.5,
        status: 'REFUNDED',
      };
      mockOrdersService.refundOrder.mockResolvedValue(expected);

      const result = await controller.refundOrder(1, TEST_USER);

      expect(result.success).toBe(true);
      expect(result.refund_amount).toBe(76.5);
      expect(result.status).toBe('REFUNDED');
      expect(mockOrdersService.refundOrder).toHaveBeenCalledWith(1, 10);
    });

    it('should throw BadRequestException for non-paid order', async () => {
      mockOrdersService.refundOrder.mockRejectedValue(
        new BadRequestException('Only paid orders can be refunded'),
      );
      await expect(controller.refundOrder(1, TEST_USER)).rejects.toThrow(
        'Only paid orders can be refunded',
      );
    });

    it('should throw NotFoundException for missing payment', async () => {
      mockOrdersService.refundOrder.mockRejectedValue(
        new NotFoundException('No completed payment found'),
      );
      await expect(controller.refundOrder(1, TEST_USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when no Stripe charge', async () => {
      mockOrdersService.refundOrder.mockRejectedValue(
        new BadRequestException('No Stripe charge found'),
      );
      await expect(controller.refundOrder(1, TEST_USER)).rejects.toThrow(
        'No Stripe charge found',
      );
    });

    it('should throw ForbiddenException for wrong store', async () => {
      mockOrdersService.refundOrder.mockRejectedValue(
        new ForbiddenException('You do not have permission'),
      );
      await expect(controller.refundOrder(1, TEST_USER)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
