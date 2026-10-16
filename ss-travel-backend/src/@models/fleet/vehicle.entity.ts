import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { VehicleSeatClassEntity } from './vehicle-seat-class.entity';
import { VehicleImageEntity } from './vehicle-image.entity';

export enum VehicleType {
  BIG_BUS = 'BIG_BUS',
  MEDIUM_BUS = 'MEDIUM_BUS',
  MINIBUS = 'MINIBUS',
}

export enum OwnershipStatus {
  OWNED_PAID_OFF = 'OWNED_PAID_OFF',
  LEASING = 'LEASING',
  RENTAL = 'RENTAL',
}

@Entity('vehicles')
export class VehicleEntity extends BaseEntity {
  constructor(partial?: Partial<VehicleEntity>) {
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

  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string; // Nomor Lambung, misal 'SS-01'

  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname?: string; // Julukan bus, misal 'Executive Combi'

  @Column({ type: 'varchar', length: 20, unique: true, name: 'plate_number' })
  plateNumber!: string; // Nopol, misal 'B 7123 SS'

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.BIG_BUS,
    name: 'vehicle_type',
  })
  vehicleType!: VehicleType;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'chassis_model' })
  chassisModel?: string; // misal 'Mercedes-Benz OH 1626'

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'body_model' })
  bodyModel?: string; // misal 'Jetbus 5 Combi'

  @Column({
    type: 'enum',
    enum: OwnershipStatus,
    default: OwnershipStatus.OWNED_PAID_OFF,
    name: 'ownership_status',
  })
  ownershipStatus!: OwnershipStatus;

  @Column({ type: 'int', default: 0 })
  capacity!: number; // Total kapasitas kursi fisik

  @Column({ type: 'int', nullable: true })
  year?: number; // Tahun pembuatan / rakit

  @OneToMany(() => VehicleSeatClassEntity, (sc) => sc.vehicle, {
    cascade: true,
  })
  seatClasses?: VehicleSeatClassEntity[];

  @OneToMany(() => VehicleImageEntity, (img) => img.vehicle, {
    cascade: true,
  })
  images?: VehicleImageEntity[];
}
