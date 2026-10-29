import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { BusinessUnitEntity } from '../organization/business-unit.entity';
import { CostCenterEntity } from '../organization/cost-center.entity';
import { VehicleEntity } from '../fleet/vehicle.entity';
import { CustomerEntity } from '../customer/customer.entity';
import { UsersEntity } from '../user/user.entity';
import { SpjEntity } from './spj.entity';
import { TripServiceType, TripScheduleStatus } from './trip.enums';

@Entity('trip_schedules')
export class TripScheduleEntity extends BaseEntity {
  constructor(partial?: Partial<TripScheduleEntity>) {
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

  @Column({ type: 'varchar', length: 50, unique: true, name: 'schedule_no' })
  scheduleNo!: string; // Misal: SCH/AKP/2610/0001 atau SCH/WIS/2610/0001

  @Column({
    type: 'enum',
    enum: TripServiceType,
    name: 'service_type',
    default: TripServiceType.AKAP,
  })
  serviceType!: TripServiceType;

  @Column({ type: 'uuid', name: 'business_unit_id', nullable: true })
  businessUnitId?: string;

  @ManyToOne(() => BusinessUnitEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit?: BusinessUnitEntity;

  @Column({ type: 'uuid', name: 'cost_center_id', nullable: true })
  costCenterId?: string;

  @ManyToOne(() => CostCenterEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cost_center_id' })
  costCenter?: CostCenterEntity;

  @Column({ type: 'uuid', name: 'vehicle_id', nullable: true })
  vehicleId?: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: VehicleEntity;

  @Column({ type: 'timestamptz', name: 'planned_departure_at' })
  plannedDepartureAt!: Date;

  @Column({ type: 'timestamptz', name: 'planned_return_at' })
  plannedReturnAt!: Date;

  @Column({ type: 'varchar', length: 150 })
  origin!: string; // Misal: 'Pool Ciputat / Tangerang'

  @Column({ type: 'varchar', length: 150 })
  destination!: string; // Misal: 'Terminal Giwangan Yogyakarta'

  // Khusus Pariwisata / Charter
  @Column({ type: 'uuid', name: 'customer_id', nullable: true })
  customerId?: string;

  @ManyToOne(() => CustomerEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: CustomerEntity;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'pic_name' })
  picName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'pic_phone' })
  picPhone?: string;

  @Column({ type: 'text', nullable: true, name: 'pickup_notes' })
  pickupNotes?: string;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'total_package_price',
  })
  totalPackagePrice!: string; // Nilai kontrak sewa wisata

  // Personel Kru yang direncanakan
  @Column({ type: 'uuid', name: 'planned_driver_1_id', nullable: true })
  plannedDriver1Id?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'planned_driver_1_id' })
  plannedDriver1?: UsersEntity;

  @Column({ type: 'uuid', name: 'planned_driver_2_id', nullable: true })
  plannedDriver2Id?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'planned_driver_2_id' })
  plannedDriver2?: UsersEntity;

  @Column({ type: 'uuid', name: 'planned_conductor_id', nullable: true })
  plannedConductorId?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'planned_conductor_id' })
  plannedConductor?: UsersEntity;

  @Column({
    type: 'enum',
    enum: TripScheduleStatus,
    default: TripScheduleStatus.DRAFT,
  })
  status!: TripScheduleStatus;

  @Column({ type: 'uuid', name: 'spj_id', nullable: true })
  spjId?: string;

  @OneToOne(() => SpjEntity, (spj) => spj.tripSchedule, { nullable: true })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
