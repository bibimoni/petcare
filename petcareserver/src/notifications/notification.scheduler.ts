import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Product } from 'src/categories/entities/product.entity';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { Store } from 'src/stores/entities/store.entity';

const DEFAULT_CRON_SCHEDULE = '0 0 8 * * *';
const DEFAULT_EXPIRY_WARNING_DAYS = 7;

@Injectable()
export class NotificationScheduler implements OnModuleInit {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly notificationsService: NotificationsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    const stores = await this.storeRepository.find();
    for (const store of stores) {
      this.registerStoreJob(store.id, store.notification_cron);
    }
    this.logger.log(`Registered cron jobs for ${stores.length} stores.`);
  }

  // Đăng ký cron job cho 1 store
  registerStoreJob(storeId: number, cronExpression: string | null) {
    const jobName = this.getJobName(storeId);
    const schedule = cronExpression ?? DEFAULT_CRON_SCHEDULE;

    // Nếu job cũ tồn tại thì xóa trước
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
      this.logger.log(`Removed old cron job for store ${storeId}`);
    }

    const job = new CronJob(schedule, () => {
      this.runStoreNotificationCheck(storeId);
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();

    this.logger.log(
      `Registered cron job for store ${storeId} with schedule: "${schedule}"`,
    );
  }

  // Gọi khi store xóa custom schedule, quay về default
  removeStoreJob(storeId: number) {
    const jobName = this.getJobName(storeId);
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
    }
    // Re-register với default schedule
    this.registerStoreJob(storeId, null);
  }

  private getJobName(storeId: number): string {
    return `notification_store_${storeId}`;
  }

  private async runStoreNotificationCheck(storeId: number) {
    this.logger.log(`Running notification check for store ${storeId}...`);
    try {
      await this.checkLowStock(storeId);
      await this.checkExpiryWarnings(storeId);
      this.logger.log(`Notification check completed for store ${storeId}.`);
    } catch (error) {
      this.logger.error(
        `Error during notification check for store ${storeId}:`,
        error,
      );
    }
  }

  private async checkLowStock(storeId: number) {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.store_id = :storeId', { storeId })
      .andWhere('product.stock_quantity <= product.min_stock_level')
      .getMany();

    for (const product of products) {
      const type =
        product.stock_quantity === 0
          ? NotificationType.OUT_OF_STOCK
          : NotificationType.LOW_STOCK;

      const alreadyNotified =
        await this.notificationsService.hasNotificationToday(
          product.store_id,
          product.product_id,
          type,
        );

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

  private async checkExpiryWarnings(storeId: number) {
    const now = new Date();
    const warningThreshold = new Date();
    warningThreshold.setDate(now.getDate() + DEFAULT_EXPIRY_WARNING_DAYS);

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.store_id = :storeId', { storeId })
      .andWhere('product.expiry_date >= :now', { now })
      .andWhere('product.expiry_date <= :warningThreshold', {
        warningThreshold,
      })
      .getMany();

    for (const product of products) {
      if (!product.expiry_date) continue;

      const expiryDate = new Date(product.expiry_date);
      product.expiry_date = expiryDate;

      const daysLeft = Math.floor(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const type =
        daysLeft < 0
          ? NotificationType.EXPIRED
          : NotificationType.EXPIRY_WARNING;

      const alreadyNotified =
        await this.notificationsService.hasNotificationToday(
          product.store_id,
          product.product_id,
          type,
        );

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
