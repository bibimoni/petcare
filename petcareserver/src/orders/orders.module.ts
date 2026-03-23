// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Order } from './entities/order.entity';
// import { OrderDetail } from './entities/order-detail.entity';
// import { OrdersService } from './orders.service';
// import { NotificationsModule } from '../notifications/notifications.module';
// import { Product } from '../categories/entities/product.entity';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([Order, OrderDetail, Product]),
//     NotificationsModule,
//   ],
//   providers: [OrdersService],
//   exports: [TypeOrmModule, OrdersService],
// })
// export class OrdersModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderDetail])],
  exports: [TypeOrmModule],
})
export class OrdersModule {}
