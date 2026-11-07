import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgentTicketSalesToSpjRevenue1782900000000
  implements MigrationInterface
{
  name = 'AddAgentTicketSalesToSpjRevenue1782900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tambahkan nilai enum TICKET_AGENT ke spj_revenue_declaration_type_enum
    await queryRunner.query(`
      ALTER TYPE "public"."spj_revenue_declaration_type_enum" ADD VALUE IF NOT EXISTS 'TICKET_AGENT';
    `);

    // 2. Tambahkan kolom relasi tiket agen, kuota, harga, komisi, dan settlement
    await queryRunner.query(`
      ALTER TABLE "spj_revenue_declarations"
      ADD COLUMN IF NOT EXISTS "agent_id" uuid,
      ADD COLUMN IF NOT EXISTS "seat_class_id" uuid,
      ADD COLUMN IF NOT EXISTS "ticket_count" integer,
      ADD COLUMN IF NOT EXISTS "ticket_price" numeric(20, 2),
      ADD COLUMN IF NOT EXISTS "agent_commission_amount" numeric(20, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS "settlement_type" "public"."agents_settlement_type_enum",
      ADD COLUMN IF NOT EXISTS "bank_account_id" uuid,
      ADD COLUMN IF NOT EXISTS "journal_id" uuid;
    `);

    // 3. Tambahkan Foreign Key Constraints
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "spj_revenue_declarations"
        ADD CONSTRAINT "FK_spj_revenue_agent" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "spj_revenue_declarations"
        ADD CONSTRAINT "FK_spj_revenue_seat_class" FOREIGN KEY ("seat_class_id") REFERENCES "seat_classes"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "spj_revenue_declarations"
        ADD CONSTRAINT "FK_spj_revenue_bank_account" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "spj_revenue_declarations"
        ADD CONSTRAINT "FK_spj_revenue_journal" FOREIGN KEY ("journal_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "spj_revenue_declarations"
      DROP CONSTRAINT IF EXISTS "FK_spj_revenue_journal",
      DROP CONSTRAINT IF EXISTS "FK_spj_revenue_bank_account",
      DROP CONSTRAINT IF EXISTS "FK_spj_revenue_seat_class",
      DROP CONSTRAINT IF EXISTS "FK_spj_revenue_agent";
    `);

    await queryRunner.query(`
      ALTER TABLE "spj_revenue_declarations"
      DROP COLUMN IF EXISTS "journal_id",
      DROP COLUMN IF EXISTS "bank_account_id",
      DROP COLUMN IF EXISTS "settlement_type",
      DROP COLUMN IF EXISTS "agent_commission_amount",
      DROP COLUMN IF EXISTS "ticket_price",
      DROP COLUMN IF EXISTS "ticket_count",
      DROP COLUMN IF EXISTS "seat_class_id",
      DROP COLUMN IF EXISTS "agent_id";
    `);
  }
}
