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

    if (!user || !user.permissions) {
      throw new ForbiddenException({
        status: false,
        message: 'Akses ditolak: Anda tidak memiliki permission apapun.',
        missing_permissions: requiredPermissions,
      });
    }

    // Cek apakah user memiliki SEMUA permission yang diminta (Bisa diubah jadi SOME jika ingin lebih longgar)
    const hasPermission = requiredPermissions.every((perm) =>
      user.permissions?.includes(perm),
    );

    if (!hasPermission) {
      // Cari tahu spesifik permission mana yang kurang
      const missing = requiredPermissions.filter(
        (p) => !user.permissions?.includes(p),
      );

      throw new ForbiddenException({
        status: false,
        message: 'Akses ditolak: Anda tidak memiliki hak akses yang cukup.',
        required: requiredPermissions,
        missing: missing, // <--- Ini menjawab permintaan Anda (Return error yang jelas butuh permission apa)
      });
    }

    return true;
  }
}
