import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Customer full name',
  })
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  @MaxLength(200, { message: 'Họ tên không được vượt quá 200 ký tự' })
  @IsNotEmpty({ message: 'Họ tên là bắt buộc' })
  @IsString()
  full_name: string;

  @ApiProperty({
    example: '+1-555-1234',
    description: 'Customer phone number (must be unique within the store)',
  })
  @IsNotEmpty({ message: 'Số điện thoại là bắt buộc' })
  @IsString()
  @Matches(/^[0-9+\-() ]+$/, {
    message: 'Số điện thoại không đúng định dạng',
  })
  phone: string;

  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Customer email address (optional)',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '123 Main St, Anytown, USA',
    description: 'Customer address (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'VIP customer',
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
