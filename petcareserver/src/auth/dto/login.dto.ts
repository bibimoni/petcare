import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@petcare.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @MinLength(6)
  password: string;
}
