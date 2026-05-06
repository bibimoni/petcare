import {
  Controller,
  Post,
  Get,
  Patch,
  UseGuards,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  CreatePaymentIntentDto,
  CreateCheckoutDto,
} from './dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

import {
  Currency,
  OrderStatus,
  PaymentMethod,
  CategoryType,
} from '../common/enum';
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  isSuperAdmin,
} from 'src/common';
import { STORE_PERMISSIONS } from 'src/common/permissions';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller({ path: '/orders', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_CREATE)
  @ApiOperation({
    summary: 'Create a new order and return Stripe checkout URL',
  })
  @ApiResponse({ status: 201, description: 'Order created with checkout_url' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.createOrder(
      createOrderDto,
      user.store_id,
      user.user_id,
      {
        currency: createOrderDto.currency,
        success_url: createOrderDto.success_url,
        cancel_url: createOrderDto.cancel_url,
      },
    );
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_VIEW)
  @ApiOperation({
    summary: 'Confirm order payment status after Stripe checkout redirect',
    description:
      'FE gọi endpoint này sau khi Stripe redirect về success_url. Trả về trạng thái thanh toán hiện tại.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['order_id'],
      properties: {
        order_id: {
          type: 'integer',
          example: 1,
          description: 'ID của đơn hàng cần xác nhận thanh toán',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái thanh toán',
    schema: {
      type: 'object',
      properties: {
        order_id: { type: 'integer', example: 1 },
        status: {
          type: 'string',
          enum: ['PENDING', 'PAID', 'CANCELLED'],
          example: 'PAID',
        },
        payment_status: {
          type: 'string',
          enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
          nullable: true,
          example: 'COMPLETED',
        },
        amount: { type: 'number', example: 110 },
        receipt_url: {
          type: 'string',
          nullable: true,
          example: 'https://pay.stripe.com/receipts/...',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async confirmOrder(
    @Body('order_id', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.confirmOrder(orderId, user.store_id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_VIEW)
  @ApiOperation({ summary: 'Get all orders with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'date_from', required: false, type: String })
  @ApiQuery({ name: 'date_to', required: false, type: String })
  @ApiQuery({ name: 'min_amount', required: false, type: Number })
  @ApiQuery({ name: 'max_amount', required: false, type: Number })
  @ApiQuery({ name: 'customer_id', required: false, type: Number })
  @ApiQuery({ name: 'payment_method', required: false, enum: PaymentMethod })
  @ApiQuery({ name: 'item_type', required: false, enum: CategoryType })
  async getAllOrders(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: OrderStatus,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
    @Query('min_amount') min_amount?: string,
    @Query('max_amount') max_amount?: string,
    @Query('customer_id') customer_id?: string,
    @Query('payment_method') payment_method?: PaymentMethod,
    @Query('item_type') item_type?: CategoryType,
  ) {
    const admin = isSuperAdmin(user);
    const storeId = admin ? null : user.store_id;
    const minAmount = min_amount ? parseFloat(min_amount) : undefined;
    const maxAmount = max_amount ? parseFloat(max_amount) : undefined;
    const customerIdNum = customer_id ? parseInt(customer_id, 10) : undefined;
    const validatedDateFrom =
      date_from && !isNaN(new Date(date_from).getTime())
        ? date_from
        : undefined;
    const validatedDateTo =
      date_to && !isNaN(new Date(date_to).getTime()) ? date_to : undefined;
    return this.ordersService.getOrderHistory(
      storeId,
      admin,
      status,
      page,
      limit,
      {
        date_from: validatedDateFrom,
        date_to: validatedDateTo,
        min_amount: minAmount && !isNaN(minAmount) ? minAmount : undefined,
        max_amount: maxAmount && !isNaN(maxAmount) ? maxAmount : undefined,
        customer_id:
          customerIdNum && !isNaN(customerIdNum) ? customerIdNum : undefined,
        payment_method,
        item_type,
      },
    );
  }

  // @Post('payment/intent')
  // @HttpCode(HttpStatus.OK)
  // @RequirePermissions(STORE_PERMISSIONS.ORDER_CREATE)
  // @ApiOperation({ deprecated: true })
  // @ApiOperation({ summary: 'Create a Stripe payment intent for an order' })
  // @ApiResponse({ status: 200, description: 'Payment intent created' })
  // @ApiResponse({ status: 404, description: 'Order not found' })
  // async createPaymentIntent(
  //   @CurrentUser() user: any,
  //   @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  // ) {
  //   const currency = createPaymentIntentDto.currency ?? Currency.VND;
  //   return this.ordersService.createPaymentIntent(
  //     createPaymentIntentDto.order_id,
  //     user.store_id,
  //     currency,
  //   );
  // }

  // @Post('checkout')
  // @HttpCode(HttpStatus.OK)
  // @RequirePermissions(STORE_PERMISSIONS.ORDER_CREATE)
  // @ApiOperation({ deprecated: true })
  // @ApiOperation({
  //   summary:
  //     'Create Stripe Checkout Session — redirects to Stripe payment page',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Checkout session created, returns checkout_url',
  // })
  // @ApiResponse({ status: 404, description: 'Order not found' })
  // @ApiResponse({ status: 400, description: 'Order already paid or cancelled' })
  // async createCheckout(
  //   @Body() dto: CreateCheckoutDto,
  //   @CurrentUser() user: any,
  // ) {
  //   const currency = dto.currency ?? Currency.VND;
  //   return this.ordersService.createCheckoutSession(
  //     dto.order_id,
  //     user.store_id,
  //     currency,
  //     dto.success_url,
  //     dto.cancel_url,
  //   );
  // }

  @Get(':orderId/payment/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_VIEW)
  @ApiOperation({
    summary:
      'Get payment status for an order (client polls after Stripe checkout)',
  })
  @ApiResponse({ status: 200, description: 'Payment status' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getPaymentStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.getPaymentStatus(orderId, user.store_id);
  }

  @Get(':orderId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_VIEW)
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.getOrder(orderId, user.store_id);
  }

  @Get(':orderId/payment')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_VIEW)
  @ApiOperation({ summary: 'Get payment details for an order' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Order or payment not found' })
  async getPaymentDetails(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.getPaymentDetails(orderId, user.store_id);
  }

  @Patch(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_CANCEL)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cancel_reason'],
      properties: {
        cancel_reason: {
          type: 'string',
          example: 'Khách hàng yêu cầu huỷ đơn',
          description: 'Lý do huỷ đơn hàng',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel this order' })
  async cancelOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body('cancel_reason') cancelReason: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.cancelOrder(
      orderId,
      user.store_id,
      cancelReason,
      user.user_id,
      user.full_name,
    );
  }

  @Post(':orderId/refund')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_REFUND)
  @ApiOperation({ summary: 'Refund a paid order' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refund_reason'],
      properties: {
        refund_reason: {
          type: 'string',
          example: 'Sản phẩm bị lỗi',
          description: 'Lý do hoàn tiền',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  @ApiResponse({ status: 400, description: 'Cannot refund this order' })
  @ApiResponse({ status: 404, description: 'Order or payment not found' })
  async refundOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body('refund_reason') refundReason: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.refundOrder(
      orderId,
      user.store_id,
      refundReason,
      user.user_id,
      user.full_name,
    );
  }

  @Get(':orderId/history')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_VIEW)
  @ApiOperation({ summary: 'Get order audit history' })
  @ApiResponse({ status: 200, description: 'Order history' })
  async getOrderHistory(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.getHistory(user.store_id, orderId);
  }
}
