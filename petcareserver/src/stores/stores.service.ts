import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { InviteStaffResponseDto } from './dto/invite-staff-response.dto';
import { AcceptInvitationResponseDto } from './dto/accept-invitation-response.dto';
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
import { Invitation } from './entities/invitation.entity';
import { UserStatus, StoreStatus, PermissionScope, InvitationStatus } from '../common/enum';

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
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private readonly mailService: MailService,
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

    const savedStore = (await this.storeRepository.save(store)) as Store;

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

      adminRole = (await this.roleRepository.save(newAdminRole)) as Role;

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

  async inviteStaff(
    storeId: number,
    inviteStaffDto: InviteStaffDto,
    currentUserId: number,
  ) {
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== storeId) {
      throw new ForbiddenException(
        'You do not have permission to invite staff to this store',
      );
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
      throw new NotFoundException(
        'Role not found or does not belong to this store',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: inviteStaffDto.email },
    });

    if (existingUser) {
      if (existingUser.store_id === storeId) {
        throw new ConflictException('User is already a member of this store');
      }

      if (existingUser.store_id !== null) {
        throw new ConflictException('User with this email already belongs to another store');
      }
    }

    // const existingInvitation = await this.invitationRepository.findOne({
    //   where: {
    //     email: inviteStaffDto.email,
    //     store_id: storeId,
    //     status: InvitationStatus.PENDING
    //   },
    // });

    // if (existingInvitation) {
    //   throw new ConflictException('An invitation for this email is already pending for this store');
    // }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationRepository.create({
      email: inviteStaffDto.email,
      store_id: storeId,
      role_id: inviteStaffDto.role_id,
      status: InvitationStatus.PENDING,
      token: token,
      expires_at: expiresAt,
      invited_by: currentUserId,
      message: inviteStaffDto.message || '',
    });

    const savedInvitation = await this.invitationRepository.save(invitation) as Invitation;

    const invitationResponse: InviteStaffResponseDto = {
      message: 'Invitation sent successfully',
      invitation: {
        id: savedInvitation.id,
        email: savedInvitation.email,
        status: savedInvitation.status,
        token: savedInvitation.token,
        expires_at: savedInvitation.expires_at,
        message: savedInvitation.message,
      },
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
      },
      store: {
        id: store.id,
        name: store.name,
        status: store.status,
      },
      note: 'An invitation link has been generated. Send this link: /api/stores/' + storeId + '/invitations/accept?token=' + token,
    };

    await this.mailService.sendInvitationEmail(invitationResponse, inviteStaffDto.full_name);

    return invitationResponse;
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

  async updateStore(
    storeId: number,
    updateData: UpdateStoreDto,
    currentUserId: number,
  ) {
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    if (!currentUser || currentUser.store_id !== storeId) {
      throw new ForbiddenException(
        'You do not have permission to update this store',
      );
    }

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    Object.assign(store, updateData);
    const updatedStore = (await this.storeRepository.save(store)) as Store;

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
      throw new ForbiddenException(
        'You do not have permission to view staff of this store',
      );
    }

    const staff = await this.userRepository.find({
      where: { store_id: storeId },
      relations: {
	      role: true
      },
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

  async acceptInvitation(token: string): Promise<AcceptInvitationResponseDto> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation token');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException('This invitation has already been processed');
    }

    if (new Date() > invitation.expires_at) {
      await this.invitationRepository.update(invitation.id, {
        status: InvitationStatus.EXPIRED,
      });
      throw new ConflictException('This invitation has expired');
    }

    const store = await this.storeRepository.findOne({
      where: { id: invitation.store_id },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const role = await this.roleRepository.findOne({
      where: { id: invitation.role_id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const user = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    if (!user) {
      throw new NotFoundException('User not found. Please register an account first.');
    }

    if (user.store_id === invitation.store_id) {
      throw new ConflictException('You are already a member of this store');
    }

    if (user.store_id !== null) {
      throw new ConflictException('You are already a member of another store');
    }

    await this.userRepository.update(user.user_id, {
      store_id: invitation.store_id,
      role_id: invitation.role_id,
      status: UserStatus.ACTIVE,
    });

    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
    });

    const updatedUser = await this.userRepository.findOne({
      where: { user_id: user.user_id },
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    const response: AcceptInvitationResponseDto = {
      message: 'Invitation accepted successfully',
      user: {
        user_id: updatedUser.user_id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        status: updatedUser.status,
      },
      store: {
        id: store.id,
        name: store.name,
        status: store.status,
      },
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
      },
      note: 'You have been successfully added to the store. Please log in to continue.',
    };

    return response;
  }
}
