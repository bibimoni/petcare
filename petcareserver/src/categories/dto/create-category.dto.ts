import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { CategoryType } from 'src/common/enum';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Grooming',
    description: 'Name of the service category',
  })
  @IsNotEmpty({ message: 'Category name is required' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'PRODUCT',
    description: 'Type of category',
    enum: CategoryType,
  })
  @IsNotEmpty({ message: 'Category type is required' })
  @IsEnum(CategoryType)
  type: CategoryType;
}
