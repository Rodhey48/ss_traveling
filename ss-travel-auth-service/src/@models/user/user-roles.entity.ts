import { Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { UsersEntity } from './user.entity';
import { RolesEntity } from '../role/roles.entity';

@Entity('user_roles')
@Unique(['user', 'role'])
export class UserRolesEntity extends BaseEntity {
    constructor(partial: Partial<UserRolesEntity>) {
        super();
        Object.assign(this, partial);
    }

    @ManyToOne(() => UsersEntity, (user: UsersEntity) => user.roles, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn()
    user: UsersEntity;

    @ManyToOne(() => RolesEntity, (role: RolesEntity) => role.users, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        eager: true,
    })
    @JoinColumn()
    role: RolesEntity;
}
