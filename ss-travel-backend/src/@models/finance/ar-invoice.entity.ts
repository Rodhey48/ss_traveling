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
import { AccountEntity } from './account.entity';
import { JournalEntryEntity } from './journal-entry.entity';
import { SpjEntity } from '../trips/spj.entity';
import { ArInvoiceLineEntity } from './ar-invoice-line.entity';
import { ArAllocationEntity } from './ar-allocation.entity';
import {
  ArInvoiceStatus,
  ArSourceType,
} from './finance.enums';

@Entity('ar_invoices')
export class ArInvoiceEntity extends BaseEntity {
  constructor(partial?: Partial<ArInvoiceEntity>) {
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
  @Column({ type: 'varchar', length: 50, unique: true, name: 'invoice_no' })
  invoiceNo!: string; // Misal: INV/WIS/2610/0001 atau INV/2610/0001

  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  customerId?: string;

  @ManyToOne(() => CustomerEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: CustomerEntity;

  @Column({ type: 'varchar', length: 150, name: 'customer_name' })
  customerName!: string;

  @Column({ type: 'timestamptz', name: 'invoice_date' })
  invoiceDate!: Date;

  @Column({ type: 'timestamptz', name: 'due_date' })
  dueDate!: Date;

  @Column({
    type: 'enum',
    enum: ArInvoiceStatus,
    default: ArInvoiceStatus.DRAFT,
  })
  status!: ArInvoiceStatus;

  @Column({ type: 'varchar', length: 10, default: 'IDR' })
  currency!: string;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'subtotal',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  subtotal!: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'tax_amount',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  taxAmount!: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'total_amount',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  totalAmount!: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'paid_amount',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  paidAmount!: number;

  @Column({
    type: 'enum',
    enum: ArSourceType,
    default: ArSourceType.MANUAL,
    name: 'source_type',
  })
  sourceType!: ArSourceType;

  @Column({ type: 'uuid', nullable: true, name: 'source_id' })
  sourceId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'trip_id' })
  tripId?: string;

  @ManyToOne(() => SpjEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'trip_id' })
  trip?: SpjEntity;

  @Column({ type: 'uuid', name: 'ar_account_id' })
  arAccountId!: string; // 12101 Piutang Sewa Charter Bus Wisata

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ar_account_id' })
  arAccount?: AccountEntity;

  @Column({ type: 'boolean', default: false, name: 'is_down_payment' })
  isDownPayment!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true, name: 'journal_entry_id' })
  journalEntryId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry?: JournalEntryEntity;

  @OneToMany(() => ArInvoiceLineEntity, (line) => line.invoice, {
    cascade: true,
  })
  lines?: ArInvoiceLineEntity[];

  @OneToMany(() => ArAllocationEntity, (alloc) => alloc.invoice)
  allocations?: ArAllocationEntity[];
}
