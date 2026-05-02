export function isSuperAdmin(user: {
  role?: { name?: string };
}): boolean {
  return user.role?.name === 'SUPER_ADMIN';
}
