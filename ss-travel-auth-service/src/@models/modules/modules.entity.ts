import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './../base.entity';
import { MenusEntity } from './../menu/menus.entity';
import { RoleModuleEntity } from '../role/role_module.entity';

@Entity('modules')
export class ModulesEntity extends BaseEntity {
    @Column({ nullable: false })
    name: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ nullable: true })
    type: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @OneToMany(() => MenusEntity, (menu) => menu.module, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    menus: MenusEntity[];

    @OneToMany(() => RoleModuleEntity, (role) => role.module, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    roles: RoleModuleEntity[];
}
