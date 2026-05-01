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
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
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
          paymentIntent.amount / 100,
        );
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const errorMessage =
          paymentIntent.last_payment_error?.message ?? 'Payment failed';
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

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
