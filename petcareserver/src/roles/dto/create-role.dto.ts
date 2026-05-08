import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Cashier',
    description: 'Name of the role',
  })
  @IsString({ message: 'Tên vai trò phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên vai trò là bắt buộc' })
  @MinLength(2, { message: 'Tên vai trò phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Tên vai trò không được vượt quá 50 ký tự' })
  name: string;

  @ApiProperty({
    example: 'Staff member who can process sales and manage inventory',
    description: 'Description of the role permissions',
    required: false,
  })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @IsOptional()
  @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
  description?: string;

  @ApiProperty({
    example: [1, 2, 3, 5],
    description: 'Array of permission IDs to assign to this role',
    type: [Number],
  })
  @IsArray({ message: 'Quyền phải là một mảng' })
  @IsNumber({}, { each: true, message: 'Mỗi quyền phải là số' })
  @IsNotEmpty({ message: 'Phải gán ít nhất một quyền' })
  permission_ids: number[];
}
