import { Controller, Get, Patch, UseGuards, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequireAnyPermission,
  isSuperAdmin,
} from '../common';
import { SYSTEM_PERMISSIONS } from 'src/common/permissions/system.permissions';
import { STORE_PERMISSIONS } from 'src/common/permissions/store.permissions';
import { InStoreFilter, UserStatus } from '../common/enum';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequireAnyPermission(SYSTEM_PERMISSIONS.MANAGE_USERS, STORE_PERMISSIONS.STAFF_VIEW)
  @ApiOperation({
    summary:
      'Get all users (superadmin sees all, store staff sees own store + unaffiliated)',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'store_id', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'role_id', required: false, type: Number })
  @ApiQuery({ name: 'in_store', required: false, enum: InStoreFilter })
  async getAllUsers(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('store_id') store_id?: string,
    @Query('status') status?: UserStatus,
    @Query('role_id') role_id?: string,
    @Query('in_store') in_store?: InStoreFilter,
  ) {
    const admin = isSuperAdmin(user);
    const storeId = admin ? null : user.store_id;
    const filterStoreId = store_id ? parseInt(store_id, 10) : undefined;
    const filterRoleId = role_id ? parseInt(role_id, 10) : undefined;
    return this.usersService.findAll(storeId, admin, {
      search,
      store_id:
        filterStoreId && !isNaN(filterStoreId) ? filterStoreId : undefined,
      status,
      role_id: filterRoleId && !isNaN(filterRoleId) ? filterRoleId : undefined,
      in_store,
    });
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user) {
    return this.usersService.getProfile(user.user_id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(
    @CurrentUser() user,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.user_id, updateProfileDto);
  }
}
