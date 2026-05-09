import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { OrdersService } from './orders.service';
import * as common from '@nestjs/common';
import { Request } from 'express';

@ApiTags('Stripe Webhook')
@Controller({ path: '/stripe', version: '1' })
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private stripeService: StripeService,
    private ordersService: OrdersService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Req() req: common.RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Thiếu header stripe-signature');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException(
        'Thiếu raw body — hãy đảm bảo rawBody:true được bật trong NestFactory',
      );
    }

    const event = this.stripeService.constructWebhookEvent(rawBody, signature);

    this.logger.log(`Received Stripe event: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        await this.ordersService.handlePaymentIntentSucceeded(
          paymentIntent.id,
          typeof paymentIntent.latest_charge === 'string'
            ? paymentIntent.latest_charge
            : (paymentIntent.latest_charge?.id ?? null),
          this.stripeService.fromStripeAmount(
            paymentIntent.amount,
            paymentIntent.currency,
          ),
        );
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const errorMessage =
          paymentIntent.last_payment_error?.message ?? 'Thanh toán thất bại';
        await this.ordersService.handlePaymentIntentFailed(
          paymentIntent.id,
          errorMessage,
        );
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as any;
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (paymentIntentId) {
          await this.ordersService.handleChargeRefunded(paymentIntentId);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as any;
        if (session.payment_status === 'paid' && session.payment_intent) {
          const piId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id;
          if (piId) {
            await this.ordersService.handleCheckoutCompleted(session.id, piId);
          }
        }
        break;
      }

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
