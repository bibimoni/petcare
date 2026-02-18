import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  PermissionsGuard,
  RequirePermissions,
  RolesGuard,
} from 'src/common';
import { Customer } from './entities/customer.entity';
import { STORE_PERMISSIONS } from 'src/common/permissions/store.permissions';
import { User } from 'src/users/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Customers Management')
@Controller({ path: '/customers', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(STORE_PERMISSIONS.CUSTOMER_CREATE)
  @ApiOperation({
    summary: 'Create a new customer',
    description: 'Creates a new customer for the specified store',
  })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: Customer,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Customer already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'Deny permission to create customer',
  })
  @ApiBody({ type: CreateCustomerDto })
  async createCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser() user: any,
  ) {
    return this.customersService.createCustomer(
      user.store_id,
      createCustomerDto,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.CUSTOMER_VIEW)
  @ApiOperation({
    summary: 'Get all customers in a store',
    description:
      'Retrieves a paginated list of customers for the specified store',
  })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Deny permission to view customers',
  })
  findAll(@CurrentUser() user: any) {
    return this.customersService.findAllByStore(user.store_id);
  }

  @Get('/phone/:phone')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.CUSTOMER_VIEW)
  @ApiOperation({
    summary: 'Get customer details',
    description: 'Retrieves detailed information about a specific customer',
  })
  @ApiParam({ name: 'phone', type: String })
  @ApiResponse({
    status: 200,
    description: 'Customer details retrieved successfully',
  })
  findByPhone(@Param('phone') phone: string, @CurrentUser() user: any) {
    if (!phone) {
      throw new BadRequestException('Phone is required');
    }
    return this.customersService.findByPhone(user.store_id, phone);
  }

  @Patch(':customerId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.CUSTOMER_EDIT)
  @ApiOperation({
    summary: 'Update customer details',
    description:
      'Updates information of a specific customer (only accessible to store members with proper permissions)',
  })
  @ApiParam({ name: 'customerId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found or deny permission to edit',
  })
  @ApiBody({ type: UpdateCustomerDto })
  update(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: any,
  ) {
    return this.customersService.update(customerId, dto, user.store_id);
  }

  @Delete('/:customerId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.CUSTOMER_DELETE)
  @ApiOperation({
    summary: 'Delete a customer',
    description:
      'Deletes a specific customer from the store (only accessible to store members with proper permissions)',
  })
  @ApiParam({ name: 'customerId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Customer deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found or deny permission to delete',
  })
  deleteCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @CurrentUser() user: any,
  ) {
    return this.customersService.deleteCustomer(customerId, user.store_id);
  }

  @Post('pets/:petId/avatar')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(STORE_PERMISSIONS.PET_EDIT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload pet image',
    description:
      'Uploads an image for a pet and updates the pet record with the image URL',
  })
  @ApiResponse({
    status: 201,
    description: 'Pet image uploaded and pet record updated successfully',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPetImage(
    @Param('petId', ParseIntPipe) petId: number,
    @CurrentUser() currentUser: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.customersService.uploadPetAvatar(
      petId,
      currentUser.user_id,
      file,
    );
  }
}
