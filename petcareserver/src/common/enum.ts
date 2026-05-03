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

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  CASH = 'CASH',
}

export enum Currency {
  VND = 'vnd',
  USD = 'usd',
}

export enum InStoreFilter {
  IN_STORE = 'IN_STORE',
  NOT_IN_STORE = 'NOT_IN_STORE',
}

export enum ActivityType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_PAID = 'ORDER_PAID',
  PET_ADDED = 'PET_ADDED',
  CUSTOMER_ADDED = 'CUSTOMER_ADDED',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PRODUCT_EXPIRED = 'PRODUCT_EXPIRED',
  STORE_INVITATION = 'STORE_INVITATION',
}

export enum ActivityReferenceType {
  ORDER = 'order',
  PET = 'pet',
  CUSTOMER = 'customer',
  PRODUCT = 'product',
  NOTIFICATION = 'notification',
}
