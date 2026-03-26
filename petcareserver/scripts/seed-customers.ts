import * as bcrypt from 'bcrypt';
import { createConnection } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Store } from '../src/stores/entities/store.entity';
import { Role } from '../src/roles/entities/role.entity';
import { UserStatus } from '../src/common/enum';
import { STORE_ROLES } from '../src/common/permissions';
import { Category } from 'src/categories/entities/category.entity';
import { Product } from 'src/categories/entities/product.entity';
import { Service } from 'src/categories/entities/service.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { OrderDetail } from 'src/orders/entities/order-detail.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { PetWeightHistory } from 'src/pets/entities/pet-weight-history.entity';
import { Pet } from 'src/pets/entities/pet.entity';
import { RolePermission } from 'src/roles/entities/role-permission.entity';

async function seedEmployees() {
  console.log('Connecting to database...');

  const connection = await createConnection({
    type: 'postgres',
    url:
      process.env.POSTGRES_URI ||
      'postgresql://postgres:password@localhost:5432/petcare_dev',
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
    synchronize: false,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

  console.log('Database connected successfully');

  const userRepository = connection.getRepository(User);
  const storeRepository = connection.getRepository(Store);
  const roleRepository = connection.getRepository(Role);

  // Get stores
  const store1 = await storeRepository.findOne({
    where: { id: 1 },
  });

  const store2 = await storeRepository.findOne({
    where: { id: 2 },
  });

  if (!store1) {
    throw new Error(
      'Store with ID 1 not found. Please create the store first.',
    );
  }

  if (!store2) {
    throw new Error(
      'Store with ID 2 not found. Please create the store first.',
    );
  }

  // Get or create Admin and Staff roles for each store
  let adminRole1 = await roleRepository.findOne({
    where: {
      name: STORE_ROLES.ADMIN,
      store_id: store1.id,
    },
  });

  if (!adminRole1) {
    console.log('\nCreating ADMIN role for Store 1...');
    adminRole1 = roleRepository.create({
      name: STORE_ROLES.ADMIN,
      description: 'Store Administrator',
      is_editable: false,
      store_id: store1.id,
      is_system_role: false,
    });
    adminRole1 = await roleRepository.save(adminRole1);
  }

  let adminRole2 = await roleRepository.findOne({
    where: {
      name: STORE_ROLES.ADMIN,
      store_id: store2.id,
    },
  });

  if (!adminRole2) {
    console.log('Creating ADMIN role for Store 2...');
    adminRole2 = roleRepository.create({
      name: STORE_ROLES.ADMIN,
      description: 'Store Administrator',
      is_editable: false,
      store_id: store2.id,
      is_system_role: false,
    });
    adminRole2 = await roleRepository.save(adminRole2);
  }

  // Create or find STAFF role for stores (if needed, create custom role)
  let staffRole1 = await roleRepository.findOne({
    where: {
      name: 'STAFF',
      store_id: store1.id,
    },
  });

  if (!staffRole1) {
    console.log('Creating STAFF role for Store 1...');
    staffRole1 = roleRepository.create({
      name: 'STAFF',
      description: 'Store Staff',
      is_editable: true,
      store_id: store1.id,
      is_system_role: false,
    });
    staffRole1 = await roleRepository.save(staffRole1);
  }

  let staffRole2 = await roleRepository.findOne({
    where: {
      name: 'STAFF',
      store_id: store2.id,
    },
  });

  if (!staffRole2) {
    console.log('Creating STAFF role for Store 2...');
    staffRole2 = roleRepository.create({
      name: 'STAFF',
      description: 'Store Staff',
      is_editable: true,
      store_id: store2.id,
      is_system_role: false,
    });
    staffRole2 = await roleRepository.save(staffRole2);
  }

  // Employee data for Store 1
  const store1Employees = [
    {
      full_name: 'Lê Thị Hương',
      email: 'le.thuong@petcare.vn',
      phone: '0901111111',
      address: '123 Điện Biên Phủ, Quận 1, TP.HCM',
      role_id: adminRole1.id,
      password: 'Store1Admin@123',
    },
    {
      full_name: 'Trần Văn Minh',
      email: 'tran.minh@petcare.vn',
      phone: '0902222222',
      address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
      role_id: staffRole1.id,
      password: 'Store1Staff@123',
    },
    {
      full_name: 'Nguyễn Thị Linh',
      email: 'nguyen.linh@petcare.vn',
      phone: '0903333333',
      address: '789 Tôn Đức Thắng, Quận 1, TP.HCM',
      role_id: staffRole1.id,
      password: 'Store1Staff@123',
    },
    {
      full_name: 'Võ Quốc Anh',
      email: 'vo.anh@petcare.vn',
      phone: '0904444444',
      address: '321 Pasteur, Quận 1, TP.HCM',
      role_id: staffRole1.id,
      password: 'Store1Staff@123',
    },
    {
      full_name: 'Phạm Thị Thu',
      email: 'pham.thu@petcare.vn',
      phone: '0905555555',
      address: '654 Hàm Nghi, Quận 1, TP.HCM',
      role_id: staffRole1.id,
      password: 'Store1Staff@123',
    },
  ];

  // Employee data for Store 2
  const store2Employees = [
    {
      full_name: 'Đặng Minh Quân',
      email: 'dang.quan@petcare.vn',
      phone: '0906666666',
      address: '111 Lê Thanh Tôn, Quận 4, TP.HCM',
      role_id: adminRole2.id,
      password: 'Store2Admin@123',
    },
    {
      full_name: 'Hồ Thị Ngọc',
      email: 'ho.ngoc@petcare.vn',
      phone: '0907777777',
      address: '222 Độc Lập, Quận 4, TP.HCM',
      role_id: staffRole2.id,
      password: 'Store2Staff@123',
    },
    {
      full_name: 'Bùi Văn Hùng',
      email: 'bui.hung@petcare.vn',
      phone: '0908888888',
      address: '333 Nguyễn Tất Thành, Quận 4, TP.HCM',
      role_id: staffRole2.id,
      password: 'Store2Staff@123',
    },
    {
      full_name: 'Cao Thị Hân',
      email: 'cao.han@petcare.vn',
      phone: '0909999999',
      address: '444 Cách Mạng Tháng 8, Quận 4, TP.HCM',
      role_id: staffRole2.id,
      password: 'Store2Staff@123',
    },
    {
      full_name: 'Phan Văn Đức',
      email: 'phan.duc@petcare.vn',
      phone: '0910101010',
      address: '555 Khánh Hội, Quận 4, TP.HCM',
      role_id: staffRole2.id,
      password: 'Store2Staff@123',
    },
  ];

  // Seed Store 1 Employees
  console.log('\n=== Seeding Employees for Store 1 ===');
  let store1EmployeeCount = 0;

  for (const employeeData of store1Employees) {
    const existingEmployee = await userRepository.findOne({
      where: { email: employeeData.email },
    });

    if (existingEmployee) {
      console.log(
        `Employee ${employeeData.full_name} already exists (${employeeData.email})`,
      );
    } else {
      console.log(`Creating employee: ${employeeData.full_name}`);

      const hashedPassword = await bcrypt.hash(employeeData.password, 10);

      const employee = userRepository.create({
        full_name: employeeData.full_name,
        email: employeeData.email,
        phone: employeeData.phone,
        address: employeeData.address,
        password_hash: hashedPassword,
        store_id: store1.id,
        role_id: employeeData.role_id,
        status: UserStatus.ACTIVE,
      });

      await userRepository.save(employee);
      store1EmployeeCount++;
    }
  }

  // Seed Store 2 Employees
  console.log('\n=== Seeding Employees for Store 2 ===');
  let store2EmployeeCount = 0;

  for (const employeeData of store2Employees) {
    const existingEmployee = await userRepository.findOne({
      where: { email: employeeData.email },
    });

    if (existingEmployee) {
      console.log(
        `Employee ${employeeData.full_name} already exists (${employeeData.email})`,
      );
    } else {
      console.log(`Creating employee: ${employeeData.full_name}`);

      const hashedPassword = await bcrypt.hash(employeeData.password, 10);

      const employee = userRepository.create({
        full_name: employeeData.full_name,
        email: employeeData.email,
        phone: employeeData.phone,
        address: employeeData.address,
        password_hash: hashedPassword,
        store_id: store2.id,
        role_id: employeeData.role_id,
        status: UserStatus.ACTIVE,
      });

      await userRepository.save(employee);
      store2EmployeeCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('EMPLOYEE SEEDING COMPLETED SUCCESSFULLY');
  console.log('='.repeat(50));
  console.log('\nSUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nStore 1: ${store1.name}`);
  console.log(`Employees Created: ${store1EmployeeCount}`);
  console.log('Employees:');
  for (const emp of store1Employees) {
    console.log(`  - ${emp.full_name} (${emp.email})`);
  }

  console.log(`\nStore 2: ${store2.name}`);
  console.log(`Employees Created: ${store2EmployeeCount}`);
  console.log('Employees:');
  for (const emp of store2Employees) {
    console.log(`  - ${emp.full_name} (${emp.email})`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(
    `Total Employees Created: ${store1EmployeeCount + store2EmployeeCount}`,
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await connection.close();
  console.log('\nDatabase connection closed');
}

void seedEmployees();
