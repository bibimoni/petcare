
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'Senior Cashier',
    description: 'Updated name of the role',
    required: false,
  })
  @IsString({ message: 'Role name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Role name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Role name must not exceed 50 characters' })
  name?: string;

  @ApiProperty({
    example: 'Senior staff member who can process sales, manage inventory, and handle returns',
    description: 'Updated description of the role permissions',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    example: [1, 2, 5, 8],
    description: 'Array of permission IDs to assign to this role (empty array means no permissions)',
    type: [Number],
    required: false,
  })
  @IsArray({ message: 'Permissions must be an array' })
  @IsNumber({}, { each: true, message: 'Each permission must be a number' })
  @IsOptional()
  permission_ids?: number[];
}
