import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum NormalBalance {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

@Entity('accounts')
export class AccountEntity extends BaseEntity {
  constructor(partial?: Partial<AccountEntity>) {
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

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type!: AccountType;

  @Column({
    type: 'enum',
    enum: NormalBalance,
    name: 'normal_balance',
  })
  normalBalance!: NormalBalance;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne(() => AccountEntity, (account) => account.children, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: AccountEntity;

  @OneToMany(() => AccountEntity, (account) => account.parent)
  children?: AccountEntity[];

  @Column({ type: 'boolean', default: true, name: 'is_postable' })
  isPostable!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
