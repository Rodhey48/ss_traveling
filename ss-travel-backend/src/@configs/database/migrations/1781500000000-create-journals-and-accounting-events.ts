import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJournalsAndAccountingEvents1781500000000
  implements MigrationInterface
{
  name = 'CreateJournalsAndAccountingEvents1781500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."journal_entries_status_enum" AS ENUM('DRAFT', 'POSTED', 'REVERSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."journal_entries_source_type_enum" AS ENUM(
          'MANUAL',
          'SPJ',
          'AR_INVOICE',
          'AP_INVOICE',
          'CASH_TRANSACTION',
          'BANK_TRANSACTION',
          'DEPRECIATION',
          'PERIOD_CLOSING',
          'SETTLEMENT'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create journal_entries table
    await queryRunner.query(`
      CREATE TABLE "journal_entries" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "journal_no" character varying(50) NOT NULL,
        "journal_date" date NOT NULL,
        "period_id" uuid NOT NULL,
        "source_type" "public"."journal_entries_source_type_enum" NOT NULL DEFAULT 'MANUAL',
        "source_id" uuid,
        "description" text NOT NULL,
        "status" "public"."journal_entries_status_enum" NOT NULL DEFAULT 'POSTED',
        "posted_at" TIMESTAMP WITH TIME ZONE,
        "posted_by" uuid,
        "reversal_of_id" uuid,
        "total_debit" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_credit" numeric(20,2) NOT NULL DEFAULT '0.00',
        CONSTRAINT "UQ_journal_entries_journal_no" UNIQUE ("journal_no"),
        CONSTRAINT "PK_journal_entries_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_journal_entries_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_journal_entries_period" FOREIGN KEY ("period_id") REFERENCES "fiscal_periods"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_journal_entries_posted_by" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_journal_entries_reversal_of" FOREIGN KEY ("reversal_of_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL
      )
    `);

    // 3. Create journal_lines table
    await queryRunner.query(`
      CREATE TABLE "journal_lines" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "journal_entry_id" uuid NOT NULL,
        "line_no" integer NOT NULL,
        "account_id" uuid NOT NULL,
        "debit" numeric(20,2) NOT NULL DEFAULT '0.00',
        "credit" numeric(20,2) NOT NULL DEFAULT '0.00',
        "description" character varying(255),
        "business_unit_id" uuid,
        "cost_center_id" uuid,
        "profit_center_id" uuid,
        "trip_id" uuid,
        "trip_leg_id" uuid,
        "vehicle_id" uuid,
        "counterparty_type" character varying(50),
        "counterparty_id" uuid,
        CONSTRAINT "PK_journal_lines_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_journal_lines_journal_entry" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_journal_lines_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_journal_lines_business_unit" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_journal_lines_cost_center" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_journal_lines_profit_center" FOREIGN KEY ("profit_center_id") REFERENCES "profit_centers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_journal_lines_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL
      )
    `);

    // 4. Create accounting_events table
    await queryRunner.query(`
      CREATE TABLE "accounting_events" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "source_type" character varying(50) NOT NULL,
        "source_id" uuid,
        "event_type" character varying(50) NOT NULL,
        "idempotency_key" character varying(150) NOT NULL,
        "journal_entry_id" uuid NOT NULL,
        CONSTRAINT "UQ_accounting_events_idempotency_key" UNIQUE ("idempotency_key"),
        CONSTRAINT "PK_accounting_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_accounting_events_journal_entry" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE
      )
    `);

    // 5. Create Indices
    await queryRunner.query(`CREATE INDEX "IDX_journal_entries_date" ON "journal_entries" ("journal_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_journal_entries_period" ON "journal_entries" ("period_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_journal_entries_status" ON "journal_entries" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_journal_entries_source" ON "journal_entries" ("source_type", "source_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_journal_lines_journal" ON "journal_lines" ("journal_entry_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_journal_lines_account" ON "journal_lines" ("account_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_journal_lines_vehicle" ON "journal_lines" ("vehicle_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_journal_lines_trip" ON "journal_lines" ("trip_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_accounting_events_key" ON "accounting_events" ("idempotency_key")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_accounting_events_key"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_journal_lines_trip"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_journal_lines_vehicle"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_journal_lines_account"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_journal_lines_journal"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_journal_entries_source"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_journal_entries_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_journal_entries_period"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_journal_entries_date"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "accounting_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_entries"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."journal_entries_source_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."journal_entries_status_enum"`);
  }
}
