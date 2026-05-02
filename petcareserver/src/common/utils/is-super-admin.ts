import { SYSTEM_PERMISSIONS } from '../permissions/system.permissions';

export function isSuperAdmin(user: {
  role?: { name?: string };
  permissions?: string[];
}): boolean {
  return (
    user.role?.name === 'SUPER_ADMIN' ||
    user.permissions?.includes(SYSTEM_PERMISSIONS.MANAGE_USERS) === true
  );
}
