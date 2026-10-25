import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCashTransactions1782300000000
  implements MigrationInterface
{
  name = 'CreateCashTransactions1782300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cash_transaction_type_enum') THEN
          CREATE TYPE "public"."cash_transaction_type_enum" AS ENUM('DISBURSEMENT', 'REPLENISHMENT');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cash_transaction_status_enum') THEN
          CREATE TYPE "public"."cash_transaction_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'petty_cash_category_enum') THEN
          CREATE TYPE "public"."petty_cash_category_enum" AS ENUM(
            'FACILITY_SNACK',
            'STANDBY_CREW',
            'DEADHEAD_INSENTIF',
            'POOL_SUPPLIES',
            'OVERTIME_MEKANIK',
            'OFFICE_CONSUMPTION',
            'OFFICE_TRAVEL',
            'WORKSHOP_EMERGENCY',
            'OTHER'
          );
        END IF;
      END $$;
    `);

    // 2. Table cash_transactions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cash_transactions" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "transaction_no" character varying(50) NOT NULL,
        "cash_account_id" uuid NOT NULL,
        "type" "public"."cash_transaction_type_enum" NOT NULL DEFAULT 'DISBURSEMENT',
        "transaction_date" date NOT NULL,
        "amount" numeric(20,2) NOT NULL,
        "recipient" character varying(150) NOT NULL,
        "expense_account_id" uuid,
        "source_bank_account_id" uuid,
        "source_cash_account_id" uuid,
        "vehicle_id" uuid,
        "cost_center_id" uuid,
        "category" "public"."petty_cash_category_enum" NOT NULL DEFAULT 'OTHER',
        "description" text NOT NULL,
        "receipt_no" character varying(50),
        "receipt_image_url" text,
        "status" "public"."cash_transaction_status_enum" NOT NULL DEFAULT 'SUBMITTED',
        "journal_entry_id" uuid,
        "created_by_id" uuid,
        "verified_by_id" uuid,
        "verified_at" TIMESTAMP WITH TIME ZONE,
        "rejection_reason" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT "PK_cash_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cash_transactions_no" UNIQUE ("transaction_no"),
        CONSTRAINT "FK_cash_transactions_cash_account" FOREIGN KEY ("cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_cash_transactions_expense_account" FOREIGN KEY ("expense_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_cash_transactions_source_bank" FOREIGN KEY ("source_bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cash_transactions_source_cash" FOREIGN KEY ("source_cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cash_transactions_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cash_transactions_cost_center" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cash_transactions_journal_entry" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cash_transactions_creator" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cash_transactions_verifier" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // 3. Indices
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cash_transactions_no" ON "cash_transactions" ("transaction_no");
      CREATE INDEX IF NOT EXISTS "IDX_cash_transactions_cash_account" ON "cash_transactions" ("cash_account_id");
      CREATE INDEX IF NOT EXISTS "IDX_cash_transactions_date" ON "cash_transactions" ("transaction_date");
      CREATE INDEX IF NOT EXISTS "IDX_cash_transactions_status" ON "cash_transactions" ("status");
    `);

    // 4. Seed sample real data
    await queryRunner.query(`
      DO $$
      DECLARE
        v_cash_id uuid;
        v_bank_id uuid;
        v_user_kasir_id uuid;
        v_user_acct_id uuid;
        v_bus_1_id uuid;
        v_bus_3_id uuid;
        v_acc_snack_id uuid;
        v_acc_standby_id uuid;
        v_acc_langsir_id uuid;
        v_acc_supplies_id uuid;
        v_acc_konsumsi_id uuid;
      BEGIN
        SELECT id INTO v_cash_id FROM "cash_accounts" WHERE code = 'CASH-PETTY-GARASI' LIMIT 1;
        SELECT id INTO v_bank_id FROM "bank_accounts" WHERE code = 'BANK-BCA-OPS' LIMIT 1;
        SELECT id INTO v_user_kasir_id FROM "users" WHERE email = 'cashier.ciputat@sstravelink.id' LIMIT 1;
        SELECT id INTO v_user_acct_id FROM "users" WHERE email = 'accountant@sstravelink.id' LIMIT 1;
        SELECT id INTO v_bus_1_id FROM "vehicles" WHERE code = 'SS-01' LIMIT 1;
        SELECT id INTO v_bus_3_id FROM "vehicles" WHERE code = 'SS-03' LIMIT 1;

        SELECT id INTO v_acc_snack_id FROM "accounts" WHERE code = '52104' LIMIT 1;
        SELECT id INTO v_acc_standby_id FROM "accounts" WHERE code = '53105' LIMIT 1;
        SELECT id INTO v_acc_langsir_id FROM "accounts" WHERE code = '53106' LIMIT 1;
        SELECT id INTO v_acc_supplies_id FROM "accounts" WHERE code = '57102' LIMIT 1;
        SELECT id INTO v_acc_konsumsi_id FROM "accounts" WHERE code = '57108' LIMIT 1;

        IF v_cash_id IS NOT NULL THEN
          -- 1. Replenishment Rp 10.000.000 (Awal Bulan)
          INSERT INTO "cash_transactions" (
            "id", "transaction_no", "cash_account_id", "type", "transaction_date",
            "amount", "recipient", "source_bank_account_id", "category", "description",
            "status", "created_by_id", "verified_by_id", "verified_at"
          ) VALUES (
            gen_random_uuid(), 'BKM-KAS/2610/0001', v_cash_id, 'REPLENISHMENT', '2026-10-01',
            10000000.00, 'Pengisian Plafon Kas Kecil Garasi dari Bank BCA', v_bank_id, 'OTHER',
            'Pencairan dana plafon kas kecil operasional bengkel & pool bulan Oktober 2026',
            'VERIFIED', v_user_acct_id, v_user_acct_id, now()
          ) ON CONFLICT ("transaction_no") DO NOTHING;

          -- 2. BKK Snack Onboard Bus SS-01 Rp 350.000
          INSERT INTO "cash_transactions" (
            "id", "transaction_no", "cash_account_id", "type", "transaction_date",
            "amount", "recipient", "expense_account_id", "vehicle_id", "category",
            "description", "receipt_no", "status", "created_by_id", "verified_by_id", "verified_at"
          ) VALUES (
            gen_random_uuid(), 'BKK-KAS/2610/0001', v_cash_id, 'DISBURSEMENT', '2026-10-04',
            350000.00, 'Toko Grosir Snack Berkah', v_acc_snack_id, v_bus_1_id, 'FACILITY_SNACK',
            'Kulakan kacang telur bal-balan 10kg, permen, dan kopi sachet fasilitas kabin bus SS-01', 'NOTA-SNK-882',
            'VERIFIED', v_user_kasir_id, v_user_acct_id, now()
          ) ON CONFLICT ("transaction_no") DO NOTHING;

          -- 3. BKK Uang Makan Standby Driver Rp 150.000
          INSERT INTO "cash_transactions" (
            "id", "transaction_no", "cash_account_id", "type", "transaction_date",
            "amount", "recipient", "expense_account_id", "category",
            "description", "status", "created_by_id", "verified_by_id", "verified_at"
          ) VALUES (
            gen_random_uuid(), 'BKK-KAS/2610/0002', v_cash_id, 'DISBURSEMENT', '2026-10-08',
            150000.00, 'Driver Hendra (Piket Standby)', v_acc_standby_id, 'STANDBY_CREW',
            'Uang makan piket standby 3 hari di pool garasi Ciputat (tidak dinas SPJ)',
            'VERIFIED', v_user_kasir_id, v_user_acct_id, now()
          ) ON CONFLICT ("transaction_no") DO NOTHING;

          -- 4. BKK Insentif Langsir Armada SS-03 Rp 200.000
          INSERT INTO "cash_transactions" (
            "id", "transaction_no", "cash_account_id", "type", "transaction_date",
            "amount", "recipient", "expense_account_id", "vehicle_id", "category",
            "description", "status", "created_by_id", "verified_by_id", "verified_at"
          ) VALUES (
            gen_random_uuid(), 'BKK-KAS/2610/0003', v_cash_id, 'DISBURSEMENT', '2026-10-12',
            200000.00, 'Driver Budi Santoso', v_acc_langsir_id, v_bus_3_id, 'DEADHEAD_INSENTIF',
            'Uang saku insentif langsir armada SS-03 kosongan ke Karoseri Adiputro untuk perbaikan bemper',
            'VERIFIED', v_user_kasir_id, v_user_acct_id, now()
          ) ON CONFLICT ("transaction_no") DO NOTHING;

          -- 5. BKK Sabun Cuci & Kuas Semir Ban Rp 120.000
          INSERT INTO "cash_transactions" (
            "id", "transaction_no", "cash_account_id", "type", "transaction_date",
            "amount", "recipient", "expense_account_id", "category",
            "description", "receipt_no", "status", "created_by_id", "verified_by_id", "verified_at"
          ) VALUES (
            gen_random_uuid(), 'BKK-KAS/2610/0004', v_cash_id, 'DISBURSEMENT', '2026-10-15',
            120000.00, 'Toko Bangunan & Kimia Sejahtera', v_acc_supplies_id, 'POOL_SUPPLIES',
            'Pembelian shampo cuci bus 2 jerigen dan 4 kuas spon semir ban garasi', 'STRUK-KM-419',
            'VERIFIED', v_user_kasir_id, v_user_acct_id, now()
          ) ON CONFLICT ("transaction_no") DO NOTHING;

          -- 6. BKK Kopi & Konsumsi Piket Mekanik Rp 180.000 (SUBMITTED - Menunggu verifikasi user)
          INSERT INTO "cash_transactions" (
            "id", "transaction_no", "cash_account_id", "type", "transaction_date",
            "amount", "recipient", "expense_account_id", "category",
            "description", "receipt_no", "status", "created_by_id"
          ) VALUES (
            gen_random_uuid(), 'BKK-KAS/2610/0005', v_cash_id, 'DISBURSEMENT', '2026-10-24',
            180000.00, 'Warung Bu Siti Pool', v_acc_konsumsi_id, 'OFFICE_CONSUMPTION',
            'Konsumsi kopi hitam, teh manis, dan gorengan piket mekanik lembur servis armada', 'NOTA-WRG-09',
            'SUBMITTED', v_user_kasir_id
          ) ON CONFLICT ("transaction_no") DO NOTHING;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cash_transactions" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."petty_cash_category_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."cash_transaction_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."cash_transaction_type_enum";`);
  }
}
