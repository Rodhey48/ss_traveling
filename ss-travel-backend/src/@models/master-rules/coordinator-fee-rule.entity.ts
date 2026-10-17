import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { UsersEntity } from '../user/user.entity';

export enum CoordinatorZone {
  WEST = 'WEST', // Jabodetabek (Jakarta, Tangerang, Bogor, dsb)
  EAST = 'EAST', // Jateng & DIY (Yogyakarta, Solo, Klaten, dsb)
}

@Entity('coordinator_fee_rules')
export class CoordinatorFeeRuleEntity extends BaseEntity {
  constructor(partial?: Partial<CoordinatorFeeRuleEntity>) {
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
    enum: CoordinatorZone,
  })
  zone!: CoordinatorZone;

  @Column({ type: 'uuid', name: 'coordinator_user_id', nullable: true })
  coordinatorUserId?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'coordinator_user_id' })
  coordinatorUser?: UsersEntity;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 10000,
    name: 'fee_per_pax',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  feePerPax!: number; // misal: 10000.00 / pax

  @Column({
    type: 'timestamptz',
    name: 'effective_from',
    default: () => 'CURRENT_TIMESTAMP',
  })
  effectiveFrom!: Date;

  @Column({ type: 'timestamptz', name: 'effective_until', nullable: true })
  effectiveUntil?: Date;
}
