import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VehicleEntity } from '../@models/fleet/vehicle.entity';
import { SpjEntity } from '../@models/trips/spj.entity';
import { SpjOperationalStatus, SpjFinancialStatus } from '../@models/trips/trip.enums';
import { CashAccountEntity } from '../@models/finance/cash-account.entity';
import { BankAccountEntity } from '../@models/finance/bank-account.entity';
import { ArInvoiceEntity } from '../@models/finance/ar-invoice.entity';
import { ApInvoiceEntity } from '../@models/finance/ap-invoice.entity';
import { CrewCashDiscrepancyEntity } from '../@models/cashier/crew-cash-discrepancy.entity';
import { DiscrepancyResolutionStatus } from '../@models/cashier/cashier.enums';
import { CashTransactionEntity } from '../@models/finance/cash-transaction.entity';
import { CashTransactionStatus } from '../@models/finance/finance.enums';
import { MoneyHelper } from '../@common/helpers/money.helper';

export interface DashboardSummaryResponse {
  fleet: {
    total: number;
    activeOnRoute: number;
    standbyPool: number;
    inMaintenance: number;
  };
  trips: {
    inProgress: number;
    pendingCashierSettlement: number;
    completedThisMonth: number;
    totalTripsThisMonth: number;
  };
  cashAndBank: {
    totalLiquidity: string;
    accounts: Array<{
      id: string;
      code: string;
      name: string;
      balance: string;
      type: 'CASH' | 'BANK';
    }>;
  };
  financeAlerts: {
    openArInvoicesAmount: string;
    openArCount: number;
    openApInvoicesAmount: string;
    openApCount: number;
    unresolvedDiscrepancyAmount: string;
    pendingDiscrepancyCount: number;
    pendingPettyCashCount: number;
  };
  recentSpjs: Array<{
    id: string;
    spjNo: string;
    serviceType: string;
    vehicleCode: string;
    vehiclePlate: string;
    driverName: string;
    route: string;
    departureDate: string;
    operationalStatus: string;
    financialStatus: string;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepo: Repository<VehicleEntity>,
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(CashAccountEntity)
    private readonly cashAccountRepo: Repository<CashAccountEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepo: Repository<BankAccountEntity>,
    @InjectRepository(ArInvoiceEntity)
    private readonly arInvoiceRepo: Repository<ArInvoiceEntity>,
    @InjectRepository(ApInvoiceEntity)
    private readonly apInvoiceRepo: Repository<ApInvoiceEntity>,
    @InjectRepository(CrewCashDiscrepancyEntity)
    private readonly discrepancyRepo: Repository<CrewCashDiscrepancyEntity>,
    @InjectRepository(CashTransactionEntity)
    private readonly cashTransactionRepo: Repository<CashTransactionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getSummary(): Promise<DashboardSummaryResponse> {
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // 1. Status Armada Bus
    const totalVehicles = await this.vehicleRepo.count({ where: { isActive: true } });

    // Cari bus yang sedang berjalan di SPJ aktif (operationalStatus = IN_PROGRESS)
    const activeSpjs = await this.spjRepo.find({
      where: { operationalStatus: SpjOperationalStatus.IN_PROGRESS },
      relations: ['vehicle'],
    });
    const activeVehicleIds = new Set(activeSpjs.map((s) => s.vehicleId));
    const activeOnRoute = activeVehicleIds.size;
    const standbyPool = Math.max(0, totalVehicles - activeOnRoute);

    // 2. Operasional SPJ Perjalanan
    const inProgressTrips = activeSpjs.length;
    const pendingSettlementTrips = await this.spjRepo.count({
      where: { financialStatus: SpjFinancialStatus.UNDER_REVIEW },
    });
    const completedThisMonth = await this.spjRepo
      .createQueryBuilder('spj')
      .where('spj.financialStatus = :settled', { settled: SpjFinancialStatus.SETTLED })
      .andWhere('spj.operationallyCompletedAt >= :start', { start: startOfMonth })
      .getCount();

    const totalTripsThisMonth = await this.spjRepo
      .createQueryBuilder('spj')
      .where('spj.createdAt >= :start', { start: startOfMonth })
      .getCount();

    // 3. Posisi Saldo Kas & Bank (Buku Besar GL Terposting)
    const cashAccounts = await this.cashAccountRepo.find({
      where: { isActive: true },
      relations: ['account'],
    });
    const bankAccounts = await this.bankAccountRepo.find({
      where: { isActive: true },
      relations: ['account'],
    });

    const liquidityAccounts: Array<{
      id: string;
      code: string;
      name: string;
      balance: string;
      type: 'CASH' | 'BANK';
    }> = [];

    let totalLiquidity = '0.00';

    for (const c of cashAccounts) {
      let bal = '0.00';
      if (c.accountId) {
        const q = await this.dataSource.query(
          `SELECT COALESCE(SUM(CAST(jl.debit AS numeric)) - SUM(CAST(jl.credit AS numeric)), 0) as balance 
           FROM journal_lines jl INNER JOIN journal_entries j ON j.id = jl.journal_entry_id 
           WHERE j.status = 'POSTED' AND jl.account_id = $1`,
          [c.accountId],
        );
        bal = Number(q[0]?.balance || 0).toFixed(2);
      }
      liquidityAccounts.push({
        id: c.id,
        code: c.code,
        name: c.name,
        balance: bal,
        type: 'CASH',
      });
      totalLiquidity = MoneyHelper.add(totalLiquidity, bal);
    }

    for (const b of bankAccounts) {
      let bal = '0.00';
      if (b.accountId) {
        const q = await this.dataSource.query(
          `SELECT COALESCE(SUM(CAST(jl.debit AS numeric)) - SUM(CAST(jl.credit AS numeric)), 0) as balance 
           FROM journal_lines jl INNER JOIN journal_entries j ON j.id = jl.journal_entry_id 
           WHERE j.status = 'POSTED' AND jl.account_id = $1`,
          [b.accountId],
        );
        bal = Number(q[0]?.balance || 0).toFixed(2);
      }
      liquidityAccounts.push({
        id: b.id,
        code: b.code,
        name: `${b.bankName} (${b.accountNumberMasked || b.accountNumber})`,
        balance: bal,
        type: 'BANK',
      });
      totalLiquidity = MoneyHelper.add(totalLiquidity, bal);
    }

    // 4. Alert Finansial: Piutang AR & Hutang AP
    const openArRaw = await this.arInvoiceRepo
      .createQueryBuilder('ar')
      .select('COUNT(ar.id)', 'count')
      .addSelect('COALESCE(SUM(ar.totalAmount - ar.paidAmount), 0)', 'totalRemaining')
      .where('ar.status NOT IN (:...done)', { done: ['PAID', 'CANCELLED'] })
      .getRawOne();

    const openApRaw = await this.apInvoiceRepo
      .createQueryBuilder('ap')
      .select('COUNT(ap.id)', 'count')
      .addSelect('COALESCE(SUM(ap.totalAmount - ap.paidAmount), 0)', 'totalRemaining')
      .where('ap.status NOT IN (:...done)', { done: ['PAID', 'CANCELLED'] })
      .getRawOne();

    const pendingDiscrepancies = await this.discrepancyRepo.find({
      where: { resolutionStatus: DiscrepancyResolutionStatus.PENDING_INVESTIGATION },
    });
    const discrepancySum = pendingDiscrepancies.reduce(
      (acc, curr) => MoneyHelper.add(acc, curr.differenceAmount || 0),
      '0.00',
    );

    const pendingPettyCashCount = await this.cashTransactionRepo.count({
      where: { status: CashTransactionStatus.SUBMITTED, isActive: true },
    });

    // 5. Daftar SPJ Terbaru (Recent Trips)
    const recentSpjEntities = await this.spjRepo.find({
      relations: ['vehicle', 'tripSchedule', 'crewAssignments', 'crewAssignments.crew', 'legs'],
      order: { createdAt: 'DESC' },
      take: 6,
    });

    const recentSpjs = recentSpjEntities.map((s) => {
      const driver = s.crewAssignments?.find((c) => c.role === 'DRIVER')?.crew?.name || '-';
      const route =
        s.tripSchedule?.origin && s.tripSchedule?.destination
          ? `${s.tripSchedule.origin} → ${s.tripSchedule.destination}`
          : s.legs?.[0]?.origin
            ? `${s.legs[0].origin} → ${s.legs[0].destination}`
            : 'Tangerang/Ciputat → Yogyakarta';

      const depDate = s.tripSchedule?.plannedDepartureAt
        ? new Date(s.tripSchedule.plannedDepartureAt).toISOString().slice(0, 10)
        : s.issuedAt
          ? s.issuedAt.toISOString().slice(0, 10)
          : '-';

      return {
        id: s.id,
        spjNo: s.spjNo,
        serviceType: s.serviceType,
        vehicleCode: s.vehicle?.code || 'ARMADA',
        vehiclePlate: s.vehicle?.plateNumber || '-',
        driverName: driver,
        route,
        departureDate: depDate,
        operationalStatus: s.operationalStatus,
        financialStatus: s.financialStatus,
      };
    });

    return {
      fleet: {
        total: totalVehicles,
        activeOnRoute,
        standbyPool,
        inMaintenance: 0,
      },
      trips: {
        inProgress: inProgressTrips,
        pendingCashierSettlement: pendingSettlementTrips,
        completedThisMonth,
        totalTripsThisMonth,
      },
      cashAndBank: {
        totalLiquidity,
        accounts: liquidityAccounts,
      },
      financeAlerts: {
        openArInvoicesAmount: Number(openArRaw?.totalRemaining || 0).toFixed(2),
        openArCount: parseInt(openArRaw?.count || '0', 10),
        openApInvoicesAmount: Number(openApRaw?.totalRemaining || 0).toFixed(2),
        openApCount: parseInt(openApRaw?.count || '0', 10),
        unresolvedDiscrepancyAmount: discrepancySum,
        pendingDiscrepancyCount: pendingDiscrepancies.length,
        pendingPettyCashCount,
      },
      recentSpjs,
    };
  }
}
