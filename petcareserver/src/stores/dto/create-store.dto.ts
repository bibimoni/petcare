import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import { IsCronExpression } from '../../common/validators/cron-expression.validator';

export class CreateStoreDto {
  @ApiProperty({
    example: 'Pet Paradise Veterinary Clinic',
    description: 'Store name',
  })
  @IsString({ message: 'Tên cửa hàng phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên cửa hàng là bắt buộc' })
  @MinLength(2, { message: 'Tên cửa hàng phải có ít nhất 2 ký tự' })
  @MaxLength(200, { message: 'Tên cửa hàng không được vượt quá 200 ký tự' })
  name: string;

  @ApiProperty({
    example: '+1-555-0100',
    description: 'Store phone number',
    required: false,
  })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: '123 Happy Pets Boulevard',
    description: 'Store street address',
    required: false,
  })
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'Los Angeles',
    description: 'Store city',
    required: false,
  })
  @IsString({ message: 'Thành phố phải là chuỗi' })
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 'California',
    description: 'Store state/province',
    required: false,
  })
  @IsString({ message: 'Tỉnh/Thành phố phải là chuỗi' })
  @IsOptional()
  state?: string;

  @ApiProperty({
    example: 'United States',
    description: 'Store country',
    required: false,
  })
  @IsString({ message: 'Quốc gia phải là chuỗi' })
  @IsOptional()
  country?: string;

  @ApiProperty({
    example: '90001',
    description: 'Store postal/ZIP code',
    required: false,
  })
  @IsString({ message: 'Mã bưu điện phải là chuỗi' })
  @IsOptional()
  postal_code?: string;

  @ApiProperty({
    example: 'https://example.com/store-logo.png',
    description: 'Store logo URL',
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
