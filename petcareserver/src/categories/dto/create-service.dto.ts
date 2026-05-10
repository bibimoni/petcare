import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the service category',
  })
  @IsNotEmpty({ message: 'Danh mục là bắt buộc' })
  @IsNumber()
  category_id: number;

  @ApiProperty({
    example: 'Wash & Groom Combo',
    description: 'Name of the service combo',
  })
  @IsNotEmpty({ message: 'Tên combo là bắt buộc' })
  @IsString()
  combo_name: string;

  @ApiProperty({
    example: 50000,
    description: 'Price of the service (VND)',
  })
  @Min(1000, { message: 'Giá dịch vụ phải tối thiểu 1000 VND' })
  @IsNumber()
  price: number;

  @ApiProperty({
    example: 2,
    description: 'Minimum weight (kg)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  min_weight?: number;

  @ApiProperty({
    example: 10,
    description: 'Maximum weight (kg)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  max_weight?: number;

  @ApiProperty({
    example:
      'A comprehensive grooming service including bath, haircut, and nail trimming.',
    description: 'Description of the service',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
