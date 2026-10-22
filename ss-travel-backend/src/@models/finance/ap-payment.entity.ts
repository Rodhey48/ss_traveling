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
import { BankAccountEntity } from './bank-account.entity';
import { CashAccountEntity } from './cash-account.entity';
import { JournalEntryEntity } from './journal-entry.entity';
import { ApAllocationEntity } from './ap-allocation.entity';
import {
  ApVendorType,
  ApPaymentStatus,
  FinancePaymentMethod,
} from './finance.enums';

@Entity('ap_payments')
export class ApPaymentEntity extends BaseEntity {
  constructor(partial?: Partial<ApPaymentEntity>) {
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
  @Column({ type: 'varchar', length: 50, unique: true, name: 'payment_no' })
  paymentNo!: string; // Misal: PAY/AP/2610/0001

  @Column({
    type: 'enum',
    enum: ApVendorType,
    default: ApVendorType.OTHER,
    name: 'vendor_type',
  })
  vendorType!: ApVendorType;

  @Column({ type: 'uuid', nullable: true, name: 'vendor_id' })
  vendorId?: string;

  @Column({ type: 'varchar', length: 150, name: 'vendor_name' })
  vendorName!: string;

  @Column({ type: 'timestamptz', name: 'payment_date' })
  paymentDate!: Date;

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
    enum: ApPaymentStatus,
    default: ApPaymentStatus.CONFIRMED,
  })
  status!: ApPaymentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference?: string; // Nomor bukti transfer bank / struk

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true, name: 'journal_entry_id' })
  journalEntryId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry?: JournalEntryEntity;

  @OneToMany(() => ApAllocationEntity, (alloc) => alloc.payment, {
    cascade: true,
  })
  allocations?: ApAllocationEntity[];
}
