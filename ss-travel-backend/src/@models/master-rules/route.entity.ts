import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { TripServiceType } from '../trips/trip.enums';

@Entity('routes')
export class RouteEntity extends BaseEntity {
  constructor(partial?: Partial<RouteEntity>) {
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

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  origin!: string;

  @Column({ type: 'varchar', length: 100 })
  destination!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  via?: string;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true, name: 'distance_km' })
  distanceKm?: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'estimated_hours' })
  estimatedHours?: number;

  @Column({
    type: 'enum',
    enum: TripServiceType,
    name: 'service_type',
    default: TripServiceType.AKAP,
  })
  serviceType!: TripServiceType;
}
