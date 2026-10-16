import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { AccountEntity } from './account.entity';
import { UsersEntity } from '../user/user.entity';
import { CostCenterEntity } from '../organization/cost-center.entity';

@Entity('cash_accounts')
export class CashAccountEntity extends BaseEntity {
  constructor(partial?: Partial<CashAccountEntity>) {
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

  @Column({ type: 'varchar', length: 30, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account?: AccountEntity;

  @Column({ type: 'uuid', name: 'custodian_user_id', nullable: true })
  custodianUserId?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'custodian_user_id' })
  custodianUser?: UsersEntity;

  @Column({ type: 'uuid', name: 'cost_center_id', nullable: true })
  costCenterId?: string;

  @ManyToOne(() => CostCenterEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cost_center_id' })
  costCenter?: CostCenterEntity;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
