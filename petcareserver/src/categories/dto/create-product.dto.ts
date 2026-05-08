import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the category this product belongs to',
  })
  @IsNotEmpty({ message: 'Danh mục là bắt buộc' })
  @IsNumber()
  category_id: number;

  @ApiProperty({
    example: 'Dog Food - Chicken Flavor',
    description: 'Name of the product',
  })
  @IsNotEmpty({ message: 'Tên sản phẩm là bắt buộc' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 12000,
    description: 'Cost price of the product in VND',
  })
  @Min(1000, { message: 'Giá vốn phải tối thiểu 1000 VND' })
  @IsNumber()
  cost_price: number;

  @ApiProperty({
    example: 15000,
    description: 'Selling price of the product in VND',
  })
  @Min(1000, {
    message: 'Giá bán phải lớn hơn hoặc bằng giá vốn',
  })
  @IsNumber()
  sell_price: number;

  @ApiProperty({
    example: 100,
    description: 'Current stock quantity of the product',
  })
  @IsNumber()
  @Min(1)
  stock_quantity: number;

  @ApiProperty({
    example: 10,
    description: 'Minimum stock level to trigger restocking alerts',
    required: false,
  })
  @Min(1)
  @IsOptional()
  @IsNumber()
  min_stock_level?: number;

  @ApiProperty({
    example: '2023-12-31',
    description: 'Expiry date of the product (optional)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @ApiProperty({
    example:
      'High-quality dog food with chicken flavor, suitable for all breeds.',
    description: 'Detailed description of the product (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'https://example.com/product-image.jpg',
    description: 'URL of the product image (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  image_url?: string;
}
