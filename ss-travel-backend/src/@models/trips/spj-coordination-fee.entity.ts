import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { SpjEntity } from './spj.entity';
import { SpjLegEntity } from './spj-leg.entity';
import { UsersEntity } from '../user/user.entity';
import { JournalEntryEntity } from '../finance/journal-entry.entity';
import { CoordinatorZone } from '../master-rules/coordinator-fee-rule.entity';
import { CoordinationFeeBatchEntity } from '../finance/coordination-fee-batch.entity';

export enum SpjCoordinationFeeStatus {
  UNPAID = 'UNPAID',
  PENDING_BATCH = 'PENDING_BATCH',
  PAID = 'PAID',
}

@Entity('spj_coordination_fees')
export class SpjCoordinationFeeEntity extends BaseEntity {
  constructor(partial?: Partial<SpjCoordinationFeeEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'company_id', nullable: true })
  companyId?: string;

  @ManyToOne(() => CompanyEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity;

  @Column({ type: 'uuid', name: 'spj_id' })
  spjId!: string;

  @ManyToOne(() => SpjEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({ type: 'uuid', name: 'spj_leg_id', nullable: true })
  spjLegId?: string;

  @ManyToOne(() => SpjLegEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'spj_leg_id' })
  spjLeg?: SpjLegEntity;

  @Column({
    type: 'enum',
    enum: CoordinatorZone,
  })
  zone!: CoordinatorZone;

  @Column({ type: 'int', name: 'ticket_count', default: 0 })
  ticketCount!: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'fee_per_pax',
    default: 10000,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  feePerPax!: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_fee',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  totalFee!: number;

  @Column({ type: 'uuid', name: 'coordinator_user_id', nullable: true })
  coordinatorUserId?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'coordinator_user_id' })
  coordinatorUser?: UsersEntity;

  @Column({
    type: 'enum',
    enum: SpjCoordinationFeeStatus,
    default: SpjCoordinationFeeStatus.UNPAID,
  })
  status!: SpjCoordinationFeeStatus;

  @Column({ type: 'uuid', name: 'settlement_batch_id', nullable: true })
  settlementBatchId?: string;

  @ManyToOne(() => CoordinationFeeBatchEntity, (batch) => batch.items, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'settlement_batch_id' })
  settlementBatch?: CoordinationFeeBatchEntity;

  @Column({ type: 'uuid', name: 'journal_id', nullable: true })
  journalId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'journal_id' })
  journal?: JournalEntryEntity;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
