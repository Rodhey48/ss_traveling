import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { SpjEntity } from './spj.entity';
import { SpjCrewAssignmentEntity } from './spj-crew-assignment.entity';
import { SpjLegDirection, SpjLegStatus } from './trip.enums';

@Entity('spj_legs')
export class SpjLegEntity extends BaseEntity {
  constructor(partial?: Partial<SpjLegEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'spj_id' })
  spjId!: string;

  @ManyToOne(() => SpjEntity, (spj) => spj.legs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({ type: 'int', name: 'sequence_no', default: 1 })
  sequenceNo!: number; // 1 = Berangkat, 2 = Pulang

  @Column({
    type: 'enum',
    enum: SpjLegDirection,
    default: SpjLegDirection.DEPARTURE,
  })
  direction!: SpjLegDirection;

  @Column({ type: 'varchar', length: 150 })
  origin!: string;

  @Column({ type: 'varchar', length: 150 })
  destination!: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'departure_at' })
  departureAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'arrival_at' })
  arrivalAt?: Date;

  @Column({
    type: 'enum',
    enum: SpjLegStatus,
    default: SpjLegStatus.SCHEDULED,
  })
  status!: SpjLegStatus;

  // Manifes Penumpang & Restoran Mitra (Addendum v1.12 & Test Case 1)
  @Column({ type: 'int', default: 0, name: 'passenger_count' })
  passengerCount!: number;

  @Column({ type: 'int', default: 0, name: 'meal_pax_count' })
  mealPaxCount!: number; // Jumlah kupon servis makan riil ditukarkan

  @Column({ type: 'text', nullable: true, name: 'meal_discrepancy_notes' })
  mealDiscrepancyNotes?: string; // Catatan selisih kupon vs manifes

  @OneToMany(() => SpjCrewAssignmentEntity, (crew) => crew.spjLeg)
  crewAssignments?: SpjCrewAssignmentEntity[];
}
