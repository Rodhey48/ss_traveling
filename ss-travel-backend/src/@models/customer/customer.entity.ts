import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';

export enum CustomerType {
  CORPORATE = 'CORPORATE',
  SCHOOL = 'SCHOOL',
  COMMUNITY = 'COMMUNITY',
  INDIVIDUAL = 'INDIVIDUAL',
  GOVERNMENT = 'GOVERNMENT',
}

export enum LeadSource {
  DIRECT = 'DIRECT',
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
}

export enum CustomerTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

@Entity('customers')
export class CustomerEntity extends BaseEntity {
  constructor(partial?: Partial<CustomerEntity>) {
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

  @Column({ type: 'varchar', length: 30, unique: true })
  code!: string; // misal 'CUST-0001'

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.CORPORATE,
    name: 'customer_type',
  })
  customerType!: CustomerType;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'institution_name',
  })
  institutionName?: string; // misal 'PT Mitra Sejahtera Abadi'

  @Column({ type: 'varchar', length: 100, name: 'pic_name' })
  picName!: string; // Nama narahubung / PIC

  @Column({ type: 'varchar', length: 30 })
  phone!: string; // No HP / WhatsApp

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({
    type: 'enum',
    enum: LeadSource,
    default: LeadSource.DIRECT,
    name: 'lead_source',
  })
  leadSource!: LeadSource;

  @Column({
    type: 'enum',
    enum: CustomerTier,
    default: CustomerTier.BRONZE,
    name: 'customer_tier',
  })
  customerTier!: CustomerTier;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_trip_date' })
  lastTripDate?: Date;

  @Column({ type: 'int', default: 0, name: 'total_trips_count' })
  totalTripsCount!: number;

  @Column({ type: 'text', nullable: true, name: 'special_notes' })
  specialNotes?: string;
}
