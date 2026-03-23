import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Product } from 'src/categories/entities/product.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create(
      createNotificationDto,
    );
    return this.notificationRepository.save(notification);
  }

  async findByStore(
    storeId: number,
    status?: NotificationStatus,
  ): Promise<Notification[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.store_id = :storeId', { storeId })
      .orderBy('notification.created_at', 'DESC');

    if (status) {
      query.andWhere('notification.status = :status', { status });
    }

    return query.getMany();
  }

  async findById(
    storeId: number,
    notificationId: number,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { notification_id: notificationId, store_id: storeId },
      relations: ['product', 'store'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }
    return notification;
  }

  async update(
    storeId: number,
    notificationId: number,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findById(storeId, notificationId);
    Object.assign(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async markAsRead(
    storeId: number,
    notificationId: number,
  ): Promise<Notification> {
    return this.update(storeId, notificationId, {
      status: NotificationStatus.READ,
    });
  }

  async markMultipleAsRead(
    storeId: number,
    notificationIds: number[],
  ): Promise<void> {
    await this.notificationRepository.update(
      { notification_id: In(notificationIds), store_id: storeId },
      { status: NotificationStatus.READ },
    );
  }

  async archive(
    storeId: number,
    notificationId: number,
  ): Promise<Notification> {
    return this.update(storeId, notificationId, {
      status: NotificationStatus.ARCHIVED,
    });
  }

  async delete(storeId: number, notificationId: number): Promise<void> {
    await this.notificationRepository.delete({
      notification_id: notificationId,
      store_id: storeId,
    });
  }

  async createLowStockNotification(
    storeId: number,
    product: Product,
  ): Promise<Notification> {
    const notification = await this.create({
      store_id: storeId,
      product_id: product.product_id,
      type: NotificationType.LOW_STOCK,
      title: `Cảnh báo: ${product.name} sắp hết hàng.`,
      message: `Sản phẩm sắp hết hàng. Số lượng sản phẩm còn ${product.stock_quantity}. Nhấn để xem chi tiết.`,
      product_name: product.name,
    });
    notification.action_url = `/notifications/${notification.notification_id}/product-details`;
    return this.notificationRepository.save(notification);
  }

  async createOutOfStockNotification(
    storeId: number,
    product: Product,
  ): Promise<Notification> {
    const notification = await this.create({
      store_id: storeId,
      product_id: product.product_id,
      type: NotificationType.OUT_OF_STOCK,
      title: `Cảnh báo: ${product.name} hết hàng`,
      message: `Sản phẩm hết hàng. Nhấn để xem chi tiết.`,
      product_name: product.name,
    });

    notification.action_url = `/notifications/${notification.notification_id}/product-details`;
    return this.notificationRepository.save(notification);
  }

  async createExpiryWarningNotification(
    storeId: number,
    product: Product,
  ): Promise<Notification> {
    const notification = await this.create({
      store_id: storeId,
      product_id: product.product_id,
      type: NotificationType.EXPIRY_WARNING,
      title: `Cảnh báo: ${product.name} sắp hết hạn.`,
      message: `Sản phẩm sắp hết hạn. Hạn sử dụng: ${product.expiry_date.toLocaleDateString()}. Nhấn để xem chi tiết.`,
      product_name: product.name,
    });

    notification.action_url = `/notifications/${notification.notification_id}/product-details`;
    return this.notificationRepository.save(notification);
  }

  async createExpiredNotification(
    storeId: number,
    product: Product,
  ): Promise<Notification> {
    const notification = await this.create({
      store_id: storeId,
      product_id: product.product_id,
      type: NotificationType.EXPIRED,
      title: `Cảnh báo: ${product.name} đã hết hạn.`,
      message: `Sản phẩm đã hết hạn. Hạn sử dụng: ${product.expiry_date.toLocaleDateString()}. Nhấn để xem chi tiết.`,
      product_name: product.name,
    });

    notification.action_url = `/notifications/${notification.notification_id}/product-details`;
    return this.notificationRepository.save(notification);
  }
}
