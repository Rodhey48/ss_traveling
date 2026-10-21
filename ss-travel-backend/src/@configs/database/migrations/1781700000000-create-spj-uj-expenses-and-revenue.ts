import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpjUjExpensesAndRevenue1781700000000
  implements MigrationInterface
{
  name = 'CreateSpjUjExpensesAndRevenue1781700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_expense_type_enum" AS ENUM(
          'FUEL', 'TOLL', 'PARKING', 'RETRIBUTION', 'RESTAURANT_MEAL_SERVICE',
          'COORDINATOR_FEE', 'CREW_LODGING', 'PARKING_TOURISM', 'EMERGENCY_REPAIR',
          'TOWING', 'OTHER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_expense_payment_source_enum" AS ENUM(
          'UJ', 'OFFICE_AP', 'OFFICE_CASH', 'OFFICE_BANK', 'CREW_POCKET'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_expense_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_uj_status_enum" AS ENUM('DRAFT', 'DISBURSED', 'BALANCED', 'DISCREPANCY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_disbursement_type_enum" AS ENUM('INITIAL', 'ADDITIONAL', 'ROLLOVER_IN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_payment_method_enum" AS ENUM('CASH', 'BANK_TRANSFER', 'ROLLOVER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_additional_request_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_revenue_declaration_type_enum" AS ENUM(
          'TICKET_CASH', 'AGENT_DEPOSIT', 'CARGO_MOTORCYCLE', 'CARGO_BOX', 'CHARTER_CASH'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_revenue_declaration_status_enum" AS ENUM('DECLARED', 'VERIFIED', 'DISCREPANCY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."crew_meal_payment_category_enum" AS ENUM(
          'MEAL_ALLOWANCE', 'TRIP_INCENTIVE', 'FULL_SEAT_BONUS', 'CARGO_COMMISSION'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."crew_meal_payment_status_enum" AS ENUM('PENDING', 'PAID', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."crew_payout_timing_enum" AS ENUM('AT_SETTLEMENT', 'EARLY_DISBURSEMENT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create spj_expenses table
    await queryRunner.query(`
      CREATE TABLE "spj_expenses" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "spj_id" uuid NOT NULL,
        "spj_leg_id" uuid,
        "vehicle_id" uuid NOT NULL,
        "expense_type" "public"."spj_expense_type_enum" NOT NULL,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "expense_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "payment_source" "public"."spj_expense_payment_source_enum" NOT NULL DEFAULT 'UJ',
        "fuel_liters" numeric(10,2),
        "odometer_km" integer,
        "fuel_station" character varying(150),
        "receipt_number" character varying(100),
        "receipt_url" text,
        "notes" text,
        "status" "public"."spj_expense_status_enum" NOT NULL DEFAULT 'APPROVED',
        "verified_by" uuid,
        "verified_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_spj_expenses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spj_expenses_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spj_expenses_spj" FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spj_expenses_leg" FOREIGN KEY ("spj_leg_id") REFERENCES "spj_legs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_expenses_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spj_expenses_verifier" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    // 3. Create spj_uj table
    await queryRunner.query(`
      CREATE TABLE "spj_uj" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "spj_id" uuid NOT NULL,
        "crew_id" uuid NOT NULL,
        "status" "public"."spj_uj_status_enum" NOT NULL DEFAULT 'DRAFT',
        "total_disbursed" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_spent" numeric(20,2) NOT NULL DEFAULT '0.00',
        "total_returned" numeric(20,2) NOT NULL DEFAULT '0.00',
        "balance" numeric(20,2) NOT NULL DEFAULT '0.00',
        "rollover_from_spj_id" uuid,
        "rollover_to_spj_id" uuid,
        "notes" text,
        CONSTRAINT "PK_spj_uj" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spj_uj_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spj_uj_spj" FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spj_uj_crew" FOREIGN KEY ("crew_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spj_uj_rollover_from" FOREIGN KEY ("rollover_from_spj_id") REFERENCES "spjs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_uj_rollover_to" FOREIGN KEY ("rollover_to_spj_id") REFERENCES "spjs"("id") ON DELETE SET NULL
      );
    `);

    // 4. Create spj_uj_disbursements table
    await queryRunner.query(`
      CREATE TABLE "spj_uj_disbursements" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "spj_uj_id" uuid NOT NULL,
        "crew_assignment_id" uuid,
        "disbursement_type" "public"."spj_disbursement_type_enum" NOT NULL DEFAULT 'INITIAL',
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "disbursed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "payment_method" "public"."spj_payment_method_enum" NOT NULL DEFAULT 'CASH',
        "cash_account_id" uuid,
        "bank_account_id" uuid,
        "disbursed_by" uuid,
        "receipt_ref" character varying(100),
        "notes" text,
        CONSTRAINT "PK_spj_uj_disbursements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spj_uj_disbursements_uj" FOREIGN KEY ("spj_uj_id") REFERENCES "spj_uj"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spj_uj_disbursements_crew_assignment" FOREIGN KEY ("crew_assignment_id") REFERENCES "spj_crew_assignments"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_uj_disbursements_cash" FOREIGN KEY ("cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_uj_disbursements_bank" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_uj_disbursements_disburser" FOREIGN KEY ("disbursed_by") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    // 5. Create spj_uj_expenses table
    await queryRunner.query(`
      CREATE TABLE "spj_uj_expenses" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "spj_uj_id" uuid NOT NULL,
        "crew_assignment_id" uuid,
        "expense_id" uuid NOT NULL,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "receipt_ref" character varying(100),
        "notes" text,
        CONSTRAINT "PK_spj_uj_expenses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spj_uj_expenses_uj" FOREIGN KEY ("spj_uj_id") REFERENCES "spj_uj"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spj_uj_expenses_crew_assignment" FOREIGN KEY ("crew_assignment_id") REFERENCES "spj_crew_assignments"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_uj_expenses_expense" FOREIGN KEY ("expense_id") REFERENCES "spj_expenses"("id") ON DELETE CASCADE
      );
    `);

    // 6. Create spj_uj_returns table
    await queryRunner.query(`
      CREATE TABLE "spj_uj_returns" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "spj_uj_id" uuid NOT NULL,
        "crew_assignment_id" uuid,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "returned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "payment_method" "public"."spj_payment_method_enum" NOT NULL DEFAULT 'CASH',
        "cash_account_id" uuid,
        "bank_account_id" uuid,
        "received_by" uuid,
        "receipt_ref" character varying(100),
        "notes" text,
        CONSTRAINT "PK_spj_uj_returns" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spj_uj_returns_uj" FOREIGN KEY ("spj_uj_id") REFERENCES "spj_uj"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spj_uj_returns_crew_assignment" FOREIGN KEY ("crew_assignment_id") REFERENCES "spj_crew_assignments"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_uj_returns_cash" FOREIGN KEY ("cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_uj_returns_bank" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_uj_returns_receiver" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    // 7. Create spj_uj_additional_requests table
    await queryRunner.query(`
      CREATE TABLE "spj_uj_additional_requests" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "spj_id" uuid NOT NULL,
        "spj_uj_id" uuid NOT NULL,
        "crew_assignment_id" uuid,
        "requested_by" uuid NOT NULL,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "reason" text NOT NULL,
        "status" "public"."spj_additional_request_status_enum" NOT NULL DEFAULT 'PENDING',
        "processed_by" uuid,
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "rejection_reason" text,
        CONSTRAINT "PK_spj_uj_additional_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spj_uj_additional_requests_spj" FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spj_uj_additional_requests_uj" FOREIGN KEY ("spj_uj_id") REFERENCES "spj_uj"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spj_uj_additional_requests_crew_assignment" FOREIGN KEY ("crew_assignment_id") REFERENCES "spj_crew_assignments"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_uj_additional_requests_requester" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spj_uj_additional_requests_processor" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    // 8. Create spj_revenue_declarations table
    await queryRunner.query(`
      CREATE TABLE "spj_revenue_declarations" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "spj_id" uuid NOT NULL,
        "spj_leg_id" uuid,
        "declaration_type" "public"."spj_revenue_declaration_type_enum" NOT NULL,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "declared_by" uuid NOT NULL,
        "declared_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "source_reference" character varying(150),
        "crew_commission_percentage" numeric(5,2) DEFAULT '0.00',
        "crew_commission_amount" numeric(20,2) DEFAULT '0.00',
        "cargo_sender_name" character varying(100),
        "cargo_sender_phone" character varying(50),
        "cargo_receiver_name" character varying(100),
        "cargo_receiver_phone" character varying(50),
        "cargo_item_description" text,
        "status" "public"."spj_revenue_declaration_status_enum" NOT NULL DEFAULT 'DECLARED',
        "verified_by" uuid,
        "verified_at" TIMESTAMP WITH TIME ZONE,
        "notes" text,
        CONSTRAINT "PK_spj_revenue_declarations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spj_revenue_declarations_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spj_revenue_declarations_spj" FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spj_revenue_declarations_leg" FOREIGN KEY ("spj_leg_id") REFERENCES "spj_legs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_revenue_declarations_declarer" FOREIGN KEY ("declared_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spj_revenue_declarations_verifier" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    // 9. Create crew_meal_payments table
    await queryRunner.query(`
      CREATE TABLE "crew_meal_payments" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "spj_id" uuid NOT NULL,
        "crew_assignment_id" uuid,
        "crew_id" uuid NOT NULL,
        "payment_category" "public"."crew_meal_payment_category_enum" NOT NULL,
        "amount" numeric(20,2) NOT NULL DEFAULT '0.00',
        "payout_timing" "public"."crew_payout_timing_enum" NOT NULL DEFAULT 'AT_SETTLEMENT',
        "status" "public"."crew_meal_payment_status_enum" NOT NULL DEFAULT 'PENDING',
        "paid_at" TIMESTAMP WITH TIME ZONE,
        "payment_method" "public"."spj_payment_method_enum",
        "cash_account_id" uuid,
        "bank_account_id" uuid,
        "paid_by" uuid,
        "receipt_ref" character varying(100),
        "notes" text,
        CONSTRAINT "PK_crew_meal_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_crew_meal_payments_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_crew_meal_payments_spj" FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_crew_meal_payments_assignment" FOREIGN KEY ("crew_assignment_id") REFERENCES "spj_crew_assignments"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_crew_meal_payments_crew" FOREIGN KEY ("crew_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_crew_meal_payments_cash" FOREIGN KEY ("cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_crew_meal_payments_bank" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_crew_meal_payments_payer" FOREIGN KEY ("paid_by") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    // 10. Indexes for high performance querying
    await queryRunner.query(`
      CREATE INDEX "IDX_spj_expenses_spj_id" ON "spj_expenses" ("spj_id");
      CREATE INDEX "IDX_spj_expenses_vehicle_id" ON "spj_expenses" ("vehicle_id");
      CREATE INDEX "IDX_spj_uj_spj_id" ON "spj_uj" ("spj_id");
      CREATE INDEX "IDX_spj_uj_crew_id" ON "spj_uj" ("crew_id");
      CREATE INDEX "IDX_spj_uj_disbursements_uj" ON "spj_uj_disbursements" ("spj_uj_id");
      CREATE INDEX "IDX_spj_revenue_declarations_spj" ON "spj_revenue_declarations" ("spj_id");
      CREATE INDEX "IDX_crew_meal_payments_spj" ON "crew_meal_payments" ("spj_id");
      CREATE INDEX "IDX_crew_meal_payments_crew" ON "crew_meal_payments" ("crew_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "crew_meal_payments"`);
    await queryRunner.query(`DROP TABLE "spj_revenue_declarations"`);
    await queryRunner.query(`DROP TABLE "spj_uj_additional_requests"`);
    await queryRunner.query(`DROP TABLE "spj_uj_returns"`);
    await queryRunner.query(`DROP TABLE "spj_uj_expenses"`);
    await queryRunner.query(`DROP TABLE "spj_uj_disbursements"`);
    await queryRunner.query(`DROP TABLE "spj_uj"`);
    await queryRunner.query(`DROP TABLE "spj_expenses"`);

    await queryRunner.query(`DROP TYPE "public"."crew_payout_timing_enum"`);
    await queryRunner.query(`DROP TYPE "public"."crew_meal_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."crew_meal_payment_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."spj_revenue_declaration_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."spj_revenue_declaration_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."spj_additional_request_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."spj_payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."spj_disbursement_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."spj_uj_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."spj_expense_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."spj_expense_payment_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."spj_expense_type_enum"`);
  }
}
