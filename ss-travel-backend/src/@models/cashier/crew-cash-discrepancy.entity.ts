import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { SpjEntity } from '../trips/spj.entity';
import { UsersEntity } from '../user/user.entity';
import { AccountEntity } from '../finance/account.entity';
import { JournalEntryEntity } from '../finance/journal-entry.entity';
import {
  DiscrepancySourceType,
  DiscrepancyResolutionStatus,
  DiscrepancyResolutionDecision,
} from './cashier.enums';
import { CrewCashSettlementEntity } from './crew-cash-settlement.entity';

@Entity('crew_cash_discrepancies')
export class CrewCashDiscrepancyEntity extends BaseEntity {
  constructor(partial?: Partial<CrewCashDiscrepancyEntity>) {
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

  @Column({ type: 'varchar', length: 50, unique: true, name: 'discrepancy_no' })
  discrepancyNo!: string; // Misal: DISC/2610/0001

  @Column({ type: 'uuid', name: 'settlement_id', nullable: true })
  settlementId?: string;

  @ManyToOne(() => CrewCashSettlementEntity, (s) => s.discrepancies, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'settlement_id' })
  settlement?: CrewCashSettlementEntity;

  @Column({ type: 'uuid', name: 'spj_id' })
  spjId!: string;

  @ManyToOne(() => SpjEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({
    type: 'enum',
    enum: DiscrepancySourceType,
    name: 'source_type',
  })
  sourceType!: DiscrepancySourceType;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    name: 'expected_amount',
  })
  expectedAmount!: number;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    name: 'actual_amount',
  })
  actualAmount!: number;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    name: 'difference_amount',
  })
  differenceAmount!: number;

  @Column({ type: 'uuid', name: 'reported_by_id' })
  reportedById!: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reported_by_id' })
  reportedBy?: UsersEntity;

  @Column({ type: 'uuid', name: 'responsible_crew_id', nullable: true })
  responsibleCrewId?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'responsible_crew_id' })
  responsibleCrew?: UsersEntity;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'text', nullable: true, name: 'investigation_notes' })
  investigationNotes?: string;

  @Column({
    type: 'enum',
    enum: DiscrepancyResolutionStatus,
    name: 'resolution_status',
    default: DiscrepancyResolutionStatus.PENDING_INVESTIGATION,
  })
  resolutionStatus!: DiscrepancyResolutionStatus;

  @Column({
    type: 'enum',
    enum: DiscrepancyResolutionDecision,
    name: 'resolution_decision',
    nullable: true,
  })
  resolutionDecision?: DiscrepancyResolutionDecision;

  @Column({ type: 'uuid', name: 'resolution_account_id', nullable: true })
  resolutionAccountId?: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'resolution_account_id' })
  resolutionAccount?: AccountEntity;

  @Column({ type: 'uuid', name: 'resolved_by_id', nullable: true })
  resolvedById?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy?: UsersEntity;

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date;

  @Column({ type: 'uuid', name: 'journal_entry_id', nullable: true })
  journalEntryId?: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry?: JournalEntryEntity;
}
