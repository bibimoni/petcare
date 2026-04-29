import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CreatePaymentIntentDto {
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
  // @Matches(/^pi_/)
  @IsString()
  payment_intent_id: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  order_id: number;
}

export class PaymentIntentResponseDto {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}
