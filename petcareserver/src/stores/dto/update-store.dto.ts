import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import { StoreStatus } from '../../common/enum';
import { IsCronExpression } from '../../common/validators/cron-expression.validator';

export class UpdateStoreDto {
  @ApiProperty({
    example: 'Pet Paradise Veterinary Clinic Updated',
    description: 'Updated store name',
    required: false,
  })
  @IsString({ message: 'Tên cửa hàng phải là chuỗi' })
  @IsOptional()
  @MinLength(2, { message: 'Tên cửa hàng phải có ít nhất 2 ký tự' })
  @MaxLength(200, { message: 'Tên cửa hàng không được vượt quá 200 ký tự' })
  name?: string;

  @ApiProperty({
    enum: StoreStatus,
    example: StoreStatus.ACTIVE,
    description: 'Store status',
    required: false,
  })
  @IsEnum(StoreStatus, { message: 'Trạng thái cửa hàng không hợp lệ' })
  @IsOptional()
  status?: StoreStatus;

  @ApiProperty({
    example: '+1-555-0100',
    description: 'Updated store phone number',
    required: false,
  })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: '456 Updated Address, City',
    description: 'Updated store street address',
    required: false,
  })
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'Los Angeles',
    description: 'Updated store city',
    required: false,
  })
  @IsString({ message: 'Thành phố phải là chuỗi' })
  @IsOptional()
  @MaxLength(100, { message: 'Thành phố không được vượt quá 100 ký tự' })
  city?: string;

  @ApiProperty({
    example: 'California',
    description: 'Updated store state/province',
    required: false,
  })
  @IsString({ message: 'Tỉnh/Thành phố phải là chuỗi' })
  @IsOptional()
  @MaxLength(100, { message: 'Tỉnh/Thành phố không được vượt quá 100 ký tự' })
  state?: string;

  @ApiProperty({
    example: 'United States',
    description: 'Updated store country',
    required: false,
  })
  @IsString({ message: 'Quốc gia phải là chuỗi' })
  @IsOptional()
  @MaxLength(100, { message: 'Quốc gia không được vượt quá 100 ký tự' })
  country?: string;

  @ApiProperty({
    example: '90210',
    description: 'Updated store postal/ZIP code',
    required: false,
  })
  @IsString({ message: 'Mã bưu điện phải là chuỗi' })
  @IsOptional()
  @MaxLength(20, { message: 'Mã bưu điện không được vượt quá 20 ký tự' })
  postal_code?: string;

  @ApiProperty({
    example: 'https://example.com/updated-store-logo.png',
    description: 'Updated store logo URL',
    required: false,
  })
  @IsUrl({}, { message: 'URL logo phải hợp lệ' })
  @IsOptional()
  logo_url?: string;

  @ApiProperty({
    example: '0 0 8 * * *',
    description:
      'Cron expression for notification schedule (e.g., "0 0 8 * * *" for 8am daily). If null, uses default system schedule',
    required: false,
  })
  @IsString({ message: 'Cron thông báo phải là chuỗi' })
  @IsCronExpression({ message: 'Định dạng cron không hợp lệ' })
  @IsOptional()
  notification_cron?: string | null;
}
