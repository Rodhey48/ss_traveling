import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';
import { RolesEntity, RoleMenusEntity, MenusEntity } from '@models';
import { JWTService } from './../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RolesEntity, RoleMenusEntity, MenusEntity]),
  ],
  controllers: [RolesController],
  providers: [RolesService, JWTService],
  exports: [RolesService],
})
export class RolesModule {}
