import * as bcrypt from 'bcrypt';
import { createConnection } from 'typeorm';

// Entities
import { User } from '../src/users/entities/user.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderDetail } from '../src/orders/entities/order-detail.entity';
import { Product } from '../src/products/entities/product.entity';
import { Category } from '../src/products/entities/category.entity';
import { Service } from '../src/products/entities/service.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import { Pet } from '../src/customers/entities/pet.entity';
import { PetWeightHistory } from '../src/customers/entities/pet-weight-history.entity';
import { Store } from '../src/stores/entities/store.entity';
import { Permission } from '../src/permissions/entities/permission.entity';
import { Role } from '../src/roles/entities/role.entity';
import { RolePermission } from '../src/roles/entities/role-permission.entity';

// Enums and Constants
import {
  UserRole,
  UserStatus,
  ALL_SYSTEM_PERMISSIONS,
  ALL_STORE_PERMISSIONS,
  SYSTEM_ROLES,
  STORE_ROLES,
  StoreStatus,
} from '../src/common/enum';

async function seedAdmin() {
  console.log('Connecting to database...');

  const connection = await createConnection({
    type: 'postgres',
    url: process.env.POSTGRES_URI || 'postgresql://postgres:password@localhost:5432/petcare_dev',
    entities: [
      User,
      Order,
      OrderDetail,
      Product,
      Category,
      Service,
      Customer,
      Pet,
      PetWeightHistory,
      Store,
      Permission,
      Role,
      RolePermission,
    ],
    synchronize: true,
    ssl: process.env.POSTGRES_URI ? { rejectUnauthorized: false } : false,
  });

  console.log('Database connected successfully');

  // Get repositories
  const userRepository = connection.getRepository(User);
  const storeRepository = connection.getRepository(Store);
  const permissionRepository = connection.getRepository(Permission);
  const roleRepository = connection.getRepository(Role);
  const rolePermissionRepository = connection.getRepository(RolePermission);

  console.log('\n=== Seeding Super Admin User ===');

  const existingSuperAdmin = await userRepository.findOne({
    where: { email: 'superadmin@petcare.com' },
  });

  let superAdmin: User;
  if (existingSuperAdmin) {
    console.log('Super admin user already exists');
    superAdmin = existingSuperAdmin;
  } else {
    console.log('Creating super admin user...');

    const hashedPassword = await bcrypt.hash('Admin@123456', 10);

    superAdmin = userRepository.create({
      email: 'superadmin@petcare.com',
      password_hash: hashedPassword,
      full_name: 'PetCare Super Admin',
      phone: '+1-555-0001',
      address: 'Platform Headquarters, Tech City',
      legacy_role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    });

    superAdmin = await userRepository.save(superAdmin);

    console.log(' Super admin created successfully');
    console.log(' Email: superadmin@petcare.com');
    console.log(' Password: Admin@123456');
    console.log(' Role: SUPER_ADMIN');
    console.log(' Status: ACTIVE');
  }

  console.log('\n=== Seeding Store ===');

  const existingStore = await storeRepository.findOne({
    where: { name: 'Pet Haven Veterinary Clinic' },
  });

  let store: Store;
  if (existingStore) {
    console.log('Store already exists');
    store = existingStore;
  } else {
    console.log('Creating store...');

    store = storeRepository.create({
      name: 'Pet Haven Veterinary Clinic',
      status: StoreStatus.ACTIVE,
      phone: '+1-555-0100',
      address: '123 Happy Pets Boulevard',
      city: 'Los Angeles',
      state: 'California',
      country: 'United States',
      postal_code: '90001',
    });

    store = await storeRepository.save(store);

    console.log(' Store created successfully');
    console.log(` Store ID: ${store.id}`);
    console.log(` Store Name: ${store.name}`);
  }

  // ==========================================
  // 3. SEED PERMISSIONS
  // ==========================================
  console.log('\n=== Seeding Permissions ===');

  let systemPermissionsCreated = 0;
  let storePermissionsCreated = 0;

  // Seed System Permissions
  console.log('Seeding system permissions...');
  for (const permissionSlug of ALL_SYSTEM_PERMISSIONS) {
    const existingPermission = await permissionRepository.findOne({
      where: { slug: permissionSlug },
    });

    if (!existingPermission) {
      const permission = permissionRepository.create({
        slug: permissionSlug,
        scope: 'SYSTEM',
        description: `System permission: ${permissionSlug}`,
        module: permissionSlug.split('.')[1] || 'system',
        is_system_defined: true,
      } as any);

      await permissionRepository.save(permission);
      systemPermissionsCreated++;
    }
  }

  // Seed Store Permissions
  console.log('Seeding store permissions...');
  for (const permissionSlug of ALL_STORE_PERMISSIONS) {
    const existingPermission = await permissionRepository.findOne({
      where: { slug: permissionSlug },
    });

    if (!existingPermission) {
      const module = permissionSlug.split('.')[0];
      const permission = permissionRepository.create({
        slug: permissionSlug,
        scope: 'STORE',
        description: `Store permission: ${permissionSlug}`,
        module: module,
        is_system_defined: true,
      } as any);

      await permissionRepository.save(permission);
      storePermissionsCreated++;
    }
  }

  console.log(`Permissions seeded successfully`);
  console.log(`System Permissions Created: ${systemPermissionsCreated}`);
  console.log(`Store Permissions Created: ${storePermissionsCreated}`);

  // Get all permissions for role assignment
  const allSystemPermissions = await permissionRepository.findBy({ scope: 'SYSTEM' as any });
  const allStorePermissions = await permissionRepository.findBy({ scope: 'STORE' as any });

  // ==========================================
  // 4. SEED SUPER ADMIN ROLE (SYSTEM ROLE)
  // ==========================================
  console.log('\n=== Seeding Super Admin Role ===');

  const existingSuperAdminRole = await roleRepository.findOne({
    where: { 
      name: SYSTEM_ROLES.SUPER_ADMIN,
      is_system_role: true,
      store_id: null as any,
    },
  });

  let superAdminRole: Role;
  if (existingSuperAdminRole) {
    console.log('Super admin role already exists');
    superAdminRole = existingSuperAdminRole;
  } else {
    console.log('Creating super admin role...');

    superAdminRole = roleRepository.create({
      name: SYSTEM_ROLES.SUPER_ADMIN,
      description: 'System Super Administrator with full platform access',
      is_editable: false,
      store_id: null as any,
      is_system_role: true,
    });

    superAdminRole = await roleRepository.save(superAdminRole);

    // Assign all system permissions to super admin role
    console.log('Assigning system permissions to super admin role...');
    for (const permission of allSystemPermissions) {
      await rolePermissionRepository.save({
        role_id: superAdminRole.id,
        permission_id: permission.id,
      });
    }

    console.log('Super admin role created with all system permissions');
    console.log(`Role ID: ${superAdminRole.id}`);
    console.log(`Permissions Assigned: ${allSystemPermissions.length}`);
  }

  // ==========================================
  // 5. SEED STORE ADMIN ROLE
  // ==========================================
  console.log('\n=== Seeding Store Admin Role ===');

  const existingStoreAdminRole = await roleRepository.findOne({
    where: { 
      name: STORE_ROLES.ADMIN,
      store_id: store.id,
    },
  });

  let storeAdminRole: Role;
  if (existingStoreAdminRole) {
    console.log('Store admin role already exists');
    storeAdminRole = existingStoreAdminRole;
  } else {
    console.log('Creating store admin role...');

    storeAdminRole = roleRepository.create({
      name: STORE_ROLES.ADMIN,
      description: 'Store Administrator with full store access',
      is_editable: false,
      store_id: store.id as number,
      is_system_role: false,
    });

    storeAdminRole = await roleRepository.save(storeAdminRole);

    // Assign all store permissions to admin role
    console.log('Assigning store permissions to admin role...');
    for (const permission of allStorePermissions) {
      await rolePermissionRepository.save({
        role_id: storeAdminRole.id,
        permission_id: permission.id,
      });
    }

    console.log('Store admin role created with all store permissions');
    console.log(`Role ID: ${storeAdminRole.id}`);
    console.log(`Permissions Assigned: ${allStorePermissions.length}`);
  }

  // ==========================================
  // 6. SEED STORE ADMIN USER
  // ==========================================
  console.log('\n=== Seeding Store Admin User ===');

  const existingStoreAdmin = await userRepository.findOne({
    where: { email: 'admin@pethaven.com' },
  });

  let storeAdmin: User;
  if (existingStoreAdmin) {
    console.log('Store admin user already exists');
    storeAdmin = existingStoreAdmin;
  } else {
    console.log('Creating store admin user...');

    const hashedPassword = await bcrypt.hash('Admin@123456', 10);

    storeAdmin = userRepository.create({
      email: 'admin@pethaven.com',
      password_hash: hashedPassword,
      full_name: 'Sarah Johnson',
      phone: '+1-555-0200',
      address: '456 Staff Quarters, Los Angeles, CA',
      store_id: store.id,
      role_id: storeAdminRole.id,
      legacy_role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    storeAdmin = await userRepository.save(storeAdmin);

    console.log('Store admin user created successfully');
    console.log('Email: admin@pethaven.com');
    console.log('Password: Admin@123456');
    console.log('Role: Store Admin');
    console.log('Store Id:', store.id);
  }

  // Update super admin with role
  if (superAdmin.role_id !== superAdminRole.id) {
    superAdmin.role_id = superAdminRole.id;
    await userRepository.save(superAdmin);
    console.log('Super admin linked to super admin role');
  }

  // ==========================================
  // SEEDING SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(50));
  console.log('SEEDING COMPLETED SUCCESSFULLY');
  console.log('='.repeat(50));
  console.log('\nSUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Super Admin User:');
  console.log(`Email: ${superAdmin.email}`);
  console.log(`Password: Admin@123456`);
  console.log(`Role: Super Admin`);
  console.log('');
  console.log('2. Store:');
  console.log(`Name: ${store.name}`);
  console.log(`ID: ${store.id}`);
  console.log('');
  console.log('3. Store Admin User:');
  console.log(`Email: ${storeAdmin.email}`);
  console.log(`Password: Admin@123456`);
  console.log(`Role: Store Admin`);
  console.log(`Store: ${store.name}`);
  console.log('');
  console.log('4. Permissions:');
  console.log(`System Permissions: ${allSystemPermissions.length}`);
  console.log(`Store Permissions: ${allStorePermissions.length}`);
  console.log(`Total: ${allSystemPermissions.length + allStorePermissions.length}`);
  console.log('');
  console.log('5. Roles:');
  console.log(`Super Admin Role: ${superAdminRole.name} (${allSystemPermissions.length} permissions)`);
  console.log(`Store Admin Role: ${storeAdminRole.name} (${allStorePermissions.length} permissions)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await connection.close();
  console.log('Database connection closed\n');
}

seedAdmin()
  .then(() => {
    console.log('Seeding process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
