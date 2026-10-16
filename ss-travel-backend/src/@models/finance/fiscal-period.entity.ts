import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { FiscalYearEntity } from './fiscal-year.entity';
import { UsersEntity } from '../user/user.entity';

export enum FiscalPeriodStatus {
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

@Entity('fiscal_periods')
export class FiscalPeriodEntity extends BaseEntity {
  constructor(partial?: Partial<FiscalPeriodEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'fiscal_year_id' })
  fiscalYearId!: string;

  @ManyToOne(() => FiscalYearEntity, (year) => year.periods, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fiscal_year_id' })
  fiscalYear?: FiscalYearEntity;

  @Column({ type: 'int', name: 'period_no' })
  periodNo!: number;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: string;

  @Column({
    type: 'enum',
    enum: FiscalPeriodStatus,
    default: FiscalPeriodStatus.OPEN,
  })
  status!: FiscalPeriodStatus;

  @Column({ type: 'timestamptz', name: 'closed_at', nullable: true })
  closedAt?: Date;

  @Column({ type: 'uuid', name: 'closed_by', nullable: true })
  closedBy?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'closed_by' })
  closedByUser?: UsersEntity;

  @Column({ type: 'text', name: 'close_reason', nullable: true })
  closeReason?: string;
}
