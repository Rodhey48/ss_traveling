import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { ApPaymentEntity } from './ap-payment.entity';
import { ApInvoiceEntity } from './ap-invoice.entity';

@Entity('ap_allocations')
export class ApAllocationEntity extends BaseEntity {
  constructor(partial?: Partial<ApAllocationEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId!: string;

  @ManyToOne(() => ApPaymentEntity, (pay) => pay.allocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_id' })
  payment?: ApPaymentEntity;

  @Column({ type: 'uuid', name: 'invoice_id' })
  invoiceId!: string;

  @ManyToOne(() => ApInvoiceEntity, (inv) => inv.allocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice?: ApInvoiceEntity;

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
