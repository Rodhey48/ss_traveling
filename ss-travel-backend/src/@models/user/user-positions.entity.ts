import { Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { UsersEntity } from './user.entity';
import { PositionsEntity } from '../position/positions.entity';

@Entity('user_positions')
@Unique(['user', 'position'])
export class UserPositionsEntity extends BaseEntity {
  constructor(partial: Partial<UserPositionsEntity>) {
    super();
    Object.assign(this, partial);
  }

  @ManyToOne(
    () => UsersEntity,
    (user: UsersEntity) => user.positions,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn()
  user: UsersEntity;

  @ManyToOne(
    () => PositionsEntity,
    (position: PositionsEntity) => position.users,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      eager: true,
    },
  )
  @JoinColumn()
  position: PositionsEntity;
}
