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
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
// import { ProductsService } from '../categories/products/products.service';

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
  constructor(
    private readonly notificationsService: NotificationsService,
    // private readonly productsService: ProductsService,
  ) {}

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

  // @Get(':id/product-details')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Get product details from a specific notification' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Product details retrieved successfully',
  // })
  // async getProductDetailsFromNotification(
  //   @CurrentUser() user: any,
  //   @Param('id') notificationId: number,
  // ): Promise<Partial<any>> {
  //   const notification = await this.notificationsService.findById(
  //     user.store_id,
  //     notificationId,
  //   );
  //   const productDetails = await this.productsService.findByProduct(
  //     notification.store_id,
  //     notification.product_id,
  //   );
  //   return {
  //     notification_id: notification.notification_id,
  //     type: notification.type,
  //     title: notification.title,
  //     message: notification.message,
  //     product: {
  //       product_id: productDetails.product_id,
  //       name: productDetails.name,
  //       stock_quantity: productDetails.stock_quantity,
  //       min_stock_level: productDetails.min_stock_level,
  //       expiry_date: productDetails.expiry_date,
  //       sell_price: productDetails.sell_price,
  //     },
  //   };
  // }
  @Get(':id/product-details')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product details from a specific notification' })
  @ApiResponse({
    status: 200,
    description: 'Product details retrieved successfully',
  })
  async getProductDetailsFromNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: number,
  ) {
    const notification = await this.notificationsService.findById(
      user.store_id,
      notificationId,
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
    @Param('id') notificationId: number,
  ): Promise<Notification> {
    return this.notificationsService.findById(user.store_id, notificationId);
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
    @Param('id') notificationId: number,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(user.store_id, notificationId);
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
    @Body('notificationIds') notificationIds: number[],
  ): Promise<{ message: string }> {
    await this.notificationsService.markMultipleAsRead(
      user.store_id,
      notificationIds,
    );
    return { message: 'Notifications marked as read' };
  }

  @Patch(':id/archive')
  async archiveNotification(
    @CurrentUser() user: any,

    @Param('id') notificationId: number,
  ): Promise<Notification> {
    return this.notificationsService.archive(user.store_id, notificationId);
  }

  @Patch(':id')
  async updateNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    return this.notificationsService.update(
      user.store_id,
      notificationId,
      updateNotificationDto,
    );
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: number,
  ): Promise<{ message: string }> {
    await this.notificationsService.delete(user.store_id, notificationId);
    return { message: 'Notification deleted successfully' };
  }
}
