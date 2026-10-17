import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';

export enum CrewRole {
  DRIVER = 'DRIVER',
  CO_DRIVER = 'CO_DRIVER',
  CONDUCTOR = 'CONDUCTOR',
  STEWARDESS = 'STEWARDESS',
}

export enum CrewServiceType {
  AKAP = 'AKAP',
  TOURISM = 'TOURISM',
}

export enum CrewRateType {
  PER_TRIP = 'PER_TRIP',
  PER_DAY = 'PER_DAY',
}

@Entity('crew_rate_rules')
export class CrewRateRuleEntity extends BaseEntity {
  constructor(partial?: Partial<CrewRateRuleEntity>) {
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

  @Column({
    type: 'enum',
    enum: CrewRole,
  })
  role!: CrewRole;

  @Column({
    type: 'enum',
    enum: CrewServiceType,
    default: CrewServiceType.AKAP,
    name: 'service_type',
  })
  serviceType!: CrewServiceType;

  @Column({ type: 'varchar', length: 100, default: 'ALL' })
  origin!: string;

  @Column({ type: 'varchar', length: 100, default: 'ALL' })
  destination!: string;

  @Column({
    type: 'enum',
    enum: CrewRateType,
    default: CrewRateType.PER_TRIP,
    name: 'rate_type',
  })
  rateType!: CrewRateType;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'meal_allowance',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  mealAllowance!: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'trip_incentive',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  tripIncentive!: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'full_seat_bonus',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  fullSeatBonus!: number;

  @Column({
    type: 'timestamptz',
    name: 'effective_from',
    default: () => 'CURRENT_TIMESTAMP',
  })
  effectiveFrom!: Date;

  @Column({ type: 'timestamptz', name: 'effective_until', nullable: true })
  effectiveUntil?: Date;
}
