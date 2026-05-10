import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class InviteStaffDto {
  @ApiProperty({
    example: 'staff@pethaven.com',
    description: 'Email address of the staff member to invite',
  })
  @IsEmail({}, { message: 'Vui lòng nhập địa chỉ email hợp lệ' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email: string;

  @ApiProperty({
    example: 2,
    description:
      'Role ID to assign to the staff member (must be a valid role in the store)',
  })
  @IsNumber({}, { message: 'Vai trò phải là số' })
  @IsNotEmpty({ message: 'Vai trò là bắt buộc' })
  role_id: number;

  @ApiProperty({
    example: 'John Smith',
    description:
      'Full name of the staff member (optional, can be set by the user later)',
    required: false,
  })
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @IsOptional()
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
  full_name?: string;

  @ApiProperty({
    example: '+1-555-0300',
    description: 'Phone number of the staff member (optional)',
    required: false,
  })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Welcome to our team! Please complete your registration.',
    description: 'Custom invitation message (optional)',
    required: false,
  })
  @IsString({ message: 'Lời nhắn phải là chuỗi' })
  @IsOptional()
  message?: string;
}
