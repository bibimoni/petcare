import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Product } from 'src/categories/entities/product.entity';
import {
  buildNotificationProductUrl,
  buildInvitationUrl,
} from './notification.util';
import { CreateInvitationNotificationDto } from './dto/create-invitation-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
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
    userId?: number,
    status?: NotificationStatus,
  ): Promise<Notification[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.store_id = :storeId', { storeId })
      .andWhere(
        '(notification.user_id IS NULL OR notification.user_id = :userId)',
        { userId },
      )
      .orderBy('notification.created_at', 'DESC');

    if (status) {
      query.andWhere('notification.status = :status', { status });
    }

    return query.getMany();
  }

  /**
   * Find all notifications for a user, including:
   * - Personal notifications (user_id = userId)
   * - Store-wide notifications (store_id = user.store_id AND user_id IS NULL)
   *
   * @param userId - The user's ID
   * @param storeId - Optional store ID. If provided, includes store-wide notifications
   * @param status - Optional status filter
   */
  async findByUser(
    userId: number,
    storeId?: number | null,
    status?: NotificationStatus,
  ): Promise<Notification[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .orderBy('notification.created_at', 'DESC');

    if (storeId) {
      query.where(
        '(notification.user_id = :userId OR (notification.store_id = :storeId AND notification.user_id IS NULL))',
        { userId, storeId },
      );
    } else {
      query.where('notification.user_id = :userId', { userId });
    }

    if (status) {
      query.andWhere('notification.status = :status', { status });
    }

    return query.getMany();
  }

  async findById(
    storeId: number,
    notificationId: number,
  ): Promise<Notification | null> {
    return this.notificationRepository.findOne({
      where: { notification_id: notificationId, store_id: storeId },
      relations: ['product', 'store'],
    });
  }

  async update(
    storeId: number,
    notificationId: number,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification | null> {
    const notification = await this.findById(storeId, notificationId);
    if (!notification) return null;
    Object.assign(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async markAsRead(
    storeId: number,
    notificationId: number,
  ): Promise<Notification | null> {
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
  ): Promise<Notification | null> {
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

  async hasNotificationToday(
    storeId: number,
    productId: number,
    type: NotificationType,
  ): Promise<boolean> {
    const existing = await this.notificationRepository
      .createQueryBuilder('n')
      .where('n.store_id = :storeId', { storeId })
      .andWhere('n.product_id = :productId', { productId })
      .andWhere('n.type = :type', { type })
      .andWhere('DATE(n.created_at) = CURRENT_DATE')
      .getOne();
    return !!existing;
  }

  async createLowStockNotification(
    storeId: number,
    product: Product,
  ): Promise<Notification> {
    const notification = await this.create({
      store_id: storeId,
      product_id: product.product_id,
      type: NotificationType.LOW_STOCK,
      title: `Warning: ${product.name} is running low`,
      message: `The product is running low. Remaining quantity: ${product.stock_quantity}. Click to view details.`,
      product_name: product.name,
    });
    notification.action_url = buildNotificationProductUrl(
      notification.notification_id,
    );
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
      title: `Alert: ${product.name} is out of stock`,
      message: `The product is out of stock. Click to view details.`,
      product_name: product.name,
    });
    notification.action_url = buildNotificationProductUrl(
      notification.notification_id,
    );
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
      title: `Warning: ${product.name} is nearing expiry`,
      message: `The product is approaching its expiry date: ${product.expiry_date.toLocaleDateString()}. Click to view details.`,
      product_name: product.name,
    });
    notification.action_url = buildNotificationProductUrl(
      notification.notification_id,
    );
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
      title: `Alert: ${product.name} has expired`,
      message: `The product has expired. Expiry date: ${product.expiry_date.toLocaleDateString()}. Click to view details.`,
      product_name: product.name,
    });
    notification.action_url = buildNotificationProductUrl(
      notification.notification_id,
    );
    return this.notificationRepository.save(notification);
  }

  async createInvitationNotification(
    storeIdOrDto: number | CreateInvitationNotificationDto,
    userId?: number,
    storeName?: string,
    roleName?: string,
    invitationToken?: string,
  ): Promise<Notification> {
    let dto: CreateInvitationNotificationDto;

    if (typeof storeIdOrDto === 'object') {
      dto = storeIdOrDto;
    } else {
      dto = {
        storeId: storeIdOrDto,
        userId: userId!,
        storeName: storeName!,
        roleName: roleName!,
        invitationToken,
      };
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    const actionUrl = dto.invitationToken
      ? buildInvitationUrl(frontendUrl, dto.invitationToken)
      : undefined;

    const notification = await this.create({
      store_id: dto.storeId,
      user_id: dto.userId,
      type: NotificationType.STORE_INVITATION,
      title: `Lời mời tham gia ${dto.storeName}`,
      message: `Bạn đã được mời tham gia ${dto.storeName} với vai trò ${dto.roleName}. Nhấn để xem chi tiết.`,
      action_url: actionUrl,
    });

    return notification;
  }
}
