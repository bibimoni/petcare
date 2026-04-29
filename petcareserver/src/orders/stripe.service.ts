import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  // FIX 1: Dùng InstanceType<typeof Stripe> thay vì Stripe trực tiếp.
  // Lỗi "Cannot use namespace 'Stripe' as a type" xảy ra khi tsconfig thiếu
  // esModuleInterop hoặc Stripe SDK version mới export khác chuẩn.
  // InstanceType<typeof Stripe> luôn hoạt động đúng trong mọi trường hợp.
  private stripe: InstanceType<typeof Stripe>;

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeKey, {
      // FIX 2: Cập nhật apiVersion cho khớp với Stripe SDK đang cài.
      // Lỗi TS2322 vì SDK mới enforce literal type chính xác.
      // Giá trị '2026-04-22.dahlia' là version mà SDK hiện tại yêu cầu.
      apiVersion: '2026-04-22.dahlia',
    });
  }

  /**
   * Create a payment intent for order
   */
  async createPaymentIntent(
    orderId: number,
    amount: number,
    currency: string = 'usd',
    description?: string,
  ): Promise<{
    client_secret: string;
    payment_intent_id: string;
    amount: number;
    currency: string;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        description: description || `Order #${orderId} payment`,
        metadata: {
          order_id: orderId.toString(),
        },
      });

      if (!paymentIntent.client_secret) {
        throw new InternalServerErrorException(
          'Stripe did not return a client_secret',
        );
      }

      return {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount,
        currency,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        // FIX 3: Bỏ cast thừa "as Stripe.errors.StripeError".
        // Lỗi TS2749: StripeError là class (value), không thể dùng trực tiếp làm type.
        // Sau khi kiểm tra instanceof, TypeScript đã tự narrow type → dùng error.message thẳng.
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Retrieve payment intent details
   */
  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      throw new InternalServerErrorException(
        'Failed to retrieve payment intent',
      );
    }
  }

  /**
   * Confirm payment intent
   * Retrieve và kiểm tra status — client đã confirm phía frontend bằng Stripe SDK
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<
    | {
        success: true;
        status: string;
        payment_intent_id: string;
        charge_id: string | null;
        amount: number;
      }
    | {
        success: false;
        status: string;
        payment_intent_id: string;
      }
  > {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        const latestCharge = paymentIntent.latest_charge;
        const chargeId =
          latestCharge === null
            ? null
            : typeof latestCharge === 'string'
              ? latestCharge
              : latestCharge.id;

        return {
          success: true,
          status: paymentIntent.status,
          payment_intent_id: paymentIntent.id,
          charge_id: chargeId,
          amount: paymentIntent.amount / 100,
        };
      }

      if (paymentIntent.status === 'requires_payment_method') {
        throw new BadRequestException('Payment method is required');
      }

      if (paymentIntent.status === 'requires_action') {
        throw new BadRequestException(
          'Further action is required to complete payment',
        );
      }

      return {
        success: false,
        status: paymentIntent.status,
        payment_intent_id: paymentIntent.id,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Cancel a payment intent on Stripe
   * Chỉ gọi được khi intent chưa ở trạng thái terminal (succeeded/canceled)
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<void> {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      // Không cancel nếu đã ở trạng thái terminal
      if (intent.status === 'succeeded' || intent.status === 'canceled') {
        return;
      }

      await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      throw new InternalServerErrorException('Failed to cancel payment intent');
    }
  }

  /**
   * Refund a charge
   */
  async refundCharge(chargeId: string, amount?: number): Promise<any> {
    try {
      // Bỏ type annotation Stripe.Refund*Params vì tên type thay đổi tuỳ SDK version.
      // Dùng object trực tiếp — TypeScript tự infer type từ this.stripe.refunds.create().
      return await this.stripe.refunds.create({
        charge: chargeId,
        ...(amount ? { amount: Math.round(amount * 100) } : {}),
      });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      throw new InternalServerErrorException('Failed to refund charge');
    }
  }

  /**
   * Get charge details (bao gồm receipt_url)
   */
  async getChargeDetails(chargeId: string) {
    try {
      return await this.stripe.charges.retrieve(chargeId);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      throw new InternalServerErrorException(
        'Failed to retrieve charge details',
      );
    }
  }
}
