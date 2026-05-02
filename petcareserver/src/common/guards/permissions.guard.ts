import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, ANY_PERMISSIONS_KEY } from '../index';
import { isSuperAdmin } from '../utils/is-super-admin';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const anyPermissions = this.reflector.getAllAndOverride<string[]>(
      ANY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      (!requiredPermissions || requiredPermissions.length === 0) &&
      (!anyPermissions || anyPermissions.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Truy cập bị từ chối');
    }

    if (isSuperAdmin(user)) {
      return true;
    }

    if (!user.permissions) {
      throw new ForbiddenException('Truy cập bị từ chối');
    }

    const userPermissions = user.permissions as string[];

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAllPermissions && !anyPermissions) {
        throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
      }

      if (hasAllPermissions) {
        return true;
      }
    }

    if (anyPermissions && anyPermissions.length > 0) {
      const hasAnyPermission = anyPermissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAnyPermission) {
        throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
      }
    }

    return true;
  }
}
