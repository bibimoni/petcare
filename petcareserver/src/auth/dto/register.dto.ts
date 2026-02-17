import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ 
    example: 'john.doe@example.com', 
    description: 'User email address' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ 
    example: 'securePassword123', 
    description: 'User password (min 8 characters)', 
    minLength: 8 
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;

  @ApiProperty({ 
    example: 'John Doe', 
    description: 'User full name' 
  })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  full_name: string;

  @ApiProperty({ 
    example: '+1-555-1234', 
    description: 'User phone number', 
    required: false 
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    example: '123 Main Street, City, State', 
    description: 'User address', 
    required: false 
  })
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;
}
