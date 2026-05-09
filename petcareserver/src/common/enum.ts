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
  REFUNDED = 'REFUNDED',
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
  ORDER_CREATED = 'Đơn hàng đã tạo',
  ORDER_CANCELLED = 'Đơn hàng đã hủy',
  ORDER_PAID = 'Đơn hàng đã thanh toán',
  PET_ADDED = 'Thêm thú cưng',
  CUSTOMER_ADDED = 'Thêm khách hàng',
  LOW_STOCK = 'Sắp hết hàng',
  OUT_OF_STOCK = 'Hết hàng',
  PRODUCT_EXPIRED = 'Sản phẩm hết hạn',
  STORE_INVITATION = 'Lời mời cửa hàng',
}

export enum ActivityReferenceType {
  ORDER = 'order',
  PET = 'pet',
  CUSTOMER = 'customer',
  PRODUCT = 'product',
  NOTIFICATION = 'notification',
}
