import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyEntity } from '../organization/company.entity';
import { SpjEntity } from './spj.entity';
import { SpjLegEntity } from './spj-leg.entity';
import { UsersEntity } from '../user/user.entity';
import { CrewCashRemittanceAllocationEntity } from '../cashier/crew-cash-remittance-allocation.entity';
import {
  SpjRevenueDeclarationType,
  SpjRevenueDeclarationStatus,
} from './trip.enums';

@Entity('spj_revenue_declarations')
export class SpjRevenueDeclarationEntity extends BaseEntity {
  constructor(partial?: Partial<SpjRevenueDeclarationEntity>) {
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

  @Column({ type: 'uuid', name: 'spj_id' })
  spjId!: string;

  @ManyToOne(() => SpjEntity, (spj) => spj.revenueDeclarations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'spj_id' })
  spj?: SpjEntity;

  @Column({ type: 'uuid', name: 'spj_leg_id', nullable: true })
  spjLegId?: string;

  @ManyToOne(() => SpjLegEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'spj_leg_id' })
  spjLeg?: SpjLegEntity;

  @Column({
    type: 'enum',
    enum: SpjRevenueDeclarationType,
    name: 'declaration_type',
  })
  declarationType!: SpjRevenueDeclarationType;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    default: '0.00',
  })
  amount!: string; // Bruto pendapatan yang diterima kas

  @Column({ type: 'uuid', name: 'declared_by' })
  declaredBy!: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'declared_by' })
  declarer?: UsersEntity;

  @Column({
    type: 'timestamptz',
    name: 'declared_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  declaredAt!: Date;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'source_reference',
  })
  sourceReference?: string; // Nomor manifest atau nomor resi kargo

  // Dynamic Komisi Kru untuk Kargo (Addendum v1.9 & Skenario 1)
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    default: '0.00',
    name: 'crew_commission_percentage',
  })
  crewCommissionPercentage?: string; // misal: 20.00%

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 2,
    nullable: true,
    default: '0.00',
    name: 'crew_commission_amount',
  })
  crewCommissionAmount?: string; // misal: Rp 70.000 dari Rp 350.000

  // Metadata Pengirim & Penerima Kargo
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'cargo_sender_name',
  })
  cargoSenderName?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'cargo_sender_phone',
  })
  cargoSenderPhone?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'cargo_receiver_name',
  })
  cargoReceiverName?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'cargo_receiver_phone',
  })
  cargoReceiverPhone?: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'cargo_item_description',
  })
  cargoItemDescription?: string;

  @Column({
    type: 'enum',
    enum: SpjRevenueDeclarationStatus,
    default: SpjRevenueDeclarationStatus.DECLARED,
  })
  status!: SpjRevenueDeclarationStatus;

  @Column({ type: 'uuid', name: 'verified_by', nullable: true })
  verifiedBy?: string;

  @ManyToOne(() => UsersEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier?: UsersEntity;

  @Column({ type: 'timestamptz', nullable: true, name: 'verified_at' })
  verifiedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(
    () => CrewCashRemittanceAllocationEntity,
    (alloc) => alloc.revenueDeclaration,
  )
  allocations?: CrewCashRemittanceAllocationEntity[];
}
