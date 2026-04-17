import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import {
    RoleMenusEntity,
    RolesEntity,
    UserRolesEntity,
    UsersEntity,
} from '../@models';
import { UtilService } from '../@common';
import { JWTService } from '../@services/jwt/jwt.service';
import { BcryptService } from '../@services/bcrypt/bcrypt.service';
import { MenusService } from '../@services/menus/menus.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UsersEntity,
            RolesEntity,
            UserRolesEntity,
            RoleMenusEntity,
        ]),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        UtilService,
        JWTService,
        BcryptService,
        MenusService,
    ],
    exports: [AuthService],
})
export class AuthModule {}
