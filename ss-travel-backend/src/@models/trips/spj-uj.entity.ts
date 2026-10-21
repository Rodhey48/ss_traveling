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
import { UsersEntity } from '../user/user.entity';
import { SpjUjStatus } from './trip.enums';
import { SpjUjDisbursementEntity } from './spj-uj-disbursement.entity';
import { SpjUjExpenseEntity } from './spj-uj-expense.entity';
import { SpjUjReturnEntity } from './spj-uj-return.entity';
import { SpjUjAdditionalRequestEntity } from './spj-uj-additional-request.entity';

@Entity('spj_uj')
export class SpjUjEntity extends BaseEntity {
  constructor(partial?: Partial<SpjUjEntity>) {
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

  @ManyToOne(() => SpjEntity, (spj) => spj.ujs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({ type: 'uuid', name: 'crew_id' })
  crewId!: string; // Pemegang amplop UJ (biasanya Driver 1)

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'crew_id' })
  crew?: UsersEntity;

  @Column({
    type: 'enum',
    enum: SpjUjStatus,
    default: SpjUjStatus.DRAFT,
  })
  status!: SpjUjStatus;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
    name: 'total_disbursed',
  })
  totalDisbursed!: string;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
    name: 'total_spent',
  })
  totalSpent!: string;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
    name: 'total_returned',
  })
  totalReturned!: string;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
    name: 'balance',
  })
  balance!: string; // totalDisbursed - totalSpent - totalReturned

  // Scenario 3: UJ Rollover saat penggantian bus darurat di tol
  @Column({ type: 'uuid', name: 'rollover_from_spj_id', nullable: true })
  rolloverFromSpjId?: string;

  @ManyToOne(() => SpjEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'rollover_from_spj_id' })
  rolloverFromSpj?: SpjEntity;

  @Column({ type: 'uuid', name: 'rollover_to_spj_id', nullable: true })
  rolloverToSpjId?: string;

  @ManyToOne(() => SpjEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'rollover_to_spj_id' })
  rolloverToSpj?: SpjEntity;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => SpjUjDisbursementEntity, (disb) => disb.spjUj)
  disbursements?: SpjUjDisbursementEntity[];

  @OneToMany(() => SpjUjExpenseEntity, (exp) => exp.spjUj)
  expenses?: SpjUjExpenseEntity[];

  @OneToMany(() => SpjUjReturnEntity, (ret) => ret.spjUj)
  returns?: SpjUjReturnEntity[];

  @OneToMany(() => SpjUjAdditionalRequestEntity, (req) => req.spjUj)
  additionalRequests?: SpjUjAdditionalRequestEntity[];
}
