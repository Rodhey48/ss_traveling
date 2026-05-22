import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenusController } from './controllers/menus.controller';
import { MenusService } from './../@services/menus/menus.service';
import { MenusEntity, RoleMenusEntity, ModulesEntity } from '@models';
import { JWTService } from './../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenusEntity, RoleMenusEntity, ModulesEntity]),
  ],
  controllers: [MenusController],
  providers: [MenusService, JWTService],
  exports: [MenusService],
})
export class MenusModule {}
