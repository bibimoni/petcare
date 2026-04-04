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
  ParseIntPipe,
  NotFoundException,
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
import { MarkMultipleAsReadDto } from './dto/mark-tuple-notification.req';

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
  @ApiResponse({
    status: 404,
    description: 'Notification or product not found',
  })
  async getProductDetailsFromNotification(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) notificationId: number,
  ) {
    const notification = await this.notificationsService.findById(
      user.store_id,
      notificationId,
    );

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    if (!notification.product_id || !notification.product) {
      throw new NotFoundException(
        'Thông báo này không liên kết với sản phẩm nào',
      );
    }

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
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async getNotification(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<Notification> {
    const notification = await this.notificationsService.findById(
      user.store_id,
      notificationId,
    );

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return notification;
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
    @Body() body: MarkMultipleAsReadDto,
  ): Promise<{ message: string }> {
    await this.notificationsService.markMultipleAsRead(
      user.store_id,
      body.notificationIds,
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
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<Notification> {
    const notification = await this.notificationsService.markAsRead(
      user.store_id,
      notificationId,
    );

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return notification;
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification archived successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async archiveNotification(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<Notification> {
    const notification = await this.notificationsService.archive(
      user.store_id,
      notificationId,
    );

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return notification;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async updateNotification(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) notificationId: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.notificationsService.update(
      user.store_id,
      notificationId,
      updateNotificationDto,
    );

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return notification;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<{ message: string }> {
    await this.notificationsService.delete(user.store_id, notificationId);
    return { message: 'Notification deleted successfully' };
  }
}
