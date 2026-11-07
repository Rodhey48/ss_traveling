import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoordinationFeeSystem1783200000000
  implements MigrationInterface
{
  name = 'CreateCoordinationFeeSystem1783200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tambahkan akun COA 52105 (Beban) dan 22102 (Utang) jika belum ada
    await queryRunner.query(`
      INSERT INTO accounts (id, code, name, type, normal_balance, is_postable, description, company_id)
      SELECT gen_random_uuid(), '52105', 'Beban Koordinasi Lapangan & Pengurus Jalur', 'EXPENSE'::"public"."accounts_type_enum", 'DEBIT'::"public"."accounts_normal_balance_enum", true, 'Fee koordinasi per tiket terjual pengurus wilayah Barat & Timur', c.id
      FROM companies c
      WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '52105');
    `);

    await queryRunner.query(`
      INSERT INTO accounts (id, code, name, type, normal_balance, is_postable, description, company_id)
      SELECT gen_random_uuid(), '22102', 'Utang Jasa Koordinator Lapangan (Barat & Timur)', 'LIABILITY'::"public"."accounts_type_enum", 'CREDIT'::"public"."accounts_normal_balance_enum", true, 'Kewajiban utang fee koordinasi tiket pengurus wilayah', c.id
      FROM companies c
      WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE code = '22102');
    `);

    // 2. Buat Enum Status Batch & Fee jika belum ada
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."coordination_fee_batch_status_enum" AS ENUM('DRAFT', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_coordination_fee_status_enum" AS ENUM('UNPAID', 'PENDING_BATCH', 'PAID');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Buat Tabel coordination_fee_batches
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coordination_fee_batches" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID REFERENCES "companies"("id") ON DELETE CASCADE,
        "batch_no" VARCHAR(60) NOT NULL UNIQUE,
        "zone" "public"."coordinator_fee_rules_zone_enum" NOT NULL,
        "coordinator_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "coordinator_name" VARCHAR(120),
        "total_spjs" INTEGER NOT NULL DEFAULT 0,
        "total_tickets" INTEGER NOT NULL DEFAULT 0,
        "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "payment_date" DATE NOT NULL,
        "bank_account_id" UUID REFERENCES "cash_accounts"("id") ON DELETE SET NULL,
        "reference_number" VARCHAR(100),
        "receipt_url" TEXT,
        "journal_id" UUID REFERENCES "journal_entries"("id") ON DELETE SET NULL,
        "status" "public"."coordination_fee_batch_status_enum" NOT NULL DEFAULT 'COMPLETED',
        "notes" TEXT,
        "created_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Buat Tabel spj_coordination_fees
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "spj_coordination_fees" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID REFERENCES "companies"("id") ON DELETE CASCADE,
        "spj_id" UUID REFERENCES "spjs"("id") ON DELETE CASCADE,
        "spj_leg_id" UUID REFERENCES "spj_legs"("id") ON DELETE SET NULL,
        "zone" "public"."coordinator_fee_rules_zone_enum" NOT NULL,
        "ticket_count" INTEGER NOT NULL DEFAULT 0,
        "fee_per_pax" DECIMAL(15,2) NOT NULL DEFAULT 10000,
        "total_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "coordinator_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "status" "public"."spj_coordination_fee_status_enum" NOT NULL DEFAULT 'UNPAID',
        "settlement_batch_id" UUID REFERENCES "coordination_fee_batches"("id") ON DELETE SET NULL,
        "journal_id" UUID REFERENCES "journal_entries"("id") ON DELETE SET NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Seed default coordinator_fee_rules untuk WEST dan EAST jika masih kosong
    await queryRunner.query(`
      INSERT INTO coordinator_fee_rules (id, company_id, zone, fee_per_pax, effective_from)
      SELECT gen_random_uuid(), c.id, 'WEST'::"public"."coordinator_fee_rules_zone_enum", 10000.00, NOW()
      FROM companies c
      WHERE NOT EXISTS (
        SELECT 1 FROM coordinator_fee_rules WHERE zone = 'WEST' AND company_id = c.id
      );
    `);

    await queryRunner.query(`
      INSERT INTO coordinator_fee_rules (id, company_id, zone, fee_per_pax, effective_from)
      SELECT gen_random_uuid(), c.id, 'EAST'::"public"."coordinator_fee_rules_zone_enum", 10000.00, NOW()
      FROM companies c
      WHERE NOT EXISTS (
        SELECT 1 FROM coordinator_fee_rules WHERE zone = 'EAST' AND company_id = c.id
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "spj_coordination_fees" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coordination_fee_batches" CASCADE`);
  }
}
