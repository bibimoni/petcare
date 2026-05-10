import { IsEnum, IsString, IsNumber, IsOptional } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    example: 1,
    description: 'ID của cửa hàng liên quan đến thông báo',
  })
  @IsNumber()
  store_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID của sản phẩm liên quan đến thông báo',
  })
  @IsOptional()
  @IsNumber()
  product_id?: number;

  @ApiProperty({
    example: NotificationType.LOW_STOCK,
    description: 'Loại thông báo',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    example: 'Cảnh báo tồn kho',
    description: 'Tiêu đề thông báo',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Mức tồn kho cho Sản phẩm A đang thấp.',
    description: 'Nội dung thông báo',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 'Sản phẩm A',
    description: 'Tên sản phẩm liên quan đến thông báo',
  })
  @IsString()
  @IsOptional()
  product_name?: string;

  @ApiProperty({
    example: 'https://example.com/product/1',
    description: 'Đường dẫn xem chi tiết thông báo',
  })
  @IsString()
  @IsOptional()
  action_url?: string;

  @ApiProperty({
    example: 1,
    description: 'ID của người dùng cho thông báo cá nhân',
  })
  @IsNumber()
  @IsOptional()
  user_id?: number;
}
