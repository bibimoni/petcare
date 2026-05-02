import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CreatePetWeightHistoryDto } from './dto/create-pet-weight-history.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  PermissionsGuard,
  RequirePermissions,
  isSuperAdmin,
} from 'src/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { STORE_PERMISSIONS } from 'src/common/permissions/store.permissions';
import { PetStatus } from './entities/pet.entity';

@ApiTags('Pets Management')
@Controller({ path: '/pets', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PET_VIEW)
  @ApiOperation({
    summary: 'Get all pets',
    description:
      'Retrieves all pets with optional filters. Superadmins see all stores.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PetStatus })
  @ApiQuery({ name: 'customer_id', required: false, type: Number })
  async findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: PetStatus,
    @Query('customer_id') customer_id?: string,
  ) {
    const admin = isSuperAdmin(user);
    const storeId = admin ? null : user.store_id;
    const customerIdNum = customer_id ? parseInt(customer_id, 10) : undefined;
    return this.petsService.findAll(storeId, admin, {
      search,
      status,
      customer_id:
        customerIdNum && !isNaN(customerIdNum) ? customerIdNum : undefined,
    });
  }

  @Get('/customer/:customerId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PET_VIEW)
  @ApiOperation({
    summary: 'Get pets for a customer',
    description: 'Retrieves all pets associated with a specific customer',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pets retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid customer ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async findByCustomer(
    @Param('customerId') customerId: string,
    @CurrentUser() user: any,
  ) {
    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    return this.petsService.findByCustomer(user.store_id, customerIdNum);
  }

  @Post('/customer/:customerId')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(STORE_PERMISSIONS.PET_CREATE)
  @ApiOperation({
    summary: 'Create a new pet',
    description: 'Creates a new pet for a specific customer',
  })
  @ApiResponse({
    status: 201,
    description: 'Pet created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or customer ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  @ApiBody({ type: CreatePetDto })
  async create(
    @Param('customerId') customerId: string,
    @CurrentUser() user: any,
    @Body() createPetDto: CreatePetDto,
  ) {
    const customerIdNum = parseInt(customerId, 10);

    if (isNaN(customerIdNum)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    console.log('user:', user);
    console.log('storeId:', user.store_id);
    return this.petsService.create(user.store_id, customerIdNum, createPetDto);
  }

  @Get('/:petId/weight')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PET_VIEW)
  @ApiOperation({
    summary: 'Get weight history for a pet',
    description:
      'Retrieves the weight history records for a specific pet, with an optional limit on the number of records returned',
  })
  @ApiResponse({
    status: 200,
    description: 'Weight history retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid store ID, pet ID, or query parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'Pet not found',
  })
  async getWeightHistory(
    @Param('petId') petId: string,
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    const petIdNum = parseInt(petId, 10);

    if (isNaN(petIdNum)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const limitNum = limit ? parseInt(limit, 10) : 100;
    if (isNaN(limitNum) || limitNum <= 0) {
      throw new BadRequestException('Giới hạn không hợp lệ');
    }
    return this.petsService.getWeightHistory(user.store_id, petIdNum, limitNum);
  }

  @Post('/:petId/weight')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(STORE_PERMISSIONS.PET_EDIT)
  @ApiOperation({
    summary: 'Add weight record for a pet',
    description: 'Adds a new weight record for a specific pet',
  })
  @ApiResponse({
    status: 201,
    description: 'Weight record added successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or pet ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Pet not found',
  })
  @ApiBody({ type: CreatePetWeightHistoryDto })
  async addWeightRecord(
    @Param('petId') petId: string,
    @CurrentUser() user: any,
    @Body() createWeightDto: CreatePetWeightHistoryDto,
  ) {
    const petIdNum = parseInt(petId, 10);

    if (isNaN(petIdNum)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    return this.petsService.addWeightRecord(
      user.store_id,
      petIdNum,
      createWeightDto,
    );
  }

  @Get('/:petId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PET_VIEW)
  @ApiOperation({
    summary: 'Get pet with weight history',
    description: 'Retrieves a specific pet with its weight history',
  })
  @ApiResponse({
    status: 200,
    description: 'Pet retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid pet ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Pet not found',
  })
  async findOneWithHistory(
    @Param('petId') petId: string,
    @CurrentUser() user: any,
  ) {
    const petIdNum = parseInt(petId, 10);

    if (isNaN(petIdNum)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    return this.petsService.findOneWithHistory(user.store_id, petIdNum);
  }

  @Patch('/:petId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PET_EDIT)
  @ApiOperation({
    summary: 'Update pet information',
    description: 'Updates the information of a specific pet',
  })
  @ApiResponse({
    status: 200,
    description: 'Pet updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or pet ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Pet not found',
  })
  @ApiBody({ type: UpdatePetDto })
  async update(
    @Param('petId') petId: string,
    @CurrentUser() user: any,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    const petIdNum = parseInt(petId, 10);
    if (isNaN(petIdNum)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    return this.petsService.update(user.store_id, petIdNum, updatePetDto);
  }

  @Delete('/:petId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(STORE_PERMISSIONS.PET_DELETE)
  @ApiOperation({
    summary: 'Delete a pet',
    description: 'Deletes a specific pet from the store',
  })
  @ApiResponse({
    status: 200,
    description: 'Pet deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Pet not found',
  })
  async remove(@Param('petId') petId: string, @CurrentUser() user: any) {
    const petIdNum = parseInt(petId, 10);

    if (isNaN(petIdNum)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    await this.petsService.remove(user.store_id, petIdNum);
    return { message: 'Xóa thú cưng thành công' };
  }
}
