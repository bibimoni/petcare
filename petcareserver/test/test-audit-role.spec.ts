import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { RolesService } from '../src/roles/roles.service';
import { Role } from '../src/roles/entities/role.entity';
import { RolePermission } from '../src/roles/entities/role-permission.entity';
import { RoleHistory, RoleHistoryAction } from '../src/roles/entities/role-history.entity';
import { Permission } from '../src/permissions/entities/permission.entity';
import { User } from '../src/users/entities/user.entity';
import { CreateRoleDto } from '../src/roles/dto/create-role.dto';
import { UpdateRoleDto } from '../src/roles/dto/update-role.dto';

describe('RolesService - Audit Logging', () => {
  let service: RolesService;
  let roleRepo: jest.Mocked<any>;
  let rolePermissionRepo: jest.Mocked<any>;
  let permissionRepo: jest.Mocked<any>;
  let userRepo: jest.Mocked<any>;
  let roleHistoryRepo: jest.Mocked<any>;

  beforeEach(async () => {
    roleRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((data) => data),
    };
    rolePermissionRepo = {
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn((data) => data),
    };
    permissionRepo = {
      findByIds: jest.fn(),
      find: jest.fn(),
    };
    userRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
    };
    roleHistoryRepo = { save: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: 'RoleRepository', useValue: roleRepo },
        { provide: 'RolePermissionRepository', useValue: rolePermissionRepo },
        { provide: 'PermissionRepository', useValue: permissionRepo },
        { provide: 'UserRepository', useValue: userRepo },
        { provide: 'RoleHistoryRepository', useValue: roleHistoryRepo },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('createRole - audit logging', () => {
    const storeId = 10;
    const createDto: CreateRoleDto = {
      name: 'Cashier',
      description: 'Cashier role',
      permission_ids: [1, 2, 3],
    };
    const userId = 5;

    beforeEach(() => {
      userRepo.findOne.mockResolvedValue({ user_id: userId, store_id: storeId, full_name: 'Admin User' });
      roleRepo.findOne.mockResolvedValue(null);
      permissionRepo.findByIds.mockResolvedValue([
        { id: 1, slug: 'order.view' },
        { id: 2, slug: 'order.create' },
        { id: 3, slug: 'product.view' },
      ]);
      roleRepo.save.mockImplementation((data) => ({ ...data, id: 100 }));
      rolePermissionRepo.save.mockResolvedValue([]);
      roleRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 100,
          name: 'Cashier',
          description: 'Cashier role',
          store_id: storeId,
          is_editable: true,
          is_system_role: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [
            { permission: { id: 1, slug: 'order.view', description: 'View orders', scope: 'STORE', module: 'order' } },
            { permission: { id: 2, slug: 'order.create', description: 'Create orders', scope: 'STORE', module: 'order' } },
            { permission: { id: 3, slug: 'product.view', description: 'View products', scope: 'STORE', module: 'product' } },
          ],
        });
    });

    it('should write RoleHistory with CREATED action after role creation', async () => {
      await service.createRole(storeId, createDto, userId);

      expect(roleHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          role_id: 100,
          store_id: storeId,
          action: RoleHistoryAction.CREATED,
          performed_by: userId,
          performed_by_name: 'Admin User',
          old_values: null,
          new_values: expect.objectContaining({
            name: 'Cashier',
            description: 'Cashier role',
            permission_ids: [1, 2, 3],
          }),
        }),
      );
    });

    it('should not write audit log if role creation fails (duplicate name)', async () => {
      roleRepo.findOne.mockReset();
      roleRepo.findOne.mockResolvedValueOnce({ id: 99, name: 'Cashier', store_id: storeId });

      await expect(service.createRole(storeId, createDto, userId)).rejects.toThrow(ConflictException);

      expect(roleHistoryRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateRole - audit logging', () => {
    const roleId = 100;
    const userId = 5;
    const existingRole = {
      id: roleId,
      name: 'Cashier',
      description: 'Cashier role',
      store_id: 10,
      is_editable: true,
      role_permissions: [
        { permission_id: 1, permission: { id: 1, slug: 'order.view' } },
        { permission_id: 2, permission: { id: 2, slug: 'order.create' } },
      ],
    };

    beforeEach(() => {
      userRepo.findOne.mockResolvedValue({ user_id: userId, store_id: 10, full_name: 'Admin User' });
      roleRepo.save.mockImplementation((data) => data);
      roleRepo.findOne
        .mockResolvedValueOnce(existingRole)
        .mockResolvedValueOnce({
          id: roleId,
          name: 'Senior Cashier',
          description: 'Updated',
          store_id: 10,
          is_editable: true,
          is_system_role: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [
            { permission: { id: 1, slug: 'order.view', description: 'View orders', scope: 'STORE', module: 'order' } },
            { permission: { id: 3, slug: 'product.view', description: 'View products', scope: 'STORE', module: 'product' } },
          ],
        });
    });

    it('should write RoleHistory with PERMISSIONS_CHANGED when permissions are updated', async () => {
      const updateDto: UpdateRoleDto = {
        permission_ids: [1, 3],
      };
      permissionRepo.findByIds.mockResolvedValue([
        { id: 1, slug: 'order.view' },
        { id: 3, slug: 'product.view' },
      ]);

      await service.updateRole(roleId, updateDto, userId);

      expect(roleHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          role_id: roleId,
          store_id: 10,
          action: RoleHistoryAction.PERMISSIONS_CHANGED,
          performed_by: userId,
          performed_by_name: 'Admin User',
          old_values: expect.objectContaining({
            permission_ids: [1, 2],
            permission_slugs: ['order.view', 'order.create'],
          }),
          new_values: expect.objectContaining({
            permission_ids: [1, 3],
          }),
        }),
      );
    });

    it('should write RoleHistory with UPDATED when only name/description changed', async () => {
      const updateDto: UpdateRoleDto = {
        name: 'Senior Cashier',
        description: 'Updated description',
      };
      roleRepo.findOne.mockReset();
      roleRepo.findOne
        .mockResolvedValueOnce(existingRole)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: roleId,
          name: 'Senior Cashier',
          description: 'Updated description',
          store_id: 10,
          is_editable: true,
          is_system_role: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        });

      await service.updateRole(roleId, updateDto, userId);

      expect(roleHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: RoleHistoryAction.UPDATED,
          performed_by: userId,
          old_values: expect.objectContaining({
            name: 'Cashier',
            description: 'Cashier role',
          }),
          new_values: expect.objectContaining({
            name: 'Senior Cashier',
            description: 'Updated description',
          }),
        }),
      );
    });

    it('should not write audit log if role update fails (non-editable role)', async () => {
      roleRepo.findOne.mockReset();
      roleRepo.findOne.mockResolvedValueOnce({
        ...existingRole,
        is_editable: false,
      });

      const updateDto: UpdateRoleDto = { name: 'New Name' };

      await expect(service.updateRole(roleId, updateDto, userId)).rejects.toThrow(ForbiddenException);

      expect(roleHistoryRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteRole - audit logging', () => {
    const roleId = 100;
    const userId = 5;

    it('should write RoleHistory with DELETED action before deleting role', async () => {
      userRepo.findOne.mockResolvedValue({ user_id: userId, store_id: 10, full_name: 'Admin User' });
      roleRepo.findOne.mockResolvedValue({
        id: roleId,
        name: 'Cashier',
        description: 'Cashier role',
        store_id: 10,
        is_editable: true,
        name_check: 'Cashier',
      });
      userRepo.count.mockResolvedValue(0);
      roleRepo.delete.mockResolvedValue({});

      await service.deleteRole(roleId, userId);

      expect(roleHistoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          role_id: roleId,
          store_id: 10,
          action: RoleHistoryAction.DELETED,
          performed_by: userId,
          performed_by_name: 'Admin User',
          old_values: expect.objectContaining({
            name: 'Cashier',
            description: 'Cashier role',
          }),
          new_values: null,
        }),
      );
    });

    it('should write audit log before actual deletion (so role_id is still valid)', async () => {
      userRepo.findOne.mockResolvedValue({ user_id: userId, store_id: 10, full_name: 'Admin' });
      roleRepo.findOne.mockResolvedValue({
        id: roleId,
        name: 'Temp',
        description: 'Temp',
        store_id: 10,
        is_editable: true,
      });
      userRepo.count.mockResolvedValue(0);

      const callOrder: string[] = [];
      roleHistoryRepo.save.mockImplementation(() => { callOrder.push('history'); return {}; });
      rolePermissionRepo.delete.mockImplementation(() => { callOrder.push('permissions'); });
      roleRepo.delete.mockImplementation(() => { callOrder.push('role'); });

      await service.deleteRole(roleId, userId);

      expect(callOrder).toEqual(['history', 'permissions', 'role']);
    });

    it('should not write audit log if deletion fails (role has users)', async () => {
      userRepo.findOne.mockResolvedValue({ user_id: userId, store_id: 10, full_name: 'Admin' });
      roleRepo.findOne.mockResolvedValue({
        id: roleId,
        name: 'Cashier',
        description: 'Cashier',
        store_id: 10,
        is_editable: true,
      });
      userRepo.count.mockResolvedValue(3);

      await expect(service.deleteRole(roleId, userId)).rejects.toThrow(ConflictException);

      expect(roleHistoryRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should return role history for a given role in store', async () => {
      const mockHistory = [
        { id: 1, role_id: 100, store_id: 10, action: RoleHistoryAction.PERMISSIONS_CHANGED },
        { id: 2, role_id: 100, store_id: 10, action: RoleHistoryAction.UPDATED },
      ];
      roleHistoryRepo.find = jest.fn().mockResolvedValue(mockHistory);

      const result = await service.getHistory(10, 100);

      expect(roleHistoryRepo.find).toHaveBeenCalledWith({
        where: { role_id: 100, store_id: 10 },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockHistory);
    });
  });
});

describe('RoleHistory Entity', () => {
  it('should have correct RoleHistoryAction enum values', () => {
    expect(RoleHistoryAction.CREATED).toBe('CREATED');
    expect(RoleHistoryAction.UPDATED).toBe('UPDATED');
    expect(RoleHistoryAction.PERMISSIONS_CHANGED).toBe('PERMISSIONS_CHANGED');
    expect(RoleHistoryAction.DELETED).toBe('DELETED');
  });
});
