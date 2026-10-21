import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { SpjUjEntity } from './spj-uj.entity';
import { SpjCrewAssignmentEntity } from './spj-crew-assignment.entity';
import { SpjExpenseEntity } from './spj-expense.entity';

@Entity('spj_uj_expenses')
export class SpjUjExpenseEntity extends BaseEntity {
  constructor(partial?: Partial<SpjUjExpenseEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'spj_uj_id' })
  spjUjId!: string;

  @ManyToOne(() => SpjUjEntity, (uj) => uj.expenses, {
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

  @Column({ type: 'uuid', name: 'expense_id' })
  expenseId!: string;

  @ManyToOne(() => SpjExpenseEntity, (exp) => exp.ujExpenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expense_id' })
  expense?: SpjExpenseEntity;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
  })
  amount!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'receipt_ref',
  })
  receiptRef?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
