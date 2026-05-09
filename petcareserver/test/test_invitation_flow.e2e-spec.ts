import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { Store } from '../src/stores/entities/store.entity';
import { Role } from '../src/roles/entities/role.entity';
import { Invitation } from '../src/stores/entities/invitation.entity';
import { Notification } from '../src/notifications/entities/notification.entity';
import { Permission } from '../src/permissions/entities/permission.entity';
import {
  UserStatus,
  StoreStatus,
  InvitationStatus,
  PermissionScope,
} from '../src/common/enum';
import { STORE_PERMISSIONS } from '../src/common/permissions';

/**
 * E2E Test Flow:
 * 1. Register 2 new users (user1 and user2)
 * 2. Login both users to get JWT tokens
 * 3. User1 creates a store (automatically gets ADMIN role)
 * 4. User1 creates a STAFF role with limited permissions
 * 5. User1 sends an invitation to user2's email
 * 6. User2 retrieves notifications and sees the invitation
 * 7. User2 accepts the invitation using the token
 * 8. Verify user2 now has store_id and role_id assigned
 */

describe('Invitation Flow (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let storeRepository: Repository<Store>;
  let roleRepository: Repository<Role>;
  let invitationRepository: Repository<Invitation>;
  let notificationRepository: Repository<Notification>;
  let permissionRepository: Repository<Permission>;

  let user1Token: string;
  let user2Token: string;
  let user1Id: number;
  let user2Id: number;
  let storeId: number;
  let staffRoleId: number;
  let invitationToken: string;

  const user1Data = {
    email: `user1.${Date.now()}@test.com`,
    password: 'Password123!',
    full_name: 'User One',
    phone: '1234567890',
    address: '123 Test Street',
  };

  const user2Data = {
    email: `user2.${Date.now()}@test.com`,
    password: 'Password123!',
    full_name: 'User Two',
    phone: '0987654321',
    address: '456 Test Avenue',
  };

  const storeData = {
    name: `Test Store ${Date.now()}`,
    phone: '5555555555',
    address: '789 Store Street',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postal_code: '12345',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    userRepository = moduleFixture.get(getRepositoryToken(User));
    storeRepository = moduleFixture.get(getRepositoryToken(Store));
    roleRepository = moduleFixture.get(getRepositoryToken(Role));
    invitationRepository = moduleFixture.get(getRepositoryToken(Invitation));
    notificationRepository = moduleFixture.get(
      getRepositoryToken(Notification),
    );
    permissionRepository = moduleFixture.get(getRepositoryToken(Permission));

    await app.init();

    await seedPermissions();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  async function seedPermissions() {
    const permissionsToSeed = [
      {
        slug: STORE_PERMISSIONS.PRODUCT_VIEW,
        scope: PermissionScope.STORE,
        description: 'View products',
        module: 'inventory',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.PRODUCT_MANAGE,
        scope: PermissionScope.STORE,
        description: 'Manage products',
        module: 'inventory',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.ORDER_VIEW,
        scope: PermissionScope.STORE,
        description: 'View orders',
        module: 'orders',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.ORDER_VIEW_ALL,
        scope: PermissionScope.STORE,
        description: 'View all orders',
        module: 'orders',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.STAFF_VIEW,
        scope: PermissionScope.STORE,
        description: 'View staff',
        module: 'staff',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.STAFF_INVITE,
        scope: PermissionScope.STORE,
        description: 'Invite staff',
        module: 'staff',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.ROLE_VIEW,
        scope: PermissionScope.STORE,
        description: 'View roles',
        module: 'staff',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.ROLE_CREATE,
        scope: PermissionScope.STORE,
        description: 'Create roles',
        module: 'staff',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.ROLE_EDIT,
        scope: PermissionScope.STORE,
        description: 'Edit roles',
        module: 'staff',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.CATEGORY_MANAGE,
        scope: PermissionScope.STORE,
        description: 'Manage categories',
        module: 'inventory',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.STORE_VIEW,
        scope: PermissionScope.STORE,
        description: 'View store',
        module: 'store',
        is_system_defined: true,
      },
      {
        slug: STORE_PERMISSIONS.STORE_SETTINGS_MANAGE,
        scope: PermissionScope.STORE,
        description: 'Manage store settings',
        module: 'store',
        is_system_defined: true,
      },
    ];

    for (const perm of permissionsToSeed) {
      const permission = permissionRepository.create(perm);
      await permissionRepository.save(permission);
    }
  }

  describe('Complete Invitation Flow', () => {
    it('should register user1', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(user1Data)
        .expect(201);

      expect(response.body.message).toBe('Đăng ký tài khoản thành công');
      expect(response.body.user.email).toBe(user1Data.email);
      expect(response.body.user.full_name).toBe(user1Data.full_name);
      user1Id = response.body.user.user_id;
    });

    it('should register user2', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(user2Data)
        .expect(201);

      expect(response.body.message).toBe('Đăng ký tài khoản thành công');
      expect(response.body.user.email).toBe(user2Data.email);
      expect(response.body.user.full_name).toBe(user2Data.full_name);
      user2Id = response.body.user.user_id;
    });

    it('should login user1', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: user1Data.email,
          password: user1Data.password,
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.email).toBe(user1Data.email);
      user1Token = response.body.access_token;
    });

    it('should login user2', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: user2Data.email,
          password: user2Data.password,
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.email).toBe(user2Data.email);
      user2Token = response.body.access_token;
    });

    it('should create a store for user1 (auto-assigns ADMIN role)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/stores')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(storeData)
        .expect(201);

      expect(response.body.message).toBe('Tạo cửa hàng thành công');
      expect(response.body.store.name).toBe(storeData.name);
      expect(response.body.admin_role.name).toBe('ADMIN');

      storeId = response.body.store.id;

      const updatedUser = await userRepository.findOne({
        where: { user_id: user1Id },
      });
      expect(updatedUser!.store_id).toBe(storeId);
      expect(updatedUser!.role_id).toBe(response.body.admin_role.id);
    });

    it('should create a STAFF role for the store', async () => {
      const permissions = await permissionRepository.find({
        where: { scope: PermissionScope.STORE },
      });

      const staffPermissions = permissions
        .filter((p) => p.slug.includes('view_'))
        .map((p) => p.id);

      const response = await request(app.getHttpServer())
        .post(`/v1/stores/${storeId}/roles`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'STAFF',
          description: 'Staff role with limited permissions',
          permission_ids: staffPermissions,
        })
        .expect(201);

      expect(response.body.name).toBe('STAFF');
      expect(response.body.permissions.length).toBeGreaterThan(0);
      staffRoleId = response.body.id;
    });

    it('should invite user2 to the store', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/stores/${storeId}/invite`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          email: user2Data.email,
          role_id: staffRoleId,
          full_name: user2Data.full_name,
          message: 'Welcome to our team!',
        })
        .expect(201);

      expect(response.body.message).toBe('Gửi lời mời thành công');
      expect(response.body.invitation.email).toBe(user2Data.email);
      expect(response.body.invitation.status).toBe(InvitationStatus.PENDING);
      expect(response.body.invitation.token).toBeDefined();

      invitationToken = response.body.invitation.token;
    });

    it('should create notification for user2', async () => {
      const notification = await notificationRepository.findOne({
        where: {
          user_id: user2Id,
          type: 'Lời mời cửa hàng' as any,
        },
      });

      expect(notification).toBeDefined();
      expect(notification!.store_id).toBe(storeId);
      expect(notification!.title).toContain(storeData.name);
    });

    it('should retrieve notifications for user2', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/notifications/user')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].user_id).toBe(user2Id);
      expect(response.body[0].type).toBe('Lời mời cửa hàng');
      expect(response.body[0].title).toContain(storeData.name);
    });

    it('should accept the invitation', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/stores/invitations/accept?token=${invitationToken}`)
        .expect(200);

      expect(response.body.message).toBe('Chấp nhận lời mời thành công');
      expect(response.body.user.user_id).toBe(user2Id);
      expect(response.body.store.id).toBe(storeId);
      expect(response.body.role.id).toBe(staffRoleId);
    });

    it('should verify user2 has store and role assigned', async () => {
      const updatedUser = await userRepository.findOne({
        where: { user_id: user2Id },
        relations: ['store', 'role'],
      });

      expect(updatedUser!.store_id).toBe(storeId);
      expect(updatedUser!.role_id).toBe(staffRoleId);
      expect(updatedUser!.status).toBe(UserStatus.ACTIVE);
      expect(updatedUser!.store.name).toBe(storeData.name);
      expect(updatedUser!.role.name).toBe('STAFF');
    });

    it('should verify invitation status is ACCEPTED', async () => {
      const invitation = await invitationRepository.findOne({
        where: { token: invitationToken },
      });

      expect(invitation!.status).toBe(InvitationStatus.ACCEPTED);
    });

    it('should verify user2 can access store resources', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/stores/${storeId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.id).toBe(storeId);
      expect(response.body.name).toBe(storeData.name);
    });

    it('should verify user2 can view their role', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/stores/${storeId}/roles/${staffRoleId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.name).toBe('STAFF');
      expect(response.body.permissions.length).toBeGreaterThan(0);
    });

    it('should verify user2 cannot manage staff (permission check)', async () => {
      await request(app.getHttpServer())
        .post(`/v1/stores/${storeId}/roles`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'TEST_ROLE',
          description: 'Test role',
          permission_ids: [],
        })
        .expect(403);
    });
  });
});
