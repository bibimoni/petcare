import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/categories/entities/product.entity';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // @Cron('0 0 8 * * *')
  @Cron('30 * * * * *')
  async handleDailyNotificationCheck() {
    this.logger.log('Running daily notification check...');

    try {
      await this.checkLowStock();
      await this.checkExpiryWarnings();
      this.logger.log('Daily notification check completed.');
    } catch (error) {
      this.logger.error('Error during notification check:', error);
    }
  }

  private async checkLowStock() {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.stock_quantity <= product.min_stock_level')
      .getMany();

    for (const product of products) {
      const type =
        product.stock_quantity === 0
          ? NotificationType.OUT_OF_STOCK
          : NotificationType.LOW_STOCK;

      const alreadyNotified = await this.notificationRepository
        .createQueryBuilder('n')
        .where('n.store_id = :storeId', { storeId: product.store_id })
        .andWhere('n.product_id = :productId', {
          productId: product.product_id,
        })
        .andWhere('n.type = :type', { type })
        .andWhere('DATE(n.created_at) = CURRENT_DATE')
        .getOne();

      if (alreadyNotified) continue;

      if (product.stock_quantity === 0) {
        await this.notificationsService.createOutOfStockNotification(
          product.store_id,
          product,
        );
      } else {
        await this.notificationsService.createLowStockNotification(
          product.store_id,
          product,
        );
      }
    }
  }

  private async checkExpiryWarnings() {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.expiry_date <= :in7Days', { in7Days })
      // .where('product.expiry_date >= :now', { now })
      // .andWhere('product.expiry_date <= :in7Days', { in7Days })
      .getMany();

    for (const product of products) {
      if (!product.expiry_date) continue;

      // const expiryDate = new Date(product.expiry_date);
      const expiryDate = new Date(product.expiry_date);
      product.expiry_date = expiryDate;

      const daysLeft = Math.floor(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const alreadyNotified = await this.notificationRepository
        .createQueryBuilder('n')
        .where('n.store_id = :storeId', { storeId: product.store_id })
        .andWhere('n.product_id = :productId', {
          productId: product.product_id,
        })
        .andWhere('n.type = :type', { type: NotificationType.EXPIRY_WARNING })
        .andWhere('DATE(n.created_at) = CURRENT_DATE')
        .getOne();

      if (alreadyNotified) continue;

      if (daysLeft < 0) {
        await this.notificationsService.createExpiredNotification(
          product.store_id,
          product,
        );
      } else {
        await this.notificationsService.createExpiryWarningNotification(
          product.store_id,
          product,
        );
      }
    }
  }
}
