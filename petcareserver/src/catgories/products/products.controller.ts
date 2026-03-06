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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, PermissionsGuard, RequirePermissions } from 'src/common';
import { STORE_PERMISSIONS } from 'src/common/permissions';
import { UpdateProductDto } from '../dto/update-product.dto';

@ApiTags('Products Management')
@Controller({ path: '/products', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('/:productId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PRODUCT_VIEW)
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
    description: 'Invalid product ID',
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
      throw new BadRequestException('Invalid product ID');
    }
    return this.productsService.findByProduct(user.store_id, productIdNum);
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
  ) {
    return this.productsService.createProduct(user.store_id, createProductDto);
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
  ) {
    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) {
      throw new BadRequestException('Invalid product ID');
    }
    return this.productsService.updateProduct(
      user.store_id,
      productIdNum,
      updateProductDto,
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
      throw new BadRequestException('Invalid product ID');
    }
    return this.productsService.deleteProduct(user.store_id, productIdNum);
  }

  @Get('inventory-value')
  async getInventoryValue() {
    return { value: await this.productsService.getInventoryValue() };
  }

  @Get('alerts')
  async getLowStockOrExpiringProducts() {
    return this.productsService.getLowStockOrExpiringProducts();
  }

  @Get()
  async getProductsByRole(@Req() req) {
    // req.user.role phải được set từ JwtAuthGuard
    return this.productsService.getProductsByRole(req.user.role);
  }
}
