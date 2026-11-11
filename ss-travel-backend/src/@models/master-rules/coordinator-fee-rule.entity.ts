import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { UsersEntity } from '../user/user.entity';
import { RouteEntity } from './route.entity';

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

  @Column({ type: 'uuid', name: 'route_id', nullable: true })
  routeId?: string;

  @ManyToOne(() => RouteEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'route_id' })
  route?: RouteEntity;

  @Column({ type: 'varchar', length: 100, default: 'ALL' })
  origin!: string;

  @Column({ type: 'varchar', length: 100, default: 'ALL' })
  destination!: string;

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
  feePerPax!: number;

  @Column({
    type: 'timestamptz',
    name: 'effective_from',
    default: () => 'CURRENT_TIMESTAMP',
  })
  effectiveFrom!: Date;

  @Column({ type: 'timestamptz', name: 'effective_until', nullable: true })
  effectiveUntil?: Date;
}
