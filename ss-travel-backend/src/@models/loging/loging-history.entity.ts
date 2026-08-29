import { BaseEntity } from "@models/base.entity";
import { UsersEntity } from "@models/user/user.entity";
import { LogingTypeEnum } from "src/@enum/loging/loging.enum";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity('loging')
export class LogingEntity extends BaseEntity {
    constructor(partial: Partial<LogingEntity>) {
        super();
        Object.assign(this, partial);
    }

    @Column({ type: 'varchar', nullable: false})
    message: string;

    @Column({ 
        type: 'enum', 
        enum: LogingTypeEnum, 
        default: LogingTypeEnum.INFO})
    level: LogingTypeEnum

    @Column({
        type: 'varchar',
        nullable: true
    })
    action: string

    @Column({
        type: 'varchar',
        nullable: true
    })
    detail: string

    @Column({
        type: 'varchar',
        nullable: true,
        length: '45'
    })
    ipaddress: string

    @ManyToOne(() => UsersEntity, (user) => user.loging)
    @JoinColumn({name: 'userId'})
    user: UsersEntity

}