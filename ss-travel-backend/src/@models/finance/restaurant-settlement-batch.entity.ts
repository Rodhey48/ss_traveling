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
import { RestaurantEntity } from '../master-rules/restaurant.entity';
import { CashAccountEntity } from '../finance/cash-account.entity';
import { JournalEntryEntity } from '../finance/journal-entry.entity';
import { SpjMealRecordEntity } from '../trips/spj-meal-record.entity';

@Entity('restaurant_settlement_batches')
export class RestaurantSettlementBatchEntity extends BaseEntity {
  constructor(partial?: Partial<RestaurantSettlementBatchEntity>) {
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

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId!: string;

  @ManyToOne(() => RestaurantEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantEntity;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'restaurant_name' })
  restaurantName?: string;

  @Column({ type: 'int', name: 'total_spjs', default: 0 })
  totalSpjs!: number;

  @Column({ type: 'int', name: 'total_coupons', default: 0 })
  totalCoupons!: number;

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

  @Column({ type: 'varchar', length: 50, default: 'COMPLETED' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', name: 'created_by_id', nullable: true })
  createdById?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: UsersEntity;

  @OneToMany(() => SpjMealRecordEntity, (record) => record.settlementBatch)
  items?: SpjMealRecordEntity[];
}
