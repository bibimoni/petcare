import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationScheduler } from './notification.scheduler';
import { ScheduleModule } from '@nestjs/schedule';
import { Product } from 'src/categories/entities/product.entity';
import { Store } from 'src/stores/entities/store.entity';
import { StoresModule } from 'src/stores/stores.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Product, Notification, Store]),
    forwardRef(() => StoresModule),
  ],
  providers: [NotificationsService, NotificationScheduler],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationScheduler],
})
export class NotificationsModule {}
