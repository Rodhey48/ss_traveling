import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';

export enum RestaurantSettlementType {
  PAID_BY_CREW_UJ = 'PAID_BY_CREW_UJ',
  INVOICED_MONTHLY_AP = 'INVOICED_MONTHLY_AP',
}

@Entity('restaurants')
export class RestaurantEntity extends BaseEntity {
  constructor(partial?: Partial<RestaurantEntity>) {
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
  code!: string; // misal: 'RM-01', 'RM-02'

  @Column({ type: 'varchar', length: 150 })
  name!: string; // misal: 'RM Taman Selera'

  @Column({ type: 'varchar', length: 100 })
  city!: string; // misal: 'SUBANG', 'BATANG', 'GRINGSING'

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'rate_per_pax',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  ratePerPax!: number; // misal: 25000.00 / pax

  @Column({
    type: 'enum',
    enum: RestaurantSettlementType,
    default: RestaurantSettlementType.INVOICED_MONTHLY_AP,
    name: 'settlement_type',
  })
  settlementType!: RestaurantSettlementType;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'contact_person' })
  contactPerson?: string;
}
