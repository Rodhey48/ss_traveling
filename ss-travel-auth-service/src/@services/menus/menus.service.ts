import { RoleMenusEntity } from '@models';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as _ from 'lodash';

@Injectable()
export class MenusService {
  private logger = new Logger(MenusService.name);
  constructor(
    @InjectRepository(RoleMenusEntity)
    private readonly roleMenuRepo: Repository<RoleMenusEntity>,
  ) {}

  async findMenusByRole(roleIds: string[]) {
    if (!roleIds || roleIds.length === 0) {
      return [];
    }

    const menus = await this.roleMenuRepo
      .createQueryBuilder('roleMenu')
      .leftJoinAndSelect('roleMenu.menu', 'menu')
      .leftJoinAndSelect('menu.children', 'children')
      .where(
        'roleMenu.role IN (:...roleIds) AND roleMenu.isActive = true AND menu.parent IS NULL',
        { roleIds },
      )
      .orderBy('menu.sequence', 'ASC')
      .getMany();

    const dirtyMenus = [];
    menus.forEach((rm) => {
      if (rm.menu) {
        if (rm.menu.children && rm.menu.children.length === 0) {
          delete rm.menu.children;
        }
        dirtyMenus.push(rm.menu);
      }
    });

    return _.uniqBy(dirtyMenus, 'id');
  }
}
