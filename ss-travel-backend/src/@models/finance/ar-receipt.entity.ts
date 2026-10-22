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
import { CustomerEntity } from '../customer/customer.entity';
import { BankAccountEntity } from './bank-account.entity';
import { CashAccountEntity } from './cash-account.entity';
import { JournalEntryEntity } from './journal-entry.entity';
import { SpjEntity } from '../trips/spj.entity';
import { ArAllocationEntity } from './ar-allocation.entity';
import {
  ArReceiptStatus,
  FinancePaymentMethod,
} from './finance.enums';

@Entity('ar_receipts')
export class ArReceiptEntity extends BaseEntity {
  constructor(partial?: Partial<ArReceiptEntity>) {
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

  @Index()
  @Column({ type: 'varchar', length: 50, unique: true, name: 'receipt_no' })
  receiptNo!: string; // Misal: RCT/AR/2610/0001

  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  customerId?: string;

  @ManyToOne(() => CustomerEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: CustomerEntity;

  @Column({ type: 'varchar', length: 150, name: 'customer_name' })
  customerName!: string;

  @Column({ type: 'timestamptz', name: 'receipt_date' })
  receiptDate!: Date;

  @Column({
    type: 'enum',
    enum: FinancePaymentMethod,
    default: FinancePaymentMethod.BANK_TRANSFER,
    name: 'payment_method',
  })
  paymentMethod!: FinancePaymentMethod;

  @Column({ type: 'uuid', nullable: true, name: 'bank_account_id' })
  bankAccountId?: string;

  @ManyToOne(() => BankAccountEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount?: BankAccountEntity;

  @Column({ type: 'uuid', nullable: true, name: 'cash_account_id' })
  cashAccountId?: string;

  @ManyToOne(() => CashAccountEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cash_account_id' })
  cashAccount?: CashAccountEntity;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  amount!: number;

  @Column({
    type: 'enum',
    enum: ArReceiptStatus,
    default: ArReceiptStatus.CONFIRMED,
  })
  status!: ArReceiptStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference?: string; // Nomor bukti transfer bank / no ref

  @Column({ type: 'boolean', default: false, name: 'is_down_payment' })
  isDownPayment!: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'down_payment_trip_id' })
  downPaymentTripId?: string; // SPJ terkait DP Sewa Wisata

  @ManyToOne(() => SpjEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'down_payment_trip_id' })
  downPaymentTrip?: SpjEntity;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true, name: 'journal_entry_id' })
  journalEntryId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry?: JournalEntryEntity;

  @OneToMany(() => ArAllocationEntity, (alloc) => alloc.receipt, {
    cascade: true,
  })
  allocations?: ArAllocationEntity[];
}
