import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePetWeightHistoryDto {
  @ApiProperty({
    example: 12.5,
    description: 'Pet weight in kilograms',
  })
  @IsNotEmpty({ message: 'Weight is required' })
  @IsNumber()
  weight: number;

  @ApiPropertyOptional({
    example: 'Health concerns, dietary changes, etc.',
    description: 'Health notes or reasons for weight change (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
