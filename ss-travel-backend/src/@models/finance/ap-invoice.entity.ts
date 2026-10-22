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
import { AccountEntity } from './account.entity';
import { JournalEntryEntity } from './journal-entry.entity';
import { ApInvoiceLineEntity } from './ap-invoice-line.entity';
import { ApAllocationEntity } from './ap-allocation.entity';
import {
  ApVendorType,
  ApInvoiceStatus,
  ApSourceType,
} from './finance.enums';

@Entity('ap_invoices')
export class ApInvoiceEntity extends BaseEntity {
  constructor(partial?: Partial<ApInvoiceEntity>) {
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
  @Column({ type: 'varchar', length: 50, unique: true, name: 'bill_no' })
  billNo!: string; // Misal: BILL/2610/0001

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'vendor_invoice_no',
  })
  vendorInvoiceNo?: string; // Nomor faktur fisik vendor, misal: INV-RMTS-2026/10/012

  @Column({
    type: 'enum',
    enum: ApVendorType,
    default: ApVendorType.OTHER,
    name: 'vendor_type',
  })
  vendorType!: ApVendorType;

  @Column({ type: 'uuid', nullable: true, name: 'vendor_id' })
  vendorId?: string; // ID Restoran, Bengkel, atau Agen

  @Column({ type: 'varchar', length: 150, name: 'vendor_name' })
  vendorName!: string;

  @Column({ type: 'timestamptz', name: 'invoice_date' })
  invoiceDate!: Date;

  @Column({ type: 'timestamptz', name: 'due_date' })
  dueDate!: Date;

  @Column({
    type: 'enum',
    enum: ApInvoiceStatus,
    default: ApInvoiceStatus.DRAFT,
  })
  status!: ApInvoiceStatus;

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
    enum: ApSourceType,
    default: ApSourceType.MANUAL,
    name: 'source_type',
  })
  sourceType!: ApSourceType;

  @Column({ type: 'uuid', nullable: true, name: 'source_id' })
  sourceId?: string;

  @Column({ type: 'uuid', name: 'ap_account_id' })
  apAccountId!: string; // Akun Utang: 21101 (RM), 21102 (Bengkel), 22101 (Agen)

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ap_account_id' })
  apAccount?: AccountEntity;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true, name: 'journal_entry_id' })
  journalEntryId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry?: JournalEntryEntity;

  @OneToMany(() => ApInvoiceLineEntity, (line) => line.invoice, {
    cascade: true,
  })
  lines?: ApInvoiceLineEntity[];

  @OneToMany(() => ApAllocationEntity, (alloc) => alloc.invoice)
  allocations?: ApAllocationEntity[];
}
