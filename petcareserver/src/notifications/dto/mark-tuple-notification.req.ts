import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';

export class MarkMultipleAsReadDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  notificationIds: number[];
}
