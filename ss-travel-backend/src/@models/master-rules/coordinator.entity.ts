import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import type { CoordinatorFeeRuleEntity } from './coordinator-fee-rule.entity';

export enum CoordinatorType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
}

@Entity('coordinators')
export class CoordinatorEntity extends BaseEntity {
  constructor(partial?: Partial<CoordinatorEntity>) {
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
  code!: string; // misal: 'KOR-BRT-01', 'KOR-TMR-01'

  @Column({ type: 'varchar', length: 150 })
  name!: string; // Nama PIC atau Nama Lengkap Koordinator

  @Column({
    type: 'enum',
    enum: CoordinatorType,
    default: CoordinatorType.INDIVIDUAL,
  })
  type!: CoordinatorType;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'organization_name' })
  organizationName?: string; // misal: 'Paguyuban Jalur Barat'

  @Column({ type: 'varchar', length: 50 })
  phone!: string; // Nomor WhatsApp / HP

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 100, default: 'ALL' })
  area!: string; // Wilayah / Terminal Basis, misal: 'JAKARTA - TERMINAL PULO GEBANG'

  @Column({ type: 'text', nullable: true })
  address?: string;

  // Detail Rekening Bank untuk Bulk Settlement
  @Column({ type: 'varchar', length: 50, name: 'bank_name' })
  bankName!: string; // misal: 'BCA', 'MANDIRI', 'BRI'

  @Column({ type: 'varchar', length: 50, name: 'bank_account_number' })
  bankAccountNumber!: string; // Nomor Rekening

  @Column({ type: 'varchar', length: 150, name: 'bank_account_holder' })
  bankAccountHolder!: string; // Atas Nama Rekening

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany('CoordinatorFeeRuleEntity', (rule: CoordinatorFeeRuleEntity) => rule.coordinator)
  feeRules?: CoordinatorFeeRuleEntity[];
}
