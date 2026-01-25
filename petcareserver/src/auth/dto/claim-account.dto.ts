import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';

export class ClaimAccountDto {
  @ApiProperty({ example: 'staff@petcare.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiProperty({ example: '0123456789', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
