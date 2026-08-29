import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { UserPositionsEntity } from '../user/user-positions.entity';

@Entity('positions')
export class PositionsEntity extends BaseEntity {
  constructor(partial: Partial<PositionsEntity>) {
    super();
    Object.assign(this, partial);
  }

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(
    () => UserPositionsEntity,
    (userPosition: UserPositionsEntity) => userPosition.position,
  )
  @JoinColumn()
  users: UserPositionsEntity[];
}
