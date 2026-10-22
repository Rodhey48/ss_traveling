import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCrewCashSettlementsAndDiscrepancies1781800000000
  implements MigrationInterface
{
  name = 'CreateCrewCashSettlementsAndDiscrepancies1781800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."crew_cash_settlement_status_enum" AS ENUM(
          'DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."settlement_uj_status_enum" AS ENUM(
          'PENDING', 'BALANCED', 'DISCREPANCY'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."settlement_revenue_status_enum" AS ENUM(
          'PENDING', 'MATCHED', 'DISCREPANCY_RECORDED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."remittance_payment_method_enum" AS ENUM(
          'CASH', 'BANK_TRANSFER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."remittance_status_enum" AS ENUM(
          'PENDING', 'VERIFIED', 'REJECTED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."discrepancy_source_type_enum" AS ENUM(
          'UJ_EXPENSE_UNVERIFIED', 'REVENUE_SHORTAGE', 'REVENUE_OVERAGE', 'OTHER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."discrepancy_resolution_status_enum" AS ENUM(
          'PENDING_INVESTIGATION', 'RESOLVED', 'REJECTED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."discrepancy_resolution_decision_enum" AS ENUM(
          'COMPANY_WAIVER', 'CHARGE_TO_CREW', 'ALLOCATION_CORRECTION'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create crew_cash_settlements table
    await queryRunner.query(`
      CREATE TABLE "crew_cash_settlements" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "settlement_no" character varying(50) NOT NULL,
        "spj_id" uuid NOT NULL,
        "status" "public"."crew_cash_settlement_status_enum" NOT NULL DEFAULT 'DRAFT',
        "uj_status" "public"."settlement_uj_status_enum" NOT NULL DEFAULT 'PENDING',
        "revenue_status" "public"."settlement_revenue_status_enum" NOT NULL DEFAULT 'PENDING',
        "cashier_id" uuid,
        "submitted_at" TIMESTAMP WITH TIME ZONE,
        "reviewed_by_id" uuid,
        "reviewed_at" TIMESTAMP WITH TIME ZONE,
        "notes" text,
        "total_uj_disbursed" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_uj_spent" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_uj_returned" numeric(20,2) NOT NULL DEFAULT '0.00',
        "uj_balance" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_revenue_expected" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_revenue_remitted" numeric(20,2) NOT NULL DEFAULT '0.00',
        "revenue_balance" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_cash_received" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_cash_paid" numeric(20,2) NOT NULL DEFAULT '0.00',
        "bkm_no" character varying(50),
        "bkk_no" character varying(50),
        "journal_entry_id" uuid,
        CONSTRAINT "UQ_crew_cash_settlements_no" UNIQUE ("settlement_no"),
        CONSTRAINT "PK_crew_cash_settlements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_crew_cash_settlements_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_crew_cash_settlements_spj" FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_crew_cash_settlements_cashier" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_crew_cash_settlements_reviewer" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_crew_cash_settlements_journal" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL
      );
    `);

    // 3. Create crew_cash_remittances table
    await queryRunner.query(`
      CREATE TABLE "crew_cash_remittances" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "remittance_no" character varying(50) NOT NULL,
        "settlement_id" uuid,
        "spj_id" uuid NOT NULL,
        "depositor_crew_id" uuid NOT NULL,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "cash_account_id" uuid,
        "received_by_cashier_id" uuid,
        "remitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "payment_method" "public"."remittance_payment_method_enum" NOT NULL DEFAULT 'CASH',
        "status" "public"."remittance_status_enum" NOT NULL DEFAULT 'VERIFIED',
        "bkm_no" character varying(50),
        "notes" text,
        CONSTRAINT "UQ_crew_cash_remittances_no" UNIQUE ("remittance_no"),
        CONSTRAINT "PK_crew_cash_remittances" PRIMARY KEY ("id"),
        CONSTRAINT "FK_crew_cash_remittances_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_crew_cash_remittances_settlement" FOREIGN KEY ("settlement_id") REFERENCES "crew_cash_settlements"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_crew_cash_remittances_spj" FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_crew_cash_remittances_depositor" FOREIGN KEY ("depositor_crew_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_crew_cash_remittances_cash_account" FOREIGN KEY ("cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_crew_cash_remittances_cashier" FOREIGN KEY ("received_by_cashier_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    // 4. Create crew_cash_remittance_allocations table
    await queryRunner.query(`
      CREATE TABLE "crew_cash_remittance_allocations" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "remittance_id" uuid NOT NULL,
        "revenue_declaration_id" uuid NOT NULL,
        "allocated_amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "notes" text,
        CONSTRAINT "PK_crew_cash_remittance_allocations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_crew_cash_remittance_alloc_remittance" FOREIGN KEY ("remittance_id") REFERENCES "crew_cash_remittances"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_crew_cash_remittance_alloc_declaration" FOREIGN KEY ("revenue_declaration_id") REFERENCES "spj_revenue_declarations"("id") ON DELETE RESTRICT
      );
    `);

    // 5. Create crew_cash_discrepancies table
    await queryRunner.query(`
      CREATE TABLE "crew_cash_discrepancies" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "discrepancy_no" character varying(50) NOT NULL,
        "settlement_id" uuid,
        "spj_id" uuid NOT NULL,
        "source_type" "public"."discrepancy_source_type_enum" NOT NULL,
        "expected_amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "actual_amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "difference_amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "reported_by_id" uuid NOT NULL,
        "responsible_crew_id" uuid,
        "reason" text NOT NULL,
        "investigation_notes" text,
        "resolution_status" "public"."discrepancy_resolution_status_enum" NOT NULL DEFAULT 'PENDING_INVESTIGATION',
        "resolution_decision" "public"."discrepancy_resolution_decision_enum",
        "resolution_account_id" uuid,
        "resolved_by_id" uuid,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "journal_entry_id" uuid,
        CONSTRAINT "UQ_crew_cash_discrepancies_no" UNIQUE ("discrepancy_no"),
        CONSTRAINT "PK_crew_cash_discrepancies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_crew_cash_discrepancies_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_crew_cash_discrepancies_settlement" FOREIGN KEY ("settlement_id") REFERENCES "crew_cash_settlements"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_crew_cash_discrepancies_spj" FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_crew_cash_discrepancies_reported_by" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_crew_cash_discrepancies_responsible_crew" FOREIGN KEY ("responsible_crew_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_crew_cash_discrepancies_account" FOREIGN KEY ("resolution_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_crew_cash_discrepancies_resolved_by" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_crew_cash_discrepancies_journal" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL
      );
    `);

    // 6. Indexes for high-performance querying
    await queryRunner.query(
      `CREATE INDEX "IDX_crew_cash_settlements_spj" ON "crew_cash_settlements" ("spj_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_crew_cash_settlements_status" ON "crew_cash_settlements" ("status");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_crew_cash_remittances_spj" ON "crew_cash_remittances" ("spj_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_crew_cash_remittances_settlement" ON "crew_cash_remittances" ("settlement_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_crew_cash_discrepancies_spj" ON "crew_cash_discrepancies" ("spj_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_crew_cash_discrepancies_status" ON "crew_cash_discrepancies" ("resolution_status");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "crew_cash_discrepancies" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crew_cash_remittance_allocations" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crew_cash_remittances" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crew_cash_settlements" CASCADE;`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."discrepancy_resolution_decision_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."discrepancy_resolution_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."discrepancy_source_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."remittance_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."remittance_payment_method_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."settlement_revenue_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."settlement_uj_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."crew_cash_settlement_status_enum";`);
  }
}
