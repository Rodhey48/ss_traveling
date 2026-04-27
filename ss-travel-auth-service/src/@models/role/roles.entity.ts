import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { UserRolesEntity } from '../user/user-roles.entity';
import { RoleModuleEntity } from './role_module.entity';
import { RoleMenusEntity } from './role-menu.entity';

@Entity('roles')
@Tree('nested-set')
export class RolesEntity extends BaseEntity {
  constructor(partial: Partial<RolesEntity>) {
    super();
    Object.assign(this, partial);
  }

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @TreeParent()
  parent: RolesEntity;

  @TreeChildren()
  children: RolesEntity[];

  @OneToMany(() => UserRolesEntity, (user: UserRolesEntity) => user.role)
  @JoinColumn()
  users: UserRolesEntity[];

  @OneToMany(
    () => RoleModuleEntity,
    (roleModule: RoleModuleEntity) => roleModule.role,
  )
  @JoinColumn()
  modules: RoleModuleEntity[];

  @OneToMany(() => RoleMenusEntity, (menus: RoleMenusEntity) => menus.role)
  @JoinColumn()
  menus: RoleMenusEntity[];
}
