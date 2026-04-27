import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { MenusEntity } from '../menu/menus.entity';
import { RolesEntity } from './roles.entity';

@Entity('role-menus')
@Unique(['role', 'menu'])
export class RoleMenusEntity extends BaseEntity {
  constructor(partial: Partial<RoleMenusEntity>) {
    super();
    Object.assign(this, partial);
  }

  @ManyToOne(() => RolesEntity, (role: RolesEntity) => role.menus, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  role: RolesEntity;

  @ManyToOne(() => MenusEntity, (menus: MenusEntity) => menus.Roles)
  @JoinColumn()
  menu: MenusEntity;

  @Column({ default: true, type: 'boolean' })
  isRead: boolean;

  @Column({ default: true, type: 'boolean' })
  isCreate: boolean;

  @Column({ default: true, type: 'boolean' })
  isUpdate: boolean;

  @Column({ default: true, type: 'boolean' })
  isDelete: boolean;

  @Column({ default: true, type: 'boolean' })
  isActive: boolean;
}
