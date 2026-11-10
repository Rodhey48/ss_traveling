import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  TripServiceType,
  CrewAssignmentRole,
  SpjDisbursementType,
  SpjPaymentMethod,
  SpjExpenseType,
  SpjExpensePaymentSource,
  SpjFinancialStatus,
  SpjOperationalStatus,
  SpjLegDirection,
} from '../src/@models/trips/trip.enums';
import { CrewCashSettlementStatus } from '../src/@models/cashier/cashier.enums';
import { FinancePaymentMethod, ArInvoiceStatus } from '../src/@models/finance/finance.enums';

describe('SPJ Wisata (Charter Multi-Day) Lifecycle & P&L E2E Verification (Skenario 2)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  const deviceId = 'test-e2e-device-spj-wisata';
  const userAgent = 'Jest-E2E-Wisata-Agent';

  // Seeded / Master Data
  let vehicleId: string;
  let driver1Id: string;
  let driver2Id: string;
  let bankAccountId: string;
  let cashAccountId: string;
  let customerId: string;
  let customerName: string;

  // Track entities for teardown
  const createdSpjIds: string[] = [];
  const createdJournalIds: string[] = [];
  const createdInvoiceIds: string[] = [];
  const createdReceiptIds: string[] = [];

  const reqHelper = (method: 'get' | 'post' | 'patch' | 'put' | 'delete', url: string) => {
    return (request(app.getHttpServer()) as any)[method](url)
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${adminToken}`);
  };

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

    // 2. Query Master Data
    const vehicles = await dataSource.query(`SELECT id FROM "vehicles" WHERE "code" = 'SS-02' LIMIT 1`);
    vehicleId = vehicles.length > 0 ? vehicles[0].id : (await dataSource.query(`SELECT id FROM "vehicles" LIMIT 1`))[0].id;

    const drivers = await dataSource.query(`SELECT id FROM "users" WHERE "email" ILIKE '%driver%' LIMIT 2`);
    if (drivers.length >= 2) {
      driver1Id = drivers[0].id;
      driver2Id = drivers[1].id;
    } else {
      const allUsers = await dataSource.query(`SELECT id FROM "users" LIMIT 2`);
      driver1Id = allUsers[0].id;
      driver2Id = allUsers[1]?.id || allUsers[0].id;
    }

    const bankAccounts = await dataSource.query(`SELECT id FROM "bank_accounts" WHERE "bank_name" ILIKE '%BCA%' LIMIT 1`);
    bankAccountId = bankAccounts.length > 0 ? bankAccounts[0].id : (await dataSource.query(`SELECT id FROM "bank_accounts" LIMIT 1`))[0].id;

    const cashAccounts = await dataSource.query(`SELECT id FROM "cash_accounts" LIMIT 1`);
    cashAccountId = cashAccounts[0].id;

    const customers = await dataSource.query(`SELECT id, institution_name, pic_name FROM "customers" LIMIT 1`);
    if (customers.length > 0) {
      customerId = customers[0].id;
      customerName = customers[0].institution_name || customers[0].pic_name || 'PT Mitra Sejahtera Abadi';
    } else {
      const newCust = await dataSource.query(`
        INSERT INTO "customers" ("id", "code", "institution_name", "pic_name", "phone", "email", "customer_type", "is_active", "created_at", "updated_at")
        VALUES (gen_random_uuid(), 'CUST-E2E-WISATA', 'PT Mitra Sejahtera Abadi', 'Bpk Hendra PIC', '08123456789', 'finance@mitrasejahtera.co.id', 'CORPORATE', true, NOW(), NOW())
        RETURNING id, institution_name
      `);
      customerId = newCust[0].id;
      customerName = newCust[0].institution_name;
    }
  });

  afterAll(async () => {
    try {
      if (createdSpjIds.length > 0) {
        for (const spjId of createdSpjIds) {
          const relatedJournals = await dataSource.query(
            `SELECT DISTINCT journal_entry_id FROM journal_lines WHERE trip_id = $1`,
            [spjId],
          );
          for (const j of relatedJournals) {
            createdJournalIds.push(j.journal_entry_id);
          }

          await dataSource.query(`DELETE FROM crew_cash_discrepancies WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM crew_cash_remittance_allocations WHERE remittance_id IN (SELECT id FROM crew_cash_remittances WHERE spj_id = $1)`, [spjId]);
          await dataSource.query(`DELETE FROM crew_cash_remittances WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM crew_cash_settlements WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM crew_meal_payments WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM spj_revenue_declarations WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM spj_expenses WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM spj_uj_returns WHERE spj_uj_id IN (SELECT id FROM spj_uj WHERE spj_id = $1)`, [spjId]);
          await dataSource.query(`DELETE FROM spj_uj_expenses WHERE spj_uj_id IN (SELECT id FROM spj_uj WHERE spj_id = $1)`, [spjId]);
          await dataSource.query(`DELETE FROM spj_uj_disbursements WHERE spj_uj_id IN (SELECT id FROM spj_uj WHERE spj_id = $1)`, [spjId]);
          await dataSource.query(`DELETE FROM spj_uj WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM spj_crew_assignments WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM spj_legs WHERE spj_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM ar_allocations WHERE receipt_id IN (SELECT id FROM ar_receipts WHERE down_payment_trip_id = $1)`, [spjId]);
          await dataSource.query(`DELETE FROM ar_invoice_lines WHERE trip_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM ar_invoices WHERE trip_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM ar_receipts WHERE down_payment_trip_id = $1`, [spjId]);
          await dataSource.query(`DELETE FROM spjs WHERE id = $1`, [spjId]);
        }
      }

      if (createdReceiptIds.length > 0) {
        for (const rId of createdReceiptIds) {
          await dataSource.query(`DELETE FROM ar_allocations WHERE receipt_id = $1`, [rId]);
          await dataSource.query(`DELETE FROM ar_receipts WHERE id = $1`, [rId]);
        }
      }

      if (createdInvoiceIds.length > 0) {
        for (const iId of createdInvoiceIds) {
          await dataSource.query(`DELETE FROM ar_invoice_lines WHERE invoice_id = $1`, [iId]);
          await dataSource.query(`DELETE FROM ar_invoices WHERE id = $1`, [iId]);
        }
      }

      if (createdJournalIds.length > 0) {
        const uniqueJournals = [...new Set(createdJournalIds)];
        for (const jId of uniqueJournals) {
          await dataSource.query(`DELETE FROM journal_lines WHERE journal_entry_id = $1`, [jId]);
          await dataSource.query(`DELETE FROM journal_entries WHERE id = $1`, [jId]);
        }
      }
    } catch (e) {
      console.warn('Wisata Cleanup error (ignored):', e.message);
    } finally {
      await app.close();
    }
  });

  // =========================================================================
  // SKENARIO 2 FULL E2E TEST: SEWA BUS PARIWISATA / CHARTER MULTI-DAY
  // =========================================================================
  let spjId: string;
  let spjNo: string;
  let dpReceiptId: string;
  let pelunasanInvoiceId: string;
  let driver1PaymentId: string;
  let driver2PaymentId: string;

  it('Tahap 1: Dispatcher Menerbitkan SPJ Wisata 5 Hari & Snapshot Tarif Kru Harian (PER_DAY)', async () => {
    const spjPayload = {
      serviceType: TripServiceType.WISATA,
      vehicleId,
      notes: 'Tour Pariwisata 5 Hari Solo - Yogya - Candi Borobudur',
      crewAssignments: [
        {
          crewId: driver1Id,
          role: CrewAssignmentRole.DRIVER,
          mealAllowanceSnapshot: 500000, // 5 hari x 100rb
          incentiveSnapshot: 750000,     // 5 hari x 150rb
          notes: 'Driver Utama [EARLY_DISBURSEMENT]',
        },
        {
          crewId: driver2Id,
          role: CrewAssignmentRole.DRIVER,
          mealAllowanceSnapshot: 500000, // 5 hari x 100rb
          incentiveSnapshot: 750000,     // 5 hari x 150rb
          notes: 'Driver Cadangan [EARLY_DISBURSEMENT]',
        },
      ],
      legs: [
        {
          sequenceNo: 1,
          direction: SpjLegDirection.DEPARTURE,
          origin: 'Pool Ciputat Tangerang',
          destination: 'Solo & Yogyakarta PP',
          departureAt: '2026-10-18T06:00:00.000Z',
          arrivalAt: '2026-10-22T20:00:00.000Z',
          passengerCount: 30,
        },
      ],
    };

    const res = await reqHelper('post', '/api/v1/spjs')
      .send(spjPayload)
      .expect(201);

    expect(res.body.status).toBe(true);
    expect(res.body.data).toBeDefined();
    spjId = res.body.data.id;
    spjNo = res.body.data.spjNo;
    createdSpjIds.push(spjId);

    expect(spjNo).toMatch(/^SPJ\/WIS\//);
    expect(res.body.data.serviceType).toBe(TripServiceType.WISATA);
    expect(res.body.data.financialStatus).toBe(SpjFinancialStatus.PENDING_SETTLEMENT);

    // Sync baris kompensasi kru
    const syncRes = await reqHelper('post', `/api/v1/spjs/${spjId}/crew-payments/sync`)
      .expect(201);

    expect(syncRes.body.status).toBe(true);
    expect(syncRes.body.data.length).toBe(4); // 2 meal + 2 incentive

    const incentives = syncRes.body.data.filter((p: any) => p.paymentCategory === 'TRIP_INCENTIVE');
    expect(incentives.length).toBe(2);
    driver1PaymentId = incentives[0].id;
    driver2PaymentId = incentives[1].id;

    // Issue SPJ
    const issueRes = await reqHelper('post', `/api/v1/spjs/${spjId}/issue`)
      .expect(201);
    expect(issueRes.body.data.operationalStatus).toBe(SpjOperationalStatus.ISSUED);
  });

  it('Tahap 2: Klien Menyetor Uang Muka (DP) 30% Rp 5.250.000 via Transfer Bank BCA (Jurnal #1)', async () => {
    const dpPayload = {
      customerId,
      customerName,
      receiptDate: '2026-10-15',
      paymentMethod: FinancePaymentMethod.BANK_TRANSFER,
      bankAccountId,
      amount: 5250000,
      downPaymentTripId: spjId,
      reference: 'TRF-BCA-DP-MITRA',
      notes: 'DP 30% Sewa Bus Pariwisata SS-02 5 Hari Solo-Yogya',
    };

    const res = await reqHelper('post', '/api/v1/ar/down-payment')
      .send(dpPayload)
      .expect(201);

    expect(res.body.status).toBe(true);
    dpReceiptId = res.body.data.id;
    createdReceiptIds.push(dpReceiptId);
    expect(res.body.data.journalEntryId).toBeDefined();
    createdJournalIds.push(res.body.data.journalEntryId);

    // Verifikasi Jurnal DP: (D) 11104 Bank BCA 5.250.000, (K) 24101 DP 5.250.000
    const journalRes = await reqHelper('get', `/api/v1/journals/${res.body.data.journalEntryId}`)
      .expect(200);

    const journal = journalRes.body.data;
    expect(Number(journal.totalDebit)).toBe(5250000);
    expect(Number(journal.totalCredit)).toBe(5250000);

    const bcaLine = journal.lines.find((l: any) => l.account.code === '11104');
    const dpLine = journal.lines.find((l: any) => l.account.code === '24101');
    expect(bcaLine).toBeDefined();
    expect(Number(bcaLine.debit)).toBe(5250000);
    expect(dpLine).toBeDefined();
    expect(Number(dpLine.credit)).toBe(5250000);
  });

  it('Tahap 3: Kasir Pool Mencairkan Uang Jalan (UJ) Awal Rp 6.000.000 Tunai (Jurnal #2)', async () => {
    // Mulai penugasan (start SPJ)
    const startRes = await reqHelper('post', `/api/v1/spjs/${spjId}/start`)
      .expect(201);
    expect(startRes.body.data.operationalStatus).toBe(SpjOperationalStatus.IN_PROGRESS);

    const disbursePayload = {
      amount: '6000000.00',
      disbursementType: SpjDisbursementType.INITIAL,
      paymentMethod: SpjPaymentMethod.CASH,
      cashAccountId,
      receiptRef: 'BKK/WIS/001',
      notes: 'Pencairan UJ awal wisata 5 hari Solo-Yogya',
    };

    const res = await reqHelper('post', `/api/v1/spjs/${spjId}/uj/disburse`)
      .send(disbursePayload)
      .expect(201);

    expect(res.body.status).toBe(true);
    expect(res.body.data.status).toBe('DISBURSED');
    expect(Number(res.body.data.totalDisbursed)).toBe(6000000);
    expect(Number(res.body.data.balance)).toBe(6000000);
  });

  it('Tahap 4: Operasional Tour - Kru Mencatat Beban Riil UJ (BBM, Tol, Parkir Wisata, Cuci, Homestay)', async () => {
    const expenses = [
      { expenseType: SpjExpenseType.FUEL, amount: '3200000.00', notes: 'Solar SPBU Pertamina Rest Area Trans Jawa' },
      { expenseType: SpjExpenseType.TOLL, amount: '1500000.00', notes: 'Top-up E-Toll Trans Jawa PP' },
      { expenseType: SpjExpenseType.PARKING, amount: '450000.00', notes: 'Parkir Kawasan Wisata Borobudur & Malioboro' },
      { expenseType: SpjExpenseType.OTHER, amount: '150000.00', notes: 'Cuci Bus Pariwisata 2x selama tour' },
      { expenseType: SpjExpenseType.CREW_LODGING, amount: '300000.00', notes: 'Homestay Kru Sopir di Sleman' },
    ];

    for (const exp of expenses) {
      await reqHelper('post', `/api/v1/spjs/${spjId}/expenses`)
        .send({
          ...exp,
          paymentSource: SpjExpensePaymentSource.UJ,
          expenseDate: '2026-10-19',
        })
        .expect(201);
    }

    // Total pengeluaran riil UJ = 3.2m + 1.5m + 450k + 150k + 300k = Rp 5.600.000
  });

  it('Tahap 5: Penambahan UJ Darurat di Perjalanan Hari ke-3 Rp 1.000.000 via Bank Transfer (Jurnal #3)', async () => {
    const additionalPayload = {
      amount: '1000000.00',
      disbursementType: SpjDisbursementType.ADDITIONAL,
      paymentMethod: SpjPaymentMethod.BANK_TRANSFER,
      bankAccountId,
      receiptRef: 'TRF-BCA-ADD-01',
      notes: 'Tambahan UJ via transfer bank driver di Jogja',
    };

    const res = await reqHelper('post', `/api/v1/spjs/${spjId}/uj/disburse`)
      .send(additionalPayload)
      .expect(201);

    expect(res.body.status).toBe(true);

    // Total Plafon UJ sekarang = 6.000.000 + 1.000.000 = Rp 7.000.000
    const ujSummary = await reqHelper('get', `/api/v1/cashier/spjs/${spjId}/summary`)
      .expect(200);

    expect(ujSummary.body.data.kantong1Uj.totalDisbursed).toBe(7000000);
    expect(ujSummary.body.data.kantong1Uj.totalSpent).toBe(5600000);
  });

  it('Tahap 6: Mid-Trip Early Payout - Transfer Nafkah Keluarga Driver di Jalan Rp 800.000 (Jurnal #4)', async () => {
    // Driver 1 transfer 400.000
    const earlyRes1 = await reqHelper('post', `/api/v1/spjs/crew-payments/${driver1PaymentId}/early-disburse`)
      .send({
        paymentMethod: SpjPaymentMethod.BANK_TRANSFER,
        bankAccountId,
        receiptRef: 'TRF-BCA-NAFKAH-01',
        notes: 'Transfer nafkah keluarga driver 1',
      })
      .expect(201);

    expect(earlyRes1.body.status).toBe(true);
    expect(earlyRes1.body.data.status).toBe('PAID');

    // Driver 2 transfer 400.000
    const earlyRes2 = await reqHelper('post', `/api/v1/spjs/crew-payments/${driver2PaymentId}/early-disburse`)
      .send({
        paymentMethod: SpjPaymentMethod.BANK_TRANSFER,
        bankAccountId,
        receiptRef: 'TRF-BCA-NAFKAH-02',
        notes: 'Transfer nafkah keluarga driver 2',
      })
      .expect(201);

    expect(earlyRes2.body.status).toBe(true);
    expect(earlyRes2.body.data.status).toBe('PAID');

    // Verifikasi Jurnal Payout Hak Kru di jalan: (D) 53102 Beban Premi 800.000, (K) 11104 Bank BCA 800.000
    const earlyJournals = await dataSource.query(`
      SELECT j.id, j.total_debit, j.total_credit
      FROM journal_entries j
      JOIN journal_lines l ON l.journal_entry_id = j.id
      WHERE l.trip_id = $1 AND j.description LIKE '%Pencairan di Muka%'
    `, [spjId]);

    expect(earlyJournals.length).toBeGreaterThanOrEqual(1);
    for (const ej of earlyJournals) {
      createdJournalIds.push(ej.id);
    }
  });

  it('Tahap 7: Penerbitan Invoice Pelunasan Sewa 70% Rp 12.250.000 & Pengakuan Pendapatan 100% Rp 17.500.000', async () => {
    const pelunasanPayload = {
      tripId: spjId,
      customerId,
      customerName,
      invoiceDate: '2026-10-21',
      dueDate: '2026-10-24',
      remainingAmount: 12250000,
      notes: 'Pelunasan sisa 70% sewa bus pariwisata 5 hari tour Jawa Tengah',
    };

    const res = await reqHelper('post', '/api/v1/ar/charter-pelunasan')
      .send(pelunasanPayload)
      .expect(201);

    expect(res.body.status).toBe(true);
    pelunasanInvoiceId = res.body.data.id;
    createdInvoiceIds.push(pelunasanInvoiceId);
    expect(res.body.data.status).toBe(ArInvoiceStatus.APPROVED);
    expect(res.body.data.journalEntryId).toBeDefined();
    createdJournalIds.push(res.body.data.journalEntryId);

    // Verifikasi Jurnal Pengakuan Pendapatan:
    // (D) 12101 Piutang 12.250.000, (D) 24101 DP 5.250.000, (K) 42101 Pendapatan Wisata 17.500.000
    const journalRes = await reqHelper('get', `/api/v1/journals/${res.body.data.journalEntryId}`)
      .expect(200);

    const journal = journalRes.body.data;
    expect(Number(journal.totalDebit)).toBe(17500000);
    expect(Number(journal.totalCredit)).toBe(17500000);

    const arLine = journal.lines.find((l: any) => l.account.code === '12101');
    const dpLine = journal.lines.find((l: any) => l.account.code === '24101');
    const revLine = journal.lines.find((l: any) => l.account.code === '42101');

    expect(arLine).toBeDefined();
    expect(Number(arLine.debit)).toBe(12250000);
    expect(dpLine).toBeDefined();
    expect(Number(dpLine.debit)).toBe(5250000);
    expect(revLine).toBeDefined();
    expect(Number(revLine.credit)).toBe(17500000);
  });

  it('Tahap 8: Klien Melunasi Invoice 70% Rp 12.250.000 via Transfer Bank BCA (Jurnal #5)', async () => {
    const receiptPayload = {
      customerId,
      customerName,
      receiptDate: '2026-10-21',
      paymentMethod: FinancePaymentMethod.BANK_TRANSFER,
      bankAccountId,
      amount: 12250000,
      reference: 'TRF-BCA-PELUNASAN-MITRA',
      allocations: [
        {
          invoiceId: pelunasanInvoiceId,
          amount: 12250000,
        },
      ],
      notes: 'Penerimaan pelunasan invoice sewa bus pariwisata 5 hari',
    };

    const res = await reqHelper('post', '/api/v1/ar/receipts')
      .send(receiptPayload)
      .expect(201);

    expect(res.body.status).toBe(true);
    createdReceiptIds.push(res.body.data.id);
    expect(res.body.data.journalEntryId).toBeDefined();
    createdJournalIds.push(res.body.data.journalEntryId);

    // Verifikasi Jurnal Pelunasan AR: (D) 11104 Bank BCA 12.250.000, (K) 12101 Piutang 12.250.000
    const journalRes = await reqHelper('get', `/api/v1/journals/${res.body.data.journalEntryId}`)
      .expect(200);

    const journal = journalRes.body.data;
    expect(Number(journal.totalDebit)).toBe(12250000);
    expect(Number(journal.totalCredit)).toBe(12250000);

    const bcaLine = journal.lines.find((l: any) => l.account.code === '11104');
    const arLine = journal.lines.find((l: any) => l.account.code === '12101');
    expect(bcaLine).toBeDefined();
    expect(Number(bcaLine.debit)).toBe(12250000);
    expect(arLine).toBeDefined();
    expect(Number(arLine.credit)).toBe(12250000);

    // Verifikasi status kontrak sewa wisata tuntas lunas 100%
    const statusRes = await reqHelper('get', `/api/v1/ar/charter-status/${spjId}`)
      .expect(200);

    expect(statusRes.body.data.downPaymentReceived).toBe(5250000);
    expect(statusRes.body.data.totalInvoiced).toBe(12250000);
    expect(statusRes.body.data.totalPaid).toBe(12250000);
    expect(statusRes.body.data.remainingBalance).toBe(0);
    expect(statusRes.body.data.isFullyPaid).toBe(true);
  });

  it('Tahap 9: Armada Tiba di Pool & Kru Mengembalikan Fisik Sisa UJ Rp 1.400.000 (UJ Balanced)', async () => {
    // Selesaikan trip via /complete
    const completeRes = await reqHelper('post', `/api/v1/spjs/${spjId}/complete`)
      .expect(201);
    expect(completeRes.body.data.operationalStatus).toBe(SpjOperationalStatus.COMPLETED);

    // Pengembalian sisa UJ Rp 1.400.000 (Plafon 7jt - Riil 5.6jt = 1.4jt)
    const returnRes = await reqHelper('post', `/api/v1/spjs/${spjId}/uj/return`)
      .send({
        amount: '1400000.00',
        paymentMethod: SpjPaymentMethod.CASH,
        cashAccountId,
        receiptRef: 'BKM/WIS/001',
        notes: 'Pengembalian fisik sisa UJ pariwisata 5 hari ke kasir pool',
      })
      .expect(201);

    expect(returnRes.body.status).toBe(true);

    // Hitung kalkulasi kasir
    const calcRes = await reqHelper('get', `/api/v1/cashier/spjs/${spjId}/summary`)
      .expect(200);

    const calc = calcRes.body.data;
    expect(calc.kantong1Uj.totalDisbursed).toBe(7000000);
    expect(calc.kantong1Uj.totalSpent).toBe(5600000);
    expect(calc.kantong1Uj.totalReturned).toBe(1400000);
    expect(calc.kantong1Uj.balance).toBe(0);
    expect(calc.kantong1Uj.status).toBe('BALANCED');
    expect(calc.kantong2Revenue.status).toBe('MATCHED'); // Kru tidak pegang uang sewa (100% transfer bank)
  });

  it('Tahap 10: Kasir Pool Membayar Uang Makan Kru Tunai Rp 1.000.000 & Verifikasi Settlement Otomatis', async () => {
    // Kasir pool memproses penyelesaian settlement
    const settlePayload = {
      spjId,
      cashAccountId,
      cashPaidToCrew: true, // Kasir membayarkan uang makan sisa (2 driver x 500rb = 1.000.000)
      notes: 'Settlement tuntas tour wisata 5 hari Solo-Yogya',
    };

    const res = await reqHelper('post', '/api/v1/cashier/settlements')
      .send(settlePayload)
      .expect(201);

    expect(res.body.status).toBe(true);
    expect(res.body.data.status).toBe(CrewCashSettlementStatus.VERIFIED);
    expect(res.body.data.bkmNo).toBeDefined();
    expect(res.body.data.bkkNo).toBeDefined();
    expect(res.body.data.journalEntryId).toBeDefined();
    createdJournalIds.push(res.body.data.journalEntryId);

    // Verifikasi Jurnal Rekonsiliasi Kasir Seimbang:
    // Net cash meja kasir = Sisa UJ (1.4jt) - Uang Makan Kru (1.0jt) = +400.000 masuk kas pool
    // Debit: 11101 (400.000) + 51101 (3.2m) + 52101 (1.5m) + 52102/52103 (900k) + 53101 (1.0m) = 7.000.000
    // Kredit: 13101 (7.000.000)
    const journalRes = await reqHelper('get', `/api/v1/journals/${res.body.data.journalEntryId}`)
      .expect(200);

    const journal = journalRes.body.data;
    expect(Number(journal.totalDebit)).toBe(7000000);
    expect(Number(journal.totalCredit)).toBe(7000000);

    // Verifikasi SPJ telah berstatus SETTLED
    const spjRes = await reqHelper('get', `/api/v1/spjs/${spjId}`)
      .expect(200);

    expect(spjRes.body.data.financialStatus).toBe(SpjFinancialStatus.SETTLED);
  });

  it('Tahap 11: Audit Laporan Profitabilitas SPJ Wisata (Trip Contribution Margin)', async () => {
    const res = await reqHelper('get', `/api/v1/reports/trip-profitability/${spjId}`)
      .expect(200);

    expect(res.body.status).toBe(true);
    const prof = res.body.data;
    const info = prof.info;

    // Omzet sewa charter pariwisata 100%
    expect(Number(info.charterRevenue)).toBe(17500000);
    expect(Number(info.grossRevenue)).toBe(17500000);

    // Biaya langsung operasional armada
    expect(Number(info.fuelCost)).toBe(3200000);
    expect(Number(info.tollAndParkingCost)).toBe(2400000); // 1.5jt Tol + 900rb Parkir/Cuci/Lodging

    // Biaya kompensasi kru: 2 driver x (500rb makan + 750rb premi) = 2.500.000
    expect(Number(info.crewCost)).toBe(2500000);

    // Total Beban Langsung Trip: 3.2m + 2.4m + 2.5m = 8.100.000
    expect(Number(info.totalDirectCost)).toBe(8100000);

    // Margin Kontribusi Laba Bersih Trip: 17.500.000 - 8.100.000 = +9.400.000
    expect(Number(info.contributionMargin)).toBe(9400000);
    expect(Number(info.contributionMarginRatio)).toBeGreaterThan(50);
  });

  it('Tahap 12: Audit Laporan Laba Rugi (Income Statement) Periode Berjalan', async () => {
    // Kueri laporan laba rugi mencakup periode transaksi Oktober 2026
    const res = await reqHelper('get', `/api/v1/reports/income-statement?startDate=2026-10-01&endDate=2026-10-31`)
      .expect(200);

    expect(res.body.status).toBe(true);
    const statement = res.body.data;

    // Omzet sewa pariwisata tercermin di laporan Laba Rugi
    expect(statement.revenues.groups.length).toBeGreaterThanOrEqual(1);
    const charterRevGroup = statement.revenues.groups.find((r: any) =>
      r.groupName.includes('Pariwisata') || r.groupName.includes('Charter'),
    );
    expect(charterRevGroup).toBeDefined();
    expect(Number(charterRevGroup.subtotal)).toBeGreaterThanOrEqual(17500000);

    // Beban-beban langsung operasional armada
    expect(Number(statement.expenses.directCosts)).toBeGreaterThan(0);
    expect(statement.grossProfit).toBeDefined();
    expect(statement.netIncome).toBeDefined();
  });
});
