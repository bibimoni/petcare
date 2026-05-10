import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'Senior Cashier',
    description: 'Updated name of the role',
    required: false,
  })
  @IsString({ message: 'Tên vai trò phải là chuỗi' })
  @IsOptional()
  @MinLength(2, { message: 'Tên vai trò phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Tên vai trò không được vượt quá 50 ký tự' })
  name?: string;

  @ApiProperty({
    example:
      'Senior staff member who can process sales, manage inventory, and handle returns',
    description: 'Updated description of the role permissions',
    required: false,
  })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @IsOptional()
  @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
  description?: string;

  @ApiProperty({
    example: [1, 2, 5, 8],
    description:
      'Array of permission IDs to assign to this role (empty array means no permissions)',
    type: [Number],
    required: false,
  })
  @IsArray({ message: 'Quyền phải là một mảng' })
  @IsNumber({}, { each: true, message: 'Mỗi quyền phải là số' })
  @IsOptional()
  permission_ids?: number[];
}
