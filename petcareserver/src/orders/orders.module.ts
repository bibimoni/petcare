import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Payment } from './entities/payment.entity';
import { OrderHistory } from './entities/order-history.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeService } from './stripe.service';
import { Product } from '../categories/entities/product.entity';
import { Service } from '../categories/entities/service.entity';
import { ProductHistory } from '../categories/entities/product-history.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Order,
      OrderDetail,
      Payment,
      OrderHistory,
      Product,
      Service,
      ProductHistory,
    ]),
  ],
  controllers: [OrdersController, StripeWebhookController],
  providers: [OrdersService, StripeService],
  exports: [OrdersService, StripeService],
})
export class OrdersModule {}
