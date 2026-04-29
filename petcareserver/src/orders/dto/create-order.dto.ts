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
import { ItemType } from '../entities/order-detail.entity';

export class CreateOrderItemDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  item_id: number;

  @IsEnum(ItemType)
  item_type: ItemType;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pet_id?: number;
}

export class CreateOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  customer_id?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  note?: string;
}
