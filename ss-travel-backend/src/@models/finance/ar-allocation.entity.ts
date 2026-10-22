import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { ArReceiptEntity } from './ar-receipt.entity';
import { ArInvoiceEntity } from './ar-invoice.entity';

@Entity('ar_allocations')
export class ArAllocationEntity extends BaseEntity {
  constructor(partial?: Partial<ArAllocationEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'receipt_id' })
  receiptId!: string;

  @ManyToOne(() => ArReceiptEntity, (rct) => rct.allocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receipt_id' })
  receipt?: ArReceiptEntity;

  @Column({ type: 'uuid', name: 'invoice_id' })
  invoiceId!: string;

  @ManyToOne(() => ArInvoiceEntity, (inv) => inv.allocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice?: ArInvoiceEntity;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  amount!: number;
}
