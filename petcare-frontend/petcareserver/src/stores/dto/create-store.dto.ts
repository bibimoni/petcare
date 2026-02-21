import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl, MinLength, MaxLength } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ 
    example: 'Pet Paradise Veterinary Clinic', 
    description: 'Store name' 
  })
  @IsString({ message: 'Store name must be a string' })
  @IsNotEmpty({ message: 'Store name is required' })
  @MinLength(2, { message: 'Store name must be at least 2 characters long' })
  @MaxLength(200, { message: 'Store name must not exceed 200 characters' })
  name: string;

  @ApiProperty({ 
    example: '+1-555-0100', 
    description: 'Store phone number', 
    required: false 
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    example: '123 Happy Pets Boulevard', 
    description: 'Store street address', 
    required: false 
  })
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;

  @ApiProperty({ 
    example: 'Los Angeles', 
    description: 'Store city', 
    required: false 
  })
  @IsString({ message: 'City must be a string' })
  @IsOptional()
  city?: string;

  @ApiProperty({ 
    example: 'California', 
    description: 'Store state/province', 
    required: false 
  })
  @IsString({ message: 'State must be a string' })
  @IsOptional()
  state?: string;

  @ApiProperty({ 
    example: 'United States', 
    description: 'Store country', 
    required: false 
  })
  @IsString({ message: 'Country must be a string' })
  @IsOptional()
  country?: string;

  @ApiProperty({ 
    example: '90001', 
    description: 'Store postal/ZIP code', 
    required: false 
  })
  @IsString({ message: 'Postal code must be a string' })
  @IsOptional()
  postal_code?: string;

  @ApiProperty({ 
    example: 'https://example.com/store-logo.png', 
    description: 'Store logo URL', 
    required: false 
  })
  @IsUrl({}, { message: 'Logo URL must be a valid URL' })
  @IsOptional()
  logo_url?: string;
}