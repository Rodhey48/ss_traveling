import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { AccountEntity } from './account.entity';

@Entity('bank_accounts')
export class BankAccountEntity extends BaseEntity {
  constructor(partial?: Partial<BankAccountEntity>) {
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

  @Column({ type: 'varchar', length: 50, name: 'bank_name' })
  bankName!: string;

  @Column({ type: 'varchar', length: 100, name: 'account_name' })
  accountName!: string;

  @Column({ type: 'varchar', length: 50, name: 'account_number' })
  accountNumber!: string;

  @Column({ type: 'varchar', length: 50, name: 'account_number_masked' })
  accountNumberMasked!: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId!: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account?: AccountEntity;

  @Column({ type: 'varchar', length: 3, default: 'IDR' })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
