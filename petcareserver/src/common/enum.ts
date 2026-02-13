export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
}

export enum CategoryType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum PermissionScope {
  SYSTEM = 'SYSTEM',
  STORE = 'STORE',
}

export enum StoreStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// ===================
// SYSTEM PERMISSIONS
// ===================
export const SYSTEM_PERMISSIONS = {
  MANAGE_USERS: 'system.users.manage',
  MANAGE_STORES: 'system.stores.manage',
  VIEW_ANALYTICS: 'system.view_analytics',
  MANAGE_SUBSCRIPTIONS: 'system.manage_subscriptions',
} as const;

// ===================
// STORE PERMISSIONS
// ===================
export const STORE_PERMISSIONS = {
  // Store Settings
  STORE_SETTINGS_MANAGE: 'store.settings.manage',
  STORE_VIEW: 'store.view',

  // Customers
  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_MANAGE: 'customer.manage',
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_EDIT: 'customer.edit',
  CUSTOMER_DELETE: 'customer.delete',

  // Pets
  PET_VIEW: 'pet.view',
  PET_CREATE: 'pet.create',
  PET_EDIT: 'pet.edit',
  PET_DELETE: 'pet.delete',

  // Products
  PRODUCT_VIEW: 'product.view',
  PRODUCT_MANAGE: 'product.manage',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_EDIT: 'product.edit',
  PRODUCT_DELETE: 'product.delete',

  // Inventory Management
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',
  INVENTORY_ADJUST: 'inventory.adjust',

  // Services
  SERVICE_VIEW: 'service.view',
  SERVICE_MANAGE: 'service.manage',
  SERVICE_CREATE: 'service.create',
  SERVICE_EDIT: 'service.edit',
  SERVICE_DELETE: 'service.delete',

  // Orders
  ORDER_VIEW: 'order.view',
  ORDER_CREATE: 'order.create',
  ORDER_EDIT: 'order.edit',
  ORDER_CANCEL: 'order.cancel',
  ORDER_REFUND: 'order.refund',
  ORDER_VIEW_ALL: 'order.view_all', // Can see all staff's orders

  // Staff Management
  STAFF_VIEW: 'staff.view',
  STAFF_CREATE: 'staff.create',
  STAFF_EDIT: 'staff.edit',
  STAFF_DELETE: 'staff.delete',
  STAFF_INVITE: 'staff.invite',

  // Role Management
  ROLE_VIEW: 'role.view',
  ROLE_CREATE: 'role.create',
  ROLE_EDIT: 'role.edit',
  ROLE_DELETE: 'role.delete',
  ROLE_ASSIGN: 'role.assign',

  // Analytics & Reports
  ANALYTICS_VIEW: 'analytics.view',
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Categories & Tags
  CATEGORY_MANAGE: 'category.manage',
  CATEGORY_CREATE: 'category.create',
  CATEGORY_EDIT: 'category.edit',
  CATEGORY_DELETE: 'category.delete',
} as const;

// ===================
// PERMISSION COLLECTIONS
// ===================
export const ALL_SYSTEM_PERMISSIONS = Object.values(SYSTEM_PERMISSIONS);

export const ALL_STORE_PERMISSIONS = Object.values(STORE_PERMISSIONS);

export const ALL_PERMISSIONS = [...ALL_SYSTEM_PERMISSIONS, ...ALL_STORE_PERMISSIONS] as const;

// ===================
// ROLES
// ===================
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const STORE_ROLES = {
  ADMIN: 'ADMIN',
} as const;

// ===================
// TYPE DEFINITIONS
// ===================
export type SystemPermission = typeof ALL_SYSTEM_PERMISSIONS[number];
export type StorePermission = typeof ALL_STORE_PERMISSIONS[number];
export type Permission = typeof ALL_PERMISSIONS[number];
export type SystemRoleName = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];
export type StoreRoleName = typeof STORE_ROLES[keyof typeof STORE_ROLES];