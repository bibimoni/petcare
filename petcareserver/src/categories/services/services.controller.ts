import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  Req,
  HttpStatus,
  Param,
  BadRequestException,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from '../dto/create-service.dto';
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
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServiceStatus } from '../entities/service.entity';

@ApiTags('Services Management')
@Controller({ path: '/services', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.SERVICE_VIEW)
  @ApiOperation({ summary: 'Get all services with optional filters' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category_id', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ServiceStatus })
  async getAllServices(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('category_id') category_id?: string,
    @Query('status') status?: ServiceStatus,
  ) {
    const admin = isSuperAdmin(user);
    const storeId = admin ? null : user.store_id;
    const categoryIdNum = category_id ? parseInt(category_id, 10) : undefined;
    return this.servicesService.findAll(storeId, admin, {
      search,
      category_id:
        categoryIdNum && !isNaN(categoryIdNum) ? categoryIdNum : undefined,
      status,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(STORE_PERMISSIONS.SERVICE_CREATE)
  @ApiOperation({
    summary: 'Create a new service',
    description: 'Creates a new service with the provided details',
  })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiBody({ type: CreateServiceDto })
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.servicesService.create(
      user.store_id,
      createServiceDto,
      user.user_id,
      user.full_name,
    );
  }

  @Get('/category/:categoryId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.SERVICE_VIEW)
  @ApiOperation({
    summary: 'Get all services',
    description: 'Retrieves a list of all services available in the store',
  })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
  })
  async getAll(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: any,
  ) {
    const categoryIdNum = parseInt(categoryId, 10);
    if (isNaN(categoryIdNum)) {
      throw new BadRequestException('ID danh mục không hợp lệ');
    }
    return this.servicesService.getAll(user.store_id, categoryIdNum);
  }

  @Get('/:serviceId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.SERVICE_VIEW)
  @ApiOperation({
    summary: 'Get service details',
    description: 'Retrieves detailed information about a specific service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service details retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'ID dịch vụ không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  async findByService(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: any,
  ) {
    const serviceIdNum = parseInt(serviceId, 10);
    if (isNaN(serviceIdNum)) {
      throw new BadRequestException('ID dịch vụ không hợp lệ');
    }
    return this.servicesService.findByService(user.store_id, serviceIdNum);
  }

  @Patch('/:serviceId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.SERVICE_EDIT)
  @ApiOperation({
    summary: 'Update service details',
    description: 'Updates the details of a specific service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  @ApiBody({ type: UpdateServiceDto })
  async updateService(
    @Param('serviceId') serviceId: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: any,
  ) {
    const serviceIdNum = parseInt(serviceId, 10);
    if (isNaN(serviceIdNum)) {
      throw new BadRequestException('ID dịch vụ không hợp lệ');
    }
    return this.servicesService.updateService(
      user.store_id,
      serviceIdNum,
      updateServiceDto,
      user.user_id,
      user.full_name,
    );
  }

  @Delete('/:serviceId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.SERVICE_DELETE)
  @ApiOperation({
    summary: 'Delete a service',
    description: 'Deletes a specific service from the store',
  })
  @ApiResponse({
    status: 200,
    description: 'Service deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'ID dịch vụ không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  async deleteService(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: any,
  ) {
    const serviceIdNum = parseInt(serviceId, 10);
    if (isNaN(serviceIdNum)) {
      throw new BadRequestException('ID dịch vụ không hợp lệ');
    }
    return this.servicesService.deleteService(
      user.store_id,
      serviceIdNum,
      user.user_id,
      user.full_name,
    );
  }

  @Get('/:serviceId/history')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.SERVICE_VIEW)
  @ApiOperation({
    summary: 'Get service audit history',
    description:
      'Retrieves the change history for a specific service (create, update, delete events)',
  })
  @ApiParam({ name: 'serviceId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Service history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  getHistory(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @CurrentUser() user: any,
  ) {
    return this.servicesService.getHistory(user.store_id, serviceId);
  }
}
