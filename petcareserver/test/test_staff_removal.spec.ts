import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StoresService } from '../src/stores/stores.service';
import { Store } from '../src/stores/entities/store.entity';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/roles/entities/role.entity';
import { Invitation } from '../src/stores/entities/invitation.entity';
import { RolePermission } from '../src/roles/entities/role-permission.entity';
import { Permission } from '../src/permissions/entities/permission.entity';
import { MailService } from '../src/mail/mail.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { NotificationScheduler } from '../src/notifications/notification.scheduler';
import { UserStatus } from '../src/common/enum';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('StoresService - Staff Removal', () => {
  let service: StoresService;
  let userRepository: jest.Mocked<Repository<User>>;

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
    role: {
      id: 1,
      name: 'ADMIN',
      description: '',
      is_editable: false,
      is_system_role: false,
      store_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
      store: null,
      users: [],
      role_permissions: [],
    } as Role,
    orders: [],
    cancelled_orders: [],
    notifications: [],
  };

  const mockStaffUser: User = {
    user_id: 2,
    email: 'staff@test.com',
    full_name: 'Staff User',
    password_hash: 'hashedpassword',
    phone: '0987654321',
    address: 'Test Address 2',
    store_id: 1,
    role_id: 2,
    status: UserStatus.ACTIVE,
    reset_password_token: null,
    reset_password_expires_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    last_login_at: null,
    avatar_url: null,
    store: null,
    role: {
      id: 2,
      name: 'STAFF',
      description: '',
      is_editable: true,
      is_system_role: false,
      store_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
      store: null,
      users: [],
      role_permissions: [],
    } as Role,
    orders: [],
    cancelled_orders: [],
    notifications: [],
  };

  const mockSecondAdminUser: User = {
    user_id: 3,
    email: 'admin2@test.com',
    full_name: 'Admin Two',
    password_hash: 'hashedpassword',
    phone: '1112223333',
    address: 'Test Address 3',
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
    role: {
      id: 1,
      name: 'ADMIN',
      description: '',
      is_editable: false,
      is_system_role: false,
      store_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
      store: null,
      users: [],
      role_permissions: [],
    } as Role,
    orders: [],
    cancelled_orders: [],
    notifications: [],
  };

  const createMockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
    })),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: getRepositoryToken(Store),
          useValue: createMockRepository(),
        },
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        { provide: getRepositoryToken(Role), useValue: createMockRepository() },
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
          useValue: { sendInvitationEmail: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: { createInvitationNotification: jest.fn() },
        },
        {
          provide: NotificationScheduler,
          useValue: { registerStoreJob: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) => {
              const em = {
                create: jest.fn((_, data) => ({ ...data })),
                save: jest.fn((entity) =>
                  Promise.resolve({ ...entity, id: 1 }),
                ),
              };
              return cb(em);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('removeStaff', () => {
    it('should remove a staff member from the store', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(mockStaffUser);
      userRepository.update.mockResolvedValue(undefined);
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      });

      const result = await service.removeStaff(1, 2, 1);

      expect(userRepository.update).toHaveBeenCalledWith(2, {
        store_id: null as any,
        role_id: null as any,
      });
      expect(result.message).toBe('Đã xóa nhân viên khỏi cửa hàng');
      expect(result.user.user_id).toBe(2);
    });

    it('should throw ForbiddenException when trying to remove self', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockAdminUser);

      await expect(service.removeStaff(1, 1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when target user not found', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(null);

      await expect(service.removeStaff(1, 999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when target user not in the same store', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce({ ...mockStaffUser, store_id: 999 });

      await expect(service.removeStaff(1, 2, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when removing the last admin', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce({ ...mockAdminUser, user_id: 2 })
        .mockResolvedValueOnce({ ...mockAdminUser, user_id: 2 });
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });

      await expect(service.removeStaff(1, 2, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow removing an admin when there are other admins', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(mockSecondAdminUser);
      userRepository.update.mockResolvedValue(undefined);
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      });

      const result = await service.removeStaff(1, 3, 1);

      expect(userRepository.update).toHaveBeenCalledWith(3, {
        store_id: null as any,
        role_id: null as any,
      });
      expect(result.message).toBe('Đã xóa nhân viên khỏi cửa hàng');
    });
  });

  describe('leaveStore', () => {
    it('should allow a staff member to leave the store', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockStaffUser);
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      });
      userRepository.update.mockResolvedValue(undefined);

      const result = await service.leaveStore(1, 2);

      expect(userRepository.update).toHaveBeenCalledWith(2, {
        store_id: null as any,
        role_id: null as any,
      });
      expect(result.message).toBe('Đã rời cửa hàng thành công');
      expect(result.user_id).toBe(2);
    });

    it('should throw ForbiddenException when last admin tries to leave', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(mockAdminUser);
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });

      await expect(service.leaveStore(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow admin to leave when there are other admins', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockAdminUser);
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      });
      userRepository.update.mockResolvedValue(undefined);

      const result = await service.leaveStore(1, 1);

      expect(userRepository.update).toHaveBeenCalledWith(1, {
        store_id: null as any,
        role_id: null as any,
      });
      expect(result.message).toBe('Đã rời cửa hàng thành công');
    });

    it('should throw ForbiddenException when user is not a member of the store', async () => {
      userRepository.findOne.mockResolvedValueOnce({
        ...mockStaffUser,
        store_id: 999,
      });

      await expect(service.leaveStore(1, 2)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow super admin to bypass store membership check', async () => {
      userRepository.findOne.mockResolvedValueOnce({
        ...mockStaffUser,
        store_id: 1,
      });
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      });
      userRepository.update.mockResolvedValue(undefined);

      const result = await service.leaveStore(1, 2, true);

      expect(result.message).toBe('Đã rời cửa hàng thành công');
    });
  });
});
