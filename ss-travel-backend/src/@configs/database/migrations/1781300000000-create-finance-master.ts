import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFinanceMaster1781300000000 implements MigrationInterface {
  name = 'CreateFinanceMaster1781300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."accounts_type_enum" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."accounts_normal_balance_enum" AS ENUM('DEBIT', 'CREDIT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."fiscal_years_status_enum" AS ENUM('OPEN', 'CLOSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."fiscal_periods_status_enum" AS ENUM('OPEN', 'CLOSING', 'CLOSED', 'REOPENED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create accounts table
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(30) NOT NULL,
        "name" character varying(150) NOT NULL,
        "type" "public"."accounts_type_enum" NOT NULL,
        "normal_balance" "public"."accounts_normal_balance_enum" NOT NULL,
        "parent_id" uuid,
        "is_postable" boolean NOT NULL DEFAULT true,
        "description" text,
        CONSTRAINT "UQ_accounts_code" UNIQUE ("code"),
        CONSTRAINT "PK_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_accounts_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_accounts_parent" FOREIGN KEY ("parent_id") REFERENCES "accounts"("id") ON DELETE RESTRICT
      )
    `);

    // 3. Create cash_accounts table
    await queryRunner.query(`
      CREATE TABLE "cash_accounts" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(30) NOT NULL,
        "name" character varying(100) NOT NULL,
        "account_id" uuid NOT NULL,
        "custodian_user_id" uuid,
        "cost_center_id" uuid,
        "description" text,
        CONSTRAINT "UQ_cash_accounts_code" UNIQUE ("code"),
        CONSTRAINT "PK_cash_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cash_accounts_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_cash_accounts_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_cash_accounts_custodian" FOREIGN KEY ("custodian_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cash_accounts_cost_center" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL
      )
    `);

    // 4. Create bank_accounts table
    await queryRunner.query(`
      CREATE TABLE "bank_accounts" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(30) NOT NULL,
        "bank_name" character varying(50) NOT NULL,
        "account_name" character varying(100) NOT NULL,
        "account_number" character varying(50) NOT NULL,
        "account_number_masked" character varying(50) NOT NULL,
        "account_id" uuid NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'IDR',
        "description" text,
        CONSTRAINT "UQ_bank_accounts_code" UNIQUE ("code"),
        CONSTRAINT "PK_bank_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bank_accounts_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_bank_accounts_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT
      )
    `);

    // 5. Create fiscal_years table
    await queryRunner.query(`
      CREATE TABLE "fiscal_years" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "year" integer NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "status" "public"."fiscal_years_status_enum" NOT NULL DEFAULT 'OPEN',
        CONSTRAINT "UQ_fiscal_years_year" UNIQUE ("year"),
        CONSTRAINT "PK_fiscal_years_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fiscal_years_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    // 6. Create fiscal_periods table
    await queryRunner.query(`
      CREATE TABLE "fiscal_periods" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "fiscal_year_id" uuid NOT NULL,
        "period_no" integer NOT NULL,
        "name" character varying(50) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "status" "public"."fiscal_periods_status_enum" NOT NULL DEFAULT 'OPEN',
        "closed_at" TIMESTAMP WITH TIME ZONE,
        "closed_by" uuid,
        "close_reason" text,
        CONSTRAINT "PK_fiscal_periods_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fiscal_periods_year" FOREIGN KEY ("fiscal_year_id") REFERENCES "fiscal_years"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_fiscal_periods_closed_by" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // 7. Create document_sequences table
    await queryRunner.query(`
      CREATE TABLE "document_sequences" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "document_type" character varying(50) NOT NULL,
        "period_key" character varying(20) NOT NULL,
        "prefix" character varying(50) NOT NULL,
        "last_number" integer NOT NULL DEFAULT 0,
        "padding" integer NOT NULL DEFAULT 4,
        CONSTRAINT "UQ_document_sequences_type_period" UNIQUE ("document_type", "period_key"),
        CONSTRAINT "PK_document_sequences_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_document_sequences_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    // Indexes for high performance queries
    await queryRunner.query(
      `CREATE INDEX "IDX_accounts_type" ON "accounts" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_accounts_parent_id" ON "accounts" ("parent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fiscal_periods_year_no" ON "fiscal_periods" ("fiscal_year_id", "period_no")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "document_sequences" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fiscal_periods" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fiscal_years" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bank_accounts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cash_accounts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fiscal_periods_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fiscal_years_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."accounts_normal_balance_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."accounts_type_enum"`);
  }
}
