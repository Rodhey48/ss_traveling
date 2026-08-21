import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JWTService {
  private readonly accessSecret = process.env.JWT_KEY || 'secret-access';
  private readonly refreshSecret = process.env.JWT_REFRESH_KEY || 'secret-refresh';

  createToken(payload: any, expiresIn: string | number = '1h') {
    return jwt.sign(payload, this.accessSecret, { expiresIn: expiresIn as any });
  }

  createRefreshToken(payload: any, expiresIn: string | number = '7d') {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: expiresIn as any });
  }

  verifyToken(token: string) {
    return jwt.verify(token, this.accessSecret);
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, this.refreshSecret);
  }
}
