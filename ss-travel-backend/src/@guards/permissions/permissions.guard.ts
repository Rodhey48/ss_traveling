import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestInterface } from '../../@interfaces';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Jika endpoint tidak menggunakan @RequirePermissions, izinkan akses
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestInterface>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        status: false,
        message: 'Akses ditolak: Data pengguna tidak ditemukan.',
        required: requiredPermissions,
      });
    }

    // 1. SUPER_ADMIN selalu memiliki akses penuh (bypass permission check)
    const isSuperAdmin = user.role?.some(
      (r: any) =>
        r.name === 'SUPER_ADMIN' ||
        r.name === 'superadmin' ||
        r.name?.toUpperCase() === 'SUPER_ADMIN',
    );
    if (isSuperAdmin) {
      return true;
    }

    if (!user.permissions || user.permissions.length === 0) {
      throw new ForbiddenException({
        status: false,
        message: 'Akses ditolak: Anda tidak memiliki permission apapun.',
        required: requiredPermissions,
        missing: requiredPermissions,
      });
    }

    // 2. Case-Insensitive Permission Matching
    const userPermSetLower = new Set(
      user.permissions.map((p) => p.toLowerCase()),
    );

    const hasPermission = requiredPermissions.every(
      (perm) =>
        user.permissions.includes(perm) ||
        userPermSetLower.has(perm.toLowerCase()),
    );

    if (!hasPermission) {
      const missing = requiredPermissions.filter(
        (p) =>
          !user.permissions.includes(p) &&
          !userPermSetLower.has(p.toLowerCase()),
      );

      throw new ForbiddenException({
        status: false,
        message: 'Akses ditolak: Anda tidak memiliki hak akses yang cukup.',
        required: requiredPermissions,
        missing: missing,
      });
    }

    return true;
  }
}
