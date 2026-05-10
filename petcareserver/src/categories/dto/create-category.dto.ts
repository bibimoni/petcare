import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { CategoryType } from 'src/common/enum';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Grooming',
    description: 'Name of the service category',
  })
  @IsNotEmpty({ message: 'Tên danh mục là bắt buộc' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'PRODUCT',
    description: 'Type of category',
    enum: CategoryType,
  })
  @IsNotEmpty({ message: 'Loại danh mục là bắt buộc' })
  @IsEnum(CategoryType)
  type: CategoryType;
}
