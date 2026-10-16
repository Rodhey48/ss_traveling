import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { VehicleEntity } from './vehicle.entity';

@Entity('vehicle_images')
export class VehicleImageEntity extends BaseEntity {
  constructor(partial?: Partial<VehicleImageEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => VehicleEntity, (v) => v.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: VehicleEntity;

  @Column({ type: 'text', name: 'image_url' })
  imageUrl!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  caption?: string; // misal: "Tampak Depan", "Kabin Sleeper", "Interior Luxury 2-1"

  @Column({ type: 'boolean', name: 'is_primary', default: false })
  isPrimary!: boolean; // Foto cover utama bus

  @Column({ type: 'int', default: 0 })
  sequence!: number; // Urutan tampilan galeri
}
