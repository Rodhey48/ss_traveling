import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArAndApInvoices1781900000000 implements MigrationInterface {
  name = 'CreateArAndApInvoices1781900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ap_vendor_type_enum" AS ENUM(
          'RESTAURANT', 'WORKSHOP', 'AGENT', 'OTHER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ap_invoice_status_enum" AS ENUM(
          'DRAFT', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ap_payment_status_enum" AS ENUM(
          'CONFIRMED', 'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ar_invoice_status_enum" AS ENUM(
          'DRAFT', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ar_receipt_status_enum" AS ENUM(
          'CONFIRMED', 'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."finance_payment_method_enum" AS ENUM(
          'BANK_TRANSFER', 'CASH'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ap_source_type_enum" AS ENUM(
          'RESTAURANT_PERIODIC', 'WORKSHOP_REPAIR', 'AGENT_COMMISSION', 'MANUAL', 'OTHER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ar_source_type_enum" AS ENUM(
          'CHARTER_CONTRACT', 'OTA_SETTLEMENT', 'MANUAL', 'OTHER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create ap_invoices table
    await queryRunner.query(`
      CREATE TABLE "ap_invoices" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "bill_no" character varying(50) NOT NULL,
        "vendor_invoice_no" character varying(100),
        "vendor_type" "public"."ap_vendor_type_enum" NOT NULL DEFAULT 'OTHER',
        "vendor_id" uuid,
        "vendor_name" character varying(150) NOT NULL,
        "invoice_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "due_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "public"."ap_invoice_status_enum" NOT NULL DEFAULT 'DRAFT',
        "currency" character varying(10) NOT NULL DEFAULT 'IDR',
        "subtotal" numeric(20,2) NOT NULL DEFAULT '0.00',
        "tax_amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "paid_amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "source_type" "public"."ap_source_type_enum" NOT NULL DEFAULT 'MANUAL',
        "source_id" uuid,
        "ap_account_id" uuid NOT NULL,
        "notes" text,
        "journal_entry_id" uuid,
        CONSTRAINT "UQ_ap_invoices_bill_no" UNIQUE ("bill_no"),
        CONSTRAINT "PK_ap_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ap_invoices_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ap_invoices_ap_account" FOREIGN KEY ("ap_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ap_invoices_journal" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL
      );
      CREATE INDEX "IDX_ap_invoices_bill_no" ON "ap_invoices" ("bill_no");
      CREATE INDEX "IDX_ap_invoices_vendor_type" ON "ap_invoices" ("vendor_type");
      CREATE INDEX "IDX_ap_invoices_status" ON "ap_invoices" ("status");
    `);

    // 3. Create ap_invoice_lines table
    await queryRunner.query(`
      CREATE TABLE "ap_invoice_lines" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "invoice_id" uuid NOT NULL,
        "line_no" integer NOT NULL,
        "description" character varying(255) NOT NULL,
        "account_id" uuid NOT NULL,
        "qty" numeric(12,2) NOT NULL DEFAULT '1.00',
        "unit_price" numeric(20,2) NOT NULL DEFAULT '0.00',
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "trip_id" uuid,
        "trip_leg_id" uuid,
        "vehicle_id" uuid,
        "cost_center_id" uuid,
        "business_unit_id" uuid,
        "manifest_pax_count" integer,
        "coupon_count" integer,
        "discrepancy_notes" character varying(255),
        CONSTRAINT "PK_ap_invoice_lines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ap_invoice_lines_invoice" FOREIGN KEY ("invoice_id") REFERENCES "ap_invoices"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ap_invoice_lines_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ap_invoice_lines_trip" FOREIGN KEY ("trip_id") REFERENCES "spjs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ap_invoice_lines_trip_leg" FOREIGN KEY ("trip_leg_id") REFERENCES "spj_legs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ap_invoice_lines_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ap_invoice_lines_cost_center" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ap_invoice_lines_business_unit" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL
      );
      CREATE INDEX "IDX_ap_invoice_lines_trip_id" ON "ap_invoice_lines" ("trip_id");
    `);

    // 4. Create ap_payments table
    await queryRunner.query(`
      CREATE TABLE "ap_payments" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "payment_no" character varying(50) NOT NULL,
        "vendor_type" "public"."ap_vendor_type_enum" NOT NULL DEFAULT 'OTHER',
        "vendor_id" uuid,
        "vendor_name" character varying(150) NOT NULL,
        "payment_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "payment_method" "public"."finance_payment_method_enum" NOT NULL DEFAULT 'BANK_TRANSFER',
        "bank_account_id" uuid,
        "cash_account_id" uuid,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "status" "public"."ap_payment_status_enum" NOT NULL DEFAULT 'CONFIRMED',
        "reference" character varying(100),
        "notes" text,
        "journal_entry_id" uuid,
        CONSTRAINT "UQ_ap_payments_payment_no" UNIQUE ("payment_no"),
        CONSTRAINT "PK_ap_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ap_payments_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ap_payments_bank_account" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ap_payments_cash_account" FOREIGN KEY ("cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ap_payments_journal" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL
      );
      CREATE INDEX "IDX_ap_payments_payment_no" ON "ap_payments" ("payment_no");
    `);

    // 5. Create ap_allocations table
    await queryRunner.query(`
      CREATE TABLE "ap_allocations" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "payment_id" uuid NOT NULL,
        "invoice_id" uuid NOT NULL,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        CONSTRAINT "PK_ap_allocations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ap_allocations_payment" FOREIGN KEY ("payment_id") REFERENCES "ap_payments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ap_allocations_invoice" FOREIGN KEY ("invoice_id") REFERENCES "ap_invoices"("id") ON DELETE CASCADE
      );
      CREATE INDEX "IDX_ap_allocations_payment_id" ON "ap_allocations" ("payment_id");
      CREATE INDEX "IDX_ap_allocations_invoice_id" ON "ap_allocations" ("invoice_id");
    `);

    // 6. Create ar_invoices table
    await queryRunner.query(`
      CREATE TABLE "ar_invoices" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "invoice_no" character varying(50) NOT NULL,
        "customer_id" uuid,
        "customer_name" character varying(150) NOT NULL,
        "invoice_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "due_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "public"."ar_invoice_status_enum" NOT NULL DEFAULT 'DRAFT',
        "currency" character varying(10) NOT NULL DEFAULT 'IDR',
        "subtotal" numeric(20,2) NOT NULL DEFAULT '0.00',
        "tax_amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "paid_amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "source_type" "public"."ar_source_type_enum" NOT NULL DEFAULT 'MANUAL',
        "source_id" uuid,
        "trip_id" uuid,
        "ar_account_id" uuid NOT NULL,
        "is_down_payment" boolean NOT NULL DEFAULT false,
        "notes" text,
        "journal_entry_id" uuid,
        CONSTRAINT "UQ_ar_invoices_invoice_no" UNIQUE ("invoice_no"),
        CONSTRAINT "PK_ar_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ar_invoices_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ar_invoices_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ar_invoices_trip" FOREIGN KEY ("trip_id") REFERENCES "spjs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ar_invoices_ar_account" FOREIGN KEY ("ar_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ar_invoices_journal" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL
      );
      CREATE INDEX "IDX_ar_invoices_invoice_no" ON "ar_invoices" ("invoice_no");
      CREATE INDEX "IDX_ar_invoices_customer_id" ON "ar_invoices" ("customer_id");
      CREATE INDEX "IDX_ar_invoices_trip_id" ON "ar_invoices" ("trip_id");
      CREATE INDEX "IDX_ar_invoices_status" ON "ar_invoices" ("status");
    `);

    // 7. Create ar_invoice_lines table
    await queryRunner.query(`
      CREATE TABLE "ar_invoice_lines" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "invoice_id" uuid NOT NULL,
        "line_no" integer NOT NULL,
        "description" character varying(255) NOT NULL,
        "account_id" uuid NOT NULL,
        "qty" numeric(12,2) NOT NULL DEFAULT '1.00',
        "unit_price" numeric(20,2) NOT NULL DEFAULT '0.00',
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "trip_id" uuid,
        "vehicle_id" uuid,
        "business_unit_id" uuid,
        "profit_center_id" uuid,
        CONSTRAINT "PK_ar_invoice_lines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ar_invoice_lines_invoice" FOREIGN KEY ("invoice_id") REFERENCES "ar_invoices"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ar_invoice_lines_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ar_invoice_lines_trip" FOREIGN KEY ("trip_id") REFERENCES "spjs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ar_invoice_lines_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ar_invoice_lines_business_unit" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ar_invoice_lines_profit_center" FOREIGN KEY ("profit_center_id") REFERENCES "profit_centers"("id") ON DELETE SET NULL
      );
      CREATE INDEX "IDX_ar_invoice_lines_trip_id" ON "ar_invoice_lines" ("trip_id");
    `);

    // 8. Create ar_receipts table
    await queryRunner.query(`
      CREATE TABLE "ar_receipts" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "receipt_no" character varying(50) NOT NULL,
        "customer_id" uuid,
        "customer_name" character varying(150) NOT NULL,
        "receipt_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "payment_method" "public"."finance_payment_method_enum" NOT NULL DEFAULT 'BANK_TRANSFER',
        "bank_account_id" uuid,
        "cash_account_id" uuid,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "status" "public"."ar_receipt_status_enum" NOT NULL DEFAULT 'CONFIRMED',
        "reference" character varying(100),
        "is_down_payment" boolean NOT NULL DEFAULT false,
        "down_payment_trip_id" uuid,
        "notes" text,
        "journal_entry_id" uuid,
        CONSTRAINT "UQ_ar_receipts_receipt_no" UNIQUE ("receipt_no"),
        CONSTRAINT "PK_ar_receipts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ar_receipts_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ar_receipts_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ar_receipts_bank_account" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ar_receipts_cash_account" FOREIGN KEY ("cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ar_receipts_down_payment_trip" FOREIGN KEY ("down_payment_trip_id") REFERENCES "spjs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ar_receipts_journal" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL
      );
      CREATE INDEX "IDX_ar_receipts_receipt_no" ON "ar_receipts" ("receipt_no");
      CREATE INDEX "IDX_ar_receipts_customer_id" ON "ar_receipts" ("customer_id");
    `);

    // 9. Create ar_allocations table
    await queryRunner.query(`
      CREATE TABLE "ar_allocations" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "receipt_id" uuid NOT NULL,
        "invoice_id" uuid NOT NULL,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        CONSTRAINT "PK_ar_allocations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ar_allocations_receipt" FOREIGN KEY ("receipt_id") REFERENCES "ar_receipts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ar_allocations_invoice" FOREIGN KEY ("invoice_id") REFERENCES "ar_invoices"("id") ON DELETE CASCADE
      );
      CREATE INDEX "IDX_ar_allocations_receipt_id" ON "ar_allocations" ("receipt_id");
      CREATE INDEX "IDX_ar_allocations_invoice_id" ON "ar_allocations" ("invoice_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ar_allocations"`);
    await queryRunner.query(`DROP TABLE "ar_receipts"`);
    await queryRunner.query(`DROP TABLE "ar_invoice_lines"`);
    await queryRunner.query(`DROP TABLE "ar_invoices"`);
    await queryRunner.query(`DROP TABLE "ap_allocations"`);
    await queryRunner.query(`DROP TABLE "ap_payments"`);
    await queryRunner.query(`DROP TABLE "ap_invoice_lines"`);
    await queryRunner.query(`DROP TABLE "ap_invoices"`);

    await queryRunner.query(`DROP TYPE "public"."ar_source_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ap_source_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."finance_payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ar_receipt_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ar_invoice_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ap_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ap_invoice_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ap_vendor_type_enum"`);
  }
}
