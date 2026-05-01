import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Payment } from './entities/payment.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeService } from './stripe.service';
import { Product } from '../categories/entities/product.entity';
import { Service } from '../categories/entities/service.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Order, OrderDetail, Payment, Product, Service]),
  ],
  controllers: [OrdersController, StripeWebhookController],
  providers: [OrdersService, StripeService],
  exports: [OrdersService, StripeService],
})
export class OrdersModule {}
