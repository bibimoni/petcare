import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotificationsService } from '../src/notifications/notifications.service';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from '../src/notifications/entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: jest.Mocked<Repository<Notification>>;
  let configService: jest.Mocked<ConfigService>;

  const mockNotification: Notification = {
    notification_id: 1,
    store_id: 1,
    store: null,
    product_id: null,
    product: null,
    user_id: 1,
    user: null,
    type: NotificationType.STORE_INVITATION,
    status: NotificationStatus.UNREAD,
    title: 'Test Notification',
    message: 'Test Message',
    product_name: null,
    action_url: 'http://localhost:3000/accept-invitation?token=test-token',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get(getRepositoryToken(Notification));
    configService = module.get(ConfigService);
  });

  describe('createInvitationNotification', () => {
    it('should create invitation notification with invitation token', async () => {
      const storeId = 1;
      const userId = 2;
      const storeName = 'Test Store';
      const roleName = 'STAFF';
      const invitationToken = 'test-invite-token-123';
      const frontendUrl = 'http://localhost:3000';

      configService.get.mockReturnValue(frontendUrl);
      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createInvitationNotification(
        storeId,
        userId,
        storeName,
        roleName,
        invitationToken,
      );

      expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL');
      expect(notificationRepository.create).toHaveBeenCalledWith({
        store_id: storeId,
        user_id: userId,
        type: NotificationType.STORE_INVITATION,
        title: `Lời mời tham gia ${storeName}`,
        message: `Bạn được mời tham gia ${storeName} với vai trò ${roleName}`,
        action_url: `${frontendUrl}/accept-invitation?token=${invitationToken}`,
      });
      expect(notificationRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it('should create invitation notification without invitation token', async () => {
      const storeId = 1;
      const userId = 2;
      const storeName = 'Test Store';
      const roleName = 'STAFF';
      const frontendUrl = 'http://localhost:3000';

      const notificationWithoutToken = {
        ...mockNotification,
        action_url: undefined,
      };

      configService.get.mockReturnValue(frontendUrl);
      notificationRepository.create.mockReturnValue(notificationWithoutToken);
      notificationRepository.save.mockResolvedValue(notificationWithoutToken);

      const result = await service.createInvitationNotification(
        storeId,
        userId,
        storeName,
        roleName,
      );

      expect(notificationRepository.create).toHaveBeenCalledWith({
        store_id: storeId,
        user_id: userId,
        type: NotificationType.STORE_INVITATION,
        title: `Lời mời tham gia ${storeName}`,
        message: `Bạn được mời tham gia ${storeName} với vai trò ${roleName}`,
        action_url: undefined,
      });
      expect(result.action_url).toBeUndefined();
    });
  });

  describe('findByUser', () => {
    let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Notification>>;

    beforeEach(() => {
      mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      } as any;

      notificationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
    });

    it('should return both personal and store-wide notifications when user has a store', async () => {
      const userId = 1;
      const storeId = 10;
      const notifications = [mockNotification];

      mockQueryBuilder.getMany.mockResolvedValue(notifications);

      const result = await service.findByUser(userId, storeId);

      expect(notificationRepository.createQueryBuilder).toHaveBeenCalledWith(
        'notification',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'notification.created_at',
        'DESC',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(notification.user_id = :userId OR (notification.store_id = :storeId AND notification.user_id IS NULL))',
        { userId, storeId },
      );
      expect(result).toEqual(notifications);
    });

    it('should return only personal notifications when user does not have a store', async () => {
      const userId = 1;
      const notifications = [mockNotification];

      mockQueryBuilder.getMany.mockResolvedValue(notifications);

      const result = await service.findByUser(userId, null);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'notification.user_id = :userId',
        { userId },
      );
      expect(result).toEqual(notifications);
    });

    it('should filter by status when provided', async () => {
      const userId = 1;
      const storeId = 10;
      const status = NotificationStatus.UNREAD;
      const notifications = [mockNotification];

      mockQueryBuilder.getMany.mockResolvedValue(notifications);

      const result = await service.findByUser(userId, storeId, status);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notification.status = :status',
        { status },
      );
      expect(result).toEqual(notifications);
    });
  });
});
