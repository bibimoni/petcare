import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsNumber, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Cashier',
    description: 'Name of the role',
  })
  @IsString({ message: 'Role name must be a string' })
  @IsNotEmpty({ message: 'Role name is required' })
  @MinLength(2, { message: 'Role name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Role name must not exceed 50 characters' })
  name: string;

  @ApiProperty({
    example: 'Staff member who can process sales and manage inventory',
    description: 'Description of the role permissions',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    example: [1, 2, 3, 5],
    description: 'Array of permission IDs to assign to this role',
    type: [Number],
  })
  @IsArray({ message: 'Permissions must be an array' })
  @IsNumber({}, { each: true, message: 'Each permission must be a number' })
  @IsNotEmpty({ message: 'At least one permission must be assigned' })
  permission_ids: number[];
}