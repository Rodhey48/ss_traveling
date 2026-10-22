import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { ApInvoiceEntity } from './ap-invoice.entity';
import { AccountEntity } from './account.entity';
import { SpjEntity } from '../trips/spj.entity';
import { SpjLegEntity } from '../trips/spj-leg.entity';
import { VehicleEntity } from '../fleet/vehicle.entity';
import { CostCenterEntity } from '../organization/cost-center.entity';
import { BusinessUnitEntity } from '../organization/business-unit.entity';

@Entity('ap_invoice_lines')
export class ApInvoiceLineEntity extends BaseEntity {
  constructor(partial?: Partial<ApInvoiceLineEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'invoice_id' })
  invoiceId!: string;

  @ManyToOne(() => ApInvoiceEntity, (inv) => inv.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice?: ApInvoiceEntity;

  @Column({ type: 'int', name: 'line_no' })
  lineNo!: number;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string; // Akun Beban (51102 Servis Makan, 55101 Bengkel, 54101 Komisi Agen)

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
  qty!: number; // misal: jumlah kupon makan

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
  unitPrice!: number; // misal: Rp 25.000 / pax

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

  // Dimensi Terikat
  @Column({ type: 'uuid', nullable: true, name: 'trip_id' })
  tripId?: string;

  @ManyToOne(() => SpjEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'trip_id' })
  trip?: SpjEntity;

  @Column({ type: 'uuid', nullable: true, name: 'trip_leg_id' })
  tripLegId?: string;

  @ManyToOne(() => SpjLegEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'trip_leg_id' })
  tripLeg?: SpjLegEntity;

  @Column({ type: 'uuid', nullable: true, name: 'vehicle_id' })
  vehicleId?: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: VehicleEntity;

  @Column({ type: 'uuid', nullable: true, name: 'cost_center_id' })
  costCenterId?: string;

  @ManyToOne(() => CostCenterEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cost_center_id' })
  costCenter?: CostCenterEntity;

  @Column({ type: 'uuid', nullable: true, name: 'business_unit_id' })
  businessUnitId?: string;

  @ManyToOne(() => BusinessUnitEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit?: BusinessUnitEntity;

  // Metadata Audit Restoran Mitra (Addendum v1.12 & Test Case 1)
  @Column({ type: 'int', nullable: true, name: 'manifest_pax_count' })
  manifestPaxCount?: number;

  @Column({ type: 'int', nullable: true, name: 'coupon_count' })
  couponCount?: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'discrepancy_notes' })
  discrepancyNotes?: string;
}
