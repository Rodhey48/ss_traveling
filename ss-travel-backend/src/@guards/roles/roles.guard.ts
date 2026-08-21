import { RequestInterface } from '@interfaces';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roleGuard = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!roleGuard) {
      return true;
    }
    const request: RequestInterface = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('RolesGuard: No user found in request');
      throw new ForbiddenException('User identity not found');
    }

    if (!user.role || !Array.isArray(user.role)) {
      this.logger.warn(`RolesGuard: User ${user.email} has no valid roles array`);
      throw new ForbiddenException('User has no assigned roles');
    }

    const userRoleNames = user.role.map((r: any) => typeof r === 'string' ? r : r.name);
    const hasRole = userRoleNames.some((roleName) => roleGuard.includes(roleName));

    if (!hasRole) {
      this.logger.warn(`RolesGuard: User ${user.email} with roles [${userRoleNames}] tried to access resource requiring [${roleGuard}]`);
      throw new ForbiddenException('You do not have the required role to access this resource');
    }

    return true;
  }
}
