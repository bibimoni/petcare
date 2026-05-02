import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  isSuperAdmin,
} from '../common';
import { AcceptInvitationResponseDto } from './dto/accept-invitation-response.dto';
import { STORE_PERMISSIONS } from '../common/permissions';
import { UpdateNotificationScheduleDto } from './dto/update-notification-schedule.dto';

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
    description:
      'Creates a new store and assigns the current user as Store Admin with full store permissions',
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
    description:
      'Invites a new staff member to the store with a specific role. Staff will be created with LOCKED status.',
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
    const admin = isSuperAdmin(user);
    return this.storesService.inviteStaff(
      parseInt(storeId),
      inviteStaffDto,
      user.user_id,
      admin,
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
    description:
      'Updates store information (only accessible to store members with proper permissions)',
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
    const admin = isSuperAdmin(user);
    return this.storesService.updateStore(
      parseInt(storeId),
      updateData,
      user.user_id,
      admin,
    );
  }

  @Patch(':storeId/notification-schedule')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions(STORE_PERMISSIONS.STORE_SETTINGS_MANAGE)
  @ApiOperation({
    summary: 'Update notification schedule',
    description:
      'Updates the cron schedule for automatic notifications of a store. Pass null to reset to default (0 0 8 * * *)',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cron_expression: {
          type: 'string',
          nullable: true,
          example: '0 0 9 * * *',
          description:
            'Cron expression for notification schedule. Pass null to reset to default.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notification schedule updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Store not found',
  })
  async updateNotificationSchedule(
    @Param('storeId') storeId: string,
    @Body() body: UpdateNotificationScheduleDto,
    @CurrentUser() user: any,
  ) {
    const admin = isSuperAdmin(user);
    return this.storesService.updateNotificationSchedule(
      parseInt(storeId),
      body.cron_expression,
      user.user_id,
      admin,
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
    const admin = isSuperAdmin(user);
    return this.storesService.getStoreStaff(
      parseInt(storeId),
      user.user_id,
      admin,
    );
  }

  @Delete(':storeId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions(STORE_PERMISSIONS.STORE_SETTINGS_MANAGE)
  @ApiOperation({
    summary: 'Remove store (soft delete)',
    description:
      'Allows the last admin to remove a store. Sets store status to SUSPENDED and removes the admin. The admin must be the only remaining member.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Store removed successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not admin or store still has members',
  })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @ApiResponse({ status: 400, description: 'Invalid store ID' })
  async removeStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: any,
  ) {
    const admin = isSuperAdmin(user);
    return this.storesService.removeStore(storeId, user.user_id, admin);
  }

  @Delete(':storeId/staff/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Leave store (self-removal)',
    description:
      'Allows a staff member to leave a store by clearing their own store_id and role_id. No STAFF_DELETE permission required.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Left store successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Last admin cannot leave',
  })
  @ApiResponse({ status: 400, description: 'Invalid store ID' })
  async leaveStore(
    @Param('storeId', ParseIntPipe) storeId: number,
    @CurrentUser() user: any,
  ) {
    const admin = isSuperAdmin(user);
    return this.storesService.leaveStore(storeId, user.user_id, admin);
  }

  @Delete(':storeId/staff/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions(STORE_PERMISSIONS.STAFF_DELETE)
  @ApiOperation({
    summary: 'Remove staff member from store',
    description:
      'Removes a staff member from the store by clearing their store_id and role_id. Requires STAFF_DELETE permission.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID', example: 1 })
  @ApiParam({ name: 'userId', description: 'User ID to remove', example: 2 })
  @ApiResponse({ status: 200, description: 'Staff removed successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or self-removal',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid store ID or user ID' })
  async removeStaff(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: any,
  ) {
    const admin = isSuperAdmin(user);
    return this.storesService.removeStaff(storeId, userId, user.user_id, admin);
  }

  @Get('invitations/accept')
  @ApiOperation({
    summary: 'Accept invitation',
    description:
      'Accepts a store invitation using the invitation token. This endpoint can be used without authentication.',
  })
  @ApiQuery({
    name: 'token',
    description: 'Invitation token',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
    type: AcceptInvitationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid or expired invitation token',
  })
  @ApiResponse({
    status: 409,
    description:
      'Invitation already processed or user already belongs to a store',
  })
  async acceptInvitation(@Query('token') token: string) {
    return this.storesService.acceptInvitation(token);
  }
}
