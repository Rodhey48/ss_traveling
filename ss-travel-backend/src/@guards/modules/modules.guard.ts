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
export class ModulesGuard implements CanActivate {
  private readonly logger = new Logger(ModulesGuard.name);
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const moduleGuard = this.reflector.get<string[]>(
      'modules',
      context.getHandler(),
    );
    if (!moduleGuard) {
      return true;
    }
    const request: RequestInterface = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('ModulesGuard: No user found in request');
      throw new ForbiddenException('User identity not found');
    }

    if (!user.module || !Array.isArray(user.module)) {
      this.logger.warn(`ModulesGuard: User ${user.email} has no valid modules array`);
      throw new ForbiddenException('User has no assigned modules');
    }

    const userModuleNames = user.module.map((m: any) => typeof m === 'string' ? m : m.name);
    const hasModule = userModuleNames.some((moduleName) => moduleGuard.includes(moduleName));

    if (!hasModule) {
      this.logger.warn(`ModulesGuard: User ${user.email} with modules [${userModuleNames}] tried to access resource requiring [${moduleGuard}]`);
      throw new ForbiddenException('You do not have access to this module');
    }

    return true;
  }
}
