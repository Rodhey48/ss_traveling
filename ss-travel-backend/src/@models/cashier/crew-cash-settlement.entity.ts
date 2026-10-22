import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { SpjEntity } from '../trips/spj.entity';
import { UsersEntity } from '../user/user.entity';
import { JournalEntryEntity } from '../finance/journal-entry.entity';
import {
  CrewCashSettlementStatus,
  SettlementUjStatus,
  SettlementRevenueStatus,
} from './cashier.enums';
import { CrewCashRemittanceEntity } from './crew-cash-remittance.entity';
import { CrewCashDiscrepancyEntity } from './crew-cash-discrepancy.entity';

@Entity('crew_cash_settlements')
export class CrewCashSettlementEntity extends BaseEntity {
  constructor(partial?: Partial<CrewCashSettlementEntity>) {
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

  @Column({ type: 'varchar', length: 50, unique: true, name: 'settlement_no' })
  settlementNo!: string; // Misal: SETTLE/2610/0001

  @Column({ type: 'uuid', name: 'spj_id' })
  spjId!: string;

  @ManyToOne(() => SpjEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({
    type: 'enum',
    enum: CrewCashSettlementStatus,
    default: CrewCashSettlementStatus.DRAFT,
  })
  status!: CrewCashSettlementStatus;

  // Dua Kantong Kas Kru (Anti-Netting)
  @Column({
    type: 'enum',
    enum: SettlementUjStatus,
    name: 'uj_status',
    default: SettlementUjStatus.PENDING,
  })
  ujStatus!: SettlementUjStatus;

  @Column({
    type: 'enum',
    enum: SettlementRevenueStatus,
    name: 'revenue_status',
    default: SettlementRevenueStatus.PENDING,
  })
  revenueStatus!: SettlementRevenueStatus;

  @Column({ type: 'uuid', name: 'cashier_id', nullable: true })
  cashierId?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cashier_id' })
  cashier?: UsersEntity;

  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt?: Date;

  @Column({ type: 'uuid', name: 'reviewed_by_id', nullable: true })
  reviewedById?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewedBy?: UsersEntity;

  @Column({ type: 'timestamptz', nullable: true, name: 'reviewed_at' })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Akumulasi Finansial Kantong 1: Pertanggungjawaban UJ
  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'total_uj_disbursed',
  })
  totalUjDisbursed!: number;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'total_uj_spent',
  })
  totalUjSpent!: number;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'total_uj_returned',
  })
  totalUjReturned!: number;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'uj_balance',
  })
  ujBalance!: number; // totalUjDisbursed - totalUjSpent - totalUjReturned (0 = BALANCED)

  // Akumulasi Finansial Kantong 2: Setoran Bruto Penerimaan
  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'total_revenue_expected',
  })
  totalRevenueExpected!: number;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'total_revenue_remitted',
  })
  totalRevenueRemitted!: number;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'revenue_balance',
  })
  revenueBalance!: number; // totalRevenueExpected - totalRevenueRemitted (0 = MATCHED)

  // Total Kas Meja Kasir
  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'total_cash_received',
  })
  totalCashReceived!: number; // UJ returned + Revenue remitted

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'total_cash_paid',
  })
  totalCashPaid!: number; // Pembayaran kas tunai kru via BKK (Uang makan / komisi kargo / talangan nombok)

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'bkm_no' })
  bkmNo?: string; // Bukti Kas Masuk (misal: BKM/2610/0001)

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'bkk_no' })
  bkkNo?: string; // Bukti Kas Keluar (misal: BKK/2610/0001)

  @Column({ type: 'uuid', name: 'journal_entry_id', nullable: true })
  journalEntryId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry?: JournalEntryEntity;

  @OneToMany(() => CrewCashRemittanceEntity, (rem) => rem.settlement)
  remittances?: CrewCashRemittanceEntity[];

  @OneToMany(() => CrewCashDiscrepancyEntity, (disc) => disc.settlement)
  discrepancies?: CrewCashDiscrepancyEntity[];
}
