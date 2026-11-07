import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { SpjEntity } from './spj.entity';
import { SpjLegEntity } from './spj-leg.entity';
import { RestaurantEntity } from '../master-rules/restaurant.entity';
import { JournalEntryEntity } from '../finance/journal-entry.entity';
import { RestaurantSettlementBatchEntity } from '../finance/restaurant-settlement-batch.entity';

export enum SpjMealRecordStatus {
  UNPAID = 'UNPAID',
  PENDING_BATCH = 'PENDING_BATCH',
  PAID = 'PAID',
}

@Entity('spj_meal_records')
export class SpjMealRecordEntity extends BaseEntity {
  constructor(partial?: Partial<SpjMealRecordEntity>) {
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

  @Column({ type: 'uuid', name: 'spj_id' })
  spjId!: string;

  @ManyToOne(() => SpjEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({ type: 'uuid', name: 'spj_leg_id', nullable: true })
  spjLegId?: string;

  @ManyToOne(() => SpjLegEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'spj_leg_id' })
  spjLeg?: SpjLegEntity;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId!: string;

  @ManyToOne(() => RestaurantEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantEntity;

  @Column({ type: 'int', name: 'manifest_pax', default: 0 })
  manifestPax!: number;

  @Column({ type: 'int', name: 'actual_pax', default: 0 })
  actualPax!: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'rate_per_pax',
    default: 25000.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  ratePerPax!: number;

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

  @Column({
    type: 'enum',
    enum: SpjMealRecordStatus,
    default: SpjMealRecordStatus.UNPAID,
  })
  status!: SpjMealRecordStatus;

  @Column({ type: 'uuid', name: 'settlement_batch_id', nullable: true })
  settlementBatchId?: string;

  @ManyToOne(
    () => RestaurantSettlementBatchEntity,
    (batch) => batch.items,
    { onDelete: 'SET NULL', nullable: true },
  )
  @JoinColumn({ name: 'settlement_batch_id' })
  settlementBatch?: RestaurantSettlementBatchEntity;

  @Column({ type: 'uuid', name: 'journal_id', nullable: true })
  journalId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'journal_id' })
  journal?: JournalEntryEntity;

  @Column({ type: 'text', nullable: true, name: 'discrepancy_notes' })
  discrepancyNotes?: string;
}
