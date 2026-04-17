import { Entity, Column, OneToMany, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from '../base.entity';
import { UserRolesEntity } from './user-roles.entity';

@Entity('users')
export class UsersEntity extends BaseEntity {
    constructor(partial: Partial<UsersEntity>) {
        super();
        Object.assign(this, partial);
    }

    @Column({ type: 'varchar', nullable: true })
    name: string;

    @Column({ type: 'varchar', unique: true, nullable: true })
    email: string;

    @Column({ type: 'varchar', unique: true })
    nip: string;

    @Column({ type: 'varchar', nullable: true, unique: true })
    phone: string;

    @Column({ type: 'varchar' })
    password: string;

    @Column({ type: 'varchar', nullable: true })
    token: string;

    @Column({ type: 'timestamp', nullable: true })
    lastLogin: Date;

    @Column({ type: 'boolean', default: true })
    isPasswordChanged: boolean;

    @Column({ type: 'enum', enum: ['admin', 'employee'], default: 'employee' })
    type: 'admin' | 'employee';

    @OneToMany(() => UserRolesEntity, (roles: UserRolesEntity) => roles.user, {
        cascade: true,
    })
    roles: UserRolesEntity[];

    @BeforeInsert()
    async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }
}
