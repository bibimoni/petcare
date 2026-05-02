import {
  IsNumber,
  IsPositive,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from 'src/common';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'ID of the item being ordered' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  item_id: number;

  @ApiProperty({
    description: 'Type of the item being ordered',
    enum: CategoryType,
  })
  @IsEnum(CategoryType)
  item_type: CategoryType;

  @ApiProperty({
    description: 'Quantity of the item being ordered',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'ID of the pet associated with the item',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pet_id?: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID of the customer placing the order',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  customer_id?: number;

  @ApiProperty({
    description: 'List of items being ordered',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({
    description: 'Additional notes for the order',
    example: 'Please deliver to the back door',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
