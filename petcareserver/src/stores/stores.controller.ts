import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions } from '../common';
import { STORE_PERMISSIONS } from '../common/permissions';

@ApiTags('Stores Management')
@Controller({ path: 'stores', version: '1' })
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all stores',
    description: 'Retrieves all stores in the system (public endpoint)',
  })
  @ApiResponse({
    status: 200,
    description: 'Stores retrieved successfully',
  })
  async getAllStores() {
    return this.storesService.getAllStores();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new store',
    description: 'Creates a new store and assigns the current user as Store Admin with full store permissions',
  })
  @ApiResponse({
    status: 201,
    description: 'Store created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User already has a store',
  })
  @ApiResponse({
    status: 409,
    description: 'Store name already exists',
  })
  @ApiBody({ type: CreateStoreDto })
  async createStore(
    @Body() createStoreDto: CreateStoreDto,
    @CurrentUser() user: any,
  ) {
    return this.storesService.createStore(createStoreDto, user.user_id);
  }

  @Post(':storeId/invite')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions(STORE_PERMISSIONS.STAFF_INVITE)
  @ApiOperation({
    summary: 'Invite staff member to store',
    description: 'Invites a new staff member to the store with a specific role. Staff will be created with LOCKED status.',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Staff invited successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or not store member',
  })
  @ApiResponse({
    status: 404,
    description: 'Store or Role not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  @ApiBody({ type: InviteStaffDto })
  async inviteStaff(
    @Param('storeId') storeId: string,
    @Body() inviteStaffDto: InviteStaffDto,
    @CurrentUser() user: any,
  ) {
    return this.storesService.inviteStaff(
      parseInt(storeId),
      inviteStaffDto,
      user.user_id,
    );
  }

  @Get(':storeId')
  @ApiOperation({
    summary: 'Get store details',
    description: 'Retrieves detailed information about a specific store',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Store details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Store not found',
  })
  async getStore(@Param('storeId') storeId: string, @CurrentUser() user: any) {
    return this.storesService.getStore(parseInt(storeId));
  }

  @Patch(':storeId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions(STORE_PERMISSIONS.STORE_SETTINGS_MANAGE)
  @ApiOperation({
    summary: 'Update store details',
    description: 'Updates store information (only accessible to store members with proper permissions)',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Store updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Store not found',
  })
  @ApiBody({ type: UpdateStoreDto })
  async updateStore(
    @Param('storeId') storeId: string,
    @Body() updateData: UpdateStoreDto,
    @CurrentUser() user: any,
  ) {
    return this.storesService.updateStore(
      parseInt(storeId),
      updateData,
      user.user_id,
    );
  }

  @Get(':storeId/staff')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get store staff members',
    description: 'Retrieves all staff members of a store with their roles',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Staff members retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not a member of this store',
  })
  async getStoreStaff(
    @Param('storeId') storeId: string,
    @CurrentUser() user: any,
  ) {
    return this.storesService.getStoreStaff(parseInt(storeId), user.user_id);
  }
}
