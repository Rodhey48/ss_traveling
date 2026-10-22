import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCashierSettlementData1888888888895 implements MigrationInterface {
  name = 'SeedCashierSettlementData1888888888895';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const spj01Id = 'f0000000-0000-0000-0000-000000000001'; // Skenario 1: AKAP Normal

    const spjs = await queryRunner.query(
      `SELECT id, company_id, vehicle_id, business_unit_id, profit_center_id FROM "spjs" WHERE "id" = '${spj01Id}' LIMIT 1`,
    );
    if (spjs.length === 0) return;

    const companyId = spjs[0].company_id;
    const vehicleId = spjs[0].vehicle_id;
    const businessUnitId = spjs[0].business_unit_id;
    const profitCenterId = spjs[0].profit_center_id;

    const driverBudi = await queryRunner.query(
      `SELECT id FROM "users" WHERE "email" = 'driver.budi@sstravel.com' LIMIT 1`,
    );
    const budiId = driverBudi.length > 0 ? driverBudi[0].id : null;

    const cashier = await queryRunner.query(
      `SELECT id FROM "users" WHERE "email" = 'cashier.ciputat@sstravel.com' OR "email" = 'cashier.pool@sstravel.com' LIMIT 1`,
    );
    const cashierId = cashier.length > 0 ? cashier[0].id : null;

    const financeManager = await queryRunner.query(
      `SELECT id FROM "users" WHERE "email" = 'finance.manager@sstravel.com' LIMIT 1`,
    );
    const fmId = financeManager.length > 0 ? financeManager[0].id : null;

    const cashAccounts = await queryRunner.query(
      `SELECT id FROM "cash_accounts" WHERE "code" = 'CASH-POOL-CIPUTAT' LIMIT 1`,
    );
    const cashAccountId =
      cashAccounts.length > 0
        ? cashAccounts[0].id
        : (await queryRunner.query(`SELECT id FROM "cash_accounts" LIMIT 1`))[0]?.id;

    // -------------------------------------------------------------
    // 1. SKENARIO 1: Settlement Normal AKAP PP Bus SS-01 (TUNTAS & VERIFIED)
    // -------------------------------------------------------------
    const settle01Id = 'a1000000-0000-0000-0000-000000000001';
    const rem01Id = 'a2000000-0000-0000-0000-000000000001';
    const decl01Id = 'e1000000-0000-0000-0000-000000000001'; // Tiket Rp 450rb
    const decl02Id = 'e1000000-0000-0000-0000-000000000002'; // Kargo Rp 350rb

    // 1.1 Insert Setoran Kas Aktual Kru (Remittance Rp 800.000)
    await queryRunner.query(`
      INSERT INTO "crew_cash_remittances" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "remittance_no",
        "settlement_id", "spj_id", "depositor_crew_id", "amount", "cash_account_id",
        "received_by_cashier_id", "remitted_at", "payment_method", "status", "bkm_no", "notes"
      ) VALUES (
        '${rem01Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        'REM/2610/0001', NULL, '${spj01Id}', '${budiId}', 800000.00,
        ${cashAccountId ? `'${cashAccountId}'` : 'NULL'}, ${cashierId ? `'${cashierId}'` : 'NULL'},
        '2026-10-20 18:30:00+07', 'CASH', 'VERIFIED', 'BKM/2610/0002',
        'Setoran kas fisik bruto tiket & kargo motor oleh Driver 1 Pak Budi'
      ) ON CONFLICT ("id") DO NOTHING;
    `);

    // 1.2 Insert Alokasi Setoran ke Deklarasi (Tiket 450rb + Kargo 350rb)
    await queryRunner.query(`
      INSERT INTO "crew_cash_remittance_allocations" (
        "id", "is_active", "createdAt", "updatedAt", "remittance_id",
        "revenue_declaration_id", "allocated_amount", "notes"
      ) VALUES
      (
        'a3000000-0000-0000-0000-000000000001', true, NOW(), NOW(), '${rem01Id}',
        '${decl01Id}', 450000.00, 'Alokasi penuh tiket fisik langsung naik pool'
      ),
      (
        'a3000000-0000-0000-0000-000000000002', true, NOW(), NOW(), '${rem01Id}',
        '${decl02Id}', 350000.00, 'Alokasi penuh resi kargo motor'
      )
      ON CONFLICT ("id") DO NOTHING;
    `);

    // 1.3 Insert Header Settlement SPJ 1 (VERIFIED & BALANCED)
    await queryRunner.query(`
      INSERT INTO "crew_cash_settlements" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "settlement_no",
        "spj_id", "status", "uj_status", "revenue_status", "cashier_id", "submitted_at",
        "reviewed_by_id", "reviewed_at", "notes",
        "total_uj_disbursed", "total_uj_spent", "total_uj_returned", "uj_balance",
        "total_revenue_expected", "total_revenue_remitted", "revenue_balance",
        "total_cash_received", "total_cash_paid", "bkm_no", "bkk_no"
      ) VALUES (
        '${settle01Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        'SETTLE/2610/0001', '${spj01Id}', 'VERIFIED', 'BALANCED', 'MATCHED',
        ${cashierId ? `'${cashierId}'` : 'NULL'}, '2026-10-20 18:45:00+07',
        ${fmId ? `'${fmId}'` : 'NULL'}, '2026-10-20 19:00:00+07',
        'Rekonsiliasi Kasir SPJ-001 Normal Seimbang (Skenario 1)',
        3500000.00, 2600000.00, 900000.00, 0.00,
        800000.00, 800000.00, 0.00,
        1700000.00, 170000.00, 'BKM/2610/0001', 'BKK/2610/0002'
      ) ON CONFLICT ("id") DO NOTHING;
    `);

    // Update remittance dengan settlement_id
    await queryRunner.query(`
      UPDATE "crew_cash_remittances" SET "settlement_id" = '${settle01Id}' WHERE "id" = '${rem01Id}';
    `);

    // Update status finansial SPJ 1 menjadi SETTLED
    await queryRunner.query(`
      UPDATE "spjs" SET "financial_status" = 'SETTLED', "operational_status" = 'COMPLETED', "closed_at" = '2026-10-20 19:00:00+07' WHERE "id" = '${spj01Id}';
    `);

    // -------------------------------------------------------------
    // 2. SKENARIO 4: SPJ 3 (Kasus Nota Hilang Rp 300rb & Temuan Selisih Meja Kasir)
    // -------------------------------------------------------------
    const spj03Id = 'f0000000-0000-0000-0000-000000000003';
    const sched03Id = 'e0000000-0000-0000-0000-000000000003';
    const settle03Id = 'a1000000-0000-0000-0000-000000000003';
    const disc03Id = 'a4000000-0000-0000-0000-000000000001';
    const rem03Id = 'a2000000-0000-0000-0000-000000000003';
    const uj03Id = 'b0000000-0000-0000-0000-000000000003';

    // 2.1 Buat SPJ Skenario 4 (Bus SS-01 Pulang dengan Selisih Kasir)
    await queryRunner.query(`
      INSERT INTO "spjs" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_no",
        "service_type", "vehicle_id", "business_unit_id", "profit_center_id",
        "operational_status", "financial_status", "issued_at", "operationally_completed_at", "notes"
      ) VALUES (
        '${spj03Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        'SPJ/AKP/2610/0099', 'AKAP', ${vehicleId ? `'${vehicleId}'` : 'NULL'},
        ${businessUnitId ? `'${businessUnitId}'` : 'NULL'}, ${profitCenterId ? `'${profitCenterId}'` : 'NULL'},
        'COMPLETED', 'DISCREPANCY', '2026-10-21 07:00:00+07', '2026-10-22 17:30:00+07',
        'Operasional AKAP PP Bus SS-01 dengan temuan selisih nota BBM tercecer di Tol Palimanan (Skenario 4)'
      ) ON CONFLICT ("spj_no") DO NOTHING;
    `);

    // 2.2 Amplop UJ SPJ 3: Plafon Rp 3.5jt, Nota Sah Rp 3.0jt, Sisa Kas Rp 200rb, Selisih Rp 300rb
    await queryRunner.query(`
      INSERT INTO "spj_uj" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_id",
        "crew_id", "status", "total_disbursed", "total_spent", "total_returned", "balance", "notes"
      ) VALUES (
        '${uj03Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        '${spj03Id}', '${budiId}', 'DISCREPANCY', 3500000.00, 3000000.00, 200000.00, 300000.00,
        'Plafon UJ Rp 3.5jt, nota sah Rp 3.0jt, sisa fisik kembali Rp 200rb, selisih nota Rp 300rb'
      ) ON CONFLICT ("id") DO NOTHING;
    `);

    // 2.3 Pencairan UJ SPJ 3
    await queryRunner.query(`
      INSERT INTO "spj_uj_disbursements" (
        "id", "is_active", "createdAt", "updatedAt", "spj_uj_id", "disbursement_type",
        "amount", "disbursed_at", "payment_method", "cash_account_id", "disbursed_by",
        "receipt_ref", "notes"
      ) VALUES (
        'b1000000-0000-0000-0000-000000000003', true, NOW(), NOW(), '${uj03Id}', 'INITIAL',
        3500000.00, '2026-10-21 06:45:00+07', 'CASH', ${cashAccountId ? `'${cashAccountId}'` : 'NULL'},
        ${cashierId ? `'${cashierId}'` : 'NULL'}, 'BKK/2610/0005', 'Uang Jalan Awal Kasir Pool Ciputat SPJ-003'
      ) ON CONFLICT ("id") DO NOTHING;
    `);

    // 2.4 Biaya Operasional Sah SPJ 3 (BBM 2.0jt, Tol 900rb, Parkir 100rb = Rp 3.0jt)
    await queryRunner.query(`
      INSERT INTO "spj_expenses" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_id",
        "vehicle_id", "expense_type", "amount", "expense_date", "payment_source",
        "fuel_liters", "odometer_km", "fuel_station", "receipt_number", "status", "notes"
      ) VALUES
      (
        'c1000000-0000-0000-0000-000000000005', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        '${spj03Id}', ${vehicleId ? `'${vehicleId}'` : 'NULL'}, 'FUEL', 2000000.00, '2026-10-21 09:30:00+07', 'UJ',
        180.00, 114500, 'SPBU Pertamina Rest Area KM 102 Tol Cipali', 'STRUK-SPBU-102', 'APPROVED', 'Pengisian solar sah nota terlampir'
      ),
      (
        'c1000000-0000-0000-0000-000000000006', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        '${spj03Id}', ${vehicleId ? `'${vehicleId}'` : 'NULL'}, 'TOLL', 900000.00, '2026-10-21 12:00:00+07', 'UJ',
        NULL, NULL, NULL, 'STRUK-TOL-003', 'APPROVED', 'Tol Trans Jawa Jakarta - Semarang PP'
      ),
      (
        'c1000000-0000-0000-0000-000000000007', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        '${spj03Id}', ${vehicleId ? `'${vehicleId}'` : 'NULL'}, 'PARKING', 100000.00, '2026-10-21 16:00:00+07', 'UJ',
        NULL, NULL, NULL, 'KRC-003', 'APPROVED', 'Cuci & parkir terminal Giwangan'
      )
      ON CONFLICT ("id") DO NOTHING;
    `);

    // 2.5 Pengembalian Sisa Fisik UJ SPJ 3 (Rp 200.000)
    await queryRunner.query(`
      INSERT INTO "spj_uj_returns" (
        "id", "is_active", "createdAt", "updatedAt", "spj_uj_id", "amount",
        "returned_at", "cash_account_id", "received_by", "receipt_ref", "notes"
      ) VALUES (
        'b2000000-0000-0000-0000-000000000003', true, NOW(), NOW(), '${uj03Id}', 200000.00,
        '2026-10-22 18:00:00+07', ${cashAccountId ? `'${cashAccountId}'` : 'NULL'},
        ${cashierId ? `'${cashierId}'` : 'NULL'}, 'BKM/2610/0007', 'Pengembalian fisik sisa UJ Rp 200rb di meja kasir'
      ) ON CONFLICT ("id") DO NOTHING;
    `);

    // 2.6 Deklarasi Tiket Kru (Rp 1.000.000) & Kargo Motor (Rp 350.000)
    const decl03Id = 'e1000000-0000-0000-0000-000000000003';
    const decl04Id = 'e1000000-0000-0000-0000-000000000004';
    await queryRunner.query(`
      INSERT INTO "spj_revenue_declarations" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_id",
        "declaration_type", "amount", "declared_by", "declared_at", "source_reference",
        "crew_commission_percentage", "crew_commission_amount", "status", "notes"
      ) VALUES
      (
        '${decl03Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        '${spj03Id}', 'TICKET_CASH', 1000000.00, '${budiId}', '2026-10-21 07:15:00+07', 'TKT-003',
        0.00, 0.00, 'VERIFIED', '4 Tiket tunai langsung naik @ 250.000 (Target 1.000.000)'
      ),
      (
        '${decl04Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        '${spj03Id}', 'CARGO_MOTORCYCLE', 350000.00, '${budiId}', '2026-10-21 07:20:00+07', 'RESI-003',
        20.00, 70000.00, 'VERIFIED', '1 Motor bagasi bawah @ 350.000 (Target 350.000)'
      )
      ON CONFLICT ("id") DO NOTHING;
    `);

    // 2.7 Remittance Setoran Kru Rp 1.350.000 (Lapis 1 Musyawarah Kru: Setoran MATCHED)
    await queryRunner.query(`
      INSERT INTO "crew_cash_remittances" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "remittance_no",
        "settlement_id", "spj_id", "depositor_crew_id", "amount", "cash_account_id",
        "received_by_cashier_id", "remitted_at", "payment_method", "status", "bkm_no", "notes"
      ) VALUES (
        '${rem03Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        'REM/2610/0003', NULL, '${spj03Id}', '${budiId}', 1350000.00,
        ${cashAccountId ? `'${cashAccountId}'` : 'NULL'}, ${cashierId ? `'${cashierId}'` : 'NULL'},
        '2026-10-22 18:15:00+07', 'CASH', 'VERIFIED', 'BKM/2610/0008',
        'Setoran kas tiket 1jt + kargo 350rb disetor utuh Rp 1.350.000 pasca musyawarah kru di meja kasir (Skenario 4 Kasus A)'
      ) ON CONFLICT ("id") DO NOTHING;
    `);

    // 2.8 Settlement SPJ 3 (Status SUBMITTED, UJ: DISCREPANCY, Rev: MATCHED)
    await queryRunner.query(`
      INSERT INTO "crew_cash_settlements" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "settlement_no",
        "spj_id", "status", "uj_status", "revenue_status", "cashier_id", "submitted_at",
        "notes", "total_uj_disbursed", "total_uj_spent", "total_uj_returned", "uj_balance",
        "total_revenue_expected", "total_revenue_remitted", "revenue_balance",
        "total_cash_received", "total_cash_paid", "bkm_no"
      ) VALUES (
        '${settle03Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        'SETTLE/2610/0003', '${spj03Id}', 'SUBMITTED', 'DISCREPANCY', 'MATCHED',
        ${cashierId ? `'${cashierId}'` : 'NULL'}, '2026-10-22 18:30:00+07',
        'Settlement diajukan dengan temuan selisih nota BBM darurat Rp 300.000 belum diverifikasi (Skenario 4)',
        3500000.00, 3000000.00, 200000.00, 300000.00,
        1350000.00, 1350000.00, 0.00,
        1550000.00, 0.00, 'BKM/2610/0008'
      ) ON CONFLICT ("id") DO NOTHING;
    `);

    // Update remittance dengan settlement_id
    await queryRunner.query(`
      UPDATE "crew_cash_remittances" SET "settlement_id" = '${settle03Id}' WHERE "id" = '${rem03Id}';
    `);

    // 2.9 Pencatatan Temuan Selisih Kas Sistemik di crew_cash_discrepancies (Lapis 2 Sistemik)
    await queryRunner.query(`
      INSERT INTO "crew_cash_discrepancies" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "discrepancy_no",
        "settlement_id", "spj_id", "source_type", "expected_amount", "actual_amount",
        "difference_amount", "reported_by_id", "responsible_crew_id", "reason",
        "investigation_notes", "resolution_status"
      ) VALUES (
        '${disc03Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        'DISC/2610/0001', '${settle03Id}', '${spj03Id}', 'UJ_EXPENSE_UNVERIFIED',
        3300000.00, 3000000.00, 300000.00, ${cashierId ? `'${cashierId}'` : 'NULL'},
        '${budiId}', 'Struk SPBU Palimanan hilang saat pengisian solar darurat 34 liter. Odometer dan foto solar terlampir.',
        'Bus terdeteksi GPS berhenti 8 menit di SPBU Pertamina KM 208 Palimanan jam 02:15 WIB. Rasio liter normal.',
        'PENDING_INVESTIGATION'
      ) ON CONFLICT ("id") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "crew_cash_discrepancies" WHERE "id" = 'a4000000-0000-0000-0000-000000000001'`);
    await queryRunner.query(`DELETE FROM "crew_cash_remittance_allocations" WHERE "id" LIKE 'a3000000-%'`);
    await queryRunner.query(`DELETE FROM "crew_cash_remittances" WHERE "id" LIKE 'a2000000-%'`);
    await queryRunner.query(`DELETE FROM "crew_cash_settlements" WHERE "id" LIKE 'a1000000-%'`);
    await queryRunner.query(`DELETE FROM "spj_revenue_declarations" WHERE "id" IN ('e1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000004')`);
    await queryRunner.query(`DELETE FROM "spj_uj_returns" WHERE "id" = 'b2000000-0000-0000-0000-000000000003'`);
    await queryRunner.query(`DELETE FROM "spj_expenses" WHERE "id" IN ('c1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000007')`);
    await queryRunner.query(`DELETE FROM "spj_uj_disbursements" WHERE "id" = 'b1000000-0000-0000-0000-000000000003'`);
    await queryRunner.query(`DELETE FROM "spj_uj" WHERE "id" = 'b0000000-0000-0000-0000-000000000003'`);
    await queryRunner.query(`DELETE FROM "spjs" WHERE "id" = 'f0000000-0000-0000-0000-000000000003'`);
  }
}
