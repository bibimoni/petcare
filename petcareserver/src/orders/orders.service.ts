import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Payment } from './entities/payment.entity';
import { CreateOrderDto } from './dto';
import { StripeService } from './stripe.service';
import {
  CategoryType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../common/enum';
import { Product } from '../categories/entities/product.entity';
import { Service as PetCareService } from '../categories/entities/service.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private orderDetailsRepository: Repository<OrderDetail>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(PetCareService)
    private servicesRepository: Repository<PetCareService>,
    private stripeService: StripeService,
    private dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────────────────
  // CREATE ORDER
  // ─────────────────────────────────────────────────────────
  async createOrder(
    createOrderDto: CreateOrderDto,
    storeId: number,
    userId: number,
  ): Promise<Order> {
    const { customer_id, items, note } = createOrderDto;

    type DetailPayload = {
      item_type: CategoryType;
      product_id?: number;
      service_id?: number;
      pet_id?: number;
      quantity: number;
      unit_price: number;
      original_cost: number;
      subtotal: number;
    };

    let totalAmount = 0;
    const detailPayloads: DetailPayload[] = [];

    for (const item of items) {
      if (item.item_type === CategoryType.PRODUCT) {
        const product = await this.productsRepository.findOne({
          where: { product_id: item.item_id, store_id: storeId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product ${item.item_id} not found in this store`,
          );
        }

        if (product.stock_quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}`,
          );
        }

        const unitPrice = Number(product.sell_price);
        const costPrice = Number(product.cost_price) || 0;

        detailPayloads.push({
          item_type: CategoryType.PRODUCT,
          product_id: item.item_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          original_cost: costPrice * item.quantity,
          subtotal: unitPrice * item.quantity,
          pet_id: item.pet_id,
        });

        totalAmount += unitPrice * item.quantity;
      } else if (item.item_type === CategoryType.SERVICE) {
        const service = await this.servicesRepository.findOne({
          where: { id: item.item_id, store_id: storeId },
        });

        if (!service) {
          throw new NotFoundException(
            `Service ${item.item_id} not found in this store`,
          );
        }

        const unitPrice = Number(service.price);

        detailPayloads.push({
          item_type: CategoryType.SERVICE,
          service_id: item.item_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          original_cost: 0,
          subtotal: unitPrice * item.quantity,
          pet_id: item.pet_id,
        });

        totalAmount += unitPrice * item.quantity;
      } else {
        throw new BadRequestException(`Invalid item type: ${item.item_type}`);
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // FIX 7: Lỗi TS2769 "No overload matches this call" xảy ra vì TypeScript
      // không resolve đúng overload của EntityManager.create() khi truyền object literal
      // trực tiếp. Giải pháp: khai báo biến với type DeepPartial<Order> rõ ràng
      // rồi truyền vào — TypeScript match overload 1 (single object) thay vì
      // nhầm overload 2 (array).
      const orderData: DeepPartial<Order> = {
        store_id: storeId,
        user_id: userId,
        customer_id: customer_id,
        total_amount: totalAmount,
        status: OrderStatus.PENDING,
        note: note,
      };

      const order = queryRunner.manager.create(Order, orderData);
      const savedOrder = await queryRunner.manager.save(Order, order);

      for (const payload of detailPayloads) {
        await queryRunner.manager.save(OrderDetail, {
          ...payload,
          order_id: savedOrder.order_id,
        });

        if (payload.item_type === CategoryType.PRODUCT) {
          const updateResult = await queryRunner.manager
            .createQueryBuilder()
            .update(Product)
            .set({
              stock_quantity: () => `stock_quantity - ${payload.quantity}`,
            })
            .where(
              'product_id = :id AND store_id = :storeId AND stock_quantity >= :qty',
              { id: payload.product_id, storeId, qty: payload.quantity },
            )
            .execute();

          if (updateResult.affected === 0) {
            throw new BadRequestException(
              `Stock changed concurrently for product ${payload.product_id}. Please retry.`,
            );
          }
        }
      }

      await queryRunner.commitTransaction();

      const completeOrder = await this.ordersRepository.findOne({
        where: { order_id: savedOrder.order_id },
        relations: [
          'order_details',
          'order_details.product',
          'order_details.service',
          'order_details.pet',
          'customer',
          'store',
        ],
      });

      if (!completeOrder) {
        throw new InternalServerErrorException(
          'Failed to retrieve created order',
        );
      }

      return completeOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────────────────────
  // CREATE PAYMENT INTENT
  // ─────────────────────────────────────────────────────────
  async createPaymentIntent(
    orderId: number,
    storeId: number,
    currency: string = 'usd',
  ): Promise<{
    client_secret: string;
    payment_intent_id: string;
    amount: number;
    currency: string;
  }> {
    const order = await this.ordersRepository.findOne({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.store_id !== storeId) {
      throw new ForbiddenException(
        'You do not have permission to pay for this order',
      );
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay for a cancelled order');
    }

    // Reuse existing PENDING intent nếu còn hợp lệ
    const existing = await this.paymentsRepository.findOne({
      where: { order_id: orderId, status: PaymentStatus.PENDING },
    });

    if (existing) {
      if (
        !existing.stripe_client_secret ||
        !existing.stripe_payment_intent_id
      ) {
        // Intent bị corrupt → xoá và tạo lại
        await this.paymentsRepository.delete({
          payment_id: existing.payment_id,
        });
      } else {
        return {
          client_secret: existing.stripe_client_secret,
          payment_intent_id: existing.stripe_payment_intent_id,
          amount: Number(existing.amount),
          currency,
        };
      }
    }

    const paymentIntentData = await this.stripeService.createPaymentIntent(
      orderId,
      Number(order.total_amount),
      currency,
    );

    const payment = this.paymentsRepository.create({
      order_id: orderId,
      payment_method: PaymentMethod.STRIPE,
      amount: order.total_amount,
      status: PaymentStatus.PENDING,
      stripe_payment_intent_id: paymentIntentData.payment_intent_id,
      stripe_client_secret: paymentIntentData.client_secret,
    });

    await this.paymentsRepository.save(payment);

    return paymentIntentData;
  }

  // ─────────────────────────────────────────────────────────
  // CONFIRM PAYMENT
  // ─────────────────────────────────────────────────────────
  async confirmPayment(
    paymentIntentId: string,
    orderId: number,
    storeId: number,
  ): Promise<{
    success: boolean;
    order_id: number;
    status: OrderStatus;
    payment_intent_id: string;
    amount: number;
  }> {
    const order = await this.ordersRepository.findOne({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.store_id !== storeId) {
      throw new ForbiddenException(
        'You do not have permission to confirm payment for this order',
      );
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    const payment = await this.paymentsRepository.findOne({
      where: { stripe_payment_intent_id: paymentIntentId },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment record not found for intent ${paymentIntentId}`,
      );
    }

    if (payment.order_id !== orderId) {
      throw new ForbiddenException(
        'Payment intent does not belong to this order',
      );
    }

    // Idempotency: đã COMPLETED thì trả kết quả luôn, không gọi Stripe lại
    if (payment.status === PaymentStatus.COMPLETED) {
      return {
        success: true,
        order_id: orderId,
        status: order.status,
        payment_intent_id: paymentIntentId,
        amount: Number(order.total_amount),
      };
    }

    // ── Xác minh với Stripe ──
    const paymentResult =
      await this.stripeService.confirmPaymentIntent(paymentIntentId);

    if (!paymentResult.success) {
      payment.status = PaymentStatus.FAILED;
      payment.error_message = `Payment status: ${paymentResult.status}`;
      await this.paymentsRepository.save(payment);

      throw new BadRequestException(
        `Payment not completed. Stripe status: ${paymentResult.status}`,
      );
    }

    // Fetch charge details TRƯỚC khi mở transaction
    // để không giữ DB connection mở trong khi chờ HTTP call đến Stripe
    let receiptUrl: string | null = null;
    if (paymentResult.charge_id) {
      try {
        const chargeDetails = await this.stripeService.getChargeDetails(
          paymentResult.charge_id,
        );
        receiptUrl = chargeDetails.receipt_url ?? null;
      } catch (err) {
        // Không block confirm nếu lấy receipt_url thất bại
        console.error('Failed to fetch charge details:', err);
      }
    }

    // ── Atomic update trong transaction với pessimistic lock ──
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock payment row để ngăn concurrent confirm xử lý đồng thời
      // Fallback to non-locking query if driver doesn't support (e.g. SQLite in tests)
      let lockedPayment: Payment | null;
      try {
        lockedPayment = await queryRunner.manager
          .createQueryBuilder(Payment, 'payment')
          .setLock('pessimistic_write')
          .where('payment.stripe_payment_intent_id = :id', {
            id: paymentIntentId,
          })
          .getOne();
      } catch (lockError: any) {
        if (lockError.name === 'LockNotSupportedOnGivenDriverError') {
          lockedPayment = await queryRunner.manager
            .createQueryBuilder(Payment, 'payment')
            .where('payment.stripe_payment_intent_id = :id', {
              id: paymentIntentId,
            })
            .getOne();
        } else {
          throw lockError;
        }
      }

      if (!lockedPayment) {
        throw new NotFoundException(
          'Payment record disappeared during processing',
        );
      }

      // Kiểm tra lại sau khi lock — tránh double-processing
      if (lockedPayment.status === PaymentStatus.COMPLETED) {
        await queryRunner.rollbackTransaction();
        return {
          success: true,
          order_id: orderId,
          status: order.status,
          payment_intent_id: paymentIntentId,
          amount: Number(order.total_amount),
        };
      }

      lockedPayment.status = PaymentStatus.COMPLETED;
      // FIX 8 & 9: Dùng ?? null để handle string | null.
      // payment.entity.ts đã đổi type sang `string | null` nên gán trực tiếp được.
      lockedPayment.stripe_charge_id = paymentResult.charge_id ?? null;
      lockedPayment.stripe_receipt_url = receiptUrl ?? null;
      await queryRunner.manager.save(Payment, lockedPayment);

      order.status = OrderStatus.PAID;
      await queryRunner.manager.save(Order, order);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(
        `[CRITICAL] Payment confirmed on Stripe (${paymentIntentId}) but DB update failed:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to update payment and order status. Payment was charged on Stripe — please contact support.',
      );
    } finally {
      await queryRunner.release();
    }

    return {
      success: true,
      order_id: orderId,
      status: order.status,
      payment_intent_id: paymentIntentId,
      amount: Number(order.total_amount),
    };
  }

  // ─────────────────────────────────────────────────────────
  // CANCEL ORDER
  // ─────────────────────────────────────────────────────────
  async cancelOrder(
    orderId: number,
    storeId: number,
    reason: string,
    cancelledByUserId?: number,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.store_id !== storeId) {
      throw new ForbiddenException(
        'You do not have permission to cancel this order',
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException(
        'Cannot cancel a paid order. Please request a refund instead.',
      );
    }

    const orderDetails = await this.orderDetailsRepository.find({
      where: { order_id: orderId },
    });

    const pendingPayment = await this.paymentsRepository.findOne({
      where: { order_id: orderId, status: PaymentStatus.PENDING },
    });

    // Thực hiện DB transaction TRƯỚC, Stripe cancel SAU.
    // Nếu làm ngược lại: Stripe cancel thành công nhưng DB rollback
    // → order vẫn PENDING nhưng intent đã bị huỷ → inconsistent state.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Hoàn trả tồn kho atomic
      for (const detail of orderDetails) {
        if (detail.item_type === CategoryType.PRODUCT && detail.product_id) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(Product)
            .set({
              stock_quantity: () => `stock_quantity + ${detail.quantity}`,
            })
            .where('product_id = :id AND store_id = :storeId', {
              id: detail.product_id,
              storeId,
            })
            .execute();
        }
      }

      // Cập nhật payment thành FAILED trong cùng transaction
      if (pendingPayment) {
        pendingPayment.status = PaymentStatus.FAILED;
        pendingPayment.error_message = 'Order cancelled by user/staff';
        await queryRunner.manager.save(Payment, pendingPayment);
      }

      order.status = OrderStatus.CANCELLED;
      order.cancel_reason = reason;
      if (cancelledByUserId) {
        order.cancelled_by_user_id = cancelledByUserId;
      }

      await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`Failed to cancel order ${orderId}:`, error);
      throw new InternalServerErrorException('Failed to cancel order');
    } finally {
      await queryRunner.release();
    }

    // Cancel Stripe intent SAU khi DB đã commit thành công.
    // Best-effort: nếu fail, intent sẽ tự expire, không gây hại.
    if (pendingPayment?.stripe_payment_intent_id) {
      try {
        await this.stripeService.cancelPaymentIntent(
          pendingPayment.stripe_payment_intent_id,
        );
      } catch (err) {
        console.error(
          `[WARN] Order ${orderId} cancelled in DB but failed to cancel Stripe intent ${pendingPayment.stripe_payment_intent_id}:`,
          err,
        );
      }
    }

    return order;
  }

  // ─────────────────────────────────────────────────────────
  // GET ORDER HISTORY
  // ─────────────────────────────────────────────────────────
  async getOrderHistory(
    storeId: number,
    status?: OrderStatus,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

    const query = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.store_id = :storeId', { storeId })
      .leftJoinAndSelect('order.order_details', 'orderDetails')
      .leftJoinAndSelect('orderDetails.product', 'product')
      .leftJoinAndSelect('orderDetails.service', 'service')
      .leftJoinAndSelect('order.customer', 'customer')
      .orderBy('order.created_at', 'DESC');

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    const skip = (safePage - 1) * safeLimit;
    query.skip(skip).take(safeLimit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
    };
  }

  // ─────────────────────────────────────────────────────────
  // GET SINGLE ORDER
  // ─────────────────────────────────────────────────────────
  async getOrder(orderId: number, storeId: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { order_id: orderId },
      relations: [
        'order_details',
        'order_details.product',
        'order_details.service',
        'order_details.pet',
        'customer',
        'store',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.store_id !== storeId) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    return order;
  }

  // ─────────────────────────────────────────────────────────
  // GET PAYMENT DETAILS
  // ─────────────────────────────────────────────────────────
  async getPaymentDetails(orderId: number, storeId: number): Promise<Payment> {
    const order = await this.ordersRepository.findOne({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.store_id !== storeId) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    const payment = await this.paymentsRepository.findOne({
      where: { order_id: orderId },
      order: { created_at: 'DESC' },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for this order');
    }

    return payment;
  }

  // ─────────────────────────────────────────────────────────
  // REFUND ORDER
  // ─────────────────────────────────────────────────────────
  async refundOrder(
    orderId: number,
    storeId: number,
  ): Promise<{
    success: boolean;
    order_id: number;
    refund_amount: number;
    status: string;
  }> {
    const order = await this.ordersRepository.findOne({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.store_id !== storeId) {
      throw new ForbiddenException(
        'You do not have permission to refund this order',
      );
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    const payment = await this.paymentsRepository.findOne({
      where: { order_id: orderId, status: PaymentStatus.COMPLETED },
    });

    if (!payment) {
      throw new NotFoundException('No completed payment found for this order');
    }

    if (!payment.stripe_charge_id) {
      throw new BadRequestException(
        'No Stripe charge found for this payment. Manual refund required.',
      );
    }

    // Call Stripe refund
    await this.stripeService.refundCharge(payment.stripe_charge_id);

    // Update DB in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      payment.status = PaymentStatus.REFUNDED;
      await queryRunner.manager.save(Payment, payment);

      order.status = OrderStatus.CANCELLED;
      order.cancel_reason = 'Refunded';
      await queryRunner.manager.save(Order, order);

      // Restore stock for product items
      const orderDetails = await this.orderDetailsRepository.find({
        where: { order_id: orderId },
      });

      for (const detail of orderDetails) {
        if (detail.item_type === CategoryType.PRODUCT && detail.product_id) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(Product)
            .set({
              stock_quantity: () => `stock_quantity + ${detail.quantity}`,
            })
            .where('product_id = :id AND store_id = :storeId', {
              id: detail.product_id,
              storeId,
            })
            .execute();
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(
        `[CRITICAL] Refund processed on Stripe for order ${orderId} but DB update failed:`,
        error,
      );
      throw new InternalServerErrorException(
        'Refund was processed on Stripe but failed to update database. Please contact support.',
      );
    } finally {
      await queryRunner.release();
    }

    return {
      success: true,
      order_id: orderId,
      refund_amount: Number(order.total_amount),
      status: 'REFUNDED',
    };
  }
}
