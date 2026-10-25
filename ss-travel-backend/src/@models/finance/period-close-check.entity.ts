import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { FiscalPeriodEntity } from './fiscal-period.entity';
import { UsersEntity } from '../user/user.entity';

export enum PeriodCheckStatus {
  PASSED = 'PASSED',
  WARNING = 'WARNING',
  BLOCKED = 'BLOCKED',
}

@Entity('period_close_checks')
export class PeriodCloseCheckEntity extends BaseEntity {
  constructor(partial?: Partial<PeriodCloseCheckEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Index()
  @Column({ type: 'uuid', name: 'period_id' })
  periodId!: string;

  @ManyToOne(() => FiscalPeriodEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'period_id' })
  period?: FiscalPeriodEntity;

  @Index()
  @Column({ type: 'varchar', length: 50, name: 'check_code' })
  checkCode!: string;

  @Column({ type: 'varchar', length: 150, name: 'check_name' })
  checkName!: string;

  @Column({
    type: 'enum',
    enum: PeriodCheckStatus,
    default: PeriodCheckStatus.PASSED,
  })
  status!: PeriodCheckStatus;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>;

  @Column({ type: 'timestamptz', name: 'checked_at', default: () => 'CURRENT_TIMESTAMP' })
  checkedAt!: Date;

  @Column({ type: 'uuid', name: 'checked_by', nullable: true })
  checkedBy?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'checked_by' })
  checkedByUser?: UsersEntity;
}
