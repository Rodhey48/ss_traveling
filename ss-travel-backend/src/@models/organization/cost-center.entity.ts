import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from './company.entity';

@Entity('cost_centers')
export class CostCenterEntity extends BaseEntity {
  constructor(partial?: Partial<CostCenterEntity>) {
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

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne(() => CostCenterEntity, (cc) => cc.children, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: CostCenterEntity;

  @OneToMany(() => CostCenterEntity, (cc) => cc.parent)
  children?: CostCenterEntity[];

  @Column({ type: 'text', nullable: true })
  description?: string;
}
