import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';
import { Currency } from '../../common/enum';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description:
      'ID of the order for which the payment intent is being created',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  order_id: number;

  @ApiProperty({
    enum: Currency,
    required: false,
    example: Currency.USD,
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;
}

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'ID of the payment intent to confirm',
    example: 'pi_1234567890abcdef',
  })
  @Matches(/^pi_[0-9A-Za-z_]+$/)
  @IsString()
  payment_intent_id: string;

  @ApiProperty({
    description: 'ID of the order associated with the payment intent',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  order_id: number;
}
