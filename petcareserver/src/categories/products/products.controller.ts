import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  BadRequestException,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  PermissionsGuard,
  RequirePermissions,
  isSuperAdmin,
} from 'src/common';
import { STORE_PERMISSIONS } from 'src/common/permissions';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductStatus } from '../entities/product.entity';

@ApiTags('Products Management')
@Controller({ path: '/products', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PRODUCT_VIEW)
  @ApiOperation({ summary: 'Get all products with optional filters' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category_id', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus })
  @ApiQuery({ name: 'low_stock', required: false, type: Boolean })
  async getAllProducts(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('category_id') category_id?: string,
    @Query('status') status?: ProductStatus,
    @Query('low_stock') low_stock?: string,
  ) {
    const admin = isSuperAdmin(user);
    const storeId = admin ? null : user.store_id;
    const categoryIdNum = category_id ? parseInt(category_id, 10) : undefined;
    return this.productsService.findAll(storeId, admin, {
      search,
      category_id:
        categoryIdNum && !isNaN(categoryIdNum) ? categoryIdNum : undefined,
      status,
      low_stock: low_stock === 'true',
    });
  }

  @Get('/alerts')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.INVENTORY_VIEW)
  @ApiOperation({
    summary: 'Get low stock and expiring products',
    description:
      'Retrieves a list of products that are low in stock or nearing their expiry date',
  })
  @ApiResponse({
    status: 200,
    description: 'Low stock and expiring products retrieved successfully',
  })
  async getLowStockOrExpiringProducts(
    @CurrentUser() user: any,
    @Query('minStock') minStock: number = 3,
    @Query('daysToExpiry') daysToExpiry: number = 30,
  ) {
    return this.productsService.getLowStockOrExpiringProducts(
      user.store_id,
      minStock,
      daysToExpiry,
    );
  }

  @Get('/count-all-products')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.INVENTORY_VIEW)
  @ApiOperation({
    summary: 'Numbers of products',
    description: 'Get counts of all products',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully',
  })
  async getNumofProducts(@CurrentUser() user: any) {
    return this.productsService.countProducts(user.store_id);
  }

  @Get('/total/sum')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.INVENTORY_VIEW)
  @ApiOperation({
    summary: 'Get total inventory value',
    description:
      'Calculates the total value of all products in the inventory based on stock quantity and cost price',
  })
  @ApiResponse({
    status: 200,
    description: 'Total inventory value retrieved successfully',
  })
  async getInventoryValue(@CurrentUser() user: any) {
    return {
      value: await this.productsService.getInventoryValue(user.store_id),
    };
  }

  @Get('/sum/:categoryId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.INVENTORY_VIEW)
  @ApiOperation({
    summary: 'Get total inventory value by category',
    description:
      'Calculates the total inventory value for each product category in the store',
  })
  @ApiResponse({
    status: 200,
    description: 'Total inventory value by category retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'ID danh mục không hợp lệ',
  })
  async geteachProductSum(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: any,
  ) {
    const categoryIdNum = parseInt(categoryId, 10);
    if (isNaN(categoryIdNum)) {
      throw new BadRequestException('ID danh mục không hợp lệ');
    }
    return this.productsService.geteachProductSum(user.store_id, categoryIdNum);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(STORE_PERMISSIONS.PRODUCT_CREATE)
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Creates a new product for the specified store',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiBody({ type: CreateProductDto })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any,
    @Query('expiryWarningDays') expiryWarningDays: number = 7,
  ) {
    return this.productsService.createProduct(
      user.store_id,
      createProductDto,
      expiryWarningDays,
      user.user_id,
      user.full_name,
    );
  }

  @Get('/category/:categoryId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PRODUCT_VIEW)
  @ApiOperation({
    summary: 'Get products by category',
    description:
      'Retrieves a list of products belonging to a specific category',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'ID danh mục không hợp lệ',
  })
  async getProductsByCategory(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: any,
  ) {
    const categoryIdNum = parseInt(categoryId, 10);
    if (isNaN(categoryIdNum)) {
      throw new BadRequestException('ID danh mục không hợp lệ');
    }
    return this.productsService.getProductsByCategory(
      user.store_id,
      categoryIdNum,
    );
  }

  @Get('/detail/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get product details',
    description: 'Retrieves detailed information about a specific product',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'ID sản phẩm không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async findByProduct(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
  ) {
    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }
    if (user.permissions.includes(STORE_PERMISSIONS.PRODUCT_MANAGE)) {
      return this.productsService.findByProduct(user.store_id, productIdNum);
    }
    return this.productsService.findProductByStaff(user.store_id, productIdNum);
  }

  @Patch('/:productId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PRODUCT_EDIT)
  @ApiOperation({
    summary: 'Update product details',
    description: 'Updates the details of a specific product',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiBody({ type: UpdateProductDto })
  async updateProduct(
    @Param('productId') productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
    @Query('expiryWarningDays') expiryWarningDays: number = 7,
  ) {
    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }
    return this.productsService.updateProduct(
      user.store_id,
      productIdNum,
      updateProductDto,
      expiryWarningDays,
      user.user_id,
      user.full_name,
    );
  }

  @Delete('/:productId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PRODUCT_DELETE)
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Deletes a specific product from the store',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async deleteProduct(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
  ) {
    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }
    return this.productsService.deleteProduct(
      user.store_id,
      productIdNum,
      user.user_id,
      user.full_name,
    );
  }

  @Get('/:productId/history')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PRODUCT_VIEW)
  @ApiOperation({
    summary: 'Get product audit history',
    description:
      'Retrieves the change history for a specific product (create, update, delete events)',
  })
  @ApiParam({ name: 'productId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Product history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getHistory(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() user: any,
  ) {
    return this.productsService.getHistory(user.store_id, productId);
  }
}
