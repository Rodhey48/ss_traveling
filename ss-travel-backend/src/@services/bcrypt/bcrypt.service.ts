import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {
  checkPassword(
    password: string | undefined,
    hash: string | undefined,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  createHashPassword(planPassword: string): Promise<string> {
    return bcrypt.hash(planPassword, 10);
  }
}
