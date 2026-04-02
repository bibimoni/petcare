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
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(200, { message: 'Full name must not exceed 200 characters' })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  full_name: string;

  @ApiProperty({
    example: '+1-555-1234',
    description: 'Customer phone number (must be unique within the store)',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^[0-9+\-() ]+$/, {
    message: 'Phone number format is invalid',
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
