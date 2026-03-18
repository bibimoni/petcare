import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  NotificationStatus,
} from './entities/notification.entity';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CurrentUser, JwtAuthGuard } from 'src/common';

@ApiTags('Notifications')
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get notifications for a specific store' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  async getStoreNotifications(
    @CurrentUser() user: any,
    @Query('status') status?: NotificationStatus,
  ): Promise<Notification[]> {
    return this.notificationsService.findByStore(user.store_id, status);
  }

  @Get(':id/product-details')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product details from a specific notification' })
  @ApiResponse({
    status: 200,
    description: 'Product details retrieved successfully',
  })
  async getProductDetailsFromNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ) {
    const notificationIdNum = parseInt(notificationId, 10);
    if (isNaN(notificationIdNum)) {
      throw new BadRequestException('Invalid notification ID');
    }
    const notification = await this.notificationsService.findById(
      user.store_id,
      notificationIdNum,
    );

    return {
      notification_id: notification.notification_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      product: notification.product,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
  })
  async getNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ): Promise<Notification> {
    const notificationIdNum = parseInt(notificationId, 10);
    if (isNaN(notificationIdNum)) {
      throw new BadRequestException('Invalid notification ID');
    }
    return this.notificationsService.findById(user.store_id, notificationIdNum);
  }

  @Patch('mark-read-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read successfully',
  })
  async markMultipleAsRead(
    @CurrentUser() user: any,
    @Body('notificationIds') notificationIds: string[],
  ): Promise<{ message: string }> {
    const notificationIdNumbers = notificationIds.map((id) => {
      const num = parseInt(id, 10);
      if (isNaN(num)) {
        throw new BadRequestException('Invalid notification ID');
      }
      return num;
    });

    await this.notificationsService.markMultipleAsRead(
      user.store_id,
      notificationIdNumbers,
    );
    return { message: 'Notifications marked as read' };
  }

  @Patch(':id/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
  })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ): Promise<Notification> {
    const notificationIdNum = parseInt(notificationId, 10);
    if (isNaN(notificationIdNum)) {
      throw new BadRequestException('Invalid notification ID');
    }
    return this.notificationsService.markAsRead(
      user.store_id,
      notificationIdNum,
    );
  }

  @Patch(':id/archive')
  async archiveNotification(
    @CurrentUser() user: any,

    @Param('id') notificationId: string,
  ): Promise<Notification> {
    const notificationIdNum = parseInt(notificationId, 10);
    if (isNaN(notificationIdNum)) {
      throw new BadRequestException('Invalid notification ID');
    }
    return this.notificationsService.archive(user.store_id, notificationIdNum);
  }

  @Patch(':id')
  async updateNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notificationIdNum = parseInt(notificationId, 10);
    if (isNaN(notificationIdNum)) {
      throw new BadRequestException('Invalid notification ID');
    }
    return this.notificationsService.update(
      user.store_id,
      notificationIdNum,
      updateNotificationDto,
    );
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ): Promise<{ message: string }> {
    const notificationIdNum = parseInt(notificationId, 10);
    if (isNaN(notificationIdNum)) {
      throw new BadRequestException('Invalid notification ID');
    }
    await this.notificationsService.delete(user.store_id, notificationIdNum);
    return { message: 'Notification deleted successfully' };
  }
}
