import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CashAccountEntity } from './cash-account.entity';
import { BankAccountEntity } from './bank-account.entity';
import { AccountEntity } from './account.entity';
import { VehicleEntity } from '../fleet/vehicle.entity';
import { CostCenterEntity } from '../organization/cost-center.entity';
import { JournalEntryEntity } from './journal-entry.entity';
import { UsersEntity } from '../user/user.entity';
import {
  CashTransactionType,
  CashTransactionStatus,
  PettyCashCategory,
} from './finance.enums';

@Entity('cash_transactions')
export class CashTransactionEntity extends BaseEntity {
  constructor(partial?: Partial<CashTransactionEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Index()
  @Column({ type: 'varchar', length: 50, unique: true, name: 'transaction_no' })
  transactionNo!: string; // Misal: BKK-KAS/2610/0001 (Pengeluaran) atau BKM-KAS/2610/0001 (Replenishment)

  @Index()
  @Column({ type: 'uuid', name: 'cash_account_id' })
  cashAccountId!: string;

  @ManyToOne(() => CashAccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cash_account_id' })
  cashAccount?: CashAccountEntity;

  @Column({
    type: 'enum',
    enum: CashTransactionType,
    default: CashTransactionType.DISBURSEMENT,
  })
  type!: CashTransactionType;

  @Column({ type: 'date', name: 'transaction_date' })
  transactionDate!: string;

  @Column({ type: 'numeric', precision: 20, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 150 })
  recipient!: string; // Penerima dana (misal: "Driver Standby Budi", "Toko Sembako Makmur", "Warung Bu Siti")

  @Column({ type: 'uuid', name: 'expense_account_id', nullable: true })
  expenseAccountId?: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'expense_account_id' })
  expenseAccount?: AccountEntity;

  // Khusus Replenishment (Pengisian Kembali Kas Kecil)
  @Column({ type: 'uuid', name: 'source_bank_account_id', nullable: true })
  sourceBankAccountId?: string;

  @ManyToOne(() => BankAccountEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_bank_account_id' })
  sourceBankAccount?: BankAccountEntity;

  @Column({ type: 'uuid', name: 'source_cash_account_id', nullable: true })
  sourceCashAccountId?: string;

  @ManyToOne(() => CashAccountEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_cash_account_id' })
  sourceCashAccount?: CashAccountEntity;

  // Dimensi Analitik
  @Column({ type: 'uuid', name: 'vehicle_id', nullable: true })
  vehicleId?: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: VehicleEntity;

  @Column({ type: 'uuid', name: 'cost_center_id', nullable: true })
  costCenterId?: string;

  @ManyToOne(() => CostCenterEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cost_center_id' })
  costCenter?: CostCenterEntity;

  @Column({
    type: 'enum',
    enum: PettyCashCategory,
    default: PettyCashCategory.OTHER,
  })
  category!: PettyCashCategory;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'receipt_no' })
  receiptNo?: string;

  @Column({ type: 'text', nullable: true, name: 'receipt_image_url' })
  receiptImageUrl?: string;

  @Column({
    type: 'enum',
    enum: CashTransactionStatus,
    default: CashTransactionStatus.SUBMITTED,
  })
  status!: CashTransactionStatus;

  @Column({ type: 'uuid', name: 'journal_entry_id', nullable: true })
  journalEntryId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry?: JournalEntryEntity;

  @Column({ type: 'uuid', name: 'created_by_id', nullable: true })
  createdById?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdByUser?: UsersEntity;

  @Column({ type: 'uuid', name: 'verified_by_id', nullable: true })
  verifiedById?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verified_by_id' })
  verifiedByUser?: UsersEntity;

  @Column({ type: 'timestamptz', nullable: true, name: 'verified_at' })
  verifiedAt?: Date;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason?: string;
}
