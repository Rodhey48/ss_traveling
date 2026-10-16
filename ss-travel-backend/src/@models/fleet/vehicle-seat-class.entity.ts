import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { VehicleEntity } from './vehicle.entity';
import { SeatClassEntity } from './seat-class.entity';

export enum SeatClassName {
  SLEEPER = 'SLEEPER',
  LUXURY_2_1 = 'LUXURY_2_1',
  EXECUTIVE = 'EXECUTIVE',
  STANDARD = 'STANDARD',
}

@Entity('vehicle_seat_classes')
export class VehicleSeatClassEntity extends BaseEntity {
  constructor(partial?: Partial<VehicleSeatClassEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => VehicleEntity, (v) => v.seatClasses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: VehicleEntity;

  @Column({ type: 'uuid', name: 'seat_class_id', nullable: true })
  seatClassId?: string;

  @ManyToOne(() => SeatClassEntity, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'seat_class_id' })
  seatClass?: SeatClassEntity;

  @Column({
    type: 'enum',
    enum: SeatClassName,
    name: 'class_name',
  })
  className!: SeatClassName;

  @Column({ type: 'int', name: 'seat_capacity' })
  seatCapacity!: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'seat_layout' })
  seatLayout?: string; // misal '1-1 Sleeper', '2-1 Luxury'
}
