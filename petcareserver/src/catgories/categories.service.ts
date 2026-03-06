import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryType } from '../common/enum';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(storeId: number, createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      store_id: storeId,
    });
    return this.categoryRepository.save(category);
  }

  async filterByType(storeId: number, type: CategoryType): Promise<Category[]> {
    return this.categoryRepository.find({ where: { store_id: storeId, type } });
  }

  async updateCategory(
    storeId: number,
    categoryId: number,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoryRepository.findOne({
      where: { category_id: categoryId, store_id: storeId },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async deleteCategory(storeId: number, categoryId: number) {
    const category = await this.categoryRepository.findOne({
      where: { category_id: categoryId, store_id: storeId },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
    await this.categoryRepository.delete({
      category_id: category.category_id,
      store_id: category.store_id,
    });
  }
}
