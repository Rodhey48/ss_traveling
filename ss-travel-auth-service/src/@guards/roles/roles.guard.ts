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
export class RolesGuard implements CanActivate {
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
        if (!user || !user.role) {
            throw new UnauthorizedException('Invalid user identity');
        }

        const emit = user.role.some((el) => roleGuard.includes(el.name));

        if (!emit) {
            throw new UnauthorizedException('Invalid user role');
        }

        return true;
    }
}
