import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { ArInvoiceEntity } from './ar-invoice.entity';
import { AccountEntity } from './account.entity';
import { SpjEntity } from '../trips/spj.entity';
import { VehicleEntity } from '../fleet/vehicle.entity';
import { BusinessUnitEntity } from '../organization/business-unit.entity';
import { ProfitCenterEntity } from '../organization/profit-center.entity';

@Entity('ar_invoice_lines')
export class ArInvoiceLineEntity extends BaseEntity {
  constructor(partial?: Partial<ArInvoiceLineEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'invoice_id' })
  invoiceId!: string;

  @ManyToOne(() => ArInvoiceEntity, (inv) => inv.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice?: ArInvoiceEntity;

  @Column({ type: 'int', name: 'line_no' })
  lineNo!: number;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string; // 24101 DP Sewa Wisata atau 42101 Pendapatan Sewa Wisata

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account?: AccountEntity;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 1,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  qty!: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'unit_price',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  unitPrice!: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'amount',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  amount!: number;

  // Dimensi Analitik
  @Column({ type: 'uuid', nullable: true, name: 'trip_id' })
  tripId?: string;

  @ManyToOne(() => SpjEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'trip_id' })
  trip?: SpjEntity;

  @Column({ type: 'uuid', nullable: true, name: 'vehicle_id' })
  vehicleId?: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: VehicleEntity;

  @Column({ type: 'uuid', nullable: true, name: 'business_unit_id' })
  businessUnitId?: string;

  @ManyToOne(() => BusinessUnitEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit?: BusinessUnitEntity;

  @Column({ type: 'uuid', nullable: true, name: 'profit_center_id' })
  profitCenterId?: string;

  @ManyToOne(() => ProfitCenterEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'profit_center_id' })
  profitCenter?: ProfitCenterEntity;
}
