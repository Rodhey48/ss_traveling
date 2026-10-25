import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SpjEntity } from '../../@models/trips/spj.entity';
import { VehicleEntity } from '../../@models/fleet/vehicle.entity';
import { JournalLineEntity } from '../../@models/finance/journal-line.entity';
import {
  CrewAssignmentRole,
  SpjRevenueDeclarationType,
} from '../../@models/trips/trip.enums';
import { MoneyHelper } from '../../@common/helpers/money.helper';
import {
  TripProfitabilityFilterDto,
  TripProfitabilityViewMode,
} from '../../@dto/finance/reports.dto';

export interface TripProfitabilityItem {
  id: string; // spjId or journeyGroupId
  journeyGroupId?: string;
  spjNo: string;
  parentSpjNo?: string;
  hasReplacement: boolean;
  serviceType: string;
  departureDate: string;
  origin: string;
  destination: string;
  vehicleCode: string;
  vehiclePlate: string;
  driverName?: string;
  paxCount: number;
  // Revenue Breakdown
  ticketRevenue: string;
  cargoRevenue: string;
  charterRevenue: string;
  grossRevenue: string;
  // Cost Breakdown
  fuelCost: string;
  tollAndParkingCost: string;
  mealCouponCost: string;
  crewCost: string;
  agentAndPartnerCost: string;
  incidentalRepairCost: string;
  totalDirectCost: string;
  // Margin
  contributionMargin: string;
  contributionMarginRatio: number; // e.g. 42.75 (%)
  status: string;
}

export interface TripProfitabilitySummary {
  totalTrips: number;
  totalRevenue: string;
  totalDirectCost: string;
  totalContributionMargin: string;
  averageMarginRatio: number;
}

export interface TripProfitabilityResponse {
  summary: TripProfitabilitySummary;
  viewMode: TripProfitabilityViewMode;
  items: TripProfitabilityItem[];
}

export interface TripProfitabilityDetailResponse {
  info: TripProfitabilityItem;
  relatedSpjs?: Array<{
    id: string;
    spjNo: string;
    vehicleCode: string;
    role: 'PARENT' | 'REPLACEMENT';
  }>;
  revenueDetails: Array<{
    source: string;
    description: string;
    amount: string;
  }>;
  costDetails: Array<{
    category: string;
    accountCode: string;
    accountName: string;
    description: string;
    amount: string;
  }>;
  journalEntries: Array<{
    journalId: string;
    journalNo: string;
    journalDate: string;
    sourceType: string;
    description: string;
    totalDebit: string;
    totalCredit: string;
  }>;
}

@Injectable()
export class TripProfitabilityService {
  constructor(
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepo: Repository<VehicleEntity>,
    @InjectRepository(JournalLineEntity)
    private readonly journalLineRepo: Repository<JournalLineEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Menghitung Laporan Margin Kontribusi Perjalanan Bus (Trip Profitability)
   * Mendukung sudut pandang per Armada Bus (BY_BUS) vs per Kelompok Perjalanan Ekonomi (BY_JOURNEY_GROUP).
   */
  async getTripProfitability(
    filter: TripProfitabilityFilterDto,
  ): Promise<TripProfitabilityResponse> {
    const viewMode = filter.viewMode || TripProfitabilityViewMode.BY_JOURNEY_GROUP;

    // Ambil data SPJ dengan relasi terkait
    const spjQb = this.spjRepo
      .createQueryBuilder('spj')
      .leftJoinAndSelect('spj.vehicle', 'vehicle')
      .leftJoinAndSelect('spj.tripSchedule', 'schedule')
      .leftJoinAndSelect('spj.parentSpj', 'parentSpj')
      .leftJoinAndSelect('parentSpj.vehicle', 'parentVehicle')
      .leftJoinAndSelect('spj.replacementSpjs', 'replacementSpjs')
      .leftJoinAndSelect('replacementSpjs.vehicle', 'replacementVehicle')
      .leftJoinAndSelect('spj.crewAssignments', 'crewAssignments')
      .leftJoinAndSelect('crewAssignments.crew', 'crewUser')
      .leftJoinAndSelect('spj.revenueDeclarations', 'revDecl')
      .leftJoinAndSelect('spj.legs', 'legs')
      .orderBy('spj.issuedAt', 'DESC')
      .addOrderBy('spj.createdAt', 'DESC');

    if (filter.startDate) {
      spjQb.andWhere('DATE(COALESCE(schedule.plannedDepartureAt, spj.issuedAt, spj.createdAt)) >= :startDate', {
        startDate: filter.startDate,
      });
    }
    if (filter.endDate) {
      spjQb.andWhere('DATE(COALESCE(schedule.plannedDepartureAt, spj.issuedAt, spj.createdAt)) <= :endDate', {
        endDate: filter.endDate,
      });
    }
    if (filter.serviceType) {
      spjQb.andWhere('spj.serviceType = :svc', { svc: filter.serviceType });
    }
    if (filter.vehicleId) {
      spjQb.andWhere('spj.vehicleId = :vId', { vId: filter.vehicleId });
    }
    if (filter.search) {
      spjQb.andWhere(
        '(spj.spjNo ILIKE :q OR vehicle.code ILIKE :q OR vehicle.plateNumber ILIKE :q OR schedule.origin ILIKE :q OR schedule.destination ILIKE :q)',
        { q: `%${filter.search}%` },
      );
    }

    const spjs = await spjQb.getMany();

    if (spjs.length === 0) {
      return {
        summary: {
          totalTrips: 0,
          totalRevenue: '0.00',
          totalDirectCost: '0.00',
          totalContributionMargin: '0.00',
          averageMarginRatio: 0,
        },
        viewMode,
        items: [],
      };
    }

    const spjIds = spjs.map((s) => s.id);

    // Ambil seluruh journal_lines POSTED yang tertaut ke trip_id
    const journalLinesQuery = `
      SELECT 
        jl.trip_id AS "tripId",
        jl.vehicle_id AS "vehicleId",
        a.code AS "accountCode",
        a.name AS "accountName",
        a.type AS "accountType",
        jl.debit AS "debit",
        jl.credit AS "credit",
        jl.description AS "description"
      FROM journal_lines jl
      INNER JOIN journal_entries j ON j.id = jl.journal_entry_id
      INNER JOIN accounts a ON a.id = jl.account_id
      WHERE j.status = 'POSTED' AND jl.trip_id IN (${spjIds.map((_, idx) => `$${idx + 1}`).join(',')})
    `;

    const lines: Array<{
      tripId: string;
      vehicleId: string;
      accountCode: string;
      accountName: string;
      accountType: string;
      debit: string;
      credit: string;
      description: string;
    }> = await this.dataSource.query(journalLinesQuery, spjIds);

    // Map financial lines per tripId
    const linesByTripId = new Map<string, typeof lines>();
    for (const l of lines) {
      const arr = linesByTripId.get(l.tripId) || [];
      arr.push(l);
      linesByTripId.set(l.tripId, arr);
    }

    if (viewMode === TripProfitabilityViewMode.BY_BUS) {
      // 1. Tampilan Per Bus (Mengisolasi unit fisik individual)
      return this.aggregateByBus(spjs, linesByTripId);
    } else {
      // 2. Tampilan Per Kelompok Perjalanan (Konsolidasi Perjalanan Ekonomi Utuh)
      return this.aggregateByJourneyGroup(spjs, linesByTripId);
    }
  }

  /**
   * Mode 1: BY_BUS
   * Mengisolasi kinerja armada individual (misal SS-01 menanggung biaya kerusakan vs SS-03 penerus).
   */
  private aggregateByBus(
    spjs: SpjEntity[],
    linesByTripId: Map<string, any[]>,
  ): TripProfitabilityResponse {
    const items: TripProfitabilityItem[] = [];

    let totalRev = '0.00';
    let totalCost = '0.00';
    let totalMargin = '0.00';

    for (const spj of spjs) {
      const tripLines = linesByTripId.get(spj.id) || [];
      const costs = this.calculateCostsFromLines(tripLines);
      const revs = this.calculateRevenues(spj, tripLines);

      const margin = MoneyHelper.sub(revs.grossRevenue, costs.totalDirectCost);
      const marginRatio = MoneyHelper.isEqual(revs.grossRevenue, 0)
        ? 0
        : Number(
            (
              (MoneyHelper.toDecimal(margin).toNumber() /
                MoneyHelper.toDecimal(revs.grossRevenue).toNumber()) *
              100
            ).toFixed(2),
          );

      const driverAssignment = spj.crewAssignments?.find((c) => c.role === CrewAssignmentRole.DRIVER);
      const departureDate =
        spj.tripSchedule?.plannedDepartureAt
          ? new Date(spj.tripSchedule.plannedDepartureAt).toISOString().slice(0, 10)
          : spj.issuedAt
            ? spj.issuedAt.toISOString().slice(0, 10)
            : '-';
      const origin = spj.tripSchedule?.origin || spj.legs?.[0]?.origin || 'Jakarta/Ciputat';
      const destination =
        spj.tripSchedule?.destination || spj.legs?.[0]?.destination || 'Yogyakarta';

      const pax = spj.legs?.reduce((acc, curr) => acc + (curr.passengerCount || 0), 0) || 0;

      items.push({
        id: spj.id,
        journeyGroupId: spj.parentSpjId || spj.id,
        spjNo: spj.spjNo,
        parentSpjNo: spj.parentSpj?.spjNo,
        hasReplacement: Boolean(spj.parentSpjId || (spj.replacementSpjs && spj.replacementSpjs.length > 0)),
        serviceType: spj.serviceType,
        departureDate,
        origin,
        destination,
        vehicleCode: spj.vehicle?.code || 'ARMADA',
        vehiclePlate: spj.vehicle?.plateNumber || '-',
        driverName: driverAssignment?.crew?.name || '-',
        paxCount: pax,
        ticketRevenue: revs.ticketRevenue,
        cargoRevenue: revs.cargoRevenue,
        charterRevenue: revs.charterRevenue,
        grossRevenue: revs.grossRevenue,
        fuelCost: costs.fuelCost,
        tollAndParkingCost: costs.tollAndParkingCost,
        mealCouponCost: costs.mealCouponCost,
        crewCost: costs.crewCost,
        agentAndPartnerCost: costs.agentAndPartnerCost,
        incidentalRepairCost: costs.incidentalRepairCost,
        totalDirectCost: costs.totalDirectCost,
        contributionMargin: margin,
        contributionMarginRatio: marginRatio,
        status: spj.financialStatus,
      });

      totalRev = MoneyHelper.add(totalRev, revs.grossRevenue);
      totalCost = MoneyHelper.add(totalCost, costs.totalDirectCost);
      totalMargin = MoneyHelper.add(totalMargin, margin);
    }

    const avgRatio =
      items.length > 0 && !MoneyHelper.isEqual(totalRev, 0)
        ? Number(
            (
              (MoneyHelper.toDecimal(totalMargin).toNumber() /
                MoneyHelper.toDecimal(totalRev).toNumber()) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      summary: {
        totalTrips: items.length,
        totalRevenue: totalRev,
        totalDirectCost: totalCost,
        totalContributionMargin: totalMargin,
        averageMarginRatio: avgRatio,
      },
      viewMode: TripProfitabilityViewMode.BY_BUS,
      items,
    };
  }

  /**
   * Mode 2: BY_JOURNEY_GROUP (Default)
   * Menggabungkan SPJ Induk dan SPJ Pengganti menjadi 1 kelompok perjalanan ekonomi utuh.
   */
  private aggregateByJourneyGroup(
    spjs: SpjEntity[],
    linesByTripId: Map<string, any[]>,
  ): TripProfitabilityResponse {
    // Kelompokkan SPJ berdasarkan parentSpjId || spj.id
    const groupsMap = new Map<string, SpjEntity[]>();

    for (const spj of spjs) {
      const groupKey = spj.parentSpjId || spj.id;
      const list = groupsMap.get(groupKey) || [];
      list.push(spj);
      groupsMap.set(groupKey, list);
    }

    const items: TripProfitabilityItem[] = [];
    let totalRev = '0.00';
    let totalCost = '0.00';
    let totalMargin = '0.00';

    for (const [groupId, groupSpjs] of groupsMap.entries()) {
      // Tentukan SPJ utama (parent) atau yang pertama
      const parentSpj = groupSpjs.find((s) => s.id === groupId) || groupSpjs[0];
      const hasReplacement = groupSpjs.length > 1;

      // Kumpulkan kendaraan yang terlibat
      const vehicleCodes = groupSpjs.map((s) => s.vehicle?.code || 'ARMADA');
      const uniqueVehicles = Array.from(new Set(vehicleCodes)).join(' → ');

      const plates = groupSpjs.map((s) => s.vehicle?.plateNumber || '-');
      const uniquePlates = Array.from(new Set(plates)).join(' / ');

      // Agregasi seluruh baris finansial untuk semua SPJ dalam grup ini
      let gTicketRev = '0.00';
      let gCargoRev = '0.00';
      let gCharterRev = '0.00';
      let gGrossRev = '0.00';

      let gFuel = '0.00';
      let gToll = '0.00';
      let gMealCoupon = '0.00';
      let gCrew = '0.00';
      let gAgent = '0.00';
      let gIncidental = '0.00';
      let gTotalCost = '0.00';
      let gPax = 0;

      for (const spj of groupSpjs) {
        const tripLines = linesByTripId.get(spj.id) || [];
        const costs = this.calculateCostsFromLines(tripLines);
        const revs = this.calculateRevenues(spj, tripLines);

        gTicketRev = MoneyHelper.add(gTicketRev, revs.ticketRevenue);
        gCargoRev = MoneyHelper.add(gCargoRev, revs.cargoRevenue);
        gCharterRev = MoneyHelper.add(gCharterRev, revs.charterRevenue);
        gGrossRev = MoneyHelper.add(gGrossRev, revs.grossRevenue);

        gFuel = MoneyHelper.add(gFuel, costs.fuelCost);
        gToll = MoneyHelper.add(gToll, costs.tollAndParkingCost);
        gMealCoupon = MoneyHelper.add(gMealCoupon, costs.mealCouponCost);
        gCrew = MoneyHelper.add(gCrew, costs.crewCost);
        gAgent = MoneyHelper.add(gAgent, costs.agentAndPartnerCost);
        gIncidental = MoneyHelper.add(gIncidental, costs.incidentalRepairCost);
        gTotalCost = MoneyHelper.add(gTotalCost, costs.totalDirectCost);

        const pax = spj.legs?.reduce((acc, curr) => acc + (curr.passengerCount || 0), 0) || 0;
        gPax += pax;
      }

      const margin = MoneyHelper.sub(gGrossRev, gTotalCost);
      const marginRatio = MoneyHelper.isEqual(gGrossRev, 0)
        ? 0
        : Number(
            (
              (MoneyHelper.toDecimal(margin).toNumber() /
                MoneyHelper.toDecimal(gGrossRev).toNumber()) *
              100
            ).toFixed(2),
          );

      const driverAssignment = parentSpj.crewAssignments?.find((c) => c.role === CrewAssignmentRole.DRIVER);
      const departureDate =
        parentSpj.tripSchedule?.plannedDepartureAt
          ? new Date(parentSpj.tripSchedule.plannedDepartureAt).toISOString().slice(0, 10)
          : parentSpj.issuedAt
            ? parentSpj.issuedAt.toISOString().slice(0, 10)
            : '-';
      const origin =
        parentSpj.tripSchedule?.origin || parentSpj.legs?.[0]?.origin || 'Jakarta/Ciputat';
      const destination =
        parentSpj.tripSchedule?.destination || parentSpj.legs?.[0]?.destination || 'Yogyakarta';

      items.push({
        id: groupId,
        journeyGroupId: groupId,
        spjNo: hasReplacement ? `${parentSpj.spjNo} (Konsolidasi)` : parentSpj.spjNo,
        hasReplacement,
        serviceType: parentSpj.serviceType,
        departureDate,
        origin,
        destination,
        vehicleCode: uniqueVehicles,
        vehiclePlate: uniquePlates,
        driverName: driverAssignment?.crew?.name || '-',
        paxCount: gPax,
        ticketRevenue: gTicketRev,
        cargoRevenue: gCargoRev,
        charterRevenue: gCharterRev,
        grossRevenue: gGrossRev,
        fuelCost: gFuel,
        tollAndParkingCost: gToll,
        mealCouponCost: gMealCoupon,
        crewCost: gCrew,
        agentAndPartnerCost: gAgent,
        incidentalRepairCost: gIncidental,
        totalDirectCost: gTotalCost,
        contributionMargin: margin,
        contributionMarginRatio: marginRatio,
        status: parentSpj.financialStatus,
      });

      totalRev = MoneyHelper.add(totalRev, gGrossRev);
      totalCost = MoneyHelper.add(totalCost, gTotalCost);
      totalMargin = MoneyHelper.add(totalMargin, margin);
    }

    const avgRatio =
      items.length > 0 && !MoneyHelper.isEqual(totalRev, 0)
        ? Number(
            (
              (MoneyHelper.toDecimal(totalMargin).toNumber() /
                MoneyHelper.toDecimal(totalRev).toNumber()) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      summary: {
        totalTrips: items.length,
        totalRevenue: totalRev,
        totalDirectCost: totalCost,
        totalContributionMargin: totalMargin,
        averageMarginRatio: avgRatio,
      },
      viewMode: TripProfitabilityViewMode.BY_JOURNEY_GROUP,
      items,
    };
  }

  /**
   * Mengkalkulasi pendapatan dari deklarasi SPJ dan journal_lines (41101, 42101, 43101)
   */
  private calculateRevenues(
    spj: SpjEntity,
    lines: any[],
  ): {
    ticketRevenue: string;
    cargoRevenue: string;
    charterRevenue: string;
    grossRevenue: string;
  } {
    let ticket = '0.00';
    let cargo = '0.00';
    let charter = '0.00';

    // Cari dari baris jurnal yang terposting
    for (const l of lines) {
      const code = l.accountCode;
      const net = MoneyHelper.sub(l.credit, l.debit);
      if (code === '41101') ticket = MoneyHelper.add(ticket, net);
      else if (code === '42101') charter = MoneyHelper.add(charter, net);
      else if (code === '43101') cargo = MoneyHelper.add(cargo, net);
    }

    // Jika jurnal belum diposting (misal SPJ baru jalan), gunakan deklarasi omzet kru
    if (MoneyHelper.isEqual(ticket, 0) && MoneyHelper.isEqual(charter, 0)) {
      if (spj.revenueDeclarations) {
        for (const rev of spj.revenueDeclarations) {
          if (
            rev.declarationType === SpjRevenueDeclarationType.TICKET_CASH ||
            rev.declarationType === SpjRevenueDeclarationType.AGENT_DEPOSIT
          ) {
            ticket = MoneyHelper.add(ticket, rev.amount);
          } else if (
            rev.declarationType === SpjRevenueDeclarationType.CARGO_MOTORCYCLE ||
            rev.declarationType === SpjRevenueDeclarationType.CARGO_BOX
          ) {
            cargo = MoneyHelper.add(cargo, rev.amount);
          } else if (rev.declarationType === SpjRevenueDeclarationType.CHARTER_CASH) {
            charter = MoneyHelper.add(charter, rev.amount);
          }
        }
      }
    }

    const grossRevenue = MoneyHelper.add(MoneyHelper.add(ticket, cargo), charter);

    return {
      ticketRevenue: ticket,
      cargoRevenue: cargo,
      charterRevenue: charter,
      grossRevenue,
    };
  }

  /**
   * Mengkalkulasi pos beban langsung perjalanan dari baris jurnal POSTED
   */
  private calculateCostsFromLines(lines: any[]): {
    fuelCost: string;
    tollAndParkingCost: string;
    mealCouponCost: string;
    crewCost: string;
    agentAndPartnerCost: string;
    incidentalRepairCost: string;
    totalDirectCost: string;
  } {
    let fuel = '0.00';
    let toll = '0.00';
    let mealCoupon = '0.00';
    let crew = '0.00';
    let agent = '0.00';
    let repair = '0.00';

    for (const l of lines) {
      const code = l.accountCode;
      const net = MoneyHelper.sub(l.debit, l.credit);

      if (code === '51101') fuel = MoneyHelper.add(fuel, net);
      else if (code === '51102') mealCoupon = MoneyHelper.add(mealCoupon, net);
      else if (code.startsWith('521')) toll = MoneyHelper.add(toll, net);
      else if (code.startsWith('531')) crew = MoneyHelper.add(crew, net);
      else if (code.startsWith('541')) agent = MoneyHelper.add(agent, net);
      else if (code.startsWith('551')) repair = MoneyHelper.add(repair, net);
    }

    const totalDirectCost = MoneyHelper.add(
      MoneyHelper.add(
        MoneyHelper.add(fuel, toll),
        MoneyHelper.add(mealCoupon, crew),
      ),
      MoneyHelper.add(agent, repair),
    );

    return {
      fuelCost: fuel,
      tollAndParkingCost: toll,
      mealCouponCost: mealCoupon,
      crewCost: crew,
      agentAndPartnerCost: agent,
      incidentalRepairCost: repair,
      totalDirectCost,
    };
  }

  /**
   * Detail Audit Finansial Lengkap Perjalanan / Kelompok Perjalanan
   */
  async getTripProfitabilityDetail(
    id: string,
    mode: TripProfitabilityViewMode = TripProfitabilityViewMode.BY_JOURNEY_GROUP,
  ): Promise<TripProfitabilityDetailResponse> {
    const mainSpj = await this.spjRepo.findOne({
      where: { id },
      relations: [
        'vehicle',
        'tripSchedule',
        'parentSpj',
        'parentSpj.vehicle',
        'replacementSpjs',
        'replacementSpjs.vehicle',
        'crewAssignments',
        'crewAssignments.crew',
        'revenueDeclarations',
        'legs',
      ],
    });

    if (!mainSpj) {
      throw new NotFoundException(`Data SPJ dengan ID '${id}' tidak ditemukan.`);
    }

    let targetSpjIds: string[] = [mainSpj.id];

    if (mode === TripProfitabilityViewMode.BY_JOURNEY_GROUP) {
      const parentId = mainSpj.parentSpjId || mainSpj.id;
      const allRelated = await this.spjRepo.find({
        where: [{ id: parentId }, { parentSpjId: parentId }],
        relations: ['vehicle'],
      });
      targetSpjIds = allRelated.map((s) => s.id);
    }

    // Ambil baris jurnal & jurnal entries
    const jLines = await this.journalLineRepo
      .createQueryBuilder('jl')
      .innerJoinAndSelect('jl.journalEntry', 'j')
      .innerJoinAndSelect('jl.account', 'a')
      .where('j.status = :st', { st: 'POSTED' })
      .andWhere('jl.tripId IN (:...targetSpjIds)', { targetSpjIds })
      .orderBy('j.journalDate', 'ASC')
      .getMany();

    const revenueDetails: Array<{ source: string; description: string; amount: string }> = [];
    const costDetails: Array<{
      category: string;
      accountCode: string;
      accountName: string;
      description: string;
      amount: string;
    }> = [];

    const journalMap = new Map<string, any>();

    for (const jl of jLines) {
      const entry = jl.journalEntry;
      if (entry && !journalMap.has(entry.id)) {
        journalMap.set(entry.id, {
          journalId: entry.id,
          journalNo: entry.journalNo,
          journalDate: entry.journalDate,
          sourceType: entry.sourceType,
          description: entry.description,
          totalDebit: entry.totalDebit,
          totalCredit: entry.totalCredit,
        });
      }

      const acc = jl.account;
      if (!acc) continue;

      if (acc.type === 'REVENUE') {
        const net = MoneyHelper.sub(jl.credit, jl.debit);
        revenueDetails.push({
          source: acc.name,
          description: jl.description || entry?.description || '-',
          amount: net,
        });
      } else if (acc.type === 'EXPENSE') {
        const net = MoneyHelper.sub(jl.debit, jl.credit);
        let category = 'Biaya Operasional Langsung';
        if (acc.code === '51101') category = 'BBM Solar Armada';
        else if (acc.code === '51102') category = 'Servis Makan Penumpang (RM Mitra)';
        else if (acc.code.startsWith('521')) category = 'Tol & Parkir Perjalanan';
        else if (acc.code.startsWith('531')) category = 'Hak & Uang Makan Kru';
        else if (acc.code.startsWith('541')) category = 'Komisi Agen & Rekanan';
        else if (acc.code.startsWith('551')) category = 'Derek & Perbaikan Bengkel';

        costDetails.push({
          category,
          accountCode: acc.code,
          accountName: acc.name,
          description: jl.description || entry?.description || '-',
          amount: net,
        });
      }
    }

    // Ringkasan info item
    const overview = await this.getTripProfitability({
      viewMode: mode,
      search: mainSpj.spjNo,
    });
    const info = overview.items.find((i) => i.id === id || i.journeyGroupId === id) || overview.items[0];

    const relatedSpjs =
      mainSpj.parentSpj || (mainSpj.replacementSpjs && mainSpj.replacementSpjs.length > 0)
        ? [
            ...(mainSpj.parentSpj
              ? [
                  {
                    id: mainSpj.parentSpj.id,
                    spjNo: mainSpj.parentSpj.spjNo,
                    vehicleCode: mainSpj.parentSpj.vehicle?.code || 'ARMADA',
                    role: 'PARENT' as const,
                  },
                ]
              : []),
            {
              id: mainSpj.id,
              spjNo: mainSpj.spjNo,
              vehicleCode: mainSpj.vehicle?.code || 'ARMADA',
              role: (mainSpj.parentSpjId ? 'REPLACEMENT' : 'PARENT') as 'PARENT' | 'REPLACEMENT',
            },
            ...(mainSpj.replacementSpjs?.map((r) => ({
              id: r.id,
              spjNo: r.spjNo,
              vehicleCode: r.vehicle?.code || 'ARMADA',
              role: 'REPLACEMENT' as const,
            })) || []),
          ]
        : undefined;

    return {
      info,
      relatedSpjs,
      revenueDetails,
      costDetails,
      journalEntries: Array.from(journalMap.values()),
    };
  }
}
