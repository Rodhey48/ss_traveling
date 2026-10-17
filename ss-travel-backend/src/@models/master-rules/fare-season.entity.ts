import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import type { FareMatrixEntity } from './fare-matrix.entity';

@Entity('fare_seasons')
export class FareSeasonEntity extends BaseEntity {
  constructor(partial?: Partial<FareSeasonEntity>) {
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
  code!: string; // misal: 'REGULER', 'LEBARAN_2026', 'NATARU_2026', 'LIBUR_SEKOLAH_2026'

  @Column({ type: 'varchar', length: 100 })
  name!: string; // misal: 'Tarif Reguler Harian', 'Tuslah Lebaran H-7 s/d H+7'

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string; // format 'YYYY-MM-DD'

  @Column({ type: 'date', name: 'end_date' })
  endDate!: string; // format 'YYYY-MM-DD'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany('FareMatrixEntity', (matrix: FareMatrixEntity) => matrix.fareSeason)
  matrices?: FareMatrixEntity[];
}
