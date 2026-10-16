import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';

@Entity('seat_classes')
export class SeatClassEntity extends BaseEntity {
  constructor(partial?: Partial<SeatClassEntity>) {
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
  code!: string; // misal: 'SLEEPER', 'LUXURY_2_1', 'EXECUTIVE', 'STANDARD'

  @Column({ type: 'varchar', length: 100 })
  name!: string; // misal: 'Sleeper Class', 'Luxury Seat 2-1', 'Executive Class'

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'default_layout' })
  defaultLayout?: string; // misal: '1-1', '2-1', '2-2'

  @Column({ type: 'text', nullable: true })
  description?: string; // Fasilitas bawaan kabin
}
