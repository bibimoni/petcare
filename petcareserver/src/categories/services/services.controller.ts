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
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from '../dto/create-service.dto';
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
import { UpdateServiceDto } from '../dto/update-service.dto';

@ApiTags('Services Management')
@Controller({ path: '/services', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

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
    return this.servicesService.create(user.store_id, createServiceDto);
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
      throw new BadRequestException('Invalid category ID');
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
    description: 'Invalid service ID',
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
      throw new BadRequestException('Invalid service ID');
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
      throw new BadRequestException('Invalid service ID');
    }
    return this.servicesService.updateService(
      user.store_id,
      serviceIdNum,
      updateServiceDto,
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
    description: 'Invalid service ID',
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
      throw new BadRequestException('Invalid service ID');
    }
    return this.servicesService.deleteService(user.store_id, serviceIdNum);
  }
}
