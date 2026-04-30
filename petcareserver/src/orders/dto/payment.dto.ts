import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsString, Matches } from 'class-validator';

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

  // @Type(() => Number)
  // @IsNumber()
  // @IsPositive()
  // amount: number;
}

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'ID of the payment intent to confirm',
    example: 'pi_1234567890abcdef',
  })
  @Matches(/^pi_/)
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

export class PaymentIntentResponseDto {
  @ApiProperty({
    description: 'The client secret for the payment intent',
    example: 'pi_1234567890abcdef_secret_1234567890abcdef',
  })
  client_secret: string;

  @ApiProperty({
    description: 'The ID of the payment intent',
    example: 'pi_1234567890abcdef',
  })
  payment_intent_id: string;

  @ApiProperty({
    description: 'The amount of the payment',
    example: 1000,
  })
  amount: number;

  @ApiProperty({
    description: 'The currency of the payment',
    example: 'usd',
  })
  currency: string;
}
