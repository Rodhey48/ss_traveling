import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { JournalEntryEntity } from './journal-entry.entity';

@Entity('accounting_events')
export class AccountingEventEntity extends BaseEntity {
  constructor(partial?: Partial<AccountingEventEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'varchar', length: 50, name: 'source_type' })
  sourceType!: string;

  @Column({ type: 'uuid', name: 'source_id', nullable: true })
  sourceId?: string;

  @Column({ type: 'varchar', length: 50, name: 'event_type' })
  eventType!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, name: 'idempotency_key', unique: true })
  idempotencyKey!: string;

  @Column({ type: 'uuid', name: 'journal_entry_id' })
  journalEntryId!: string;

  @ManyToOne(() => JournalEntryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry?: JournalEntryEntity;
}
