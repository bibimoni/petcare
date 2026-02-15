import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CurrentUser, JwtAuthGuard, RequirePermissions, PermissionsGuard } from '../common';
import { STORE_PERMISSIONS } from '../common/permissions';

@ApiTags('Roles Management')
@Controller({ path: 'stores/:storeId/roles', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PermissionsGuard)
  @RequirePermissions(STORE_PERMISSIONS.ROLE_CREATE)
  @ApiOperation({
    summary: 'Create a new role with permissions',
    description: 'Creates a new custom role for the store with specified permissions',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or not store member',
  })
  @ApiResponse({
    status: 409,
    description: 'Role name already exists in this store',
  })
  @ApiBody({ type: CreateRoleDto })
  async createRole(
    @Param('storeId') storeId: string,
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.createRole(parseInt(storeId), createRoleDto, user.user_id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all roles for a store',
    description: 'Retrieves all roles belonging to a store with their assigned permissions',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not a member of this store',
  })
  async getRoles(
    @Param('storeId') storeId: string,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.getRoles(parseInt(storeId), user.user_id);
  }

  @Get('permissions')
  @ApiOperation({
    summary: 'Get available permissions',
    description: 'Retrieves all available store-level permissions that can be assigned to roles',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not a member of this store',
  })
  async getAvailablePermissions(
    @Param('storeId') storeId: string,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.getAvailablePermissions(parseInt(storeId), user.user_id);
  }

  @Get(':roleId')
  @ApiOperation({
    summary: 'Get a specific role with its permissions',
    description: 'Retrieves detailed information about a specific role and its assigned permissions',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to view this role',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async getRole(
    @Param('storeId') storeId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.getRole(parseInt(roleId), user.user_id);
  }

  @Patch(':roleId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(STORE_PERMISSIONS.ROLE_EDIT)
  @ApiOperation({
    summary: 'Update a role',
    description: 'Updates role name, description, or permissions. Can remove all permissions (0 permissions allowed)',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot edit system roles or insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  @ApiBody({ type: UpdateRoleDto })
  async updateRole(
    @Param('storeId') storeId: string,
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.updateRole(parseInt(roleId), updateRoleDto, user.user_id);
  }

  @Delete(':roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(PermissionsGuard)
  @RequirePermissions(STORE_PERMISSIONS.ROLE_DELETE)
  @ApiOperation({
    summary: 'Delete a role',
    description: 'Deletes a role from the store. Cannot delete admin role or system roles',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
  })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    example: 2,
  })
  @ApiResponse({
    status: 204,
    description: 'Role deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot delete admin/system roles or insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Role is assigned to users',
  })
  async deleteRole(
    @Param('storeId') storeId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.deleteRole(parseInt(roleId), user.user_id);
  }
}