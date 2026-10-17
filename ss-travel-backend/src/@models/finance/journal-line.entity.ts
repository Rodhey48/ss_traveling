import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { JournalEntryEntity } from './journal-entry.entity';
import { AccountEntity } from './account.entity';
import { BusinessUnitEntity } from '../organization/business-unit.entity';
import { CostCenterEntity } from '../organization/cost-center.entity';
import { ProfitCenterEntity } from '../organization/profit-center.entity';
import { VehicleEntity } from '../fleet/vehicle.entity';

@Entity('journal_lines')
export class JournalLineEntity extends BaseEntity {
  constructor(partial?: Partial<JournalLineEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'journal_entry_id' })
  journalEntryId!: string;

  @ManyToOne(() => JournalEntryEntity, (entry) => entry.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry?: JournalEntryEntity;

  @Column({ type: 'int', name: 'line_no' })
  lineNo!: number;

  @Index()
  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account?: AccountEntity;

  @Column({ type: 'numeric', precision: 20, scale: 2, default: '0.00' })
  debit!: string;

  @Column({ type: 'numeric', precision: 20, scale: 2, default: '0.00' })
  credit!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  // Dimensions
  @Column({ type: 'uuid', name: 'business_unit_id', nullable: true })
  businessUnitId?: string;

  @ManyToOne(() => BusinessUnitEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit?: BusinessUnitEntity;

  @Column({ type: 'uuid', name: 'cost_center_id', nullable: true })
  costCenterId?: string;

  @ManyToOne(() => CostCenterEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cost_center_id' })
  costCenter?: CostCenterEntity;

  @Column({ type: 'uuid', name: 'profit_center_id', nullable: true })
  profitCenterId?: string;

  @ManyToOne(() => ProfitCenterEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'profit_center_id' })
  profitCenter?: ProfitCenterEntity;

  @Column({ type: 'uuid', name: 'trip_id', nullable: true })
  tripId?: string;

  @Column({ type: 'uuid', name: 'trip_leg_id', nullable: true })
  tripLegId?: string;

  @Column({ type: 'uuid', name: 'vehicle_id', nullable: true })
  vehicleId?: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: VehicleEntity;

  @Column({ type: 'varchar', length: 50, name: 'counterparty_type', nullable: true })
  counterpartyType?: string;

  @Column({ type: 'uuid', name: 'counterparty_id', nullable: true })
  counterpartyId?: string;
}
