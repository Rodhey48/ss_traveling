import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { UsersEntity } from '../user/user.entity';
import { CashAccountEntity } from '../finance/cash-account.entity';
import { JournalEntryEntity } from '../finance/journal-entry.entity';
import { SpjCoordinationFeeEntity } from '../trips/spj-coordination-fee.entity';

export enum CoordinationFeeBatchStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('coordination_fee_batches')
export class CoordinationFeeBatchEntity extends BaseEntity {
  constructor(partial?: Partial<CoordinationFeeBatchEntity>) {
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

  @Column({ type: 'varchar', length: 60, unique: true, name: 'batch_no' })
  batchNo!: string;

  @Column({ type: 'varchar', length: 100, default: 'ALL' })
  origin!: string;

  @Column({ type: 'varchar', length: 100, default: 'ALL' })
  destination!: string;

  @Column({ type: 'uuid', name: 'coordinator_user_id', nullable: true })
  coordinatorUserId?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'coordinator_user_id' })
  coordinatorUser?: UsersEntity;

  @Column({ type: 'varchar', length: 120, nullable: true, name: 'coordinator_name' })
  coordinatorName?: string;

  @Column({ type: 'int', name: 'total_spjs', default: 0 })
  totalSpjs!: number;

  @Column({ type: 'int', name: 'total_tickets', default: 0 })
  totalTickets!: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_amount',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  totalAmount!: number;

  @Column({ type: 'date', name: 'payment_date' })
  paymentDate!: string;

  @Column({ type: 'uuid', name: 'bank_account_id', nullable: true })
  bankAccountId?: string;

  @ManyToOne(() => CashAccountEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount?: CashAccountEntity;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'reference_number' })
  referenceNumber?: string;

  @Column({ type: 'text', nullable: true, name: 'receipt_url' })
  receiptUrl?: string;

  @Column({ type: 'uuid', name: 'journal_id', nullable: true })
  journalId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'journal_id' })
  journal?: JournalEntryEntity;

  @Column({
    type: 'enum',
    enum: CoordinationFeeBatchStatus,
    default: CoordinationFeeBatchStatus.COMPLETED,
  })
  status!: CoordinationFeeBatchStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', name: 'created_by_id', nullable: true })
  createdById?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: UsersEntity;

  @OneToMany(() => SpjCoordinationFeeEntity, (item) => item.settlementBatch)
  items?: SpjCoordinationFeeEntity[];
}
