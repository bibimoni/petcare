import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../../common/enum';

export class CreateStaffDto {
  @ApiProperty({ example: 'staff@petcare.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, default: UserRole.STAFF })
  @IsEnum(UserRole)
  role: UserRole;
}
