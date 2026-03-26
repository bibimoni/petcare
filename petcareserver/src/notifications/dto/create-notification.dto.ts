import { IsEnum, IsString, IsNumber, IsOptional } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the store associated with the notification',
  })
  @IsNumber()
  store_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the product associated with the notification',
  })
  @IsOptional()
  @IsNumber()
  product_id: number;

  @ApiProperty({
    example: NotificationType.LOW_STOCK,
    description: 'Type of the notification',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    example: 'Low Stock Alert',
    description: 'Title of the notification',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'The stock level for Product A is running low.',
    description: 'Message of the notification',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 'Product A',
    description: 'Name of the product associated with the notification',
  })
  @IsString()
  product_name: string;

  @ApiProperty({
    example: 'https://example.com/product/1',
    description: 'Optional URL for more details about the notification',
  })
  @IsString()
  @IsOptional()
  action_url?: string;
}
