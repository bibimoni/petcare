import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StoresService } from '../src/stores/stores.service';
import { Store } from '../src/stores/entities/store.entity';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/roles/entities/role.entity';
import { Invitation } from '../src/stores/entities/invitation.entity';
import {
  Notification,
  NotificationType,
} from '../src/notifications/entities/notification.entity';
import { RolePermission } from '../src/roles/entities/role-permission.entity';
import { Permission } from '../src/permissions/entities/permission.entity';
import { MailService } from '../src/mail/mail.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { NotificationScheduler } from '../src/notifications/notification.scheduler';
import { InvitationStatus, UserStatus, StoreStatus } from '../src/common/enum';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('StoresService - Invitation Flow', () => {
  let service: StoresService;
  let userRepository: jest.Mocked<Repository<User>>;
  let storeRepository: jest.Mocked<Repository<Store>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let invitationRepository: jest.Mocked<Repository<Invitation>>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let mailService: jest.Mocked<MailService>;

  const mockStore: Store = {
    id: 1,
    name: 'Test Store',
    status: StoreStatus.ACTIVE,
    phone: '1234567890',
    address: 'Test Address',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postal_code: '12345',
    logo_url: null,
    notification_schedule: null,
    created_at: new Date(),
    updated_at: new Date(),
    users: [],
    roles: [],
    notifications: [],
    invitations: [],
    categories: [],
  };

  const mockAdminUser: User = {
    user_id: 1,
    email: 'admin@test.com',
    full_name: 'Admin User',
    password_hash: 'hashedpassword',
    phone: '1234567890',
    address: 'Test Address',
    store_id: 1,
    role_id: 1,
    status: UserStatus.ACTIVE,
    reset_password_token: null,
    reset_password_expires_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    last_login_at: null,
    avatar_url: null,
    store: null,
    role: null,
    orders: [],
    cancelled_orders: [],
    notifications: [],
  };

  const mockExistingUser: User = {
    user_id: 2,
    email: 'existing@test.com',
    full_name: 'Existing User',
    password_hash: 'hashedpassword',
    phone: '0987654321',
    address: 'Test Address 2',
    store_id: null,
    role_id: null,
    status: UserStatus.ACTIVE,
    reset_password_token: null,
    reset_password_expires_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    last_login_at: null,
    avatar_url: null,
    store: null,
    role: null,
    orders: [],
    cancelled_orders: [],
    notifications: [],
  };

  const mockRole: Role = {
    id: 2,
    name: 'STAFF',
    description: 'Staff Role',
    is_editable: true,
    is_system_role: false,
    store_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
    store: null,
    users: [],
    role_permissions: [],
  };

  const mockInvitation: Invitation = {
    id: 1,
    email: 'existing@test.com',
    store_id: 1,
    role_id: 2,
    status: InvitationStatus.PENDING,
    token: 'test-token-123',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    invited_by: 1,
    message: 'Welcome to our store',
    created_at: new Date(),
    store: null,
    role: null,
    inviter: null,
  };

  beforeEach(async () => {
    const createMockRepository = () => ({
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: getRepositoryToken(Store),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Role),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Invitation),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: createMockRepository(),
        },
        {
          provide: MailService,
          useValue: {
            sendInvitationEmail: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            createInvitationNotification: jest.fn(),
          },
        },
        {
          provide: NotificationScheduler,
          useValue: {
            registerStoreJob: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) => {
              mockTransactionalEntityManager = {
                create: jest.fn((entity, data) => ({ ...data })),
                save: jest.fn((entity) =>
                  Promise.resolve({ ...entity, id: 1 }),
                ),
              };
              return cb(mockTransactionalEntityManager);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
    userRepository = module.get(getRepositoryToken(User));
    storeRepository = module.get(getRepositoryToken(Store));
    roleRepository = module.get(getRepositoryToken(Role));
    invitationRepository = module.get(getRepositoryToken(Invitation));
    notificationsService = module.get(NotificationsService);
    mailService = module.get(MailService);
    dataSource = module.get(DataSource);
  });

  let mockTransactionalEntityManager: any;

  describe('inviteStaff - notification creation', () => {
    it('should create invitation and notification when user exists', async () => {
      const storeId = 1;
      const currentUserId = 1;
      const inviteStaffDto = {
        email: 'existing@test.com',
        role_id: 2,
        full_name: 'Existing User',
        message: 'Welcome to our store',
      };

      userRepository.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(mockExistingUser);

      storeRepository.findOne.mockResolvedValue(mockStore);
      roleRepository.findOne.mockResolvedValue(mockRole);
      mailService.sendInvitationEmail.mockResolvedValue(undefined);
      notificationsService.createInvitationNotification.mockResolvedValue(
        {} as any,
      );

      const result = await service.inviteStaff(
        storeId,
        inviteStaffDto,
        currentUserId,
      );

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockTransactionalEntityManager.create).toHaveBeenCalledWith(
        Invitation,
        expect.objectContaining({
          email: inviteStaffDto.email,
          store_id: storeId,
          role_id: inviteStaffDto.role_id,
          status: InvitationStatus.PENDING,
          invited_by: currentUserId,
        }),
      );
      expect(mockTransactionalEntityManager.save).toHaveBeenCalled();

      expect(mockTransactionalEntityManager.create).toHaveBeenCalledWith(
        Notification,
        expect.objectContaining({
          store_id: storeId,
          user_id: mockExistingUser.user_id,
          type: NotificationType.STORE_INVITATION,
        }),
      );

      expect(mailService.sendInvitationEmail).toHaveBeenCalled();
      expect(result.message).toBe('Gửi lời mời thành công');
    });

    it('should create invitation without notification when user does not exist', async () => {
      const storeId = 1;
      const currentUserId = 1;
      const inviteStaffDto = {
        email: 'newuser@test.com',
        role_id: 2,
        full_name: 'New User',
        message: 'Welcome',
      };

      userRepository.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(null);

      storeRepository.findOne.mockResolvedValue(mockStore);
      roleRepository.findOne.mockResolvedValue(mockRole);
      invitationRepository.create.mockReturnValue({
        ...mockInvitation,
        email: 'newuser@test.com',
      });
      invitationRepository.save.mockResolvedValue({
        ...mockInvitation,
        email: 'newuser@test.com',
      });
      mailService.sendInvitationEmail.mockResolvedValue(undefined);

      const result = await service.inviteStaff(
        storeId,
        inviteStaffDto,
        currentUserId,
      );

      expect(
        notificationsService.createInvitationNotification,
      ).not.toHaveBeenCalled();
      expect(result.message).toBe('Gửi lời mời thành công');
    });

    it('should throw ForbiddenException when user is not store member', async () => {
      const storeId = 1;
      const currentUserId = 999;
      const inviteStaffDto = {
        email: 'test@test.com',
        role_id: 2,
      };

      userRepository.findOne.mockResolvedValue({
        ...mockAdminUser,
        store_id: 999,
      });

      await expect(
        service.inviteStaff(storeId, inviteStaffDto, currentUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when user already in store', async () => {
      const storeId = 1;
      const currentUserId = 1;
      const inviteStaffDto = {
        email: 'existing@test.com',
        role_id: 2,
      };

      userRepository.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce({ ...mockExistingUser, store_id: storeId });

      storeRepository.findOne.mockResolvedValue(mockStore);
      roleRepository.findOne.mockResolvedValue(mockRole);

      await expect(
        service.inviteStaff(storeId, inviteStaffDto, currentUserId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and update user store and role', async () => {
      const token = 'test-token-123';
      const userWithStore = { ...mockExistingUser, store_id: 1, role_id: 2 };

      invitationRepository.findOne.mockResolvedValue(mockInvitation);
      storeRepository.findOne.mockResolvedValue(mockStore);
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.findOne
        .mockResolvedValueOnce(mockExistingUser)
        .mockResolvedValueOnce(userWithStore);
      userRepository.update.mockResolvedValue(undefined);
      invitationRepository.update.mockResolvedValue(undefined);

      const result = await service.acceptInvitation(token);

      expect(invitationRepository.findOne).toHaveBeenCalledWith({
        where: { token },
      });
      expect(userRepository.update).toHaveBeenCalledWith(
        mockExistingUser.user_id,
        {
          store_id: mockInvitation.store_id,
          role_id: mockInvitation.role_id,
          status: UserStatus.ACTIVE,
          last_active_at: expect.any(Date),
        },
      );
      expect(invitationRepository.update).toHaveBeenCalledWith(
        mockInvitation.id,
        {
          status: InvitationStatus.ACCEPTED,
        },
      );
      expect(result.message).toBe('Chấp nhận lời mời thành công');
      expect(result.store.id).toBe(mockStore.id);
      expect(result.role.id).toBe(mockRole.id);
    });

    it('should throw NotFoundException for invalid token', async () => {
      const token = 'invalid-token';

      invitationRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException for already accepted invitation', async () => {
      const token = 'test-token-123';
      const acceptedInvitation = {
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
      };

      invitationRepository.findOne.mockResolvedValue(acceptedInvitation);

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException for expired invitation', async () => {
      const token = 'test-token-123';
      const expiredInvitation = {
        ...mockInvitation,
        expires_at: new Date(Date.now() - 1000),
      };

      invitationRepository.findOne.mockResolvedValue(expiredInvitation);
      invitationRepository.update.mockResolvedValue(undefined);

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when user not found for invitation email', async () => {
      const token = 'test-token-123';

      invitationRepository.findOne.mockResolvedValue(mockInvitation);
      storeRepository.findOne.mockResolvedValue(mockStore);
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when user already in another store', async () => {
      const token = 'test-token-123';
      const userInOtherStore = {
        ...mockExistingUser,
        store_id: 999,
      };

      invitationRepository.findOne.mockResolvedValue(mockInvitation);
      storeRepository.findOne.mockResolvedValue(mockStore);
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.findOne.mockResolvedValue(userInOtherStore);

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
