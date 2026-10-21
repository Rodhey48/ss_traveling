import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { SpjEntity } from './spj.entity';
import { SpjCrewAssignmentEntity } from './spj-crew-assignment.entity';
import { UsersEntity } from '../user/user.entity';
import { CashAccountEntity } from '../finance/cash-account.entity';
import { BankAccountEntity } from '../finance/bank-account.entity';
import {
  CrewMealPaymentCategory,
  CrewMealPaymentStatus,
  CrewPayoutTiming,
  SpjPaymentMethod,
} from './trip.enums';

@Entity('crew_meal_payments')
export class CrewMealPaymentEntity extends BaseEntity {
  constructor(partial?: Partial<CrewMealPaymentEntity>) {
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

  @ManyToOne(() => SpjEntity, (spj) => spj.crewMealPayments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({ type: 'uuid', name: 'crew_assignment_id', nullable: true })
  crewAssignmentId?: string;

  @ManyToOne(() => SpjCrewAssignmentEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'crew_assignment_id' })
  crewAssignment?: SpjCrewAssignmentEntity;

  @Column({ type: 'uuid', name: 'crew_id' })
  crewId!: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'crew_id' })
  crew?: UsersEntity;

  @Column({
    type: 'enum',
    enum: CrewMealPaymentCategory,
    name: 'payment_category',
  })
  paymentCategory!: CrewMealPaymentCategory;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
  })
  amount!: string;

  @Column({
    type: 'enum',
    enum: CrewPayoutTiming,
    name: 'payout_timing',
    default: CrewPayoutTiming.AT_SETTLEMENT,
  })
  payoutTiming!: CrewPayoutTiming;

  @Column({
    type: 'enum',
    enum: CrewMealPaymentStatus,
    default: CrewMealPaymentStatus.PENDING,
  })
  status!: CrewMealPaymentStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'paid_at' })
  paidAt?: Date;

  @Column({
    type: 'enum',
    enum: SpjPaymentMethod,
    nullable: true,
    name: 'payment_method',
  })
  paymentMethod?: SpjPaymentMethod;

  @Column({ type: 'uuid', name: 'cash_account_id', nullable: true })
  cashAccountId?: string;

  @ManyToOne(() => CashAccountEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cash_account_id' })
  cashAccount?: CashAccountEntity;

  @Column({ type: 'uuid', name: 'bank_account_id', nullable: true })
  bankAccountId?: string;

  @ManyToOne(() => BankAccountEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount?: BankAccountEntity;

  @Column({ type: 'uuid', name: 'paid_by', nullable: true })
  paidBy?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'paid_by' })
  payer?: UsersEntity;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'receipt_ref',
  })
  receiptRef?: string; // misal BKK/2610/0002 atau Ref Transfer BCA

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
