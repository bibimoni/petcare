import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UserStatus, StoreStatus, PermissionScope } from '../common/enum';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Create a new store and automatically assign admin role to the user
   * @param createStoreDto Store creation data
   * @param currentUserId Current authenticated user ID
   * @returns Created store with assigned admin role
   */
  async createStore(createStoreDto: CreateStoreDto, currentUserId: number) {
    // Check if user already has a store
    const existingUser = await this.userRepository.findOne({
      where: { user_id: currentUserId, store_id: null as any },
    });

    if (!existingUser) {
      throw new ForbiddenException('User already has a store');
    }

    // Check if store name already exists
    const existingStore = await this.storeRepository.findOne({
      where: { name: createStoreDto.name },
    });

    if (existingStore) {
      throw new ConflictException('Store name already exists');
    }

    // Create the store
    const store = this.storeRepository.create({
      name: createStoreDto.name,
      status: StoreStatus.ACTIVE,
      phone: createStoreDto.phone,
      address: createStoreDto.address,
      city: createStoreDto.city,
      state: createStoreDto.state,
      country: createStoreDto.country,
      postal_code: createStoreDto.postal_code,
      logo_url: createStoreDto.logo_url,
    });

    const savedStore = await this.storeRepository.save(store) as Store;

    // Find or create the ADMIN role for this store with all permissions
    let adminRole = await this.roleRepository.findOne({
      where: { name: 'ADMIN', store_id: savedStore.id },
    });

    if (!adminRole) {
      // Create ADMIN role
      const newAdminRole = this.roleRepository.create({
        name: 'ADMIN',
        description: 'Store Administrator with full store access',
        is_editable: false,
        store_id: savedStore.id,
        is_system_role: false,
      });

      adminRole = await this.roleRepository.save(newAdminRole) as Role;

      // Assign all store permissions to admin role
      const storePermissions = await this.permissionRepository.find({
        where: { scope: PermissionScope.STORE },
      });

      const rolePermissions = storePermissions.map((permission) =>
        this.rolePermissionRepository.create({
          role_id: newAdminRole.id,
          permission_id: permission.id,
        }),
      );

      await this.rolePermissionRepository.save(rolePermissions);
    }

    // Update user to link to the store and assign admin role
    await this.userRepository.update(currentUserId, {
      store_id: savedStore.id,
      role_id: adminRole.id,
    });

    return {
      message: 'Store created successfully',
      store: savedStore,
      admin_role: {
        id: adminRole.id,
        name: adminRole.name,
        description: adminRole.description,
      },
      note: 'You have been assigned as Store Admin with full access',
    };
  }


  /**
   * Invite a staff member to the store with a specific role
   * @param storeId Store ID
   * @param inviteStaffDto Staff invitation data
   * @param currentUserId Current authenticated user ID
   * @returns Created staff user or invitation details
   */
  async inviteStaff(storeId: number, inviteStaffDto: InviteStaffDto, currentUserId: number) {
    // Verify that the current user belongs to this store
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== storeId) {
      throw new ForbiddenException('You do not have permission to invite staff to this store');
    }

    // Verify the store exists
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Verify the role exists and belongs to this store
    const role = await this.roleRepository.findOne({
      where: { id: inviteStaffDto.role_id, store_id: storeId },
    });

    if (!role) {
      throw new NotFoundException('Role not found or does not belong to this store');
    }

    // Check if user with this email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: inviteStaffDto.email },
    });

    if (existingUser) {
      // Check if user is already in this store
      if (existingUser.store_id === storeId) {
        throw new ConflictException('User is already a member of this store');
      }

      // User exists but is in a different store
      throw new ConflictException('User with this email already exists in another store');
    }

    // Create the staff user with LOCKED status and no password
    const staffUser = this.userRepository.create({
      email: inviteStaffDto.email,
      full_name: inviteStaffDto.full_name || '',
      phone: inviteStaffDto.phone,
      address: '',
      store_id: storeId,
      role_id: inviteStaffDto.role_id,
      status: UserStatus.LOCKED,
    });

    const savedStaff = await this.userRepository.save(staffUser) as User;

    // Remove sensitive data from response
    const { password_hash, ...staffResponse } = savedStaff;

    return {
      message: 'Staff member invited successfully',
      staff: staffResponse,
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
      },
      store: {
        id: store.id,
        name: store.name,
      },
      note: 'An invitation link will be sent to the staff member (to be implemented)',
    };
  }

  /**
   * Get store details
   * @param storeId Store ID
   * @returns Store details
   */
  async getStore(storeId: number) {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  /**
   * Update store details
   * @param storeId Store ID
   * @param updateData Store update data
   * @param currentUserId Current authenticated user ID
   * @returns Updated store
   */
  async updateStore(storeId: number, updateData: UpdateStoreDto, currentUserId: number) {
    // Verify the current user belongs to this store
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== storeId) {
      throw new ForbiddenException('You do not have permission to update this store');
    }

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Update store with provided data
    Object.assign(store, updateData);
    const updatedStore = await this.storeRepository.save(store) as Store;

    return {
      message: 'Store updated successfully',
      store: updatedStore,
    };
  }

  /**
   * Get staff members of a store
   * @param storeId Store ID
   * @param currentUserId Current authenticated user ID
   * @returns List of staff members
   */
  async getStoreStaff(storeId: number, currentUserId: number) {
    // Verify the current user belongs to this store
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== storeId) {
      throw new ForbiddenException('You do not have permission to view staff of this store');
    }

    const staff = await this.userRepository.find({
      where: { store_id: storeId },
      relations: ['role'],
      select: {
        user_id: true,
        email: true,
        full_name: true,
        phone: true,
        status: true,
        created_at: true,
        role_id: true,
        role: {
          id: true,
          name: true,
          description: true,
        },
      },
    });

    return {
      store_id: storeId,
      staff,
      total: staff.length,
    };
  }
}