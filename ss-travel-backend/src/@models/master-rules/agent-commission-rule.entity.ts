import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { AgentEntity } from './agent.entity';
import { SeatClassEntity } from '../fleet/seat-class.entity';

export enum CommissionRuleType {
  FLAT_PER_TICKET = 'FLAT_PER_TICKET',
  PERCENTAGE = 'PERCENTAGE',
}

@Entity('agent_commission_rules')
export class AgentCommissionRuleEntity extends BaseEntity {
  constructor(partial?: Partial<AgentCommissionRuleEntity>) {
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

  @Column({ type: 'uuid', name: 'agent_id' })
  agentId!: string;

  @ManyToOne(() => AgentEntity, (agent) => agent.commissionRules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agent_id' })
  agent?: AgentEntity;

  @Column({ type: 'uuid', name: 'seat_class_id', nullable: true })
  seatClassId?: string; // Jika null / undefined: Berlaku untuk seluruh kelas kursi

  @ManyToOne(() => SeatClassEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'seat_class_id' })
  seatClass?: SeatClassEntity;

  @Column({
    type: 'enum',
    enum: CommissionRuleType,
    default: CommissionRuleType.FLAT_PER_TICKET,
    name: 'rule_type',
  })
  ruleType!: CommissionRuleType;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'commission_value',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  commissionValue!: number; // misal: 30000.00 (Flat) atau 10.00 (10%)

  @Column({
    type: 'timestamptz',
    name: 'effective_from',
    default: () => 'CURRENT_TIMESTAMP',
  })
  effectiveFrom!: Date;

  @Column({ type: 'timestamptz', name: 'effective_until', nullable: true })
  effectiveUntil?: Date;
}
