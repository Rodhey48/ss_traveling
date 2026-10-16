import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity('companies')
export class CompanyEntity extends BaseEntity {
  constructor(partial?: Partial<CompanyEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 3, default: 'IDR' })
  currency!: string;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Jakarta' })
  timezone!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  website?: string;
}
