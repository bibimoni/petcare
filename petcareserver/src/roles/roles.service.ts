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
import { RoleHistory, RoleHistoryAction } from './entities/role-history.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { STORE_ROLES } from '../common/permissions';
import { PermissionScope } from '../common/enum';

@Injectable()
export class RolesService {
  private async validateStoreMembership(
    storeId: number,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    if (isSuperAdmin) return;
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });
    if (!currentUser || currentUser.store_id !== storeId) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện thao tác này trên cửa hàng',
      );
    }
  }

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleHistory)
    private roleHistoryRepository: Repository<RoleHistory>,
  ) {}

  private async getPerformedByName(
    userId: number | null,
  ): Promise<string | null> {
    if (!userId) return null;
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    return user?.full_name ?? null;
  }

  async createRole(
    storeId: number,
    createRoleDto: CreateRoleDto,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    await this.validateStoreMembership(storeId, currentUserId, isSuperAdmin);

    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name, store_id: storeId },
    });

    if (existingRole) {
      throw new ConflictException(
        `Vai trò '${createRoleDto.name}' đã tồn tại trong cửa hàng`,
      );
    }

    const permissions = await this.permissionRepository.findByIds(
      createRoleDto.permission_ids,
    );
    if (permissions.length !== createRoleDto.permission_ids.length) {
      throw new NotFoundException('Một hoặc nhiều quyền không tồn tại');
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
      store_id: storeId,
      is_editable: true,
      is_system_role: false,
    });

    const savedRole = await this.roleRepository.save(role);

    const rolePermissions = createRoleDto.permission_ids.map((permissionId) =>
      this.rolePermissionRepository.create({
        role_id: savedRole.id,
        permission_id: permissionId,
      }),
    );

    await this.rolePermissionRepository.save(rolePermissions);

    const performedByName = await this.getPerformedByName(currentUserId);

    await this.roleHistoryRepository.save({
      role_id: savedRole.id,
      store_id: storeId,
      action: RoleHistoryAction.CREATED,
      performed_by: currentUserId,
      performed_by_name: performedByName,
      old_values: null,
      new_values: {
        name: savedRole.name,
        description: savedRole.description,
        permission_ids: createRoleDto.permission_ids,
      },
    });

    return await this.getRole(savedRole.id, currentUserId, isSuperAdmin);
  }

  async getRoles(
    storeId: number,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    await this.validateStoreMembership(storeId, currentUserId, isSuperAdmin);

    const roles = await this.roleRepository.find({
      where: { store_id: storeId },
      relations: {
        role_permissions: {
          permission: true,
        },
      },
      order: { id: 'ASC' },
    });

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

  async getRole(
    roleId: number,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: {
        role_permissions: {
          permission: true,
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò');
    }

    await this.validateStoreMembership(
      role.store_id,
      currentUserId,
      isSuperAdmin,
    );

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

  async updateRole(
    roleId: number,
    updateRoleDto: UpdateRoleDto,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: { role_permissions: { permission: true } },
    });

    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò');
    }

    if (!role.is_editable) {
      throw new ForbiddenException('Vai trò này không thể chỉnh sửa');
    }

    await this.validateStoreMembership(
      role.store_id,
      currentUserId,
      isSuperAdmin,
    );

    const oldValues: Record<string, any> = {
      name: role.name,
      description: role.description,
      permission_ids: role.role_permissions.map((rp) => rp.permission_id),
      permission_slugs: role.role_permissions.map((rp) => rp.permission.slug),
    };

    if (updateRoleDto.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name, store_id: role.store_id },
      });

      if (existingRole && existingRole.id !== roleId) {
        throw new ConflictException(
          `Vai trò '${updateRoleDto.name}' đã tồn tại trong cửa hàng`,
        );
      }

      role.name = updateRoleDto.name;
    }

    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }

    if (updateRoleDto.permission_ids !== undefined) {
      await this.rolePermissionRepository.delete({ role_id: roleId });

      if (updateRoleDto.permission_ids.length > 0) {
        const permissions = await this.permissionRepository.findByIds(
          updateRoleDto.permission_ids,
        );
        if (permissions.length !== updateRoleDto.permission_ids.length) {
          throw new NotFoundException('Một hoặc nhiều quyền không tồn tại');
        }

        const rolePermissions = updateRoleDto.permission_ids.map(
          (permissionId) =>
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

    const newValues: Record<string, any> = {
      name: updatedRole.name,
      description: updatedRole.description,
    };

    if (updateRoleDto.permission_ids !== undefined) {
      newValues.permission_ids = updateRoleDto.permission_ids;
    }

    const performedByName = await this.getPerformedByName(currentUserId);
    const historyAction =
      updateRoleDto.permission_ids !== undefined
        ? RoleHistoryAction.PERMISSIONS_CHANGED
        : RoleHistoryAction.UPDATED;

    await this.roleHistoryRepository.save({
      role_id: roleId,
      store_id: role.store_id,
      action: historyAction,
      performed_by: currentUserId,
      performed_by_name: performedByName,
      old_values: oldValues,
      new_values: newValues,
    });

    return await this.getRole(updatedRole.id, currentUserId, isSuperAdmin);
  }

  async deleteRole(
    roleId: number,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò');
    }

    if (!role.is_editable || role.name === 'ADMIN') {
      throw new ForbiddenException('Không thể xóa vai trò hệ thống');
    }

    await this.validateStoreMembership(
      role.store_id,
      currentUserId,
      isSuperAdmin,
    );

    const usersWithRole = await this.userRepository.count({
      where: { role_id: roleId },
    });

    if (usersWithRole > 0) {
      throw new ConflictException(
        `Không thể xóa vai trò vì đang có ${usersWithRole} người dùng được gán. Vui lòng gán lại vai trò trước`,
      );
    }

    const performedByName = await this.getPerformedByName(currentUserId);

    await this.roleHistoryRepository.save({
      role_id: roleId,
      store_id: role.store_id,
      action: RoleHistoryAction.DELETED,
      performed_by: currentUserId,
      performed_by_name: performedByName,
      old_values: { name: role.name, description: role.description },
      new_values: null,
    });

    await this.rolePermissionRepository.delete({ role_id: roleId });

    await this.roleRepository.delete(roleId);

    return {
      message: `Xóa vai trò '${role.name}' thành công`,
    };
  }

  async getAvailablePermissions(
    storeId: number,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    await this.validateStoreMembership(storeId, currentUserId, isSuperAdmin);

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

  async getHistory(storeId: number, roleId: number) {
    return this.roleHistoryRepository.find({
      where: { role_id: roleId, store_id: storeId },
      order: { created_at: 'DESC' },
    });
  }
}
