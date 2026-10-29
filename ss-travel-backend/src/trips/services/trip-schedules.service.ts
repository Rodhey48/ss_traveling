import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  TripScheduleEntity,
  TripServiceType,
  TripScheduleStatus,
} from '../../@models/trips';
import { VehicleEntity } from '../../@models/fleet/vehicle.entity';
import { CustomerEntity } from '../../@models/customer/customer.entity';
import { UsersEntity } from '../../@models/user/user.entity';
import { BusinessUnitEntity } from '../../@models/organization/business-unit.entity';
import { CostCenterEntity } from '../../@models/organization/cost-center.entity';
import { DocumentSequenceService } from '../../finance/services/document-sequence.service';
import {
  CreateTripScheduleDto,
  UpdateTripScheduleDto,
  TripScheduleQueryFilterDto,
  ConflictCheckDto,
} from '../../@dto/trips/trip-schedule.dto';

export interface BufferWarning {
  type: 'VEHICLE' | 'CREW';
  targetId: string;
  targetName: string;
  message: string;
  gapMinutes: number;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictDetails: string[];
  warnings: BufferWarning[];
}

@Injectable()
export class TripSchedulesService {
  constructor(
    @InjectRepository(TripScheduleEntity)
    private readonly scheduleRepo: Repository<TripScheduleEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepo: Repository<VehicleEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepo: Repository<UsersEntity>,
    @InjectRepository(BusinessUnitEntity)
    private readonly businessUnitRepo: Repository<BusinessUnitEntity>,
    @InjectRepository(CostCenterEntity)
    private readonly costCenterRepo: Repository<CostCenterEntity>,
    private readonly sequenceService: DocumentSequenceService,
  ) {}

  /**
   * Helper untuk format Period Key (YYMM)
   */
  private getPeriodKey(date: Date): string {
    const d = new Date(date);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}`;
  }

  /**
   * Validasi anti-bentrok jadwal armada & kru (Overlap Conflict)
   * serta deteksi sisa istirahat (Buffer Rest Time minimal 3 jam = 180 menit)
   */
  async checkConflictsAndBuffer(dto: ConflictCheckDto): Promise<ConflictCheckResult> {
    const departure = new Date(dto.departureAt);
    const returnAt = new Date(dto.returnAt);

    if (departure >= returnAt) {
      throw new BadRequestException('Waktu keberangkatan harus lebih awal dari waktu kepulangan.');
    }

    const conflicts: string[] = [];
    const warnings: BufferWarning[] = [];
    const BUFFER_MINUTES = 180; // 3 jam buffer istirahat

    // 1. Cek bentrok Armada Bus
    if (dto.vehicleId) {
      const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicleId } });
      const vehicleName = vehicle ? `${vehicle.code} (${vehicle.plateNumber})` : 'Bus';

      const qbVehicle = this.scheduleRepo.createQueryBuilder('s')
        .where('s.vehicleId = :vehicleId', { vehicleId: dto.vehicleId })
        .andWhere('s.status IN (:...activeStatuses)', {
          activeStatuses: [TripScheduleStatus.CONFIRMED, TripScheduleStatus.IN_PROGRESS],
        });

      if (dto.excludeScheduleId) {
        qbVehicle.andWhere('s.id != :excludeId', { excludeId: dto.excludeScheduleId });
      }

      // Overlap formula: (startA <= endB) AND (endA >= startB)
      qbVehicle.andWhere('s.plannedDepartureAt <= :returnAt', { returnAt })
        .andWhere('s.plannedReturnAt >= :departure', { departure });

      const overlapBus = await qbVehicle.getMany();
      if (overlapBus.length > 0) {
        conflicts.push(
          `Armada ${vehicleName} sedang bertabrakan dengan jadwal aktif: ${overlapBus.map((o) => o.scheduleNo).join(', ')}.`,
        );
      }

      // Cek Buffer Rest Time Bus (sebelum departure dan sesudah return)
      const prevScheduleBus = await this.scheduleRepo.createQueryBuilder('s')
        .where('s.vehicleId = :vehicleId', { vehicleId: dto.vehicleId })
        .andWhere('s.status IN (:...activeStatuses)', {
          activeStatuses: [TripScheduleStatus.CONFIRMED, TripScheduleStatus.IN_PROGRESS, TripScheduleStatus.COMPLETED],
        })
        .andWhere('s.plannedReturnAt <= :departure', { departure })
        .orderBy('s.plannedReturnAt', 'DESC')
        .getOne();

      if (prevScheduleBus) {
        const gap = Math.round((departure.getTime() - new Date(prevScheduleBus.plannedReturnAt).getTime()) / (1000 * 60));
        if (gap >= 0 && gap < BUFFER_MINUTES) {
          warnings.push({
            type: 'VEHICLE',
            targetId: dto.vehicleId,
            targetName: vehicleName,
            message: `Armada ${vehicleName} hanya memiliki jeda istirahat ${gap} menit setelah jadwal ${prevScheduleBus.scheduleNo} (standar minimal 3 jam).`,
            gapMinutes: gap,
          });
        }
      }
    }

    // 2. Cek bentrok Kru (Drivers & Conductor)
    if (dto.crewIds && dto.crewIds.length > 0) {
      for (const crewId of dto.crewIds) {
        const crew = await this.userRepo.findOne({ where: { id: crewId } });
        const crewName = crew ? crew.name : 'Kru';

        const qbCrew = this.scheduleRepo.createQueryBuilder('s')
          .where('s.status IN (:...activeStatuses)', {
            activeStatuses: [TripScheduleStatus.CONFIRMED, TripScheduleStatus.IN_PROGRESS],
          })
          .andWhere(
            '(s.plannedDriver1Id = :crewId OR s.plannedDriver2Id = :crewId OR s.plannedConductorId = :crewId)',
            { crewId },
          );

        if (dto.excludeScheduleId) {
          qbCrew.andWhere('s.id != :excludeId', { excludeId: dto.excludeScheduleId });
        }

        qbCrew.andWhere('s.plannedDepartureAt <= :returnAt', { returnAt })
          .andWhere('s.plannedReturnAt >= :departure', { departure });

        const overlapCrew = await qbCrew.getMany();
        if (overlapCrew.length > 0) {
          conflicts.push(
            `Kru ${crewName} sedang bertabrakan dengan jadwal aktif: ${overlapCrew.map((o) => o.scheduleNo).join(', ')}.`,
          );
        }

        // Cek buffer rest time Kru
        const prevScheduleCrew = await this.scheduleRepo.createQueryBuilder('s')
          .where('s.status IN (:...activeStatuses)', {
            activeStatuses: [TripScheduleStatus.CONFIRMED, TripScheduleStatus.IN_PROGRESS, TripScheduleStatus.COMPLETED],
          })
          .andWhere(
            '(s.plannedDriver1Id = :crewId OR s.plannedDriver2Id = :crewId OR s.plannedConductorId = :crewId)',
            { crewId },
          )
          .andWhere('s.plannedReturnAt <= :departure', { departure })
          .orderBy('s.plannedReturnAt', 'DESC')
          .getOne();

        if (prevScheduleCrew) {
          const gap = Math.round((departure.getTime() - new Date(prevScheduleCrew.plannedReturnAt).getTime()) / (1000 * 60));
          if (gap >= 0 && gap < BUFFER_MINUTES) {
            warnings.push({
              type: 'CREW',
              targetId: crewId,
              targetName: crewName,
              message: `Personel ${crewName} hanya memiliki sisa istirahat ${gap} menit setelah jadwal ${prevScheduleCrew.scheduleNo} (standar minimal 3 jam).`,
              gapMinutes: gap,
            });
          }
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflictDetails: conflicts,
      warnings,
    };
  }

  async findAll(query: TripScheduleQueryFilterDto): Promise<{ data: TripScheduleEntity[]; total: number; page: number; limit: number }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const qb = this.scheduleRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.vehicle', 'vehicle')
      .leftJoinAndSelect('s.customer', 'customer')
      .leftJoinAndSelect('s.plannedDriver1', 'driver1')
      .leftJoinAndSelect('s.plannedDriver2', 'driver2')
      .leftJoinAndSelect('s.plannedConductor', 'conductor')
      .leftJoinAndSelect('s.businessUnit', 'businessUnit')
      .leftJoinAndSelect('s.costCenter', 'costCenter')
      .leftJoinAndSelect('s.spj', 'spj')
      .orderBy('s.plannedDepartureAt', 'ASC');

    if (query.serviceType) {
      qb.andWhere('s.serviceType = :serviceType', { serviceType: query.serviceType });
    }

    if (query.status) {
      qb.andWhere('s.status = :status', { status: query.status });
    }

    if (query.vehicleId) {
      qb.andWhere('s.vehicleId = :vehicleId', { vehicleId: query.vehicleId });
    }

    if (query.driverId) {
      qb.andWhere('(s.plannedDriver1Id = :dId OR s.plannedDriver2Id = :dId)', { dId: query.driverId });
    }

    if (query.startDate) {
      const sDate = new Date(query.startDate);
      sDate.setHours(0, 0, 0, 0);
      qb.andWhere('s.plannedDepartureAt >= :startDate', { startDate: sDate });
    }

    if (query.endDate) {
      const eDate = new Date(query.endDate);
      eDate.setHours(23, 59, 59, 999);
      qb.andWhere('s.plannedDepartureAt <= :endDate', { endDate: eDate });
    }

    if (query.search) {
      qb.andWhere(
        '(s.scheduleNo ILIKE :search OR s.origin ILIKE :search OR s.destination ILIKE :search OR customer.institutionName ILIKE :search OR vehicle.code ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findCalendar(startDate: string, endDate: string): Promise<TripScheduleEntity[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.scheduleRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.vehicle', 'vehicle')
      .leftJoinAndSelect('s.customer', 'customer')
      .leftJoinAndSelect('s.plannedDriver1', 'driver1')
      .leftJoinAndSelect('s.plannedDriver2', 'driver2')
      .leftJoinAndSelect('s.plannedConductor', 'conductor')
      .leftJoinAndSelect('s.spj', 'spj')
      .where('s.plannedDepartureAt <= :end', { end })
      .andWhere('s.plannedReturnAt >= :start', { start })
      .orderBy('s.plannedDepartureAt', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<TripScheduleEntity> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      relations: [
        'vehicle',
        'customer',
        'plannedDriver1',
        'plannedDriver2',
        'plannedConductor',
        'businessUnit',
        'costCenter',
        'spj',
      ],
    });

    if (!schedule) {
      throw new NotFoundException(`Jadwal dengan ID '${id}' tidak ditemukan.`);
    }

    return schedule;
  }

  async create(dto: CreateTripScheduleDto): Promise<{ schedule: TripScheduleEntity; warnings: BufferWarning[] }> {
    const departure = new Date(dto.plannedDepartureAt);
    const returnAt = new Date(dto.plannedReturnAt);

    if (departure >= returnAt) {
      throw new BadRequestException('Waktu keberangkatan harus lebih awal dari waktu kepulangan.');
    }

    // Jalankan conflict check jika sudah ada armada atau kru
    const crewIds: string[] = [];
    if (dto.plannedDriver1Id) crewIds.push(dto.plannedDriver1Id);
    if (dto.plannedDriver2Id) crewIds.push(dto.plannedDriver2Id);
    if (dto.plannedConductorId) crewIds.push(dto.plannedConductorId);

    const checkResult = await this.checkConflictsAndBuffer({
      vehicleId: dto.vehicleId,
      crewIds,
      departureAt: dto.plannedDepartureAt,
      returnAt: dto.plannedReturnAt,
    });

    if (checkResult.hasConflict) {
      throw new ConflictException(
        `Gagal menyimpan jadwal karena terjadi bentrok operasional: ${checkResult.conflictDetails.join(' ')}`,
      );
    }

    // Otomasi Nomor Jadwal via DocumentSequenceService
    const periodKey = this.getPeriodKey(departure);
    let typePrefix = 'AKP';
    if (dto.serviceType === TripServiceType.WISATA) typePrefix = 'WIS';
    else if (dto.serviceType === TripServiceType.SHUTTLE) typePrefix = 'SHT';

    const documentType = `SCHEDULE_${dto.serviceType}`;
    const prefix = `SCH/${typePrefix}/${periodKey}`;

    let scheduleNo = await this.sequenceService.getNextDocumentNumber(
      documentType,
      periodKey,
      prefix,
      4,
      dto.companyId,
    );

    // Self-healing: jika nomor sudah pernah terpakai di DB (misal dari data seeder/migrasi),
    // otomatis ambil nomor urut berikutnya sampai unik (maksimal 20 percobaan)
    let attempts = 0;
    while (attempts < 20) {
      const existing = await this.scheduleRepo.findOne({ where: { scheduleNo } });
      if (!existing) break;
      scheduleNo = await this.sequenceService.getNextDocumentNumber(
        documentType,
        periodKey,
        prefix,
        4,
        dto.companyId,
      );
      attempts++;
    }

    // Dapatkan business unit otomatis jika tidak diinput
    let buId = dto.businessUnitId;
    if (!buId) {
      const bu = await this.businessUnitRepo.findOne({
        where: { code: dto.serviceType === TripServiceType.AKAP ? 'AKAP' : 'PARIWISATA' },
      });
      if (bu) buId = bu.id;
    }

    // Dapatkan cost center otomatis berdasarkan tipe layanan jika tidak diinput
    let ccId = dto.costCenterId;
    if (!ccId) {
      const ccCode = dto.serviceType === TripServiceType.AKAP ? 'CC-OPS-AKAP' : 'CC-OPS-WISATA';
      const cc = await this.costCenterRepo.findOne({ where: { code: ccCode } });
      if (cc) ccId = cc.id;
    }

    const schedule = this.scheduleRepo.create({
      scheduleNo,
      serviceType: dto.serviceType,
      vehicleId: dto.vehicleId,
      plannedDepartureAt: departure,
      plannedReturnAt: returnAt,
      origin: dto.origin,
      destination: dto.destination,
      customerId: dto.customerId,
      picName: dto.picName,
      picPhone: dto.picPhone,
      pickupNotes: dto.pickupNotes,
      totalPackagePrice: String(dto.totalPackagePrice || 0),
      plannedDriver1Id: dto.plannedDriver1Id,
      plannedDriver2Id: dto.plannedDriver2Id,
      plannedConductorId: dto.plannedConductorId,
      status: TripScheduleStatus.DRAFT,
      notes: dto.notes,
      businessUnitId: buId,
      costCenterId: ccId,
      companyId: dto.companyId,
    });

    const saved = await this.scheduleRepo.save(schedule);
    const result = await this.findOne(saved.id);

    return {
      schedule: result,
      warnings: checkResult.warnings,
    };
  }

  async update(id: string, dto: UpdateTripScheduleDto): Promise<{ schedule: TripScheduleEntity; warnings: BufferWarning[] }> {
    const schedule = await this.findOne(id);

    if (schedule.status === TripScheduleStatus.COMPLETED || schedule.status === TripScheduleStatus.CANCELLED) {
      throw new BadRequestException(`Jadwal dengan status '${schedule.status}' tidak dapat diubah lagi.`);
    }

    const departure = dto.plannedDepartureAt ? new Date(dto.plannedDepartureAt) : schedule.plannedDepartureAt;
    const returnAt = dto.plannedReturnAt ? new Date(dto.plannedReturnAt) : schedule.plannedReturnAt;

    if (departure >= returnAt) {
      throw new BadRequestException('Waktu keberangkatan harus lebih awal dari waktu kepulangan.');
    }

    const vehicleId = dto.vehicleId !== undefined ? dto.vehicleId : schedule.vehicleId;
    const driver1 = dto.plannedDriver1Id !== undefined ? dto.plannedDriver1Id : schedule.plannedDriver1Id;
    const driver2 = dto.plannedDriver2Id !== undefined ? dto.plannedDriver2Id : schedule.plannedDriver2Id;
    const cond = dto.plannedConductorId !== undefined ? dto.plannedConductorId : schedule.plannedConductorId;

    const crewIds: string[] = [];
    if (driver1) crewIds.push(driver1);
    if (driver2) crewIds.push(driver2);
    if (cond) crewIds.push(cond);

    const checkResult = await this.checkConflictsAndBuffer({
      vehicleId,
      crewIds,
      departureAt: departure.toISOString(),
      returnAt: returnAt.toISOString(),
      excludeScheduleId: id,
    });

    if (checkResult.hasConflict) {
      throw new ConflictException(
        `Gagal memperbarui jadwal karena terjadi bentrok: ${checkResult.conflictDetails.join(' ')}`,
      );
    }

    Object.assign(schedule, {
      ...dto,
      plannedDepartureAt: departure,
      plannedReturnAt: returnAt,
      totalPackagePrice: dto.totalPackagePrice !== undefined ? String(dto.totalPackagePrice) : schedule.totalPackagePrice,
    });

    await this.scheduleRepo.save(schedule);
    const updated = await this.findOne(id);

    return {
      schedule: updated,
      warnings: checkResult.warnings,
    };
  }

  async confirm(id: string): Promise<TripScheduleEntity> {
    const schedule = await this.findOne(id);

    if (schedule.status !== TripScheduleStatus.DRAFT) {
      throw new BadRequestException(`Hanya jadwal berstatus DRAFT yang dapat dikonfirmasi.`);
    }

    if (!schedule.vehicleId) {
      throw new BadRequestException(`Jadwal harus memiliki armada bus yang ditugaskan sebelum dikonfirmasi.`);
    }

    schedule.status = TripScheduleStatus.CONFIRMED;
    await this.scheduleRepo.save(schedule);

    // Update customer CRM jika sewa wisata
    if (schedule.customerId) {
      const customer = await this.customerRepo.findOne({ where: { id: schedule.customerId } });
      if (customer) {
        customer.totalTripsCount = (customer.totalTripsCount || 0) + 1;
        customer.lastTripDate = schedule.plannedDepartureAt;
        await this.customerRepo.save(customer);
      }
    }

    return this.findOne(id);
  }

  async cancel(id: string, reason?: string): Promise<TripScheduleEntity> {
    const schedule = await this.findOne(id);

    if (schedule.status === TripScheduleStatus.IN_PROGRESS || schedule.status === TripScheduleStatus.COMPLETED) {
      throw new BadRequestException(`Jadwal yang sedang berjalan atau sudah selesai tidak dapat dibatalkan langsung.`);
    }

    schedule.status = TripScheduleStatus.CANCELLED;
    if (reason) {
      schedule.notes = schedule.notes ? `${schedule.notes} [Dibatalkan: ${reason}]` : `[Dibatalkan: ${reason}]`;
    }

    await this.scheduleRepo.save(schedule);
    return this.findOne(id);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const schedule = await this.findOne(id);

    if (schedule.status !== TripScheduleStatus.DRAFT && schedule.status !== TripScheduleStatus.CANCELLED) {
      throw new BadRequestException(`Hanya jadwal berstatus DRAFT atau CANCELLED yang dapat dihapus.`);
    }

    if (schedule.spjId) {
      throw new BadRequestException(`Jadwal telah menerbitkan dokumen SPJ, tidak dapat dihapus.`);
    }

    await this.scheduleRepo.remove(schedule);
    return {
      success: true,
      message: `Jadwal ${schedule.scheduleNo} berhasil dihapus.`,
    };
  }
}
