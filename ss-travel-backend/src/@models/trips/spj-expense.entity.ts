import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { SpjEntity } from './spj.entity';
import { SpjLegEntity } from './spj-leg.entity';
import { VehicleEntity } from '../fleet/vehicle.entity';
import { UsersEntity } from '../user/user.entity';
import {
  SpjExpenseType,
  SpjExpensePaymentSource,
  SpjExpenseStatus,
} from './trip.enums';
import { SpjUjExpenseEntity } from './spj-uj-expense.entity';

@Entity('spj_expenses')
export class SpjExpenseEntity extends BaseEntity {
  constructor(partial?: Partial<SpjExpenseEntity>) {
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

  @Column({ type: 'uuid', name: 'spj_id' })
  spjId!: string;

  @ManyToOne(() => SpjEntity, (spj) => spj.expenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({ type: 'uuid', name: 'spj_leg_id', nullable: true })
  spjLegId?: string;

  @ManyToOne(() => SpjLegEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'spj_leg_id' })
  spjLeg?: SpjLegEntity;

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: VehicleEntity;

  @Column({
    type: 'enum',
    enum: SpjExpenseType,
    name: 'expense_type',
  })
  expenseType!: SpjExpenseType;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
  })
  amount!: string;

  @Column({
    type: 'timestamptz',
    name: 'expense_date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  expenseDate!: Date;

  @Column({
    type: 'enum',
    enum: SpjExpensePaymentSource,
    name: 'payment_source',
    default: SpjExpensePaymentSource.UJ,
  })
  paymentSource!: SpjExpensePaymentSource;

  // Metadata spesifik BBM Solar
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'fuel_liters',
  })
  fuelLiters?: string;

  @Column({ type: 'integer', nullable: true, name: 'odometer_km' })
  odometerKm?: number;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'fuel_station',
  })
  fuelStation?: string;

  // Bukti fisik / Struk nota
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'receipt_number',
  })
  receiptNumber?: string;

  @Column({ type: 'text', nullable: true, name: 'receipt_url' })
  receiptUrl?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: SpjExpenseStatus,
    default: SpjExpenseStatus.APPROVED,
  })
  status!: SpjExpenseStatus;

  @Column({ type: 'uuid', name: 'verified_by', nullable: true })
  verifiedBy?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier?: UsersEntity;

  @Column({ type: 'timestamptz', nullable: true, name: 'verified_at' })
  verifiedAt?: Date;

  @OneToMany(() => SpjUjExpenseEntity, (ujExp) => ujExp.expense)
  ujExpenses?: SpjUjExpenseEntity[];
}
