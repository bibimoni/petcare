import { IsEnum, IsOptional } from 'class-validator';
import { NotificationStatus } from '../entities/notification.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationDto {
  @ApiProperty({
    example: 'READ',
    description: 'Updated status of the notification',
    enum: NotificationStatus,
  })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;
}
