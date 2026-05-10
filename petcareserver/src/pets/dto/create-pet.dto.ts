import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { PetGender, PetStatus } from '../entities/pet.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePetDto {
  @ApiProperty({
    example: 'Buddy',
    description: 'Name of the pet',
  })
  @IsNotEmpty({ message: 'Tên thú cưng là bắt buộc' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'MALE',
    description: 'Gender of the pet',
    enum: PetGender,
  })
  @IsEnum(PetGender)
  gender: PetGender;

  @ApiPropertyOptional({
    example: 'Golden Retriever',
  })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiPropertyOptional({
    example: '2018-05-20',
  })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({
    example: 'Health concerns, dietary changes, etc.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'ALIVE',
    description: 'Status of the pet',
    enum: PetStatus,
  })
  @IsEnum(PetStatus)
  status: PetStatus;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({
    example: 'avatar_public_id_12345',
  })
  @IsOptional()
  @IsString()
  avatar_public_id?: string;
}
