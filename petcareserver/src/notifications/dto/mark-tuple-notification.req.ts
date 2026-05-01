import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';

export class MarkMultipleAsReadDto {
  @ApiProperty({
    description: 'Array of notification IDs to mark as read',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  notificationIds: number[];
}
