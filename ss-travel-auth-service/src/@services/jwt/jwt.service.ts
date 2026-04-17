import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JWTService {
    createToken(payload: any, expiresIn: string | number = '180d') {
        const secretOrKey = process.env.JWT_KEY || 'secret';
        return jwt.sign(payload, secretOrKey, { expiresIn: expiresIn as any });
    }

    verifyToken(token: string) {
        const secretOrKey = process.env.JWT_KEY || 'secret';
        return jwt.verify(token, secretOrKey);
    }
}
