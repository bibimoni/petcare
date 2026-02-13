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

  async createStore(createStoreDto: CreateStoreDto, currentUserId: number) {
    const existingUser = await this.userRepository.findOne({
      where: { user_id: currentUserId, store_id: null as any },
    });

    if (!existingUser) {
      throw new ForbiddenException('User already has a store');
    }

    const existingStore = await this.storeRepository.findOne({
      where: { name: createStoreDto.name },
    });

    if (existingStore) {
      throw new ConflictException('Store name already exists');
    }

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

    let adminRole = await this.roleRepository.findOne({
      where: { name: 'ADMIN', store_id: savedStore.id },
    });

    if (!adminRole) {
      const newAdminRole = this.roleRepository.create({
        name: 'ADMIN',
        description: 'Store Administrator with full store access',
        is_editable: false,
        store_id: savedStore.id,
        is_system_role: false,
      });

      adminRole = await this.roleRepository.save(newAdminRole) as Role;

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


  async inviteStaff(storeId: number, inviteStaffDto: InviteStaffDto, currentUserId: number) {
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== storeId) {
      throw new ForbiddenException('You do not have permission to invite staff to this store');
    }

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const role = await this.roleRepository.findOne({
      where: { id: inviteStaffDto.role_id, store_id: storeId },
    });

    if (!role) {
      throw new NotFoundException('Role not found or does not belong to this store');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: inviteStaffDto.email },
    });

    if (existingUser) {
      if (existingUser.store_id === storeId) {
        throw new ConflictException('User is already a member of this store');
      }

      throw new ConflictException('User with this email already exists in another store');
    }

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

  async getStore(storeId: number) {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async updateStore(storeId: number, updateData: UpdateStoreDto, currentUserId: number) {
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

    Object.assign(store, updateData);
    const updatedStore = await this.storeRepository.save(store) as Store;

    return {
      message: 'Store updated successfully',
      store: updatedStore,
    };
  }

  async getStoreStaff(storeId: number, currentUserId: number) {
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

  async getAllStores() {
    const stores = await this.storeRepository.find({
      order: { id: 'ASC' },
    });

    return {
      total: stores.length,
      stores: stores.map((store) => ({
        id: store.id,
        name: store.name,
        status: store.status,
        phone: store.phone,
        city: store.city,
        country: store.country,
        created_at: store.created_at,
        updated_at: store.updated_at,
      })),
    };
  }
}
