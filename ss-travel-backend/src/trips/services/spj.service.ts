import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SpjEntity,
  SpjLegEntity,
  SpjCrewAssignmentEntity,
  TripScheduleEntity,
  TripServiceType,
  TripScheduleStatus,
  SpjOperationalStatus,
  SpjFinancialStatus,
  SpjLegDirection,
  SpjLegStatus,
  CrewAssignmentRole,
  CrewAssignmentStatus,
} from '../../@models/trips';
import { VehicleEntity } from '../../@models/fleet/vehicle.entity';
import { UsersEntity } from '../../@models/user/user.entity';
import { BusinessUnitEntity } from '../../@models/organization/business-unit.entity';
import { ProfitCenterEntity } from '../../@models/organization/profit-center.entity';
import { CostCenterEntity } from '../../@models/organization/cost-center.entity';
import { CrewRole, CrewServiceType } from '../../@models/master-rules/crew-rate-rule.entity';
import { DocumentSequenceService } from '../../finance/services/document-sequence.service';
import { CrewRatesService } from '../../master-rules/services/crew-rates.service';
import {
  CreateSpjDto,
  ReplaceCrewDto,
  EmergencyReplaceBusDto,
  SpjQueryFilterDto,
  UpdateSpjLegDto,
} from '../../@dto/trips/spj.dto';
import { GenerateSpjFromScheduleDto } from '../../@dto/trips/trip-schedule.dto';

@Injectable()
export class SpjService {
  constructor(
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(SpjLegEntity)
    private readonly legRepo: Repository<SpjLegEntity>,
    @InjectRepository(SpjCrewAssignmentEntity)
    private readonly crewRepo: Repository<SpjCrewAssignmentEntity>,
    @InjectRepository(TripScheduleEntity)
    private readonly scheduleRepo: Repository<TripScheduleEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepo: Repository<VehicleEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepo: Repository<UsersEntity>,
    @InjectRepository(BusinessUnitEntity)
    private readonly businessUnitRepo: Repository<BusinessUnitEntity>,
    @InjectRepository(ProfitCenterEntity)
    private readonly profitCenterRepo: Repository<ProfitCenterEntity>,
    @InjectRepository(CostCenterEntity)
    private readonly costCenterRepo: Repository<CostCenterEntity>,
    private readonly sequenceService: DocumentSequenceService,
    private readonly crewRatesService: CrewRatesService,
  ) {}

  private getPeriodKey(date: Date): string {
    const d = new Date(date);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}`;
  }

  private mapRoleToCrewRole(role: CrewAssignmentRole): CrewRole {
    switch (role) {
      case CrewAssignmentRole.DRIVER:
        return CrewRole.DRIVER;
      case CrewAssignmentRole.CO_DRIVER:
        return CrewRole.CO_DRIVER;
      case CrewAssignmentRole.CONDUCTOR:
        return CrewRole.CONDUCTOR;
      case CrewAssignmentRole.STEWARDESS:
        return CrewRole.STEWARDESS;
      default:
        return CrewRole.CONDUCTOR;
    }
  }

  /**
   * Helper snapshot rate kompensasi kru
   */
  private async getRateSnapshotForCrew(
    role: CrewAssignmentRole,
    serviceType: TripServiceType,
    durationDays = 1,
    origin = 'ALL',
    destination = 'ALL',
  ): Promise<{ mealAllowance: number; incentive: number; fullSeatBonus: number }> {
    try {
      const crewRole = this.mapRoleToCrewRole(role);
      const crewService =
        serviceType === TripServiceType.WISATA
          ? CrewServiceType.TOURISM
          : CrewServiceType.AKAP;

      const snapshot = await this.crewRatesService.getRateSnapshot({
        role: crewRole,
        serviceType: crewService,
        durationDays,
        origin,
        destination,
      });

      return {
        mealAllowance: snapshot.mealAllowance,
        incentive: snapshot.tripIncentive,
        fullSeatBonus: snapshot.fullSeatBonus,
      };
    } catch {
      // Fallback jika tidak ada master rate khusus
      return {
        mealAllowance: 100000,
        incentive: 150000,
        fullSeatBonus: serviceType === TripServiceType.AKAP ? 50000 : 0,
      };
    }
  }

  async findAll(query: SpjQueryFilterDto): Promise<{ data: SpjEntity[]; total: number; page: number; limit: number }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const qb = this.spjRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.vehicle', 'vehicle')
      .leftJoinAndSelect('s.tripSchedule', 'schedule')
      .leftJoinAndSelect('s.parentSpj', 'parentSpj')
      .leftJoinAndSelect('s.legs', 'legs')
      .leftJoinAndSelect('s.crewAssignments', 'crewAssignments')
      .leftJoinAndSelect('crewAssignments.crew', 'crew')
      .leftJoinAndSelect('s.businessUnit', 'businessUnit')
      .leftJoinAndSelect('s.profitCenter', 'profitCenter')
      .leftJoinAndSelect('s.costCenter', 'costCenter')
      .orderBy('s.createdAt', 'DESC');

    if (query.serviceType) {
      qb.andWhere('s.serviceType = :serviceType', { serviceType: query.serviceType });
    }

    if (query.operationalStatus) {
      qb.andWhere('s.operationalStatus = :opStatus', { opStatus: query.operationalStatus });
    }

    if (query.financialStatus) {
      qb.andWhere('s.financialStatus = :finStatus', { finStatus: query.financialStatus });
    }

    if (query.vehicleId) {
      qb.andWhere('s.vehicleId = :vId', { vId: query.vehicleId });
    }

    if (query.crewId) {
      qb.andWhere('crewAssignments.crewId = :crewId', { crewId: query.crewId });
    }

    if (query.startDate) {
      qb.andWhere('s.createdAt >= :startDate', { startDate: new Date(query.startDate) });
    }

    if (query.endDate) {
      qb.andWhere('s.createdAt <= :endDate', { endDate: new Date(query.endDate) });
    }

    if (query.search) {
      qb.andWhere(
        '(s.spjNo ILIKE :search OR vehicle.code ILIKE :search OR vehicle.plateNumber ILIKE :search)',
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

  async findOne(id: string): Promise<SpjEntity> {
    const spj = await this.spjRepo.findOne({
      where: { id },
      relations: [
        'vehicle',
        'tripSchedule',
        'tripSchedule.customer',
        'parentSpj',
        'replacementSpjs',
        'legs',
        'crewAssignments',
        'crewAssignments.crew',
        'crewAssignments.replacementCrew',
        'businessUnit',
        'profitCenter',
        'costCenter',
      ],
      order: {
        legs: { sequenceNo: 'ASC' },
      },
    });

    if (!spj) {
      throw new NotFoundException(`Dokumen SPJ dengan ID '${id}' tidak ditemukan.`);
    }

    return spj;
  }

  async create(dto: CreateSpjDto): Promise<SpjEntity> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Armada bus dengan ID '${dto.vehicleId}' tidak ditemukan.`);
    }

    const periodKey = this.getPeriodKey(new Date());
    let typePrefix = 'AKP';
    if (dto.serviceType === TripServiceType.WISATA) typePrefix = 'WIS';
    else if (dto.serviceType === TripServiceType.SHUTTLE) typePrefix = 'SHT';

    const documentType = `SPJ_${dto.serviceType}`;
    const prefix = `SPJ/${typePrefix}/${periodKey}`;

    let spjNo = await this.sequenceService.getNextDocumentNumber(
      documentType,
      periodKey,
      prefix,
      4,
    );

    // Self-healing: jika nomor sudah pernah terpakai di DB (misal dari seeder/migrasi),
    // otomatis ambil nomor urut berikutnya sampai unik (maksimal 20 percobaan)
    let attempts = 0;
    while (attempts < 20) {
      const existing = await this.spjRepo.findOne({ where: { spjNo } });
      if (!existing) break;
      spjNo = await this.sequenceService.getNextDocumentNumber(
        documentType,
        periodKey,
        prefix,
        4,
      );
      attempts++;
    }

    let buId = dto.businessUnitId;
    if (!buId) {
      const bu = await this.businessUnitRepo.findOne({
        where: { code: dto.serviceType === TripServiceType.AKAP ? 'AKAP' : 'PARIWISATA' },
      });
      if (bu) buId = bu.id;
    }

    let pcId = dto.profitCenterId;
    if (!pcId) {
      const pc = await this.profitCenterRepo.findOne({
        where: { code: dto.serviceType === TripServiceType.AKAP ? 'PC-AKAP' : 'PC-WISATA' },
      });
      if (pc) pcId = pc.id;
    }

    // Auto-map cost center berdasarkan serviceType jika tidak disediakan
    let ccId = dto.costCenterId;
    if (!ccId && this.costCenterRepo) {
      const ccCode = dto.serviceType === TripServiceType.AKAP ? 'CC-OPS-AKAP' : 'CC-OPS-WISATA';
      const cc = await this.costCenterRepo.findOne({ where: { code: ccCode } });
      if (cc) ccId = cc.id;
    }

    const spj = this.spjRepo.create({
      spjNo,
      serviceType: dto.serviceType,
      vehicleId: dto.vehicleId,
      tripScheduleId: dto.tripScheduleId,
      parentSpjId: dto.parentSpjId,
      businessUnitId: buId,
      profitCenterId: pcId,
      costCenterId: ccId,
      operationalStatus: SpjOperationalStatus.DRAFT,
      financialStatus: SpjFinancialStatus.PENDING_SETTLEMENT,
      notes: dto.notes,
    });

    const savedSpj = await this.spjRepo.save(spj);

    // Buat Legs
    if (dto.legs && dto.legs.length > 0) {
      for (const legDto of dto.legs) {
        const leg = this.legRepo.create({
          spjId: savedSpj.id,
          sequenceNo: legDto.sequenceNo,
          direction: legDto.direction,
          origin: legDto.origin,
          destination: legDto.destination,
          departureAt: legDto.departureAt ? new Date(legDto.departureAt) : undefined,
          arrivalAt: legDto.arrivalAt ? new Date(legDto.arrivalAt) : undefined,
          passengerCount: legDto.passengerCount || 0,
          status: SpjLegStatus.SCHEDULED,
        });
        await this.legRepo.save(leg);
      }
    } else {
      // Default Legs sesuai serviceType
      if (dto.serviceType === TripServiceType.AKAP) {
        const leg1 = this.legRepo.create({
          spjId: savedSpj.id,
          sequenceNo: 1,
          direction: SpjLegDirection.DEPARTURE,
          origin: 'Pool Ciputat / Jakarta',
          destination: 'Terminal Giwangan Yogyakarta',
          status: SpjLegStatus.SCHEDULED,
        });
        const leg2 = this.legRepo.create({
          spjId: savedSpj.id,
          sequenceNo: 2,
          direction: SpjLegDirection.RETURN,
          origin: 'Terminal Giwangan Yogyakarta',
          destination: 'Pool Ciputat / Jakarta',
          status: SpjLegStatus.SCHEDULED,
        });
        await this.legRepo.save([leg1, leg2]);
      } else {
        const leg = this.legRepo.create({
          spjId: savedSpj.id,
          sequenceNo: 1,
          direction: SpjLegDirection.ONE_WAY,
          origin: 'Pool Ciputat / Tangerang',
          destination: 'Destinasi Wisata / Penugasan Sewa',
          status: SpjLegStatus.SCHEDULED,
        });
        await this.legRepo.save(leg);
      }
    }

    // Buat Crew Assignments & Rate Snapshotting
    if (dto.crewAssignments && dto.crewAssignments.length > 0) {
      for (const crewDto of dto.crewAssignments) {
        let meal = crewDto.mealAllowanceSnapshot;
        let inc = crewDto.incentiveSnapshot;
        let bonus = crewDto.fullSeatBonusSnapshot;

        if (meal === undefined || inc === undefined) {
          const rates = await this.getRateSnapshotForCrew(
            crewDto.role,
            dto.serviceType,
            1,
          );
          if (meal === undefined) meal = rates.mealAllowance;
          if (inc === undefined) inc = rates.incentive;
          if (bonus === undefined) bonus = rates.fullSeatBonus;
        }

        let assignmentNotes = crewDto.notes || '';
        if (crewDto.payoutTiming) {
          assignmentNotes = assignmentNotes
            ? `${assignmentNotes} [Payout: ${crewDto.payoutTiming}]`
            : `[Payout: ${crewDto.payoutTiming}]`;
        }

        const assignment = this.crewRepo.create({
          spjId: savedSpj.id,
          crewId: crewDto.crewId,
          role: crewDto.role,
          spjLegId: crewDto.spjLegId,
          status: CrewAssignmentStatus.ASSIGNED,
          notes: assignmentNotes || undefined,
          mealAllowanceSnapshot: String(meal || 0),
          incentiveSnapshot: String(inc || 0),
          fullSeatBonusSnapshot: String(bonus || 0),
        });
        await this.crewRepo.save(assignment);
      }
    }

    return this.findOne(savedSpj.id);
  }

  /**
   * Aksi 1-Klik: Terbitkan SPJ dari Jadwal yang Terkonfirmasi (Addendum v1.16 & v1.19)
   */
  async generateFromSchedule(
    scheduleId: string,
    dto?: GenerateSpjFromScheduleDto,
  ): Promise<SpjEntity> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id: scheduleId },
      relations: ['vehicle', 'customer'],
    });

    if (!schedule) {
      throw new NotFoundException(`Jadwal dengan ID '${scheduleId}' tidak ditemukan.`);
    }

    if (schedule.spjId) {
      throw new BadRequestException(`Jadwal '${schedule.scheduleNo}' sudah memiliki dokumen SPJ.`);
    }

    const vehicleId = dto?.vehicleId || schedule.vehicleId;
    if (!vehicleId) {
      throw new BadRequestException('Armada bus belum ditentukan untuk jadwal ini.');
    }

    const driver1Id = dto?.driver1Id || schedule.plannedDriver1Id;
    const driver2Id = dto?.driver2Id || schedule.plannedDriver2Id;
    const conductorId = dto?.conductorId || schedule.plannedConductorId;

    if (!driver1Id && !driver2Id) {
      throw new BadRequestException('Penerbitan SPJ memerlukan minimal 1 orang pengemudi (Driver).');
    }

    // Durasi hari untuk pariwisata
    const depDate = new Date(schedule.plannedDepartureAt);
    const retDate = new Date(schedule.plannedReturnAt);
    const durationDays = Math.max(
      1,
      Math.ceil((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );

    // Legs: default 2 Leg (PP) untuk AKAP, atau sesuai pilihan isRoundTrip
    const isRoundTrip =
      dto?.isRoundTrip !== undefined
        ? dto.isRoundTrip
        : schedule.serviceType === TripServiceType.AKAP;

    // Multiplier hak kompensasi kru: AKAP (2 Leg PP atau 1 Leg), Wisata (Jumlah Hari)
    const legOrDayMultiplier =
      schedule.serviceType === TripServiceType.AKAP
        ? (isRoundTrip ? 2 : 1)
        : durationDays;

    // Kumpulkan Crew Assignments beserta Snapshot Rate (Addendum v1.19)
    const rawCrewList = [
      { id: driver1Id, role: CrewAssignmentRole.DRIVER },
      { id: driver2Id, role: CrewAssignmentRole.CO_DRIVER },
      { id: conductorId, role: CrewAssignmentRole.CONDUCTOR },
    ].filter((c) => !!c.id) as { id: string; role: CrewAssignmentRole }[];

    const crewAssignments: {
      crewId: string;
      role: CrewAssignmentRole;
      mealAllowanceSnapshot?: number;
      incentiveSnapshot?: number;
      fullSeatBonusSnapshot?: number;
      payoutTiming?: string;
    }[] = [];

    for (const raw of rawCrewList) {
      const custom = dto?.customCrewRates?.find((c) => c.crewId === raw.id || c.role === raw.role);
      if (custom) {
        crewAssignments.push({
          crewId: raw.id,
          role: raw.role,
          mealAllowanceSnapshot: custom.mealAllowance,
          incentiveSnapshot: custom.incentive,
          fullSeatBonusSnapshot: custom.fullSeatBonus,
          payoutTiming: custom.payoutTiming,
        });
      } else {
        const baseRates = await this.getRateSnapshotForCrew(
          raw.role,
          schedule.serviceType,
          1,
        );
        crewAssignments.push({
          crewId: raw.id,
          role: raw.role,
          mealAllowanceSnapshot: baseRates.mealAllowance * legOrDayMultiplier,
          incentiveSnapshot: baseRates.incentive * legOrDayMultiplier,
          fullSeatBonusSnapshot:
            schedule.serviceType === TripServiceType.AKAP && isRoundTrip
              ? baseRates.fullSeatBonus * 2
              : baseRates.fullSeatBonus,
          payoutTiming: 'AT_SETTLEMENT',
        });
      }
    }

    const legs: { sequenceNo: number; direction: SpjLegDirection; origin: string; destination: string; departureAt?: string; arrivalAt?: string }[] = [];
    if (isRoundTrip) {
      legs.push({
        sequenceNo: 1,
        direction: SpjLegDirection.DEPARTURE,
        origin: schedule.origin,
        destination: schedule.destination,
        departureAt: schedule.plannedDepartureAt.toISOString(),
      });
      legs.push({
        sequenceNo: 2,
        direction: SpjLegDirection.RETURN,
        origin: schedule.destination,
        destination: schedule.origin,
        arrivalAt: schedule.plannedReturnAt.toISOString(),
      });
    } else {
      legs.push({
        sequenceNo: 1,
        direction: SpjLegDirection.ONE_WAY,
        origin: schedule.origin,
        destination: schedule.destination,
        departureAt: schedule.plannedDepartureAt.toISOString(),
        arrivalAt: schedule.plannedReturnAt.toISOString(),
      });
    }

    const spj = await this.create({
      serviceType: schedule.serviceType,
      vehicleId,
      tripScheduleId: schedule.id,
      notes: dto?.notes || schedule.notes,
      businessUnitId: schedule.businessUnitId,
      costCenterId: schedule.costCenterId,
      legs,
      crewAssignments,
    });

    // Otomatis terbitkan resmi (ISSUED)
    spj.operationalStatus = SpjOperationalStatus.ISSUED;
    spj.issuedAt = new Date();
    await this.spjRepo.save(spj);

    // Update jadwal
    schedule.spjId = spj.id;
    schedule.status = TripScheduleStatus.IN_PROGRESS;
    await this.scheduleRepo.save(schedule);

    return this.findOne(spj.id);
  }

  async issue(id: string): Promise<SpjEntity> {
    const spj = await this.findOne(id);

    if (spj.operationalStatus !== SpjOperationalStatus.DRAFT) {
      throw new BadRequestException(`Hanya SPJ berstatus DRAFT yang dapat diterbitkan.`);
    }

    // Validasi Minimal 1 Driver (Blueprint Bab 7.2 & Test Case 1)
    const hasDriver = spj.crewAssignments?.some(
      (c) => (c.role === CrewAssignmentRole.DRIVER || c.role === CrewAssignmentRole.CO_DRIVER) && c.status === CrewAssignmentStatus.ASSIGNED,
    );

    if (!hasDriver) {
      throw new BadRequestException('Penerbitan SPJ ditolak: Wajib memiliki minimal 1 orang pengemudi (DRIVER).');
    }

    spj.operationalStatus = SpjOperationalStatus.ISSUED;
    spj.issuedAt = new Date();

    await this.spjRepo.save(spj);
    return this.findOne(id);
  }

  async start(id: string): Promise<SpjEntity> {
    const spj = await this.findOne(id);

    if (spj.operationalStatus !== SpjOperationalStatus.ISSUED) {
      throw new BadRequestException(`Hanya SPJ berstatus ISSUED yang dapat diberangkatkan.`);
    }

    spj.operationalStatus = SpjOperationalStatus.IN_PROGRESS;

    // Aktifkan leg pertama
    if (spj.legs && spj.legs.length > 0) {
      const firstLeg = spj.legs.find((l) => l.sequenceNo === 1) || spj.legs[0];
      firstLeg.status = SpjLegStatus.IN_PROGRESS;
      firstLeg.departureAt = new Date();
      await this.legRepo.save(firstLeg);
    }

    // Aktifkan kru
    if (spj.crewAssignments) {
      for (const crew of spj.crewAssignments) {
        crew.status = CrewAssignmentStatus.ACTIVE;
        crew.assignedFrom = new Date();
        await this.crewRepo.save(crew);
      }
    }

    await this.spjRepo.save(spj);
    return this.findOne(id);
  }

  async complete(id: string): Promise<SpjEntity> {
    const spj = await this.findOne(id);

    if (spj.operationalStatus !== SpjOperationalStatus.IN_PROGRESS) {
      throw new BadRequestException(`Hanya SPJ yang sedang berjalan (IN_PROGRESS) yang dapat diselesaikan.`);
    }

    spj.operationalStatus = SpjOperationalStatus.COMPLETED;
    spj.operationallyCompletedAt = new Date();

    // Blueprint Bab 8.2: Status finansial beralih ke UNDER_REVIEW untuk meja kasir pool
    spj.financialStatus = SpjFinancialStatus.UNDER_REVIEW;

    // Selesaikan seluruh leg
    if (spj.legs) {
      for (const leg of spj.legs) {
        if (leg.status !== SpjLegStatus.CANCELLED) {
          leg.status = SpjLegStatus.COMPLETED;
          if (!leg.arrivalAt) leg.arrivalAt = new Date();
          await this.legRepo.save(leg);
        }
      }
    }

    // Selesaikan kru
    if (spj.crewAssignments) {
      for (const crew of spj.crewAssignments) {
        if (crew.status === CrewAssignmentStatus.ACTIVE) {
          crew.status = CrewAssignmentStatus.COMPLETED;
          crew.assignedUntil = new Date();
          await this.crewRepo.save(crew);
        }
      }
    }

    // Update jadwal jika terhubung
    if (spj.tripScheduleId) {
      const schedule = await this.scheduleRepo.findOne({ where: { id: spj.tripScheduleId } });
      if (schedule) {
        schedule.status = TripScheduleStatus.COMPLETED;
        await this.scheduleRepo.save(schedule);
      }
    }

    await this.spjRepo.save(spj);
    return this.findOne(id);
  }

  async cancel(id: string, reason?: string): Promise<SpjEntity> {
    const spj = await this.findOne(id);

    if (spj.operationalStatus === SpjOperationalStatus.COMPLETED) {
      throw new BadRequestException('SPJ yang telah selesai secara operasional tidak dapat dibatalkan.');
    }

    spj.operationalStatus = SpjOperationalStatus.CANCELLED;
    if (reason) {
      spj.notes = spj.notes ? `${spj.notes} [Dibatalkan: ${reason}]` : `[Dibatalkan: ${reason}]`;
    }

    await this.spjRepo.save(spj);
    return this.findOne(id);
  }

  async updateLeg(legId: string, dto: UpdateSpjLegDto): Promise<SpjLegEntity> {
    const leg = await this.legRepo.findOne({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException(`Leg dengan ID '${legId}' tidak ditemukan.`);
    }

    Object.assign(leg, {
      ...dto,
      departureAt: dto.departureAt ? new Date(dto.departureAt) : leg.departureAt,
      arrivalAt: dto.arrivalAt ? new Date(dto.arrivalAt) : leg.arrivalAt,
    });

    return this.legRepo.save(leg);
  }

  /**
   * Revisi Kru Berjalan / Sakit di Jalan (Skenario 1 Poin 7 & Addendum v1.1)
   */
  async replaceCrew(spjId: string, dto: ReplaceCrewDto): Promise<SpjEntity> {
    const spj = await this.findOne(spjId);

    const oldAssignment = await this.crewRepo.findOne({
      where: { id: dto.assignmentId, spjId },
      relations: ['crew'],
    });

    if (!oldAssignment) {
      throw new NotFoundException(`Penugasan kru dengan ID '${dto.assignmentId}' tidak ditemukan pada SPJ ini.`);
    }

    const replacementUser = await this.userRepo.findOne({ where: { id: dto.replacementCrewId } });
    if (!replacementUser) {
      throw new NotFoundException(`Kru pengganti dengan ID '${dto.replacementCrewId}' tidak ditemukan.`);
    }

    // Tandai assignment lama
    oldAssignment.status = CrewAssignmentStatus.REPLACED;
    oldAssignment.replacementCrewId = dto.replacementCrewId;
    oldAssignment.notes = oldAssignment.notes
      ? `${oldAssignment.notes} [Digantikan oleh ${replacementUser.name}: ${dto.reason}]`
      : `[Digantikan oleh ${replacementUser.name}: ${dto.reason}]`;
    await this.crewRepo.save(oldAssignment);

    // Ambil snapshot tarif kru pengganti
    const role = dto.role || oldAssignment.role;
    const rates = await this.getRateSnapshotForCrew(role, spj.serviceType);

    // Buat assignment baru
    const newAssignment = this.crewRepo.create({
      spjId,
      crewId: dto.replacementCrewId,
      role,
      spjLegId: oldAssignment.spjLegId,
      status: CrewAssignmentStatus.ACTIVE,
      assignedFrom: new Date(),
      notes: `Menggantikan ${oldAssignment.crew?.name}: ${dto.reason}`,
      mealAllowanceSnapshot: String(rates.mealAllowance),
      incentiveSnapshot: String(rates.incentive),
      fullSeatBonusSnapshot: String(rates.fullSeatBonus),
    });
    await this.crewRepo.save(newAssignment);

    return this.findOne(spjId);
  }

  /**
   * Skenario 3: Emergency Breakdown & Penggantian Armada di Tol (KM 214 Tol Cipali)
   */
  async emergencyReplaceBus(
    spjId: string,
    dto: EmergencyReplaceBusDto,
  ): Promise<{ oldSpj: SpjEntity; newSpj: SpjEntity }> {
    const oldSpj = await this.findOne(spjId);

    const newVehicle = await this.vehicleRepo.findOne({ where: { id: dto.newVehicleId } });
    if (!newVehicle) {
      throw new NotFoundException(`Armada pengganti dengan ID '${dto.newVehicleId}' tidak ditemukan.`);
    }

    // 1. Tutup operasional SPJ lama
    oldSpj.operationalStatus = SpjOperationalStatus.COMPLETED;
    oldSpj.operationallyCompletedAt = new Date();
    oldSpj.financialStatus = SpjFinancialStatus.UNDER_REVIEW;
    oldSpj.notes = oldSpj.notes
      ? `${oldSpj.notes} [Breakdown di ${dto.incidentLocation}: ${dto.incidentNotes}. Digantikan oleh ${newVehicle.code}]`
      : `[Breakdown di ${dto.incidentLocation}: ${dto.incidentNotes}. Digantikan oleh ${newVehicle.code}]`;
    await this.spjRepo.save(oldSpj);

    // 2. Terbitkan SPJ Pengganti yang ditautkan ke parent_spj_id
    const periodKey = this.getPeriodKey(new Date());
    let typePrefix = 'AKP';
    if (oldSpj.serviceType === TripServiceType.WISATA) typePrefix = 'WIS';

    const spjNo = await this.sequenceService.getNextDocumentNumber(
      `SPJ_${oldSpj.serviceType}`,
      periodKey,
      `SPJ/${typePrefix}/${periodKey}`,
      4,
    );

    const newSpj = this.spjRepo.create({
      spjNo,
      serviceType: oldSpj.serviceType,
      vehicleId: dto.newVehicleId,
      tripScheduleId: oldSpj.tripScheduleId,
      parentSpjId: oldSpj.id, // KUNCI UTAMA RELASI PERJALANAN EKONOMI
      businessUnitId: oldSpj.businessUnitId,
      profitCenterId: oldSpj.profitCenterId,
      costCenterId: oldSpj.costCenterId,
      operationalStatus: SpjOperationalStatus.IN_PROGRESS, // Langsung aktif melanjutkan perjalanan
      financialStatus: SpjFinancialStatus.PENDING_SETTLEMENT,
      issuedAt: new Date(),
      notes: `SPJ Pengganti pasca insiden breakdown ${oldSpj.vehicle?.code} di ${dto.incidentLocation}.`,
    });

    const savedNewSpj = await this.spjRepo.save(newSpj);

    // 3. Buat leg lanjutan untuk SPJ baru
    const continuationLeg = this.legRepo.create({
      spjId: savedNewSpj.id,
      sequenceNo: 1,
      direction: SpjLegDirection.DEPARTURE,
      origin: dto.incidentLocation,
      destination: 'Terminal Giwangan Yogyakarta',
      departureAt: new Date(),
      status: SpjLegStatus.IN_PROGRESS,
      passengerCount: dto.transferPassengerCount || 24,
    });
    await this.legRepo.save(continuationLeg);

    // 4. Salin kru ke SPJ baru jika kru utama melanjutkan perjalanan
    if (dto.continueWithExistingCrew && oldSpj.crewAssignments) {
      for (const crew of oldSpj.crewAssignments) {
        if (crew.status === CrewAssignmentStatus.ACTIVE || crew.status === CrewAssignmentStatus.ASSIGNED) {
          const newCrewAssignment = this.crewRepo.create({
            spjId: savedNewSpj.id,
            crewId: crew.crewId,
            role: crew.role,
            status: CrewAssignmentStatus.ACTIVE,
            assignedFrom: new Date(),
            notes: `Lanjut estafet dari ${oldSpj.spjNo}`,
            mealAllowanceSnapshot: crew.mealAllowanceSnapshot,
            incentiveSnapshot: crew.incentiveSnapshot,
            fullSeatBonusSnapshot: crew.fullSeatBonusSnapshot,
          });
          await this.crewRepo.save(newCrewAssignment);
        }
      }
    }

    return {
      oldSpj: await this.findOne(oldSpj.id),
      newSpj: await this.findOne(savedNewSpj.id),
    };
  }
}
