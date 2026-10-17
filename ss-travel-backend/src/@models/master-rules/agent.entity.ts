import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import type { AgentCommissionRuleEntity } from './agent-commission-rule.entity';

export enum AgentType {
  OFFLINE = 'OFFLINE',
  ONLINE_OTA = 'ONLINE_OTA',
}

export enum AgentSettlementType {
  CASH_TO_CREW = 'CASH_TO_CREW',
  CASH_TO_OFFICE = 'CASH_TO_OFFICE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

@Entity('agents')
export class AgentEntity extends BaseEntity {
  constructor(partial?: Partial<AgentEntity>) {
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

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string; // misal: 'AGT-CPT-01', 'AGT-REDBUS'

  @Column({ type: 'varchar', length: 150 })
  name!: string; // misal: 'Agen Pool Ciputat', 'RedBus Indonesia'

  @Column({
    type: 'enum',
    enum: AgentType,
    default: AgentType.OFFLINE,
    name: 'agent_type',
  })
  agentType!: AgentType;

  @Column({ type: 'varchar', length: 50, default: 'ALL' })
  city!: string; // 'JAKARTA', 'TANGERANG', 'YOGYAKARTA', 'ALL'

  @Column({ type: 'varchar', length: 50 })
  phone!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({
    type: 'enum',
    enum: AgentSettlementType,
    default: AgentSettlementType.CASH_TO_CREW,
    name: 'settlement_type',
  })
  settlementType!: AgentSettlementType;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'contact_person' })
  contactPerson?: string;

  @OneToMany('AgentCommissionRuleEntity', (rule: AgentCommissionRuleEntity) => rule.agent)
  commissionRules?: AgentCommissionRuleEntity[];
}
