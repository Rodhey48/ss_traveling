import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './../base.entity';
import { ModulesEntity } from './../modules/modules.entity';
import { RoleMenusEntity } from '../role/role-menu.entity';

export class Badge {
  variant: string;
  text: string;
}
export class Attribute {
  target: string;
  rel: string;
  disabled: boolean;
}

@Entity('menus')
export class MenusEntity extends BaseEntity {
  constructor(partial: Partial<MenusEntity>) {
    super();
    Object.assign(this, partial);
  }
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  url: string;

  @Column({ type: 'varchar', nullable: true })
  icon: string;

  @Column({ type: 'varchar', nullable: true })
  activityName: string;

  @Column({ default: true })
  isWeb: boolean;

  @Column({ default: false })
  isMobile: boolean;

  @Column({ type: 'json', nullable: true })
  badge: Badge;

  @Column({ type: 'json', nullable: true })
  attributes: Attribute;

  @Column({ default: false })
  title: boolean;

  @Column({ default: false })
  divider: boolean;

  @Column({ default: 0 })
  sequence: number;

  @Column({ default: false })
  isIndent: boolean;

  @Column({ nullable: true })
  parentClass: string;

  @Column({ nullable: true })
  aclName: string;

  @Column({ nullable: true })
  aclParam: string;

  @ManyToOne(() => MenusEntity, (parent: MenusEntity) => parent.children)
  parent: MenusEntity;

  @OneToMany(() => MenusEntity, (children: MenusEntity) => children.parent, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  children: MenusEntity[];

  @ManyToOne(() => ModulesEntity, (module: ModulesEntity) => module.menus)
  @JoinColumn()
  module: ModulesEntity;

  @OneToMany(
    () => RoleMenusEntity,
    (roleMenu: RoleMenusEntity) => roleMenu.menu,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinTable()
  Roles: RoleMenusEntity[];
}
