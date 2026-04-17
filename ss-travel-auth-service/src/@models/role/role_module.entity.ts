import { Entity, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { RolesEntity } from './roles.entity';
import { ModulesEntity } from '../modules/modules.entity';

@Entity('role_modules')
@Unique(['role', 'module'])
export class RoleModuleEntity extends BaseEntity {
    @ManyToOne(() => RolesEntity, (role: RolesEntity) => role.modules, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    role: RolesEntity;

    @ManyToOne(() => ModulesEntity, (module: ModulesEntity) => module.roles, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    module: ModulesEntity;

    @Column({ default: true, type: 'boolean' })
    isActive: boolean;
}
