import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CrewCashRemittanceEntity } from './crew-cash-remittance.entity';
import { SpjRevenueDeclarationEntity } from '../trips/spj-revenue-declaration.entity';

@Entity('crew_cash_remittance_allocations')
export class CrewCashRemittanceAllocationEntity extends BaseEntity {
  constructor(partial?: Partial<CrewCashRemittanceAllocationEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'remittance_id' })
  remittanceId!: string;

  @ManyToOne(() => CrewCashRemittanceEntity, (r) => r.allocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'remittance_id' })
  remittance?: CrewCashRemittanceEntity;

  @Column({ type: 'uuid', name: 'revenue_declaration_id' })
  revenueDeclarationId!: string;

  @ManyToOne(() => SpjRevenueDeclarationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'revenue_declaration_id' })
  revenueDeclaration?: SpjRevenueDeclarationEntity;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    name: 'allocated_amount',
  })
  allocatedAmount!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
