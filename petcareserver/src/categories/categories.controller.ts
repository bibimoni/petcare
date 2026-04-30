import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryType } from '../common/enum';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
} from 'src/common';
import { STORE_PERMISSIONS } from 'src/common/permissions';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories Management')
@Controller({ path: '/categories', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(STORE_PERMISSIONS.CATEGORY_CREATE)
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Creates a new category for a specific store',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiBody({ type: CreateCategoryDto })
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: any,
  ) {
    return this.categoriesService.create(user.store_id, createCategoryDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.CATEGORY_MANAGE)
  @ApiOperation({
    summary: 'Get categories by type',
    description: 'Retrieves categories for a specific store filtered by type',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid category type',
  })
  @ApiQuery({ name: 'categoryType', required: false, enum: CategoryType })
  async filterCategoriesByType(
    @Query('categoryType') type: CategoryType,
    @CurrentUser() user: any,
  ) {
    return this.categoriesService.filterByType(user.store_id, type);
  }

  @Patch('/:categoryId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.CATEGORY_EDIT)
  @ApiOperation({
    summary: 'Update a category',
    description: 'Updates the details of a specific category for a given store',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or category not found',
  })
  @ApiBody({ type: UpdateCategoryDto })
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: any,
  ) {
    const categoryIdNum = parseInt(categoryId, 10);
    if (isNaN(categoryIdNum)) {
      throw new BadRequestException('Invalid category ID');
    }
    return this.categoriesService.updateCategory(
      user.store_id,
      categoryIdNum,
      updateCategoryDto,
    );
  }

  @Delete('/:categoryId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.CATEGORY_DELETE)
  @ApiOperation({
    summary: 'Delete a category',
    description: 'Deletes a specific category for a given store',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid category ID',
  })
  async deleteCategory(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: any,
  ) {
    const categoryIdNum = parseInt(categoryId, 10);
    if (isNaN(categoryIdNum)) {
      throw new BadRequestException('Invalid category ID');
    }
    return this.categoriesService.deleteCategory(user.store_id, categoryIdNum);
  }
}
