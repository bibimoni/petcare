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
import { ConfigService } from '@nestjs/config';

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
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    storeId: number,
    userId: number,
    checkoutOptions?: {
      currency?: string;
      success_url?: string;
      cancel_url?: string;
    },
  ): Promise<{ order: Order; checkout_url: string; session_id: string }> {
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
            .set({ stock_quantity: () => 'stock_quantity - :qty' })
            .setParameter('qty', payload.quantity)
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

      const currency = checkoutOptions?.currency || 'usd';
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const successUrl =
        checkoutOptions?.success_url ||
        `${frontendUrl}/orders/${completeOrder.order_id}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl =
        checkoutOptions?.cancel_url ||
        `${frontendUrl}/orders/${completeOrder.order_id}/cancel`;

      const sessionData = await this.stripeService.createCheckoutSession(
        completeOrder.order_id,
        totalAmount,
        currency,
        successUrl,
        cancelUrl,
      );

      const payment = this.paymentsRepository.create({
        order_id: completeOrder.order_id,
        payment_method: PaymentMethod.STRIPE,
        amount: totalAmount,
        status: PaymentStatus.PENDING,
        stripe_checkout_session_id: sessionData.session_id,
        stripe_checkout_url: sessionData.checkout_url,
        stripe_payment_intent_id: undefined,
      });
      await this.paymentsRepository.save(payment);

      return {
        order: completeOrder,
        checkout_url: sessionData.checkout_url,
        session_id: sessionData.session_id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

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

  async createCheckoutSession(
    orderId: number,
    storeId: number,
    currency: string = 'usd',
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<{
    checkout_url: string;
    session_id: string;
    order_id: number;
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
        'You do not have permission to pay for this order',
      );
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay for a cancelled order');
    }

    // Reuse existing PENDING payment if checkout URL is still valid
    const existing = await this.paymentsRepository.findOne({
      where: { order_id: orderId, status: PaymentStatus.PENDING },
    });

    if (existing?.stripe_checkout_session_id) {
      // Already has a checkout session → return existing
      return {
        checkout_url: existing.stripe_checkout_url ?? '',
        session_id: existing.stripe_checkout_session_id,
        order_id: orderId,
        amount: Number(existing.amount),
      };
    }

    // Clean up corrupt payment if exists
    if (existing) {
      await this.paymentsRepository.delete({ payment_id: existing.payment_id });
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const finalSuccessUrl =
      successUrl ||
      `${frontendUrl}/orders/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl =
      cancelUrl || `${frontendUrl}/orders/${orderId}/cancel`;

    const sessionData = await this.stripeService.createCheckoutSession(
      orderId,
      Number(order.total_amount),
      currency,
      finalSuccessUrl,
      finalCancelUrl,
    );

    const payment = this.paymentsRepository.create({
      order_id: orderId,
      payment_method: PaymentMethod.STRIPE,
      amount: order.total_amount,
      status: PaymentStatus.PENDING,
      stripe_checkout_session_id: sessionData.session_id,
      stripe_checkout_url: sessionData.checkout_url,
      stripe_payment_intent_id: undefined,
    });

    await this.paymentsRepository.save(payment);

    return {
      checkout_url: sessionData.checkout_url,
      session_id: sessionData.session_id,
      order_id: orderId,
      amount: Number(order.total_amount),
    };
  }

  async getPaymentStatus(
    orderId: number,
    storeId: number,
  ): Promise<{
    order_id: number;
    order_status: string;
    payment_status: string | null;
    payment_intent_id: string | null;
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
        'You do not have permission to view this order',
      );
    }

    const payment = await this.paymentsRepository.findOne({
      where: { order_id: orderId },
      order: { created_at: 'DESC' },
    });

    return {
      order_id: orderId,
      order_status: order.status,
      payment_status: payment?.status ?? null,
      payment_intent_id: payment?.stripe_payment_intent_id ?? null,
      amount: Number(order.total_amount),
    };
  }

  async confirmOrder(
    orderId: number,
    storeId: number,
  ): Promise<{
    order_id: number;
    status: string;
    payment_status: string | null;
    amount: number;
    receipt_url: string | null;
  }> {
    const order = await this.ordersRepository.findOne({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.store_id !== storeId) {
      throw new ForbiddenException(
        'You do not have permission to confirm this order',
      );
    }

    const payment = await this.paymentsRepository.findOne({
      where: { order_id: orderId },
      order: { created_at: 'DESC' },
    });

    return {
      order_id: orderId,
      status: order.status,
      payment_status: payment?.status ?? null,
      amount: Number(order.total_amount),
      receipt_url: payment?.stripe_receipt_url ?? null,
    };
  }

  async handlePaymentIntentSucceeded(
    paymentIntentId: string,
    chargeId: string | null,
    amount: number,
  ): Promise<void> {
    const payment = await this.paymentsRepository.findOne({
      where: { stripe_payment_intent_id: paymentIntentId },
    });

    if (!payment) {
      console.warn(
        `[WEBHOOK] Payment record not found for intent ${paymentIntentId} — ignoring`,
      );
      return;
    }

    // Idempotency: already processed
    if (payment.status === PaymentStatus.COMPLETED) {
      return;
    }

    // Fetch receipt URL (best-effort, don't block)
    let receiptUrl: string | null = null;
    if (chargeId) {
      try {
        const chargeDetails =
          await this.stripeService.getChargeDetails(chargeId);
        receiptUrl = chargeDetails.receipt_url ?? null;
      } catch (err) {
        console.error('Failed to fetch charge details:', err);
      }
    }

    // Atomic update
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Pessimistic lock with SQLite fallback
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

      if (!lockedPayment || lockedPayment.status === PaymentStatus.COMPLETED) {
        await queryRunner.rollbackTransaction();
        return;
      }

      lockedPayment.status = PaymentStatus.COMPLETED;
      lockedPayment.stripe_charge_id = chargeId ?? null;
      lockedPayment.stripe_receipt_url = receiptUrl ?? null;
      await queryRunner.manager.save(Payment, lockedPayment);

      await queryRunner.manager.update(Order, lockedPayment.order_id, {
        status: OrderStatus.PAID,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(
        `[CRITICAL] Webhook payment_intent.succeeded for ${paymentIntentId} — DB update failed:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to process payment webhook',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async handleCheckoutCompleted(
    sessionId: string,
    paymentIntentId: string,
  ): Promise<void> {
    const payment = await this.paymentsRepository.findOne({
      where: { stripe_checkout_session_id: sessionId },
    });

    if (!payment) {
      console.warn(
        `[WEBHOOK] Payment record not found for checkout session ${sessionId} — ignoring`,
      );
      return;
    }

    // Idempotency
    if (payment.status === PaymentStatus.COMPLETED) return;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lưu payment_intent_id + update COMPLETED ngay tại đây
      // Không chờ payment_intent.succeeded vì có thể đến trước khi DB lưu kịp
      payment.stripe_payment_intent_id = paymentIntentId;
      payment.status = PaymentStatus.COMPLETED;
      await queryRunner.manager.save(Payment, payment);

      await queryRunner.manager.update(Order, payment.order_id, {
        status: OrderStatus.PAID,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(
        `[CRITICAL] checkout.session.completed for ${sessionId} — DB update failed:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to process checkout webhook',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async handlePaymentIntentFailed(
    paymentIntentId: string,
    errorMessage: string,
  ): Promise<void> {
    const payment = await this.paymentsRepository.findOne({
      where: { stripe_payment_intent_id: paymentIntentId },
    });

    if (!payment) {
      console.warn(
        `[WEBHOOK] Payment record not found for intent ${paymentIntentId} — ignoring`,
      );
      return;
    }

    // Idempotency
    if (
      payment.status === PaymentStatus.FAILED ||
      payment.status === PaymentStatus.COMPLETED
    ) {
      return;
    }

    payment.status = PaymentStatus.FAILED;
    payment.error_message = errorMessage;
    await this.paymentsRepository.save(payment);
  }

  async handleChargeRefunded(paymentIntentId: string): Promise<void> {
    const payment = await this.paymentsRepository.findOne({
      where: { stripe_payment_intent_id: paymentIntentId },
    });

    if (!payment) {
      console.warn(
        `[WEBHOOK] Payment record not found for intent ${paymentIntentId} — ignoring`,
      );
      return;
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      payment.status = PaymentStatus.REFUNDED;
      await queryRunner.manager.save(Payment, payment);

      await queryRunner.manager.update(Order, payment.order_id, {
        status: OrderStatus.CANCELLED,
        cancel_reason: 'Refunded via Stripe',
      });

      const orderDetails = await queryRunner.manager.find(OrderDetail, {
        where: { order_id: payment.order_id },
      });

      for (const detail of orderDetails) {
        if (detail.item_type === CategoryType.PRODUCT && detail.product_id) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(Product)
            .set({ stock_quantity: () => 'stock_quantity + :qty' })
            .setParameter('qty', detail.quantity)
            .where('product_id = :id', { id: detail.product_id })
            .execute();
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(
        `[CRITICAL] Webhook charge.refunded for ${paymentIntentId} — DB update failed:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to process refund webhook',
      );
    } finally {
      await queryRunner.release();
    }
  }

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
      const orderDetails = await queryRunner.manager.find(OrderDetail, {
        where: { order_id: orderId },
      });

      // Hoàn trả tồn kho atomic
      for (const detail of orderDetails) {
        if (detail.item_type === CategoryType.PRODUCT && detail.product_id) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(Product)
            .set({ stock_quantity: () => 'stock_quantity + :qty' })
            .setParameter('qty', detail.quantity)
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

      const orderDetails = await queryRunner.manager.find(OrderDetail, {
        where: { order_id: orderId },
      });

      // Restore stock
      for (const detail of orderDetails) {
        if (detail.item_type === CategoryType.PRODUCT && detail.product_id) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(Product)
            .set({ stock_quantity: () => 'stock_quantity + :qty' })
            .setParameter('qty', detail.quantity)
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
        `[CRITICAL] Refund DB update failed for order ${orderId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to process refund in database.',
      );
    } finally {
      await queryRunner.release();
    }

    try {
      await this.stripeService.refundCharge(payment.stripe_charge_id!);
    } catch (err) {
      console.error(
        `[CRITICAL] DB updated but Stripe refund failed for order ${orderId}:`,
        err,
      );
      throw new InternalServerErrorException(
        'Database updated but Stripe refund failed. Please process refund manually.',
      );
    }

    return {
      success: true,
      order_id: orderId,
      refund_amount: Number(order.total_amount),
      status: 'REFUNDED',
    };
  }
}
