import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { STORE_ROLES, PermissionScope } from '../common/enum';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new role with assigned permissions
   * @param storeId Store ID
   * @param createRoleDto Role creation data
   * @param currentUserId Current authenticated user ID
   * @returns Created role with permissions
   */
  async createRole(
    storeId: number,
    createRoleDto: CreateRoleDto,
    currentUserId: number,
  ) {
    // Verify that the current user belongs to this store
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== storeId) {
      throw new ForbiddenException('You do not have permission to create roles for this store');
    }

    // Check if role name already exists for this store
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name, store_id: storeId },
    });

    if (existingRole) {
      throw new ConflictException(`Role with name '${createRoleDto.name}' already exists in this store`);
    }

    // Verify that all permission IDs exist
    const permissions = await this.permissionRepository.findByIds(createRoleDto.permission_ids);
    if (permissions.length !== createRoleDto.permission_ids.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Create the role
    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
      store_id: storeId,
      is_editable: true,
      is_system_role: false,
    });

    const savedRole = await this.roleRepository.save(role);

    // Assign permissions to the role
    const rolePermissions = createRoleDto.permission_ids.map((permissionId) =>
      this.rolePermissionRepository.create({
        role_id: savedRole.id,
        permission_id: permissionId,
      }),
    );

    await this.rolePermissionRepository.save(rolePermissions);

    // Return the role with its permissions
    return await this.getRole(savedRole.id, currentUserId);
  }

  /**
   * Get all roles for a store
   * @param storeId Store ID
   * @param currentUserId Current authenticated user ID
   * @returns List of roles with their permissions
   */
  async getRoles(storeId: number, currentUserId: number) {
    // Verify that the current user belongs to this store
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== storeId) {
      throw new ForbiddenException('You do not have permission to view roles for this store');
    }

    const roles = await this.roleRepository.find({
      where: { store_id: storeId },
      relations: ['role_permissions', 'role_permissions.permission'],
      order: { id: 'ASC' },
    });

    // Format the response to include permission details
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      is_editable: role.is_editable,
      is_system_role: role.is_system_role,
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions: role.role_permissions.map((rp) => ({
        id: rp.permission.id,
        slug: rp.permission.slug,
        description: rp.permission.description,
        scope: rp.permission.scope,
        module: rp.permission.module,
      })),
    }));
  }

  /**
   * Get a specific role with its permissions
   * @param roleId Role ID
   * @param currentUserId Current authenticated user ID
   * @returns Role with permissions
   */
  async getRole(roleId: number, currentUserId: number) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['role_permissions', 'role_permissions.permission'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify that the current user has access to this role's store
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== role.store_id) {
      throw new ForbiddenException('You do not have permission to view this role');
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      is_editable: role.is_editable,
      is_system_role: role.is_system_role,
      store_id: role.store_id,
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions: role.role_permissions.map((rp) => ({
        id: rp.permission.id,
        slug: rp.permission.slug,
        description: rp.permission.description,
        scope: rp.permission.scope,
        module: rp.permission.module,
      })),
    };
  }

  /**
   * Update a role (name, description, or permissions)
   * @param roleId Role ID
   * @param updateRoleDto Role update data
   * @param currentUserId Current authenticated user ID
   * @returns Updated role with permissions
   */
  async updateRole(
    roleId: number,
    updateRoleDto: UpdateRoleDto,
    currentUserId: number,
  ) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if role is editable
    if (!role.is_editable) {
      throw new ForbiddenException('This role cannot be edited');
    }

    // Verify that the current user has access to this role's store
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== role.store_id) {
      throw new ForbiddenException('You do not have permission to update this role');
    }

    // Update basic properties if provided
    if (updateRoleDto.name) {
      // Check if the new name conflicts with an existing role in the same store
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name, store_id: role.store_id },
      });

      if (existingRole && existingRole.id !== roleId) {
        throw new ConflictException(`Role with name '${updateRoleDto.name}' already exists in this store`);
      }

      role.name = updateRoleDto.name;
    }

    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }

    // Update permissions if provided
    if (updateRoleDto.permission_ids !== undefined) {
      // Remove all existing permissions
      await this.rolePermissionRepository.delete({ role_id: roleId });

      // Add new permissions (can be empty array)
      if (updateRoleDto.permission_ids.length > 0) {
        // Verify that all permission IDs exist
        const permissions = await this.permissionRepository.findByIds(updateRoleDto.permission_ids);
        if (permissions.length !== updateRoleDto.permission_ids.length) {
          throw new NotFoundException('One or more permissions not found');
        }

        // Create new role-permission relationships
        const rolePermissions = updateRoleDto.permission_ids.map((permissionId) =>
          this.rolePermissionRepository.create({
            role_id: roleId,
            permission_id: permissionId,
          }),
        );

        await this.rolePermissionRepository.save(rolePermissions);
      }
    }

    role.updated_at = new Date();
    const updatedRole = await this.roleRepository.save(role);

    // Return the updated role with permissions
    return await this.getRole(updatedRole.id, currentUserId);
  }

  /**
   * Delete a role
   * @param roleId Role ID
   * @param currentUserId Current authenticated user ID
   * @returns Success message
   */
  async deleteRole(roleId: number, currentUserId: number) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Cannot delete system roles like ADMIN
    if (!role.is_editable || role.name === 'ADMIN') {
      throw new ForbiddenException('Cannot delete system roles');
    }

    // Verify that the current user has access to this role's store
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== role.store_id) {
      throw new ForbiddenException('You do not have permission to delete this role');
    }

    // Check if role is assigned to any users
    const usersWithRole = await this.userRepository.count({
      where: { role_id: roleId },
    });

    if (usersWithRole > 0) {
      throw new ConflictException(
        `Cannot delete role as it is assigned to ${usersWithRole} user(s). Please reassign users first.`,
      );
    }

    // Delete all role-permission associations
    await this.rolePermissionRepository.delete({ role_id: roleId });

    // Delete the role
    await this.roleRepository.delete(roleId);

    return {
      message: `Role '${role.name}' deleted successfully`,
    };
  }

  /**
   * Get available permissions for a store (for creating/editing roles)
   * @param storeId Store ID
   * @param currentUserId Current authenticated user ID
   * @returns List of available store permissions
   */
  async getAvailablePermissions(storeId: number, currentUserId: number) {
    // Verify that the current user belongs to this store
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== storeId) {
      throw new ForbiddenException('You do not have permission to view permissions for this store');
    }

    // Get all store-level permissions
    const permissions = await this.permissionRepository.find({
      where: { scope: PermissionScope.STORE },
      order: { module: 'ASC', slug: 'ASC' },
    });

    return permissions.map((permission) => ({
      id: permission.id,
      slug: permission.slug,
      description: permission.description,
      module: permission.module,
      is_system_defined: permission.is_system_defined,
    }));
  }
}