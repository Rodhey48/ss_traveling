import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from './company.entity';
import { BusinessUnitEntity } from './business-unit.entity';

@Entity('profit_centers')
export class ProfitCenterEntity extends BaseEntity {
  constructor(partial?: Partial<ProfitCenterEntity>) {
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

  @Column({ type: 'uuid', name: 'business_unit_id', nullable: true })
  businessUnitId?: string;

  @ManyToOne(() => BusinessUnitEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit?: BusinessUnitEntity;

  @Column({ type: 'varchar', length: 30, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
