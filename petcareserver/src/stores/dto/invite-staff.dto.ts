import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class InviteStaffDto {
  @ApiProperty({ 
    example: 'staff@pethaven.com', 
    description: 'Email address of the staff member to invite' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ 
    example: 2, 
    description: 'Role ID to assign to the staff member (must be a valid role in the store)' 
  })
  @IsNumber({}, { message: 'Role ID must be a number' })
  @IsNotEmpty({ message: 'Role ID is required' })
  role_id: number;

  @ApiProperty({ 
    example: 'John Smith', 
    description: 'Full name of the staff member (optional, can be set by the user later)', 
    required: false 
  })
  @IsString({ message: 'Full name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  full_name?: string;

  @ApiProperty({ 
    example: '+1-555-0300', 
    description: 'Phone number of the staff member (optional)', 
    required: false 
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    example: 'Welcome to our team! Please complete your registration.', 
    description: 'Custom invitation message (optional)', 
    required: false 
  })
  @IsString({ message: 'Message must be a string' })
  @IsOptional()
  message?: string;
}
