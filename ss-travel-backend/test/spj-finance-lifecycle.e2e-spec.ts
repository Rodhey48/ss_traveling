import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  TripServiceType,
  SpjLegDirection,
  CrewAssignmentRole,
  SpjDisbursementType,
  SpjPaymentMethod,
  SpjExpenseType,
  SpjExpensePaymentSource,
  SpjRevenueDeclarationType,
  SpjFinancialStatus,
} from '../src/@models/trips/trip.enums';
import { CrewCashSettlementStatus } from '../src/@models/cashier/cashier.enums';

describe('SPJ Financial Lifecycle & Income Statement (Laba Rugi) E2E Verification', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  const deviceId = 'test-e2e-device-spj-finance';
  const userAgent = 'Jest-E2E-Agent';

  // Seeded / Test Master Data
  let vehicleId: string;
  let driverId: string;
  let cashAccountId: string;
  let agentId: string;

  // Track created entities for teardown
  const createdSpjIds: string[] = [];
  const createdJournalIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);

    // 1. Login as SUPER_ADMIN
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .send({
        identifier: 'superadmin@sstravel.com',
        password: 'Asd123',
        deviceId,
      })
      .expect(200);

    adminToken = loginRes.body.data.token;

    // 2. Fetch or identify master data from DB
    const vehicles = await dataSource.query(`SELECT id FROM "vehicles" WHERE "code" = 'SS-01' LIMIT 1`);
    vehicleId = vehicles.length > 0 ? vehicles[0].id : (await dataSource.query(`SELECT id FROM "vehicles" LIMIT 1`))[0].id;

    const drivers = await dataSource.query(`SELECT id FROM "users" WHERE "email" = 'driver.budi@sstravel.com' LIMIT 1`);
    driverId = drivers.length > 0 ? drivers[0].id : (await dataSource.query(`SELECT id FROM "users" LIMIT 1`))[0].id;

    const cashAccounts = await dataSource.query(`SELECT id FROM "cash_accounts" LIMIT 1`);
    cashAccountId = cashAccounts[0].id;

    const agents = await dataSource.query(`SELECT id FROM "agents" LIMIT 1`);
    if (agents.length > 0) {
      agentId = agents[0].id;
    } else {
      // Create a test agent if none exists
      const newAgent = await dataSource.query(`
        INSERT INTO "agents" ("id", "name", "code", "agent_type", "settlement_type", "commission_rate", "is_active", "created_at", "updated_at")
        VALUES (gen_random_uuid(), 'Agen Test E2E', 'AGT-E2E-01', 'OFFLINE_COUNTER', 'CASH_TO_CREW', 8.00, true, NOW(), NOW())
        RETURNING id
      `);
      agentId = newAgent[0].id;
    }
  });

  afterAll(async () => {
    try {
      if (createdSpjIds.length > 0) {
        for (const spjId of createdSpjIds) {
          // Find all journals related to this SPJ
          const relatedJournals = await dataSource.query(
            `SELECT DISTINCT journal_entry_id FROM journal_lines WHERE trip_id = $1`,
            [spjId],
          );
          for (const rj of relatedJournals) {
            createdJournalIds.push(rj.journal_entry_id);
          }

          // Clean up child tables
          await dataSource.query(`DELETE FROM "crew_cash_remittance_allocations" WHERE remittance_id IN (SELECT id FROM "crew_cash_remittances" WHERE spj_id = $1)`, [spjId]);
          await dataSource.query(`DELETE FROM "crew_cash_remittances" WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM "crew_cash_discrepancies" WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM "crew_cash_settlements" WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM "crew_meal_payments" WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM "spj_revenue_declarations" WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM "spj_uj_expenses" WHERE spj_uj_id IN (SELECT id FROM "spj_uj" WHERE spj_id = $1)`, [spjId]);
          await dataSource.query(`DELETE FROM "spj_expenses" WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM "spj_uj_returns" WHERE spj_uj_id IN (SELECT id FROM "spj_uj" WHERE spj_id = $1)`, [spjId]);
          await dataSource.query(`DELETE FROM "spj_uj_disbursements" WHERE spj_uj_id IN (SELECT id FROM "spj_uj" WHERE spj_id = $1)`, [spjId]);
          await dataSource.query(`DELETE FROM "spj_uj" WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM "spj_crew_assignments" WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM "spj_legs" WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM "spjs" WHERE id = $1`, [spjId]);
        }
      }

      if (createdJournalIds.length > 0) {
        for (const jId of createdJournalIds) {
          await dataSource.query(`DELETE FROM "accounting_events" WHERE journal_entry_id = $1`, [jId]);
          await dataSource.query(`DELETE FROM "journal_lines" WHERE journal_entry_id = $1`, [jId]);
          await dataSource.query(`DELETE FROM "journal_entries" WHERE id = $1`, [jId]);
        }
      }
    } catch (err) {
      console.warn('Teardown warning:', err);
    } finally {
      await app.close();
    }
  });

  describe('Skenario 1: Full SPJ Lifecycle, Cashier Settlement, and P&L (Laba Rugi) Verification', () => {
    let spjId: string;
    let spjNo: string;
    let driverAssignmentId: string;
    let directTicketRevId: string;
    let kargoMotorRevId: string;
    let kargoBoxRevId: string;
    let agentTicketRevId: string;

    it('Step 1: Harus berhasil membuat SPJ AKAP baru dengan 2 Rute (Legs) dan Penugasan Driver', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/spjs')
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serviceType: TripServiceType.AKAP,
          vehicleId,
          notes: 'Uji Coba E2E Finansial SPJ & Laba Rugi',
          legs: [
            {
              sequenceNo: 1,
              direction: SpjLegDirection.DEPARTURE,
              origin: 'Pool Ciputat / Jakarta',
              destination: 'Terminal Giwangan Yogyakarta',
              passengerCount: 20,
            },
            {
              sequenceNo: 2,
              direction: SpjLegDirection.RETURN,
              origin: 'Terminal Giwangan Yogyakarta',
              destination: 'Pool Ciputat / Jakarta',
              passengerCount: 22,
            },
          ],
          crewAssignments: [
            {
              crewId: driverId,
              role: CrewAssignmentRole.DRIVER,
              mealAllowanceSnapshot: 400000,
              incentiveSnapshot: 300000,
              fullSeatBonusSnapshot: 150000,
              payoutTiming: 'AT_SETTLEMENT',
            },
          ],
        })
        .expect(201);

      expect(res.body.status).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.spjNo).toBeDefined();

      spjId = res.body.data.id;
      spjNo = res.body.data.spjNo;
      createdSpjIds.push(spjId);

      expect(res.body.data.crewAssignments.length).toBeGreaterThan(0);
      driverAssignmentId = res.body.data.crewAssignments[0].id;
    });

    it('Step 2 & 3: Harus berhasil menerbitkan (ISSUE) dan memberangkatkan (START) SPJ', async () => {
      // 2. Issue
      const issueRes = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/issue`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(issueRes.body.data.operationalStatus).toBe('ISSUED');

      // 3. Start
      const startRes = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/start`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(startRes.body.data.operationalStatus).toBe('IN_PROGRESS');
    });

    it('Step 4: Harus berhasil mencairkan UJ awal sebesar Rp 3.500.000 ke amplop kru', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/uj/disburse`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          disbursementType: SpjDisbursementType.INITIAL,
          amount: '3500000.00',
          paymentMethod: SpjPaymentMethod.CASH,
          cashAccountId,
          crewAssignmentId: driverAssignmentId,
          receiptRef: 'BKK/E2E/001',
          notes: 'Pencairan dana UJ Awal',
        })
        .expect(201);

      expect(res.body.status).toBe(true);
      expect(res.body.data.totalDisbursed).toBe('3500000.00');
      expect(res.body.data.balance).toBe('3500000.00');
    });

    it('Step 5: Harus mencatat pengeluaran operasional di jalan (BBM Rp 1.6jt, Tol Rp 900rb, Cuci Rp 100rb)', async () => {
      // 5.1 Solar BBM Rp 1.600.000
      const exp1 = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/expenses`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expenseType: SpjExpenseType.FUEL,
          amount: '1600000.00',
          paymentSource: SpjExpensePaymentSource.UJ,
          fuelLiters: '235.30',
          odometerKm: 135200,
          notes: 'Solar Tol Palikanci',
        })
        .expect(201);
      expect(exp1.body.status).toBe(true);

      // 5.2 Tol Trans Jawa Rp 900.000
      const exp2 = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/expenses`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expenseType: SpjExpenseType.TOLL,
          amount: '900000.00',
          paymentSource: SpjExpensePaymentSource.UJ,
          notes: 'Top up E-toll Mandiri',
        })
        .expect(201);
      expect(exp2.body.status).toBe(true);

      // 5.3 Cuci Bus Rp 100.000
      const exp3 = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/expenses`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expenseType: SpjExpenseType.PARKING,
          amount: '100000.00',
          paymentSource: SpjExpensePaymentSource.UJ,
          notes: 'Cuci bus di Giwangan',
        })
        .expect(201);
      expect(exp3.body.status).toBe(true);

      // Cek amplop UJ (Total Spent = 2.600.000, Sisa = 900.000)
      const ujRes = await request(app.getHttpServer())
        .get(`/api/v1/spjs/${spjId}/uj`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(ujRes.body.data.totalSpent).toBe('2600000.00');
      expect(ujRes.body.data.balance).toBe('900000.00');
    });

    it('Step 6: Harus mengembalikan sisa UJ Rp 900.000 dan membuat status UJ BALANCED (Nol)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/uj/return`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: '900000.00',
          paymentMethod: SpjPaymentMethod.CASH,
          cashAccountId,
          receiptRef: 'BKM/E2E/001',
          notes: 'Pengembalian sisa UJ ke meja kasir',
        })
        .expect(201);

      expect(res.body.data.totalReturned).toBe('900000.00');
      expect(res.body.data.balance).toBe('0.00');
      expect(res.body.data.status).toBe('BALANCED');
    });

    it('Step 7: Harus mendeklarasikan pendapatan (Tiket Tunai 1jt, Kargo Motor 350rb, Kargo Box 100rb, Tiket Agen 2jt)', async () => {
      // 7.1 Tiket Tunai Langsung Kru Rp 1.000.000
      const rev1 = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/revenues`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          declarationType: SpjRevenueDeclarationType.TICKET_CASH,
          amount: '1000000.00',
          sourceReference: 'TKT-DIRECT-001',
          notes: '4 penumpang naik langsung di Ciputat',
        })
        .expect(201);
      directTicketRevId = rev1.body.data.id;

      // 7.2 Kargo Motor Rp 350.000 (Komisi kru 20% = Rp 70.000)
      const rev2 = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/revenues`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          declarationType: SpjRevenueDeclarationType.CARGO_MOTORCYCLE,
          amount: '350000.00',
          crewCommissionPercentage: '20.00',
          sourceReference: 'RESI-MTR-001',
          cargoSenderName: 'Pak Anton',
          cargoReceiverName: 'Bu Dian',
        })
        .expect(201);
      kargoMotorRevId = rev2.body.data.id;
      expect(rev2.body.data.crewCommissionAmount).toBe('70000.00');

      // 7.3 Kargo Box Rp 100.000 (Komisi kru 20% = Rp 20.000)
      const rev3 = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/revenues`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          declarationType: SpjRevenueDeclarationType.CARGO_BOX,
          amount: '100000.00',
          crewCommissionPercentage: '20.00',
          sourceReference: 'RESI-BOX-001',
        })
        .expect(201);
      kargoBoxRevId = rev3.body.data.id;
      expect(rev3.body.data.crewCommissionAmount).toBe('20000.00');

      // 7.4 Tiket Agen Rp 2.000.000 (Komisi Agen Rp 160.000, Uang dipegang kru)
      const rev4 = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/revenues`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          declarationType: SpjRevenueDeclarationType.TICKET_AGENT,
          amount: '2000000.00',
          agentId,
          ticketCount: 8,
          agentCommissionAmount: '160000.00',
          settlementType: 'CASH_TO_CREW',
          notes: '8 tiket loket agen terminal',
        })
        .expect(201);
      agentTicketRevId = rev4.body.data.id;
      expect(rev4.body.data.journalId).toBeDefined(); // Jurnal penjualan agen otomatis terposting
    });

    it('Step 8: Harus mencatat hak kompensasi kru (Uang Makan Rp 400rb & Klaim Full Seat Bonus Rp 150rb)', async () => {
      // 8.1 Driver Meal Rp 400.000
      const meal = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/crew-payments`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          crewAssignmentId: driverAssignmentId,
          crewId: driverId,
          paymentCategory: 'MEAL_ALLOWANCE',
          amount: '400000.00',
          payoutTiming: 'AT_SETTLEMENT',
          notes: 'Uang makan driver PP',
        })
        .expect(201);
      expect(meal.body.status).toBe(true);

      // 8.2 Full Seat Bonus Rp 150.000
      const bonus = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/crew-payments/full-seat-bonus`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          crewAssignmentIds: [driverAssignmentId],
          bonusAmountPerPerson: '150000.00',
          notes: 'Bonus Okupansi 100% Arus Balik',
        })
        .expect(201);
      expect(bonus.body.status).toBe(true);
    });

    it('Step 9: Kepulangan bus di garasi & status SPJ COMPLETED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/spjs/${spjId}/complete`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(res.body.data.operationalStatus).toBe('COMPLETED');
      expect(res.body.data.financialStatus).toBe(SpjFinancialStatus.UNDER_REVIEW);
    });

    it('Step 10: Harus menghitung kalkulasi Dua Kantong Kas Kru (Anti-Netting) secara tepat', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/cashier/spjs/${spjId}/summary`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const summary = res.body.data;

      // Kantong 1: UJ
      expect(summary.kantong1Uj.totalDisbursed).toBe(3500000);
      expect(summary.kantong1Uj.totalSpent).toBe(2600000);
      expect(summary.kantong1Uj.totalReturned).toBe(900000);
      expect(summary.kantong1Uj.balance).toBe(0);
      expect(summary.kantong1Uj.status).toBe('BALANCED');

      // Kantong 2: Revenue
      // Tiket tunai: 1jt, Kargo: 350k + 100k = 450k, Agen: 2jt => Total expected = 3.450.000
      expect(summary.kantong2Revenue.totalExpected).toBe(3450000);

      // Posisi Kas Meja Kasir:
      // Uang fisik masuk = Sisa UJ (900rb)
      expect(summary.cashDesk.totalCashReceived).toBe(900000);
      // Hak kru pending = Uang makan (400rb) + Full seat (150rb) + Komisi kargo (70rb + 20rb = 90rb) = 640.000
      expect(summary.cashDesk.totalCrewCompensationPayable).toBe(640000);
    });

    it('Step 11: Proses Settlement Kasir Meja Pool (Anti-Netting) & Otomasi Jurnal Rekonsiliasi Terposting Seimbang', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cashier/settlements')
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          spjId,
          cashAccountId,
          cashPaidToCrew: true,
          notes: 'Settlement Kasir Pool E2E Test Seimbang',
          remittances: [
            {
              spjId,
              depositorCrewId: driverId,
              amount: 3450000,
              cashAccountId,
              paymentMethod: 'CASH',
              notes: 'Setoran penuh tiket & kargo kru',
              allocations: [
                { revenueDeclarationId: directTicketRevId, allocatedAmount: 1000000 },
                { revenueDeclarationId: kargoMotorRevId, allocatedAmount: 350000 },
                { revenueDeclarationId: kargoBoxRevId, allocatedAmount: 100000 },
                { revenueDeclarationId: agentTicketRevId, allocatedAmount: 2000000 },
              ],
            },
          ],
        })
        .expect(201);

      expect(res.body.status).toBe(true);
      const settlement = res.body.data;

      expect(settlement.status).toBe(CrewCashSettlementStatus.VERIFIED);
      expect(settlement.ujStatus).toBe('BALANCED');
      expect(settlement.revenueStatus).toBe('MATCHED');
      expect(settlement.bkmNo).toBeDefined();
      expect(settlement.bkkNo).toBeDefined();
      expect(settlement.journalEntryId).toBeDefined();

      // Kas diterima = 900rb (sisa UJ) + 3.45jt (setoran) = 4.350.000
      expect(Number(settlement.totalCashReceived)).toBe(4350000);
      // Kas dibayar = 640.000 (makan 400k + bonus 150k + komisi kargo 90k)
      expect(Number(settlement.totalCashPaid)).toBe(640000);

      // Verifikasi Jurnal Rekonsiliasi di Database
      const journalEntry = await dataSource.query(
        `SELECT * FROM "journal_entries" WHERE "id" = $1`,
        [settlement.journalEntryId],
      );
      expect(journalEntry.length).toBe(1);
      expect(journalEntry[0].status).toBe('POSTED');

      const lines = await dataSource.query(
        `SELECT jl.*, a.code as "accountCode" FROM "journal_lines" jl INNER JOIN "accounts" a ON a.id = jl.account_id WHERE jl.journal_entry_id = $1`,
        [settlement.journalEntryId],
      );

      // Total Debit harus sama persis dengan Total Kredit
      const totalDebit = lines.reduce((acc: number, l: any) => acc + Number(l.debit), 0);
      const totalCredit = lines.reduce((acc: number, l: any) => acc + Number(l.credit), 0);

      expect(totalDebit).toBe(totalCredit);
      expect(totalDebit).toBe(6950000); // 3.71m (kas pool net) + 1.6m (bbm) + 900k (tol) + 100k (cuci) + 640k (kru) = 6.950.000

      // Verifikasi status SPJ menjadi SETTLED
      const updatedSpj = await dataSource.query(`SELECT * FROM "spjs" WHERE "id" = $1`, [spjId]);
      expect(updatedSpj[0].financial_status).toBe('SETTLED');
    });

    it('Step 12: Verifikasi Audit Margin Kontribusi Perjalanan (Trip Profitability API)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/reports/trip-profitability?search=${spjNo}`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);

      const trip = res.body.data.items.find((i: any) => i.spjNo.includes(spjNo));
      expect(trip).toBeDefined();

      // Omzet Bruto = 3.450.000 (Tiket 3.000.000 + Kargo 450.000)
      expect(Number(trip.grossRevenue)).toBe(3450000);
      expect(Number(trip.ticketRevenue)).toBe(3000000);
      expect(Number(trip.cargoRevenue)).toBe(450000);

      // Biaya Langsung
      expect(Number(trip.fuelCost)).toBe(1600000);
      expect(Number(trip.tollAndParkingCost)).toBe(1000000); // Tol 900k + Cuci/Parkir 100k
      expect(Number(trip.crewCost)).toBe(640000); // Makan 400k + Bonus 150k + Komisi Kargo 90k
      expect(Number(trip.agentAndPartnerCost)).toBe(160000); // Komisi Agen Tiket

      // Total Biaya Langsung = 1.6m + 1.0m + 640k + 160k = 3.400.000
      expect(Number(trip.totalDirectCost)).toBe(3400000);

      // Margin Kontribusi = 3.450.000 - 3.400.000 = Rp 50.000
      expect(Number(trip.contributionMargin)).toBe(50000);
      expect(trip.contributionMarginRatio).toBeGreaterThan(0);

      // Cost center
      expect(trip.costCenterCode).toBe('CC-OPS-AKAP');
    });

    it('Step 13: Verifikasi Laporan Laba Rugi Komprehensif (Income Statement / P&L API)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/reports/income-statement')
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe(true);
      const pnl = res.body.data;

      expect(Number(pnl.revenues.totalRevenue)).toBeGreaterThanOrEqual(3450000);
      expect(Number(pnl.expenses.directCosts)).toBeGreaterThanOrEqual(3400000);

      // Validasi formula Laba Rugi:
      // Gross Profit = Total Revenue - Direct Costs
      const expectedGrossProfit = Number(pnl.revenues.totalRevenue) - Number(pnl.expenses.directCosts);
      expect(Math.abs(Number(pnl.grossProfit) - expectedGrossProfit)).toBeLessThanOrEqual(0.01);

      // Net Income = Total Revenue - Total Expense
      const expectedNetIncome = Number(pnl.revenues.totalRevenue) - Number(pnl.expenses.totalExpense);
      expect(Math.abs(Number(pnl.netIncome) - expectedNetIncome)).toBeLessThanOrEqual(0.01);
    });
  });

  describe('Edge-Case Test: Kas Meja Kasir Bernilai Negatif (netCashDesk < 0)', () => {
    let edgeSpjId: string;
    let edgeDriverAssignmentId: string;

    it('Harus berhasil memproses settlement saat kasir membayar hak kru lebih besar daripada kas diterima tanpa error jurnal tidak seimbang', async () => {
      // 1. Buat SPJ baru
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/spjs')
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serviceType: TripServiceType.AKAP,
          vehicleId,
          notes: 'Uji Edge Case netCashDesk < 0',
          legs: [
            {
              sequenceNo: 1,
              direction: SpjLegDirection.DEPARTURE,
              origin: 'Pool Ciputat',
              destination: 'Yogyakarta',
              passengerCount: 15,
            },
          ],
          crewAssignments: [
            {
              crewId: driverId,
              role: CrewAssignmentRole.DRIVER,
              mealAllowanceSnapshot: 400000,
              payoutTiming: 'AT_SETTLEMENT',
            },
          ],
        })
        .expect(201);

      edgeSpjId = createRes.body.data.id;
      createdSpjIds.push(edgeSpjId);
      edgeDriverAssignmentId = createRes.body.data.crewAssignments[0].id;

      // 2. Issue & Start
      await request(app.getHttpServer())
        .post(`/api/v1/spjs/${edgeSpjId}/issue`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/spjs/${edgeSpjId}/start`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      // 3. Cairkan UJ Rp 2.000.000
      await request(app.getHttpServer())
        .post(`/api/v1/spjs/${edgeSpjId}/uj/disburse`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          disbursementType: SpjDisbursementType.INITIAL,
          amount: '2000000.00',
          paymentMethod: SpjPaymentMethod.CASH,
          cashAccountId,
          crewAssignmentId: edgeDriverAssignmentId,
        })
        .expect(201);

      // 4. Habiskan seluruh UJ untuk BBM Rp 2.000.000 (Sisa UJ = 0)
      await request(app.getHttpServer())
        .post(`/api/v1/spjs/${edgeSpjId}/expenses`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expenseType: SpjExpenseType.FUEL,
          amount: '2000000.00',
          paymentSource: SpjExpensePaymentSource.UJ,
        })
        .expect(201);

      // 5. Kembalikan Rp 0 (karena sisa 0, amplop balance)
      const ujRes = await request(app.getHttpServer())
        .get(`/api/v1/spjs/${edgeSpjId}/uj`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(ujRes.body.data.balance).toBe('0.00');

      // 6. Kru tidak memegang tiket tunai (semua tiket online OTA), tapi kasir membayar Uang Makan Kru Rp 400.000
      await request(app.getHttpServer())
        .post(`/api/v1/spjs/${edgeSpjId}/crew-payments`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          crewAssignmentId: edgeDriverAssignmentId,
          crewId: driverId,
          paymentCategory: 'MEAL_ALLOWANCE',
          amount: '400000.00',
          payoutTiming: 'AT_SETTLEMENT',
        })
        .expect(201);

      // 7. Complete SPJ
      await request(app.getHttpServer())
        .post(`/api/v1/spjs/${edgeSpjId}/complete`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      // 8. Cek summary: totalCashReceived = 0, totalCrewCompensationPayable = 400.000 => netCashPosition = -400.000
      const summaryRes = await request(app.getHttpServer())
        .get(`/api/v1/cashier/spjs/${edgeSpjId}/summary`)
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(summaryRes.body.data.cashDesk.totalCashReceived).toBe(0);
      expect(summaryRes.body.data.cashDesk.totalCrewCompensationPayable).toBe(400000);
      expect(summaryRes.body.data.cashDesk.netCashPosition).toBe(-400000);

      // 9. Jalankan settlement dengan cashPaidToCrew: true.
      // SEBELUM PERBAIKAN: ini akan crash dengan BadRequestException: Jurnal tidak seimbang!
      // SETELAH PERBAIKAN: kasir mengkredit akun 11101 Kas Pool sebesar Rp 400.000 sehingga jurnal seimbang!
      const settleRes = await request(app.getHttpServer())
        .post('/api/v1/cashier/settlements')
        .set('x-device-id', deviceId)
        .set('User-Agent', userAgent)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          spjId: edgeSpjId,
          cashAccountId,
          cashPaidToCrew: true,
          notes: 'Settlement Uji Edge Case Net Kas Meja Negatif',
        })
        .expect(201);

      expect(settleRes.body.status).toBe(true);
      expect(settleRes.body.data.status).toBe(CrewCashSettlementStatus.VERIFIED);
      expect(settleRes.body.data.journalEntryId).toBeDefined();

      // Verifikasi baris jurnal di database
      const edgeLines = await dataSource.query(
        `SELECT jl.*, a.code as "accountCode" FROM "journal_lines" jl INNER JOIN "accounts" a ON a.id = jl.account_id WHERE jl.journal_entry_id = $1`,
        [settleRes.body.data.journalEntryId],
      );

      const totalDebit = edgeLines.reduce((acc: number, l: any) => acc + Number(l.debit), 0);
      const totalCredit = edgeLines.reduce((acc: number, l: any) => acc + Number(l.credit), 0);

      expect(totalDebit).toBe(totalCredit);
      expect(totalDebit).toBe(2400000); // 2.0m (BBM) + 400k (Makan Kru) = 2.400.000

      // Pastikan ada baris kredit Kas Pool (11101) sebesar Rp 400.000
      const kasPoolCreditLine = edgeLines.find(
        (l: any) => l.accountCode === '11101' && Number(l.credit) === 400000,
      );
      expect(kasPoolCreditLine).toBeDefined();
    });
  });
});
