import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';

@Entity('document_sequences')
@Unique('UQ_document_sequences_type_period', ['documentType', 'periodKey'])
export class DocumentSequenceEntity extends BaseEntity {
  constructor(partial?: Partial<DocumentSequenceEntity>) {
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

  @Column({ type: 'varchar', length: 50, name: 'document_type' })
  documentType!: string;

  @Column({ type: 'varchar', length: 20, name: 'period_key' })
  periodKey!: string;

  @Column({ type: 'varchar', length: 50 })
  prefix!: string;

  @Column({ type: 'int', name: 'last_number', default: 0 })
  lastNumber!: number;

  @Column({ type: 'int', default: 4 })
  padding!: number;
}
