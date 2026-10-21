import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { SpjEntity } from './spj.entity';
import { SpjUjEntity } from './spj-uj.entity';
import { SpjCrewAssignmentEntity } from './spj-crew-assignment.entity';
import { UsersEntity } from '../user/user.entity';
import { SpjAdditionalRequestStatus } from './trip.enums';

@Entity('spj_uj_additional_requests')
export class SpjUjAdditionalRequestEntity extends BaseEntity {
  constructor(partial?: Partial<SpjUjAdditionalRequestEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'spj_id' })
  spjId!: string;

  @ManyToOne(() => SpjEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({ type: 'uuid', name: 'spj_uj_id' })
  spjUjId!: string;

  @ManyToOne(() => SpjUjEntity, (uj) => uj.additionalRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'spj_uj_id' })
  spjUj?: SpjUjEntity;

  @Column({ type: 'uuid', name: 'crew_assignment_id', nullable: true })
  crewAssignmentId?: string;

  @ManyToOne(() => SpjCrewAssignmentEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'crew_assignment_id' })
  crewAssignment?: SpjCrewAssignmentEntity;

  @Column({ type: 'uuid', name: 'requested_by' })
  requestedBy!: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by' })
  requester?: UsersEntity;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
  })
  amount!: string;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    type: 'enum',
    enum: SpjAdditionalRequestStatus,
    default: SpjAdditionalRequestStatus.PENDING,
  })
  status!: SpjAdditionalRequestStatus;

  @Column({ type: 'uuid', name: 'processed_by', nullable: true })
  processedBy?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'processed_by' })
  processor?: UsersEntity;

  @Column({ type: 'timestamptz', nullable: true, name: 'processed_at' })
  processedAt?: Date;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason?: string;
}
