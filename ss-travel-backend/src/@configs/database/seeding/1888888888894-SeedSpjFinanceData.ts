import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSpjFinanceData1888888888894 implements MigrationInterface {
  name = 'SeedSpjFinanceData1888888888894';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const spj01Id = 'f0000000-0000-0000-0000-000000000001';
    const spj02Id = 'f0000000-0000-0000-0000-000000000002';

    const spjs = await queryRunner.query(`SELECT id, company_id, vehicle_id FROM "spjs" WHERE "id" = '${spj01Id}' LIMIT 1`);
    if (spjs.length === 0) return;

    const companyId = spjs[0].company_id;
    const vehicleId = spjs[0].vehicle_id;

    const driverBudi = await queryRunner.query(`SELECT id FROM "users" WHERE "email" = 'driver.budi@sstravel.com' LIMIT 1`);
    const budiId = driverBudi.length > 0 ? driverBudi[0].id : null;

    const cashier = await queryRunner.query(`SELECT id FROM "users" WHERE "email" = 'cashier.pool@sstravel.com' LIMIT 1`);
    const cashierId = cashier.length > 0 ? cashier[0].id : null;

    const cashAccounts = await queryRunner.query(`SELECT id FROM "cash_accounts" LIMIT 1`);
    const cashAccountId = cashAccounts.length > 0 ? cashAccounts[0].id : null;

    const bankAccounts = await queryRunner.query(`SELECT id FROM "bank_accounts" LIMIT 1`);
    const bankAccountId = bankAccounts.length > 0 ? bankAccounts[0].id : null;

    const uj01Id = 'b0000000-0000-0000-0000-000000000001';
    const uj02Id = 'b0000000-0000-0000-0000-000000000002';

    // 1. UJ Header SPJ 1 (Skenario 1: AKAP PP Normal)
    if (budiId) {
      await queryRunner.query(`
        INSERT INTO "spj_uj" (
          "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_id",
          "crew_id", "status", "total_disbursed", "total_spent", "total_returned", "balance", "notes"
        ) VALUES (
          '${uj01Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
          '${spj01Id}', '${budiId}', 'BALANCED', 3500000.00, 2600000.00, 900000.00, 0.00,
          'Amplop UJ Trayek AKAP PP Jakarta - Yogya Bus SS-01 (Skenario 1)'
        ) ON CONFLICT ("id") DO NOTHING;
      `);

      // 2. Pencairan UJ Awal Kasir Pool
      await queryRunner.query(`
        INSERT INTO "spj_uj_disbursements" (
          "id", "is_active", "createdAt", "updatedAt", "spj_uj_id", "disbursement_type",
          "amount", "disbursed_at", "payment_method", "cash_account_id", "disbursed_by",
          "receipt_ref", "notes"
        ) VALUES (
          'b1000000-0000-0000-0000-000000000001', true, NOW(), NOW(), '${uj01Id}', 'INITIAL',
          3500000.00, '2026-10-19 06:50:00+07', 'CASH', ${cashAccountId ? `'${cashAccountId}'` : 'NULL'},
          ${cashierId ? `'${cashierId}'` : 'NULL'}, 'BKK/2610/0001', 'Uang Jalan Awal Kasir Pool Ciputat'
        ) ON CONFLICT ("id") DO NOTHING;
      `);

      // 3. Pengeluaran Operasional SPJ 1 (BBM, Tol, Parkir, Servis Makan)
      const expBbmId = 'c1000000-0000-0000-0000-000000000001';
      const expTolId = 'c1000000-0000-0000-0000-000000000002';
      const expTprId = 'c1000000-0000-0000-0000-000000000003';
      const expMealId = 'c1000000-0000-0000-0000-000000000004';

      await queryRunner.query(`
        INSERT INTO "spj_expenses" (
          "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_id",
          "vehicle_id", "expense_type", "amount", "expense_date", "payment_source",
          "fuel_liters", "odometer_km", "fuel_station", "receipt_number", "status", "notes"
        ) VALUES
        (
          '${expBbmId}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'}, '${spj01Id}',
          '${vehicleId}', 'FUEL', 1800000.00, '2026-10-19 11:30:00+07', 'UJ',
          264.70, 125430, 'SPBU Rest Area KM 207A Tol Palikanci', 'BBM-207-001', 'APPROVED',
          'Pengisian Biosolar Bus SS-01'
        ),
        (
          '${expTolId}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'}, '${spj01Id}',
          '${vehicleId}', 'TOLL', 550000.00, '2026-10-19 09:15:00+07', 'UJ',
          NULL, NULL, NULL, 'TOL-TOPUP-102', 'APPROVED',
          'Top-up saldo E-Toll Mandiri di Indomaret KM 102 Cipali'
        ),
        (
          '${expTprId}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'}, '${spj01Id}',
          '${vehicleId}', 'RETRIBUTION', 50000.00, '2026-10-19 17:30:00+07', 'UJ',
          NULL, NULL, NULL, 'TPR-GWG-01', 'APPROVED',
          'Retribusi TPR Terminal Giwangan Yogyakarta'
        ),
        (
          '${expMealId}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'}, '${spj01Id}',
          '${vehicleId}', 'RESTAURANT_MEAL_SERVICE', 200000.00, '2026-10-19 13:00:00+07', 'UJ',
          NULL, NULL, NULL, 'KPN-RMTS-08', 'APPROVED',
          '8 kupon servis makan penumpang di RM Taman Selera Subang'
        )
        ON CONFLICT ("id") DO NOTHING;
      `);

      // Hubungkan ke UJ expenses
      await queryRunner.query(`
        INSERT INTO "spj_uj_expenses" ("id", "is_active", "createdAt", "updatedAt", "spj_uj_id", "expense_id", "amount", "receipt_ref", "notes")
        VALUES
        ('d1000000-0000-0000-0000-000000000001', true, NOW(), NOW(), '${uj01Id}', '${expBbmId}', 1800000.00, 'BBM-207-001', 'Solar Palikanci'),
        ('d1000000-0000-0000-0000-000000000002', true, NOW(), NOW(), '${uj01Id}', '${expTolId}', 550000.00, 'TOL-TOPUP-102', 'Topup Etoll'),
        ('d1000000-0000-0000-0000-000000000003', true, NOW(), NOW(), '${uj01Id}', '${expTprId}', 50000.00, 'TPR-GWG-01', 'TPR Giwangan'),
        ('d1000000-0000-0000-0000-000000000004', true, NOW(), NOW(), '${uj01Id}', '${expMealId}', 200000.00, 'KPN-RMTS-08', 'Servis Makan 8 Pax')
        ON CONFLICT ("id") DO NOTHING;
      `);

      // 4. Pengembalian Sisa UJ Rp 900.000 ke Kasir
      await queryRunner.query(`
        INSERT INTO "spj_uj_returns" (
          "id", "is_active", "createdAt", "updatedAt", "spj_uj_id", "amount",
          "returned_at", "payment_method", "cash_account_id", "received_by",
          "receipt_ref", "notes"
        ) VALUES (
          'b2000000-0000-0000-0000-000000000001', true, NOW(), NOW(), '${uj01Id}', 900000.00,
          '2026-10-20 18:30:00+07', 'CASH', ${cashAccountId ? `'${cashAccountId}'` : 'NULL'},
          ${cashierId ? `'${cashierId}'` : 'NULL'}, 'BKM/2610/0001', 'Pengembalian fisik sisa UJ di meja kasir'
        ) ON CONFLICT ("id") DO NOTHING;
      `);

      // 5. Deklarasi Penerimaan Kas Operasional (Tiket & Kargo Motor 20% Komisi)
      await queryRunner.query(`
        INSERT INTO "spj_revenue_declarations" (
          "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_id",
          "declaration_type", "amount", "declared_by", "declared_at", "source_reference",
          "crew_commission_percentage", "crew_commission_amount", "cargo_sender_name",
          "cargo_receiver_name", "cargo_item_description", "status", "notes"
        ) VALUES
        (
          'e1000000-0000-0000-0000-000000000001', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
          '${spj01Id}', 'TICKET_CASH', 450000.00, '${budiId}', '2026-10-19 07:15:00+07', 'TKT-PL-001',
          0.00, 0.00, NULL, NULL, NULL, 'VERIFIED', '1 Tiket Luxury Seat langsung naik di Pool Ciputat'
        ),
        (
          'e1000000-0000-0000-0000-000000000002', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
          '${spj01Id}', 'CARGO_MOTORCYCLE', 350000.00, '${budiId}', '2026-10-19 07:20:00+07', 'RESI-MTR-001',
          20.00, 70000.00, 'Pak Ahmad Ciputat', 'Mas Wahyu Giwangan', 'Honda Vario 125 cc (Bagasi Bawah)', 'VERIFIED',
          'Kargo Motor dengan hak komisi kru 20% (Rp 70.000)'
        )
        ON CONFLICT ("id") DO NOTHING;
      `);

      // 6. Hak Kompensasi Kru (Uang Makan, Premi, dan Komisi Kargo)
      await queryRunner.query(`
        INSERT INTO "crew_meal_payments" (
          "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_id",
          "crew_id", "payment_category", "amount", "payout_timing", "status", "notes"
        ) VALUES
        (
          'f1000000-0000-0000-0000-000000000001', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
          '${spj01Id}', '${budiId}', 'MEAL_ALLOWANCE', 100000.00, 'AT_SETTLEMENT', 'PENDING',
          'Uang Makan Sopir 1 Pak Budi'
        ),
        (
          'f1000000-0000-0000-0000-000000000002', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
          '${spj01Id}', '${budiId}', 'TRIP_INCENTIVE', 150000.00, 'AT_SETTLEMENT', 'PENDING',
          'Premi Ritase PP Sopir 1 Pak Budi'
        ),
        (
          'f1000000-0000-0000-0000-000000000003', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
          '${spj01Id}', '${budiId}', 'CARGO_COMMISSION', 70000.00, 'AT_SETTLEMENT', 'PENDING',
          'Komisi Kargo Motor (20% dari Rp 350.000)'
        )
        ON CONFLICT ("id") DO NOTHING;
      `);
    }

    // 7. Skenario 2: SPJ 2 Pariwisata 5 Hari (Early Payout Transfer BCA)
    const driverHendra = await queryRunner.query(`SELECT id FROM "users" WHERE "email" = 'driver.hendra@sstravel.com' LIMIT 1`);
    const hendraId = driverHendra.length > 0 ? driverHendra[0].id : null;

    if (hendraId) {
      await queryRunner.query(`
        INSERT INTO "crew_meal_payments" (
          "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_id",
          "crew_id", "payment_category", "amount", "payout_timing", "status",
          "paid_at", "payment_method", "bank_account_id", "receipt_ref", "notes"
        ) VALUES (
          'f2000000-0000-0000-0000-000000000001', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
          '${spj02Id}', '${hendraId}', 'TRIP_INCENTIVE', 800000.00, 'EARLY_DISBURSEMENT', 'PAID',
          '2026-10-24 14:00:00+07', 'BANK_TRANSFER', ${bankAccountId ? `'${bankAccountId}'` : 'NULL'},
          'TRF-BCA-88772', 'Pencairan sebagian premi di muka (Early Payout) ke rekening BCA keluarga driver di perjalanan wisata'
        ) ON CONFLICT ("id") DO NOTHING;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "crew_meal_payments" WHERE "id" LIKE 'f1000000-%' OR "id" LIKE 'f2000000-%'`);
    await queryRunner.query(`DELETE FROM "spj_revenue_declarations" WHERE "id" LIKE 'e1000000-%'`);
    await queryRunner.query(`DELETE FROM "spj_uj_returns" WHERE "id" LIKE 'b2000000-%'`);
    await queryRunner.query(`DELETE FROM "spj_uj_expenses" WHERE "id" LIKE 'd1000000-%'`);
    await queryRunner.query(`DELETE FROM "spj_expenses" WHERE "id" LIKE 'c1000000-%'`);
    await queryRunner.query(`DELETE FROM "spj_uj_disbursements" WHERE "id" LIKE 'b1000000-%'`);
    await queryRunner.query(`DELETE FROM "spj_uj" WHERE "id" = 'b0000000-0000-0000-0000-000000000001'`);
  }
}
