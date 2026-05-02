import { IsOptional, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ProfitGranularity {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class ProfitQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({
    enum: ProfitGranularity,
    default: ProfitGranularity.DAY,
  })
  @IsOptional()
  @IsEnum(ProfitGranularity)
  granularity?: ProfitGranularity = ProfitGranularity.DAY;
}

export class OrderStatsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}

export class ActivitiesQueryDto {
  @ApiPropertyOptional({
    description: 'Number of activities to return',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
