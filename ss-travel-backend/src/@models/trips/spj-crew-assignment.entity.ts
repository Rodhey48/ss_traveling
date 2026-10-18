import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { SpjEntity } from './spj.entity';
import { SpjLegEntity } from './spj-leg.entity';
import { UsersEntity } from '../user/user.entity';
import { CrewAssignmentRole, CrewAssignmentStatus } from './trip.enums';

@Entity('spj_crew_assignments')
export class SpjCrewAssignmentEntity extends BaseEntity {
  constructor(partial?: Partial<SpjCrewAssignmentEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'spj_id' })
  spjId!: string;

  @ManyToOne(() => SpjEntity, (spj) => spj.crewAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({ type: 'uuid', name: 'spj_leg_id', nullable: true })
  spjLegId?: string;

  @ManyToOne(() => SpjLegEntity, (leg) => leg.crewAssignments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'spj_leg_id' })
  spjLeg?: SpjLegEntity;

  @Column({ type: 'uuid', name: 'crew_id' })
  crewId!: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'crew_id' })
  crew?: UsersEntity;

  @Column({
    type: 'enum',
    enum: CrewAssignmentRole,
    default: CrewAssignmentRole.DRIVER,
  })
  role!: CrewAssignmentRole;

  @Column({ type: 'timestamptz', nullable: true, name: 'assigned_from' })
  assignedFrom?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'assigned_until' })
  assignedUntil?: Date;

  @Column({
    type: 'enum',
    enum: CrewAssignmentStatus,
    default: CrewAssignmentStatus.ASSIGNED,
  })
  status!: CrewAssignmentStatus;

  // Pergantian Kru Mid-Trip (Addendum v1.1 & Test Case 1 Poin 7)
  @Column({ type: 'uuid', name: 'replacement_crew_id', nullable: true })
  replacementCrewId?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'replacement_crew_id' })
  replacementCrew?: UsersEntity;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Snapshot Kompensasi Hak Kru Saat Penugasan (Addendum v1.8 & v1.10)
  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'meal_allowance_snapshot',
  })
  mealAllowanceSnapshot!: string; // Nominal uang makan riil

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'incentive_snapshot',
  })
  incentiveSnapshot!: string; // Nominal premi ritase/harian

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: 0,
    name: 'full_seat_bonus_snapshot',
  })
  fullSeatBonusSnapshot!: string; // Potensi bonus full seat (AKAP)
}
