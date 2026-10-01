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
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'UNAUTHORIZED',
        message: 'Authentication token not found in header or cookie',
      });
    }

    let payload: any;
    try {
      payload = this.jwtService.verifyToken(token);
    } catch (err: any) {
      if (
        err?.name === 'TokenExpiredError' ||
        err?.message?.toLowerCase().includes('expired')
      ) {
        throw new UnauthorizedException({
          statusCode: 401,
          errorCode: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        });
      }

      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'INVALID_TOKEN',
        message: err?.message || 'Invalid or malformed token',
      });
    }

    // Stateless Fingerprint Validation
    const deviceId = request.headers['x-device-id'];
    const userAgent = request.headers['user-agent'] || '';

    if (!deviceId) {
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'MISSING_DEVICE_ID',
        message: 'x-device-id header is required for security verification',
      });
    }

    if (!payload.fingerprint) {
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'SECURITY_BINDING_MISSING',
        message: 'Token does not contain required security fingerprint binding',
      });
    }

    const currentFingerprint = crypto
      .createHash('sha256')
      .update(deviceId + userAgent)
      .digest('hex');

    if (payload.fingerprint !== currentFingerprint) {
      throw new UnauthorizedException({
        statusCode: 401,
        errorCode: 'INVALID_DEVICE_CONTEXT',
        message: 'Security anomaly: Device context or fingerprint mismatch',
      });
    }

    request['user'] = payload;
    return true;
  }

  /**
   * Dual token extraction:
   * 1. Authorization: Bearer <token> (Mobile App, Swagger, API Clients)
   * 2. Cookie: token=<token> (Web Browser with httpOnly cookie)
   */
  private extractToken(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token;
    }

    if (request.cookies && request.cookies['token']) {
      return request.cookies['token'];
    }

    return undefined;
  }
}
