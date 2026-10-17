import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { FiscalPeriodEntity } from './fiscal-period.entity';
import { UsersEntity } from '../user/user.entity';
import { JournalLineEntity } from './journal-line.entity';

export enum JournalStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export enum JournalSourceType {
  MANUAL = 'MANUAL',
  SPJ = 'SPJ',
  AR_INVOICE = 'AR_INVOICE',
  AP_INVOICE = 'AP_INVOICE',
  CASH_TRANSACTION = 'CASH_TRANSACTION',
  BANK_TRANSACTION = 'BANK_TRANSACTION',
  DEPRECIATION = 'DEPRECIATION',
  PERIOD_CLOSING = 'PERIOD_CLOSING',
  SETTLEMENT = 'SETTLEMENT',
}

@Entity('journal_entries')
export class JournalEntryEntity extends BaseEntity {
  constructor(partial?: Partial<JournalEntryEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'company_id', nullable: true })
  companyId?: string;

  @ManyToOne(() => CompanyEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, name: 'journal_no', unique: true })
  journalNo!: string;

  @Index()
  @Column({ type: 'date', name: 'journal_date' })
  journalDate!: string;

  @Column({ type: 'uuid', name: 'period_id' })
  periodId!: string;

  @ManyToOne(() => FiscalPeriodEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'period_id' })
  period?: FiscalPeriodEntity;

  @Column({
    type: 'enum',
    enum: JournalSourceType,
    name: 'source_type',
    default: JournalSourceType.MANUAL,
  })
  sourceType!: JournalSourceType;

  @Column({ type: 'uuid', name: 'source_id', nullable: true })
  sourceId?: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: JournalStatus,
    default: JournalStatus.POSTED,
  })
  status!: JournalStatus;

  @Column({ type: 'timestamptz', name: 'posted_at', nullable: true })
  postedAt?: Date;

  @Column({ type: 'uuid', name: 'posted_by', nullable: true })
  postedBy?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'posted_by' })
  postedByUser?: UsersEntity;

  @Column({ type: 'uuid', name: 'reversal_of_id', nullable: true })
  reversalOfId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reversal_of_id' })
  reversalOf?: JournalEntryEntity;

  @Column({ type: 'numeric', precision: 20, scale: 2, name: 'total_debit', default: '0.00' })
  totalDebit!: string;

  @Column({ type: 'numeric', precision: 20, scale: 2, name: 'total_credit', default: '0.00' })
  totalCredit!: string;

  @OneToMany(() => JournalLineEntity, (line) => line.journalEntry, {
    cascade: true,
  })
  lines?: JournalLineEntity[];
}
