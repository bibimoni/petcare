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
} from './dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { OrderStatus } from '../common/enum';
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
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
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.createOrder(
      createOrderDto,
      user.store_id,
      user.user_id,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_VIEW)
  @ApiOperation({ summary: 'Get all orders with pagination' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  async getAllOrders(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.getOrderHistory(
      user.store_id,
      status,
      page,
      limit,
    );
  }

  @Post('payment/intent')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_CREATE)
  @ApiOperation({ summary: 'Create a Stripe payment intent for an order' })
  @ApiResponse({ status: 200, description: 'Payment intent created' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createPaymentIntent(
    @CurrentUser() user: any,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Query('currency') currency: string = 'usd',
  ) {
    return this.ordersService.createPaymentIntent(
      createPaymentIntentDto.order_id,
      user.store_id,
      currency,
    );
  }

  @Get(':orderId/payment/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_VIEW)
  @ApiOperation({ summary: 'Get payment status for an order (client polls after Stripe checkout)' })
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
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel this order' })
  async cancelOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.cancelOrder(
      orderId,
      user.store_id,
      reason,
      user.user_id,
    );
  }

  @Post(':orderId/refund')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.ORDER_REFUND)
  @ApiOperation({ summary: 'Refund a paid order' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  @ApiResponse({ status: 400, description: 'Cannot refund this order' })
  @ApiResponse({ status: 404, description: 'Order or payment not found' })
  async refundOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.refundOrder(orderId, user.store_id);
  }
}
