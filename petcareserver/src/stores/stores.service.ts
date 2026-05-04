import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { InviteStaffResponseDto } from './dto/invite-staff-response.dto';
import { AcceptInvitationResponseDto } from './dto/accept-invitation-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Store } from './entities/store.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { Invitation } from './entities/invitation.entity';
import { CustomerHistory } from '../customers/entities/customer-history.entity';
import { ProductHistory } from '../categories/entities/product-history.entity';
import { ServiceHistory } from '../categories/entities/service-history.entity';
import {
  UserStatus,
  StoreStatus,
  PermissionScope,
  InvitationStatus,
} from '../common/enum';
import { generateRandomToken, INVITE_TOKEN_EXPIRATION_DAYS } from 'src/common';
import { NotificationScheduler } from 'src/notifications/notification.scheduler';
import { NotificationsService } from 'src/notifications/notifications.service';
import {
  Notification,
  NotificationType,
} from 'src/notifications/entities/notification.entity';
import { buildInvitationUrl } from 'src/notifications/notification.util';
import { ConfigService } from '@nestjs/config';

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
    @InjectRepository(CustomerHistory)
    private customerHistoryRepository: Repository<CustomerHistory>,
    @InjectRepository(ProductHistory)
    private productHistoryRepository: Repository<ProductHistory>,
    @InjectRepository(ServiceHistory)
    private serviceHistoryRepository: Repository<ServiceHistory>,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => NotificationScheduler))
    private readonly notificationScheduler: NotificationScheduler,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async createStore(createStoreDto: CreateStoreDto, currentUserId: number) {
    const existingUser = await this.userRepository.findOne({
      where: { user_id: currentUserId, store_id: null as any },
    });

    if (!existingUser) {
      throw new ForbiddenException('Người dùng đã có cửa hàng');
    }

    const existingStore = await this.storeRepository.findOne({
      where: { name: createStoreDto.name },
    });

    if (existingStore) {
      throw new ConflictException('Tên cửa hàng đã tồn tại');
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
      notification_cron: createStoreDto.notification_cron ?? null,
    });

    const savedStore = await this.storeRepository.save(store);

    this.notificationScheduler.registerStoreJob(
      savedStore.id,
      savedStore.notification_cron,
    );

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

      adminRole = await this.roleRepository.save(newAdminRole);

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
      last_active_at: new Date(),
    });

    return {
      message: 'Tạo cửa hàng thành công',
      store: savedStore,
      admin_role: {
        id: adminRole.id,
        name: adminRole.name,
        description: adminRole.description,
      },
      note: 'Bạn đã được gán làm Quản trị viên cửa hàng với toàn quyền truy cập',
    };
  }

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

  async inviteStaff(
    storeId: number,
    inviteStaffDto: InviteStaffDto,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    await this.validateStoreMembership(storeId, currentUserId, isSuperAdmin);

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Không tìm thấy cửa hàng');
    }

    const role = await this.roleRepository.findOne({
      where: { id: inviteStaffDto.role_id, store_id: storeId },
    });

    if (!role) {
      throw new NotFoundException(
        'Không tìm thấy vai trò hoặc vai trò không thuộc cửa hàng này',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: inviteStaffDto.email },
    });

    if (existingUser) {
      if (existingUser.store_id === storeId) {
        throw new ConflictException(
          'Người dùng đã là thành viên của cửa hàng này',
        );
      }

      if (existingUser.store_id !== null) {
        throw new ConflictException('Email này đã thuộc về một cửa hàng khác');
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

    const token = generateRandomToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TOKEN_EXPIRATION_DAYS);

    const savedInvitation = await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const invitation = transactionalEntityManager.create(Invitation, {
          email: inviteStaffDto.email,
          store_id: storeId,
          role_id: inviteStaffDto.role_id,
          status: InvitationStatus.PENDING,
          token: token,
          expires_at: expiresAt,
          invited_by: currentUserId,
          message: inviteStaffDto.message || '',
        });

        const saved = await transactionalEntityManager.save(invitation);

        if (existingUser) {
          try {
            const frontendUrl =
              this.configService.get<string>('FRONTEND_URL') || '';
            const actionUrl = buildInvitationUrl(frontendUrl, token);

            const notification = transactionalEntityManager.create(
              Notification,
              {
                store_id: storeId,
                user_id: existingUser.user_id,
                type: NotificationType.STORE_INVITATION,
                title: `Lời mời tham gia ${store.name}`,
                message: `Bạn đã được mời tham gia ${store.name} với vai trò ${role.name}. Nhấn để xem chi tiết.`,
                action_url: actionUrl,
              },
            );

            await transactionalEntityManager.save(notification);
          } catch (error) {
            console.error('Failed to create invitation notification:', error);
          }
        }

        return saved;
      },
    );

    const invitationResponse: InviteStaffResponseDto = {
      message: 'Gửi lời mời thành công',
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
      note:
        'Đường dẫn mời đã được tạo. Gửi đường dẫn này: /api/stores/' +
        storeId +
        '/invitations/accept?token=' +
        token,
    };

    try {
      await this.mailService.sendInvitationEmail(
        invitationResponse,
        inviteStaffDto.full_name,
      );
    } catch (error) {
      console.error('Failed to send invitation email:', error);
    }

    return invitationResponse;
  }

  async getStore(storeId: number) {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Không tìm thấy cửa hàng');
    }

    return store;
  }

  async updateStore(
    storeId: number,
    updateData: UpdateStoreDto,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    await this.validateStoreMembership(storeId, currentUserId, isSuperAdmin);

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Không tìm thấy cửa hàng');
    }

    // Track if notification_cron was updated
    const wasNotificationCronUpdated =
      updateData.notification_cron !== undefined;

    Object.assign(store, updateData);
    const updatedStore = await this.storeRepository.save(store);

    // Register the notification job if cron was updated
    if (wasNotificationCronUpdated && updatedStore.notification_cron) {
      this.notificationScheduler.registerStoreJob(
        storeId,
        updatedStore.notification_cron,
      );
    }

    return {
      message: 'Cập nhật cửa hàng thành công',
      store: updatedStore,
    };
  }

  async updateNotificationSchedule(
    storeId: number,
    cronExpression: string | null,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    await this.validateStoreMembership(storeId, currentUserId, isSuperAdmin);

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Không tìm thấy cửa hàng');
    }

    store.notification_cron = cronExpression;
    await this.storeRepository.save(store);

    // Cập nhật cron job ngay lập tức, không cần restart server
    this.notificationScheduler.registerStoreJob(storeId, cronExpression);

    return {
      message: 'Cập nhật lịch thông báo thành công',
      store_id: storeId,
      notification_cron: cronExpression ?? 'default (0 0 8 * * *)',
    };
  }

  async getStoreStaff(
    storeId: number,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    await this.validateStoreMembership(storeId, currentUserId, isSuperAdmin);

    const staff = await this.userRepository.find({
      where: { store_id: storeId },
      relations: {
        role: true,
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

  private async checkLastAdmin(storeId: number, targetUserId: number) {
    const targetUser = await this.userRepository.findOne({
      where: { user_id: targetUserId, store_id: storeId },
      relations: { role: true },
    });

    if (targetUser && targetUser.role?.name === 'ADMIN') {
      const adminsInStore = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .where('user.store_id = :storeId', { storeId })
        .andWhere('role.name = :roleName', { roleName: 'ADMIN' })
        .getCount();

      if (adminsInStore <= 1) {
        throw new ForbiddenException(
          'Không thể xóa quản trị viên cuối cùng của cửa hàng',
        );
      }
    }
  }

  async removeStaff(
    storeId: number,
    targetUserId: number,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    await this.validateStoreMembership(storeId, currentUserId, isSuperAdmin);

    if (currentUserId === targetUserId) {
      throw new ForbiddenException(
        'Không thể tự xóa khỏi cửa hàng. Vui lòng sử dụng chức năng rời cửa hàng',
      );
    }

    const targetUser = await this.userRepository.findOne({
      where: { user_id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (targetUser.store_id !== storeId) {
      throw new ForbiddenException('Người dùng không thuộc cửa hàng này');
    }

    await this.checkLastAdmin(storeId, targetUserId);

    await this.userRepository.update(targetUserId, {
      store_id: null as any,
      role_id: null as any,
      last_active_at: new Date(),
    });

    return {
      message: 'Đã xóa nhân viên khỏi cửa hàng',
      user: {
        user_id: targetUser.user_id,
        email: targetUser.email,
        full_name: targetUser.full_name,
      },
    };
  }

  async leaveStore(
    storeId: number,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    if (isSuperAdmin) {
      const currentUser = await this.userRepository.findOne({
        where: { user_id: currentUserId },
      });
      if (!currentUser || currentUser.store_id !== storeId) {
        throw new ForbiddenException(
          'Bạn không phải là thành viên của cửa hàng này',
        );
      }
    } else {
      await this.validateStoreMembership(storeId, currentUserId, false);
    }

    await this.checkLastAdmin(storeId, currentUserId);

    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
    });

    await this.userRepository.update(currentUserId, {
      store_id: null as any,
      role_id: null as any,
      last_active_at: new Date(),
    });

    return {
      message: 'Đã rời cửa hàng thành công',
      user: {
        user_id: currentUser!.user_id,
        email: currentUser!.email,
        full_name: currentUser!.full_name,
      },
    };
  }

  async removeStore(
    storeId: number,
    currentUserId: number,
    isSuperAdmin: boolean = false,
  ) {
    await this.validateStoreMembership(storeId, currentUserId, isSuperAdmin);

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Không tìm thấy cửa hàng');
    }

    const staffCount = await this.userRepository.count({
      where: { store_id: storeId },
    });

    if (staffCount > 1) {
      throw new ForbiddenException(
        'Cửa hàng vẫn còn nhân viên. Vui lòng xóa tất cả nhân viên trước khi xóa cửa hàng',
      );
    }

    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId },
      relations: { role: true },
    });

    if (!currentUser || currentUser.role?.name !== 'ADMIN') {
      throw new ForbiddenException('Chỉ quản trị viên mới có thể xóa cửa hàng');
    }

    await this.userRepository.update(currentUserId, {
      store_id: null as any,
      role_id: null as any,
      last_active_at: new Date(),
    });

    await this.storeRepository.delete(storeId);

    return {
      message: 'Đã xóa cửa hàng thành công',
      store: {
        id: store.id,
        name: store.name,
      },
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
      throw new NotFoundException('Đường dẫn mời không hợp lệ hoặc đã hết hạn');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException('Lời mời này đã được xử lý trước đó');
    }

    if (new Date() > invitation.expires_at) {
      await this.invitationRepository.update(invitation.id, {
        status: InvitationStatus.EXPIRED,
      });
      throw new ConflictException('Lời mời đã hết hạn');
    }

    const store = await this.storeRepository.findOne({
      where: { id: invitation.store_id },
    });

    if (!store) {
      throw new NotFoundException('Không tìm thấy cửa hàng');
    }

    const role = await this.roleRepository.findOne({
      where: { id: invitation.role_id },
    });

    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò');
    }

    const user = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    if (!user) {
      throw new NotFoundException(
        'Không tìm thấy người dùng. Vui lòng đăng ký tài khoản trước',
      );
    }

    if (user.store_id === invitation.store_id) {
      throw new ConflictException('Bạn đã là thành viên của cửa hàng này');
    }

    if (user.store_id !== null) {
      throw new ConflictException('Bạn đã là thành viên của một cửa hàng khác');
    }

    await this.userRepository.update(user.user_id, {
      store_id: invitation.store_id,
      role_id: invitation.role_id,
      status: UserStatus.ACTIVE,
      last_active_at: new Date(),
    });

    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
    });

    const updatedUser = await this.userRepository.findOne({
      where: { user_id: user.user_id },
    });

    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng sau khi cập nhật');
    }

    const response: AcceptInvitationResponseDto = {
      message: 'Chấp nhận lời mời thành công',
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
      note: 'Bạn đã được thêm vào cửa hàng thành công. Vui lòng đăng nhập để tiếp tục',
    };

    return response;
  }

  async getActivity(
    storeId: number,
    filters?: {
      entity_type?: 'CUSTOMER' | 'PRODUCT' | 'SERVICE';
      performed_by?: number;
    },
  ) {
    type ActivityEntry = {
      id: number;
      entity_type: 'CUSTOMER' | 'PRODUCT' | 'SERVICE';
      entity_id: number;
      action: string;
      performed_by: number | null;
      performed_by_name: string | null;
      old_values: Record<string, any> | null;
      new_values: Record<string, any> | null;
      created_at: Date;
    };

    const entries: ActivityEntry[] = [];

    if (!filters?.entity_type || filters.entity_type === 'CUSTOMER') {
      const customerWhere: any = { store_id: storeId };
      if (filters?.performed_by !== undefined) customerWhere.performed_by = filters.performed_by;
      const rows = await this.customerHistoryRepository.find({
        where: customerWhere,
        order: { created_at: 'DESC' },
      });
      for (const r of rows) {
        entries.push({
          id: r.id,
          entity_type: 'CUSTOMER',
          entity_id: r.customer_id,
          action: r.action,
          performed_by: r.performed_by,
          performed_by_name: r.performed_by_name,
          old_values: r.old_values,
          new_values: r.new_values,
          created_at: r.created_at,
        });
      }
    }

    if (!filters?.entity_type || filters.entity_type === 'PRODUCT') {
      const productWhere: any = { store_id: storeId };
      if (filters?.performed_by !== undefined) productWhere.performed_by = filters.performed_by;
      const rows = await this.productHistoryRepository.find({
        where: productWhere,
        order: { created_at: 'DESC' },
      });
      for (const r of rows) {
        entries.push({
          id: r.id,
          entity_type: 'PRODUCT',
          entity_id: r.product_id,
          action: r.action,
          performed_by: r.performed_by,
          performed_by_name: r.performed_by_name,
          old_values: r.old_values,
          new_values: r.new_values,
          created_at: r.created_at,
        });
      }
    }

    if (!filters?.entity_type || filters.entity_type === 'SERVICE') {
      const serviceWhere: any = { store_id: storeId };
      if (filters?.performed_by !== undefined) serviceWhere.performed_by = filters.performed_by;
      const rows = await this.serviceHistoryRepository.find({
        where: serviceWhere,
        order: { created_at: 'DESC' },
      });
      for (const r of rows) {
        entries.push({
          id: r.id,
          entity_type: 'SERVICE',
          entity_id: r.service_id,
          action: r.action,
          performed_by: r.performed_by,
          performed_by_name: r.performed_by_name,
          old_values: r.old_values,
          new_values: r.new_values,
          created_at: r.created_at,
        });
      }
    }

    entries.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return entries;
  }
}
