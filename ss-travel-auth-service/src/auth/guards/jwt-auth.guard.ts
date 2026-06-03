import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JWTService } from '../../@services/jwt/jwt.service';
import * as crypto from 'crypto';

@Injectable()
export class JwtAuthGuard {
  constructor(private readonly jwtService: JWTService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload: any = await this.jwtService.verifyToken(token);
      
      // Stateless Fingerprint Validation
      const deviceId = request.headers['x-device-id'];
      const userAgent = request.headers['user-agent'];

      if (!deviceId || !payload.fingerprint) {
        throw new UnauthorizedException('Security binding missing');
      }

      const currentFingerprint = crypto
        .createHash('sha256')
        .update(deviceId + userAgent)
        .digest('hex');

      if (payload.fingerprint !== currentFingerprint) {
        throw new UnauthorizedException('Invalid device context');
      }

      request['user'] = payload;
    } catch (err) {
      throw new UnauthorizedException(err.message || 'Invalid token');
    }
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
