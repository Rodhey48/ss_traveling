import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { SpjUjEntity } from './spj-uj.entity';
import { SpjCrewAssignmentEntity } from './spj-crew-assignment.entity';
import { CashAccountEntity } from '../finance/cash-account.entity';
import { BankAccountEntity } from '../finance/bank-account.entity';
import { UsersEntity } from '../user/user.entity';
import { SpjDisbursementType, SpjPaymentMethod } from './trip.enums';

@Entity('spj_uj_disbursements')
export class SpjUjDisbursementEntity extends BaseEntity {
  constructor(partial?: Partial<SpjUjDisbursementEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'spj_uj_id' })
  spjUjId!: string;

  @ManyToOne(() => SpjUjEntity, (uj) => uj.disbursements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'spj_uj_id' })
  spjUj?: SpjUjEntity;

  @Column({ type: 'uuid', name: 'crew_assignment_id', nullable: true })
  crewAssignmentId?: string;

  @ManyToOne(() => SpjCrewAssignmentEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'crew_assignment_id' })
  crewAssignment?: SpjCrewAssignmentEntity;

  @Column({
    type: 'enum',
    enum: SpjDisbursementType,
    name: 'disbursement_type',
    default: SpjDisbursementType.INITIAL,
  })
  disbursementType!: SpjDisbursementType;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
  })
  amount!: string;

  @Column({
    type: 'timestamptz',
    name: 'disbursed_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  disbursedAt!: Date;

  @Column({
    type: 'enum',
    enum: SpjPaymentMethod,
    name: 'payment_method',
    default: SpjPaymentMethod.CASH,
  })
  paymentMethod!: SpjPaymentMethod;

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

  @Column({ type: 'uuid', name: 'disbursed_by', nullable: true })
  disbursedBy?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'disbursed_by' })
  disburser?: UsersEntity;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'receipt_ref',
  })
  receiptRef?: string; // misal BKK/2610/0001 atau No Transfer BCA

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
