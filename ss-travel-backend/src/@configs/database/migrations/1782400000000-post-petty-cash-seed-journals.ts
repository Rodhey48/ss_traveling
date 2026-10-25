import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostPettyCashSeedJournals1782400000000
  implements MigrationInterface
{
  name = 'PostPettyCashSeedJournals1782400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        v_period_id uuid;
        v_company_id uuid;
        v_user_id uuid;
        v_acc_petty_id uuid;
        v_acc_bca_id uuid;
        v_acc_snack_id uuid;
        v_acc_standby_id uuid;
        v_acc_langsir_id uuid;
        v_acc_supplies_id uuid;
        v_bus_1_id uuid;
        v_bus_3_id uuid;

        v_t1_id uuid;
        v_t2_id uuid;
        v_t3_id uuid;
        v_t4_id uuid;
        v_t5_id uuid;

        v_j1_id uuid := gen_random_uuid();
        v_j2_id uuid := gen_random_uuid();
        v_j3_id uuid := gen_random_uuid();
        v_j4_id uuid := gen_random_uuid();
        v_j5_id uuid := gen_random_uuid();
      BEGIN
        SELECT id INTO v_period_id FROM "fiscal_periods" WHERE status = 'OPEN' ORDER BY start_date DESC LIMIT 1;
        SELECT id INTO v_company_id FROM "companies" LIMIT 1;
        SELECT id INTO v_user_id FROM "users" WHERE email = 'accountant@sstravelink.id' LIMIT 1;

        SELECT id INTO v_acc_petty_id FROM "accounts" WHERE code = '11103' LIMIT 1;
        SELECT id INTO v_acc_bca_id FROM "accounts" WHERE code = '11104' LIMIT 1;
        SELECT id INTO v_acc_snack_id FROM "accounts" WHERE code = '52104' LIMIT 1;
        SELECT id INTO v_acc_standby_id FROM "accounts" WHERE code = '53105' LIMIT 1;
        SELECT id INTO v_acc_langsir_id FROM "accounts" WHERE code = '53106' LIMIT 1;
        SELECT id INTO v_acc_supplies_id FROM "accounts" WHERE code = '57102' LIMIT 1;

        SELECT id INTO v_bus_1_id FROM "vehicles" WHERE code = 'SS-01' LIMIT 1;
        SELECT id INTO v_bus_3_id FROM "vehicles" WHERE code = 'SS-03' LIMIT 1;

        SELECT id INTO v_t1_id FROM "cash_transactions" WHERE transaction_no = 'BKM-KAS/2610/0001';
        SELECT id INTO v_t2_id FROM "cash_transactions" WHERE transaction_no = 'BKK-KAS/2610/0001';
        SELECT id INTO v_t3_id FROM "cash_transactions" WHERE transaction_no = 'BKK-KAS/2610/0002';
        SELECT id INTO v_t4_id FROM "cash_transactions" WHERE transaction_no = 'BKK-KAS/2610/0003';
        SELECT id INTO v_t5_id FROM "cash_transactions" WHERE transaction_no = 'BKK-KAS/2610/0004';

        IF v_period_id IS NOT NULL AND v_acc_petty_id IS NOT NULL THEN
          -- 1. Jurnal Replenishment Kas Kecil Rp 10.000.000
          IF v_t1_id IS NOT NULL AND v_acc_bca_id IS NOT NULL THEN
            INSERT INTO "journal_entries" (
              "id", "journal_no", "journal_date", "period_id", "source_type", "source_id",
              "description", "status", "company_id", "total_debit", "total_credit", "posted_at", "posted_by"
            ) VALUES (
              v_j1_id, 'JV/2610/0501', '2026-10-01 00:00:00+00', v_period_id, 'CASH_TRANSACTION', v_t1_id,
              '[REPLENISHMENT KAS KECIL] Pengisian kembali plafon kas kecil garasi dari Bank BCA',
              'POSTED', v_company_id, 10000000.00, 10000000.00, now(), v_user_id
            );

            INSERT INTO "journal_lines" ("id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description")
            VALUES (gen_random_uuid(), v_j1_id, 1, v_acc_petty_id, 10000000.00, 0.00, 'Penambahan saldo Kas Kecil Garasi');

            INSERT INTO "journal_lines" ("id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description")
            VALUES (gen_random_uuid(), v_j1_id, 2, v_acc_bca_id, 0.00, 10000000.00, 'Pencairan dana kas kecil dari Bank BCA Operasional');

            UPDATE "cash_transactions" SET "journal_entry_id" = v_j1_id WHERE "id" = v_t1_id;
          END IF;

          -- 2. Jurnal Snack Onboard Bus SS-01 Rp 350.000
          IF v_t2_id IS NOT NULL AND v_acc_snack_id IS NOT NULL THEN
            INSERT INTO "journal_entries" (
              "id", "journal_no", "journal_date", "period_id", "source_type", "source_id",
              "description", "status", "company_id", "total_debit", "total_credit", "posted_at", "posted_by"
            ) VALUES (
              v_j2_id, 'JV/2610/0502', '2026-10-04 00:00:00+00', v_period_id, 'CASH_TRANSACTION', v_t2_id,
              '[KAS KECIL POOL] Kulakan snack, kopi sachet, dan amenity kabin bus SS-01',
              'POSTED', v_company_id, 350000.00, 350000.00, now(), v_user_id
            );

            INSERT INTO "journal_lines" ("id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description", "vehicle_id")
            VALUES (gen_random_uuid(), v_j2_id, 1, v_acc_snack_id, 350000.00, 0.00, 'Beban Snack, Amenity, & Fasilitas Onboard Bus SS-01', v_bus_1_id);

            INSERT INTO "journal_lines" ("id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description")
            VALUES (gen_random_uuid(), v_j2_id, 2, v_acc_petty_id, 0.00, 350000.00, 'Pengeluaran Kas Kecil Garasi (BKK-KAS/2610/0001)');

            UPDATE "cash_transactions" SET "journal_entry_id" = v_j2_id WHERE "id" = v_t2_id;
          END IF;

          -- 3. Jurnal Uang Makan Standby Driver Rp 150.000
          IF v_t3_id IS NOT NULL AND v_acc_standby_id IS NOT NULL THEN
            INSERT INTO "journal_entries" (
              "id", "journal_no", "journal_date", "period_id", "source_type", "source_id",
              "description", "status", "company_id", "total_debit", "total_credit", "posted_at", "posted_by"
            ) VALUES (
              v_j3_id, 'JV/2610/0503', '2026-10-08 00:00:00+00', v_period_id, 'CASH_TRANSACTION', v_t3_id,
              '[KAS KECIL POOL] Uang makan piket standby 3 hari Driver Hendra di pool Ciputat',
              'POSTED', v_company_id, 150000.00, 150000.00, now(), v_user_id
            );

            INSERT INTO "journal_lines" ("id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description")
            VALUES (gen_random_uuid(), v_j3_id, 1, v_acc_standby_id, 150000.00, 0.00, 'Beban Uang Makan Standby Kru (Non-SPJ Garasi)');

            INSERT INTO "journal_lines" ("id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description")
            VALUES (gen_random_uuid(), v_j3_id, 2, v_acc_petty_id, 0.00, 150000.00, 'Pengeluaran Kas Kecil Garasi (BKK-KAS/2610/0002)');

            UPDATE "cash_transactions" SET "journal_entry_id" = v_j3_id WHERE "id" = v_t3_id;
          END IF;

          -- 4. Jurnal Insentif Langsir Armada SS-03 Rp 200.000
          IF v_t4_id IS NOT NULL AND v_acc_langsir_id IS NOT NULL THEN
            INSERT INTO "journal_entries" (
              "id", "journal_no", "journal_date", "period_id", "source_type", "source_id",
              "description", "status", "company_id", "total_debit", "total_credit", "posted_at", "posted_by"
            ) VALUES (
              v_j4_id, 'JV/2610/0504', '2026-10-12 00:00:00+00', v_period_id, 'CASH_TRANSACTION', v_t4_id,
              '[KAS KECIL POOL] Uang saku insentif langsir armada SS-03 kosongan ke Karoseri Adiputro',
              'POSTED', v_company_id, 200000.00, 200000.00, now(), v_user_id
            );

            INSERT INTO "journal_lines" ("id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description", "vehicle_id")
            VALUES (gen_random_uuid(), v_j4_id, 1, v_acc_langsir_id, 200000.00, 0.00, 'Beban Insentif Langsir & Dinas Teknis Kru Bus SS-03', v_bus_3_id);

            INSERT INTO "journal_lines" ("id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description")
            VALUES (gen_random_uuid(), v_j4_id, 2, v_acc_petty_id, 0.00, 200000.00, 'Pengeluaran Kas Kecil Garasi (BKK-KAS/2610/0003)');

            UPDATE "cash_transactions" SET "journal_entry_id" = v_j4_id WHERE "id" = v_t4_id;
          END IF;

          -- 5. Jurnal Shampo Cuci Bus & Kuas Semir Ban Rp 120.000
          IF v_t5_id IS NOT NULL AND v_acc_supplies_id IS NOT NULL THEN
            INSERT INTO "journal_entries" (
              "id", "journal_no", "journal_date", "period_id", "source_type", "source_id",
              "description", "status", "company_id", "total_debit", "total_credit", "posted_at", "posted_by"
            ) VALUES (
              v_j5_id, 'JV/2610/0505', '2026-10-15 00:00:00+00', v_period_id, 'CASH_TRANSACTION', v_t5_id,
              '[KAS KECIL POOL] Pembelian shampo cuci bus 2 jerigen dan kuas spon semir ban garasi',
              'POSTED', v_company_id, 120000.00, 120000.00, now(), v_user_id
            );

            INSERT INTO "journal_lines" ("id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description")
            VALUES (gen_random_uuid(), v_j5_id, 1, v_acc_supplies_id, 120000.00, 0.00, 'Beban Perlengkapan, Sabun Cuci Bus & ATK Pool');

            INSERT INTO "journal_lines" ("id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description")
            VALUES (gen_random_uuid(), v_j5_id, 2, v_acc_petty_id, 0.00, 120000.00, 'Pengeluaran Kas Kecil Garasi (BKK-KAS/2610/0004)');

            UPDATE "cash_transactions" SET "journal_entry_id" = v_j5_id WHERE "id" = v_t5_id;
          END IF;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "journal_entries" WHERE "journal_no" IN ('JV/2610/0501', 'JV/2610/0502', 'JV/2610/0503', 'JV/2610/0504', 'JV/2610/0505');
    `);
  }
}
