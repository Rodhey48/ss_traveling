import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { SpjEntity } from '../trips/spj.entity';
import { UsersEntity } from '../user/user.entity';
import { CashAccountEntity } from '../finance/cash-account.entity';
import {
  RemittancePaymentMethod,
  RemittanceStatus,
} from './cashier.enums';
import { CrewCashSettlementEntity } from './crew-cash-settlement.entity';
import { CrewCashRemittanceAllocationEntity } from './crew-cash-remittance-allocation.entity';

@Entity('crew_cash_remittances')
export class CrewCashRemittanceEntity extends BaseEntity {
  constructor(partial?: Partial<CrewCashRemittanceEntity>) {
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

  @Column({ type: 'varchar', length: 50, unique: true, name: 'remittance_no' })
  remittanceNo!: string; // Misal: REM/2610/0001

  @Column({ type: 'uuid', name: 'settlement_id', nullable: true })
  settlementId?: string;

  @ManyToOne(() => CrewCashSettlementEntity, (s) => s.remittances, {
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

  @Column({ type: 'uuid', name: 'depositor_crew_id' })
  depositorCrewId!: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'depositor_crew_id' })
  depositorCrew?: UsersEntity;

  @Column({ type: 'numeric', precision: 20, scale: 2 })
  amount!: number;

  @Column({ type: 'uuid', name: 'cash_account_id', nullable: true })
  cashAccountId?: string;

  @ManyToOne(() => CashAccountEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cash_account_id' })
  cashAccount?: CashAccountEntity;

  @Column({ type: 'uuid', name: 'received_by_cashier_id', nullable: true })
  receivedByCashierId?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'received_by_cashier_id' })
  receivedByCashier?: UsersEntity;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'remitted_at' })
  remittedAt!: Date;

  @Column({
    type: 'enum',
    enum: RemittancePaymentMethod,
    name: 'payment_method',
    default: RemittancePaymentMethod.CASH,
  })
  paymentMethod!: RemittancePaymentMethod;

  @Column({
    type: 'enum',
    enum: RemittanceStatus,
    default: RemittanceStatus.VERIFIED,
  })
  status!: RemittanceStatus;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'bkm_no' })
  bkmNo?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => CrewCashRemittanceAllocationEntity, (alloc) => alloc.remittance, {
    cascade: true,
  })
  allocations?: CrewCashRemittanceAllocationEntity[];
}
