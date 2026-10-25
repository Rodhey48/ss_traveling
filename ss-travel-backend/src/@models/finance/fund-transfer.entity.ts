import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { FundTransferStatus, FundTransferType } from './finance.enums';
import { BankAccountEntity } from './bank-account.entity';
import { CashAccountEntity } from './cash-account.entity';
import { JournalEntryEntity } from './journal-entry.entity';
import { UsersEntity } from '../user/user.entity';

@Entity('fund_transfers')
export class FundTransferEntity extends BaseEntity {
  @Column({ name: 'transfer_no', type: 'varchar', length: 50, unique: true })
  @Index()
  transferNo: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ type: 'enum', enum: FundTransferType, name: 'transfer_type' })
  transferType: FundTransferType;

  // SOURCE
  @Column({ name: 'source_bank_account_id', type: 'uuid', nullable: true })
  sourceBankAccountId?: string;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'source_bank_account_id' })
  sourceBankAccount?: BankAccountEntity;

  @Column({ name: 'source_cash_account_id', type: 'uuid', nullable: true })
  sourceCashAccountId?: string;

  @ManyToOne(() => CashAccountEntity)
  @JoinColumn({ name: 'source_cash_account_id' })
  sourceCashAccount?: CashAccountEntity;

  // TARGET
  @Column({ name: 'target_bank_account_id', type: 'uuid', nullable: true })
  targetBankAccountId?: string;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'target_bank_account_id' })
  targetBankAccount?: BankAccountEntity;

  @Column({ name: 'target_cash_account_id', type: 'uuid', nullable: true })
  targetCashAccountId?: string;

  @ManyToOne(() => CashAccountEntity)
  @JoinColumn({ name: 'target_cash_account_id' })
  targetCashAccount?: CashAccountEntity;

  @Column({ type: 'numeric', precision: 20, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 255 })
  purpose: string;

  @Column({ name: 'reference_doc', type: 'varchar', length: 255, nullable: true })
  referenceDoc?: string;

  @Column({ type: 'enum', enum: FundTransferStatus, default: FundTransferStatus.PENDING_APPROVAL })
  status: FundTransferStatus;

  @Column({ name: 'requested_by_id', type: 'uuid' })
  requestedById: string;

  @ManyToOne(() => UsersEntity)
  @JoinColumn({ name: 'requested_by_id' })
  requestedBy: UsersEntity;

  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById?: string;

  @ManyToOne(() => UsersEntity)
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: UsersEntity;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'journal_entry_id', type: 'uuid', nullable: true })
  journalEntryId?: string;

  @ManyToOne(() => JournalEntryEntity)
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry?: JournalEntryEntity;
}