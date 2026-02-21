import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUrl, MinLength, MaxLength } from 'class-validator';
import { StoreStatus } from '../../common/enum';

export class UpdateStoreDto {
  @ApiProperty({
    example: 'Pet Paradise Veterinary Clinic Updated',
    description: 'Updated store name',
    required: false,
  })
  @IsString({ message: 'Store name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Store name must be at least 2 characters long' })
  @MaxLength(200, { message: 'Store name must not exceed 200 characters' })
  name?: string;

  @ApiProperty({
    enum: StoreStatus,
    example: StoreStatus.ACTIVE,
    description: 'Store status',
    required: false,
  })
  @IsEnum(StoreStatus, { message: 'Invalid store status' })
  @IsOptional()
  status?: StoreStatus;

  @ApiProperty({
    example: '+1-555-0100',
    description: 'Updated store phone number',
    required: false,
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: '456 Updated Address, City',
    description: 'Updated store street address',
    required: false,
  })
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'Los Angeles',
    description: 'Updated store city',
    required: false,
  })
  @IsString({ message: 'City must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'City must not exceed 100 characters' })
  city?: string;

  @ApiProperty({
    example: 'California',
    description: 'Updated store state/province',
    required: false,
  })
  @IsString({ message: 'State must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'State must not exceed 100 characters' })
  state?: string;

  @ApiProperty({
    example: 'United States',
    description: 'Updated store country',
    required: false,
  })
  @IsString({ message: 'Country must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Country must not exceed 100 characters' })
  country?: string;

  @ApiProperty({
    example: '90210',
    description: 'Updated store postal/ZIP code',
    required: false,
  })
  @IsString({ message: 'Postal code must be a string' })
  @IsOptional()
  @MaxLength(20, { message: 'Postal code must not exceed 20 characters' })
  postal_code?: string;

  @ApiProperty({
    example: 'https://example.com/updated-store-logo.png',
    description: 'Updated store logo URL',
    required: false,
  })
  @IsUrl({}, { message: 'Logo URL must be a valid URL' })
  @IsOptional()
  logo_url?: string;
}