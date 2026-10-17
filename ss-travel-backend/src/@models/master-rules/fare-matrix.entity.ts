import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { FareSeasonEntity } from './fare-season.entity';
import { SeatClassEntity } from '../fleet/seat-class.entity';

@Entity('fare_matrix')
export class FareMatrixEntity extends BaseEntity {
  constructor(partial?: Partial<FareMatrixEntity>) {
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

  @Column({ type: 'uuid', name: 'fare_season_id' })
  fareSeasonId!: string;

  @ManyToOne(() => FareSeasonEntity, (season) => season.matrices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fare_season_id' })
  fareSeason?: FareSeasonEntity;

  @Column({ type: 'varchar', length: 100 })
  origin!: string; // misal: 'TANGERANG', 'JAKARTA'

  @Column({ type: 'varchar', length: 100 })
  destination!: string; // misal: 'YOGYAKARTA'

  @Column({ type: 'uuid', name: 'seat_class_id' })
  seatClassId!: string;

  @ManyToOne(() => SeatClassEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seat_class_id' })
  seatClass?: SeatClassEntity;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount!: number; // misal: 420000.00

  @Column({
    type: 'timestamptz',
    name: 'effective_from',
    default: () => 'CURRENT_TIMESTAMP',
  })
  effectiveFrom!: Date;

  @Column({ type: 'timestamptz', name: 'effective_until', nullable: true })
  effectiveUntil?: Date;
}
