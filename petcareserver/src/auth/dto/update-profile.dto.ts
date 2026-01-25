import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiProperty({ example: '0123456789', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
