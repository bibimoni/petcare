import { SYSTEM_PERMISSIONS } from './system.permissions';
import { STORE_PERMISSIONS } from './store.permissions';
import { UserRole } from '../enum';

export const ALL_SYSTEM_PERMISSIONS = Object.values(SYSTEM_PERMISSIONS);

export const ALL_STORE_PERMISSIONS = Object.values(STORE_PERMISSIONS);

export const ALL_PERMISSIONS = [
  ...ALL_SYSTEM_PERMISSIONS,
  ...ALL_STORE_PERMISSIONS,
] as const;

export const SYSTEM_ROLES = [UserRole.SUPER_ADMIN] as const;

export const STORE_ROLES = [UserRole.ADMIN, UserRole.STAFF] as const;


export type SystemPermission = (typeof ALL_SYSTEM_PERMISSIONS)[number];
export type StorePermission = (typeof ALL_STORE_PERMISSIONS)[number];
export type Permission = (typeof ALL_PERMISSIONS)[number];
export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
export type StoreRoleName = (typeof STORE_ROLES)[keyof typeof STORE_ROLES];
