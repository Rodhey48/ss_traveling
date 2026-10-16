import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { FiscalPeriodEntity } from './fiscal-period.entity';

export enum FiscalYearStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Entity('fiscal_years')
export class FiscalYearEntity extends BaseEntity {
  constructor(partial?: Partial<FiscalYearEntity>) {
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

  @Column({ type: 'int', unique: true })
  year!: number;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: string;

  @Column({
    type: 'enum',
    enum: FiscalYearStatus,
    default: FiscalYearStatus.OPEN,
  })
  status!: FiscalYearStatus;

  @OneToMany(() => FiscalPeriodEntity, (period) => period.fiscalYear)
  periods?: FiscalPeriodEntity[];
}
