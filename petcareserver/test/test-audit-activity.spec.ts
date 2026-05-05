import { StoresService } from '../src/stores/stores.service';
import { CustomerHistory } from '../src/customers/entities/customer-history.entity';
import { ProductHistory } from '../src/categories/entities/product-history.entity';
import { ServiceHistory } from '../src/categories/entities/service-history.entity';
import { OrderHistory } from '../src/orders/entities/order-history.entity';
import { RoleHistory } from '../src/roles/entities/role-history.entity';

describe('StoresService - Activity Timeline (ORDER & ROLE)', () => {
  let service: StoresService;
  let storeRepo: jest.Mocked<any>;
  let userRepo: jest.Mocked<any>;
  let roleRepo: jest.Mocked<any>;
  let rolePermissionRepo: jest.Mocked<any>;
  let permissionRepo: jest.Mocked<any>;
  let invitationRepo: jest.Mocked<any>;
  let customerHistoryRepo: jest.Mocked<any>;
  let productHistoryRepo: jest.Mocked<any>;
  let serviceHistoryRepo: jest.Mocked<any>;
  let orderHistoryRepo: jest.Mocked<any>;
  let roleHistoryRepo: jest.Mocked<any>;
  let mailService: jest.Mocked<any>;
  let notificationScheduler: jest.Mocked<any>;
  let notificationsService: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;
  let configService: jest.Mocked<any>;

  beforeEach(() => {
    storeRepo = {};
    userRepo = {};
    roleRepo = {};
    rolePermissionRepo = {};
    permissionRepo = {};
    invitationRepo = {};
    customerHistoryRepo = { find: jest.fn().mockResolvedValue([]) };
    productHistoryRepo = { find: jest.fn().mockResolvedValue([]) };
    serviceHistoryRepo = { find: jest.fn().mockResolvedValue([]) };
    orderHistoryRepo = { find: jest.fn().mockResolvedValue([]) };
    roleHistoryRepo = { find: jest.fn().mockResolvedValue([]) };
    mailService = {};
    notificationScheduler = {};
    notificationsService = {};
    dataSource = {};
    configService = {};

    service = new StoresService(
      storeRepo as any,
      userRepo as any,
      roleRepo as any,
      rolePermissionRepo as any,
      permissionRepo as any,
      invitationRepo as any,
      customerHistoryRepo as any,
      productHistoryRepo as any,
      serviceHistoryRepo as any,
      orderHistoryRepo as any,
      roleHistoryRepo as any,
      mailService as any,
      notificationScheduler as any,
      notificationsService as any,
      dataSource as any,
      configService as any,
    );
  });

  describe('getActivity', () => {
    const storeId = 10;

    it('should include ORDER entity_type in results when order history exists', async () => {
      const orderRows = [
        {
          id: 1,
          order_id: 100,
          store_id: storeId,
          action: 'CANCELLED',
          performed_by: 5,
          performed_by_name: 'Admin',
          old_values: { status: 'PENDING' },
          new_values: { status: 'CANCELLED' },
          created_at: new Date('2025-01-01'),
        },
      ];
      orderHistoryRepo.find.mockResolvedValue(orderRows);

      const result = await service.getActivity(storeId, { entity_type: 'ORDER' });

      expect(result).toHaveLength(1);
      expect(result[0].entity_type).toBe('ORDER');
      expect(result[0].entity_id).toBe(100);
      expect(result[0].action).toBe('CANCELLED');
    });

    it('should include ROLE entity_type in results when role history exists', async () => {
      const roleRows = [
        {
          id: 2,
          role_id: 50,
          store_id: storeId,
          action: 'PERMISSIONS_CHANGED',
          performed_by: 5,
          performed_by_name: 'Admin',
          old_values: { permission_ids: [1, 2] },
          new_values: { permission_ids: [1, 3] },
          created_at: new Date('2025-01-02'),
        },
      ];
      roleHistoryRepo.find.mockResolvedValue(roleRows);

      const result = await service.getActivity(storeId, { entity_type: 'ROLE' });

      expect(result).toHaveLength(1);
      expect(result[0].entity_type).toBe('ROLE');
      expect(result[0].entity_id).toBe(50);
      expect(result[0].action).toBe('PERMISSIONS_CHANGED');
    });

    it('should return all entity types including ORDER and ROLE when no filter specified', async () => {
      const now = new Date();
      customerHistoryRepo.find.mockResolvedValue([
        { id: 1, customer_id: 10, store_id: storeId, action: 'CREATED', performed_by: null, performed_by_name: null, old_values: null, new_values: {}, created_at: new Date(now.getTime() - 3000) },
      ]);
      productHistoryRepo.find.mockResolvedValue([
        { id: 2, product_id: 20, store_id: storeId, action: 'STOCK_CHANGED', performed_by: null, performed_by_name: null, old_values: null, new_values: {}, created_at: new Date(now.getTime() - 2000) },
      ]);
      serviceHistoryRepo.find.mockResolvedValue([
        { id: 3, service_id: 30, store_id: storeId, action: 'UPDATED', performed_by: null, performed_by_name: null, old_values: null, new_values: {}, created_at: new Date(now.getTime() - 1000) },
      ]);
      orderHistoryRepo.find.mockResolvedValue([
        { id: 4, order_id: 40, store_id: storeId, action: 'CANCELLED', performed_by: 5, performed_by_name: 'Admin', old_values: null, new_values: {}, created_at: new Date(now.getTime() + 0) },
      ]);
      roleHistoryRepo.find.mockResolvedValue([
        { id: 5, role_id: 50, store_id: storeId, action: 'PERMISSIONS_CHANGED', performed_by: 5, performed_by_name: 'Admin', old_values: null, new_values: {}, created_at: new Date(now.getTime() + 1000) },
      ]);

      const result = await service.getActivity(storeId);

      expect(result).toHaveLength(5);
      const entityTypes = result.map((r: any) => r.entity_type);
      expect(entityTypes).toContain('CUSTOMER');
      expect(entityTypes).toContain('PRODUCT');
      expect(entityTypes).toContain('SERVICE');
      expect(entityTypes).toContain('ORDER');
      expect(entityTypes).toContain('ROLE');
    });

    it('should sort results by created_at DESC across all entity types', async () => {
      const t1 = new Date('2025-01-01');
      const t2 = new Date('2025-01-02');
      const t3 = new Date('2025-01-03');

      customerHistoryRepo.find.mockResolvedValue([
        { id: 1, customer_id: 10, store_id: storeId, action: 'CREATED', performed_by: null, performed_by_name: null, old_values: null, new_values: {}, created_at: t1 },
      ]);
      orderHistoryRepo.find.mockResolvedValue([
        { id: 2, order_id: 40, store_id: storeId, action: 'CANCELLED', performed_by: null, performed_by_name: null, old_values: null, new_values: {}, created_at: t3 },
      ]);
      roleHistoryRepo.find.mockResolvedValue([
        { id: 3, role_id: 50, store_id: storeId, action: 'UPDATED', performed_by: null, performed_by_name: null, old_values: null, new_values: {}, created_at: t2 },
      ]);

      const result = await service.getActivity(storeId);

      expect(result[0].entity_type).toBe('ORDER');
      expect(result[0].created_at).toEqual(t3);
      expect(result[1].entity_type).toBe('ROLE');
      expect(result[1].created_at).toEqual(t2);
      expect(result[2].entity_type).toBe('CUSTOMER');
      expect(result[2].created_at).toEqual(t1);
    });

    it('should filter by performed_by for ORDER and ROLE entity types', async () => {
      await service.getActivity(storeId, { entity_type: 'ORDER', performed_by: 5 });

      expect(orderHistoryRepo.find).toHaveBeenCalledWith({
        where: { store_id: storeId, performed_by: 5 },
        order: { created_at: 'DESC' },
      });

      await service.getActivity(storeId, { entity_type: 'ROLE', performed_by: 5 });

      expect(roleHistoryRepo.find).toHaveBeenCalledWith({
        where: { store_id: storeId, performed_by: 5 },
        order: { created_at: 'DESC' },
      });
    });
  });
});
