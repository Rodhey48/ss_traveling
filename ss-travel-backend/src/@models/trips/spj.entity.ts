import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { BusinessUnitEntity } from '../organization/business-unit.entity';
import { CostCenterEntity } from '../organization/cost-center.entity';
import { ProfitCenterEntity } from '../organization/profit-center.entity';
import { VehicleEntity } from '../fleet/vehicle.entity';
import { TripScheduleEntity } from './trip-schedule.entity';
import { SpjLegEntity } from './spj-leg.entity';
import { SpjCrewAssignmentEntity } from './spj-crew-assignment.entity';
import { SpjExpenseEntity } from './spj-expense.entity';
import { SpjUjEntity } from './spj-uj.entity';
import { SpjRevenueDeclarationEntity } from './spj-revenue-declaration.entity';
import { CrewMealPaymentEntity } from './crew-meal-payment.entity';
import { CrewCashSettlementEntity } from '../cashier/crew-cash-settlement.entity';
import { CrewCashRemittanceEntity } from '../cashier/crew-cash-remittance.entity';
import { CrewCashDiscrepancyEntity } from '../cashier/crew-cash-discrepancy.entity';
import {
  TripServiceType,
  SpjOperationalStatus,
  SpjFinancialStatus,
} from './trip.enums';

@Entity('spjs')
export class SpjEntity extends BaseEntity {
  constructor(partial?: Partial<SpjEntity>) {
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

  @Column({ type: 'varchar', length: 50, unique: true, name: 'spj_no' })
  spjNo!: string; // Misal: SPJ/AKP/2610/0001 atau SPJ/WIS/2610/0001

  @Column({
    type: 'enum',
    enum: TripServiceType,
    name: 'service_type',
    default: TripServiceType.AKAP,
  })
  serviceType!: TripServiceType;

  @Column({ type: 'uuid', name: 'trip_schedule_id', nullable: true })
  tripScheduleId?: string;

  @OneToOne(() => TripScheduleEntity, (sch) => sch.spj, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'trip_schedule_id' })
  tripSchedule?: TripScheduleEntity;

  // Emergency Breakdown / Penggantian Armada (Skenario 3)
  @Column({ type: 'uuid', name: 'parent_spj_id', nullable: true })
  parentSpjId?: string;

  @ManyToOne(() => SpjEntity, (parent) => parent.replacementSpjs, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_spj_id' })
  parentSpj?: SpjEntity;

  @OneToMany(() => SpjEntity, (child) => child.parentSpj)
  replacementSpjs?: SpjEntity[];

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: VehicleEntity;

  @Column({ type: 'uuid', name: 'business_unit_id', nullable: true })
  businessUnitId?: string;

  @ManyToOne(() => BusinessUnitEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit?: BusinessUnitEntity;

  @Column({ type: 'uuid', name: 'profit_center_id', nullable: true })
  profitCenterId?: string;

  @ManyToOne(() => ProfitCenterEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'profit_center_id' })
  profitCenter?: ProfitCenterEntity;

  @Column({ type: 'uuid', name: 'cost_center_id', nullable: true })
  costCenterId?: string;

  @ManyToOne(() => CostCenterEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cost_center_id' })
  costCenter?: CostCenterEntity;

  // Blueprint Bab 8.2: Status Ganda Independen
  @Column({
    type: 'enum',
    enum: SpjOperationalStatus,
    name: 'operational_status',
    default: SpjOperationalStatus.DRAFT,
  })
  operationalStatus!: SpjOperationalStatus;

  @Column({
    type: 'enum',
    enum: SpjFinancialStatus,
    name: 'financial_status',
    default: SpjFinancialStatus.PENDING_SETTLEMENT,
  })
  financialStatus!: SpjFinancialStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'issued_at' })
  issuedAt?: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'operationally_completed_at',
  })
  operationallyCompletedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'closed_at' })
  closedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => SpjLegEntity, (leg) => leg.spj, { cascade: true })
  legs?: SpjLegEntity[];

  @OneToMany(() => SpjCrewAssignmentEntity, (crew) => crew.spj, {
    cascade: true,
  })
  crewAssignments?: SpjCrewAssignmentEntity[];

  @OneToMany(() => SpjUjEntity, (uj) => uj.spj)
  ujs?: SpjUjEntity[];

  @OneToMany(() => SpjExpenseEntity, (expense) => expense.spj)
  expenses?: SpjExpenseEntity[];

  @OneToMany(() => SpjRevenueDeclarationEntity, (rev) => rev.spj)
  revenueDeclarations?: SpjRevenueDeclarationEntity[];

  @OneToMany(() => CrewMealPaymentEntity, (pay) => pay.spj)
  crewMealPayments?: CrewMealPaymentEntity[];

  @OneToMany(() => CrewCashSettlementEntity, (s) => s.spj)
  settlements?: CrewCashSettlementEntity[];

  @OneToMany(() => CrewCashRemittanceEntity, (r) => r.spj)
  remittances?: CrewCashRemittanceEntity[];

  @OneToMany(() => CrewCashDiscrepancyEntity, (d) => d.spj)
  discrepancies?: CrewCashDiscrepancyEntity[];
}
