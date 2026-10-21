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
import { SpjPaymentMethod } from './trip.enums';

@Entity('spj_uj_returns')
export class SpjUjReturnEntity extends BaseEntity {
  constructor(partial?: Partial<SpjUjReturnEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'spj_uj_id' })
  spjUjId!: string;

  @ManyToOne(() => SpjUjEntity, (uj) => uj.returns, {
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
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
  })
  amount!: string;

  @Column({
    type: 'timestamptz',
    name: 'returned_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  returnedAt!: Date;

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

  @Column({ type: 'uuid', name: 'received_by', nullable: true })
  receivedBy?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'received_by' })
  receiver?: UsersEntity;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'receipt_ref',
  })
  receiptRef?: string; // misal BKM/2610/0001

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
