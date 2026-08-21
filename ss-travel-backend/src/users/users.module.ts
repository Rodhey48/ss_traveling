import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UsersEntity } from './../@models/user/user.entity';
import { UserRolesEntity } from './../@models/user/user-roles.entity';
import { RolesEntity } from './../@models/role/roles.entity';
import { JWTService } from './../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersEntity, UserRolesEntity, RolesEntity]),
  ],
  controllers: [UsersController],
  providers: [UsersService, JWTService],
  exports: [UsersService],
})
export class UsersModule {}
