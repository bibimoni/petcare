import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateInvitationNotificationDto {
  @ApiProperty({ example: 1, description: 'Store ID' })
  @IsNumber()
  storeId: number;

  @ApiProperty({ example: 2, description: 'User ID to receive the notification' })
  @IsNumber()
  userId: number;

  @ApiProperty({ example: 'Pet Store', description: 'Store name' })
  @IsString()
  storeName: string;

  @ApiProperty({ example: 'STAFF', description: 'Role name' })
  @IsString()
  roleName: string;

  @ApiProperty({
    example: 'abc123token',
    description: 'Invitation token (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  invitationToken?: string;
}