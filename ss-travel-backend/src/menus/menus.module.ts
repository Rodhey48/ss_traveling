import { MenusEntity, ModulesEntity, RoleMenusEntity } from '@models';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JWTService } from './../@services/jwt/jwt.service';
import { MenusController } from './controllers/menus.controller';
import { MenusService } from './services/menus.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenusEntity, RoleMenusEntity, ModulesEntity]),
  ],
  controllers: [MenusController],
  providers: [MenusService, JWTService],
  exports: [MenusService],
})
export class MenusModule {}
