import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilService {
    generateRandomString(
        length: number,
        input: string = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789',
    ): string {
        let result = '';
        const inputLength = input.length;
        for (let i = 0; i < length; i++) {
            result += input.charAt(Math.floor(Math.random() * inputLength));
        }
        return result;
    }

    validEmail(email: string) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
}
