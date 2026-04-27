import { RequestInterface } from '@interfaces';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class ModulesGuard implements CanActivate {
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
    if (!user || !user.module) {
      throw new UnauthorizedException('Invalid user identity');
    }

    const emit = user.module.some((el) => moduleGuard.includes(el.name));

    if (!emit) {
      throw new UnauthorizedException('Invalid user module');
    }

    return true;
  }
}
