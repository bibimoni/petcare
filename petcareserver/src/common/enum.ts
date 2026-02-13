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