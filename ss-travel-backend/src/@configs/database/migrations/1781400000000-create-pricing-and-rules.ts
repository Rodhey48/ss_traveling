import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePricingAndRules1781400000000 implements MigrationInterface {
  name = 'CreatePricingAndRules1781400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."agents_type_enum" AS ENUM('OFFLINE', 'ONLINE_OTA');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."agents_settlement_type_enum" AS ENUM('CASH_TO_CREW', 'CASH_TO_OFFICE', 'BANK_TRANSFER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."agent_commission_rules_rule_type_enum" AS ENUM('FLAT_PER_TICKET', 'PERCENTAGE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."crew_rate_rules_role_enum" AS ENUM('DRIVER', 'CO_DRIVER', 'CONDUCTOR', 'STEWARDESS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."crew_rate_rules_service_type_enum" AS ENUM('AKAP', 'TOURISM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."crew_rate_rules_rate_type_enum" AS ENUM('PER_TRIP', 'PER_DAY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."restaurants_settlement_type_enum" AS ENUM('PAID_BY_CREW_UJ', 'INVOICED_MONTHLY_AP');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."coordinator_fee_rules_zone_enum" AS ENUM('WEST', 'EAST');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Table: fare_seasons
    await queryRunner.query(`
      CREATE TABLE "fare_seasons" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "description" text,
        CONSTRAINT "UQ_fare_seasons_code" UNIQUE ("code"),
        CONSTRAINT "PK_fare_seasons_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fare_seasons_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    // 3. Table: fare_matrix
    await queryRunner.query(`
      CREATE TABLE "fare_matrix" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "fare_season_id" uuid NOT NULL,
        "origin" character varying(100) NOT NULL,
        "destination" character varying(100) NOT NULL,
        "seat_class_id" uuid NOT NULL,
        "amount" numeric(15, 2) NOT NULL,
        "effective_from" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "effective_until" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_fare_matrix_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fare_matrix_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_fare_matrix_season" FOREIGN KEY ("fare_season_id") REFERENCES "fare_seasons"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_fare_matrix_seat_class" FOREIGN KEY ("seat_class_id") REFERENCES "seat_classes"("id") ON DELETE RESTRICT
      )
    `);

    // 4. Table: agents
    await queryRunner.query(`
      CREATE TABLE "agents" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(50) NOT NULL,
        "name" character varying(150) NOT NULL,
        "agent_type" "public"."agents_type_enum" NOT NULL DEFAULT 'OFFLINE',
        "city" character varying(50) NOT NULL DEFAULT 'ALL',
        "phone" character varying(50) NOT NULL,
        "email" character varying(100),
        "address" text,
        "settlement_type" "public"."agents_settlement_type_enum" NOT NULL DEFAULT 'CASH_TO_CREW',
        "contact_person" character varying(100),
        CONSTRAINT "UQ_agents_code" UNIQUE ("code"),
        CONSTRAINT "PK_agents_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_agents_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    // 5. Table: agent_commission_rules
    await queryRunner.query(`
      CREATE TABLE "agent_commission_rules" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "agent_id" uuid NOT NULL,
        "seat_class_id" uuid,
        "rule_type" "public"."agent_commission_rules_rule_type_enum" NOT NULL DEFAULT 'FLAT_PER_TICKET',
        "commission_value" numeric(15, 2) NOT NULL,
        "effective_from" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "effective_until" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_agent_commission_rules_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_agent_commission_rules_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_agent_commission_rules_agent" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_agent_commission_rules_seat_class" FOREIGN KEY ("seat_class_id") REFERENCES "seat_classes"("id") ON DELETE SET NULL
      )
    `);

    // 6. Table: crew_rate_rules
    await queryRunner.query(`
      CREATE TABLE "crew_rate_rules" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "role" "public"."crew_rate_rules_role_enum" NOT NULL,
        "service_type" "public"."crew_rate_rules_service_type_enum" NOT NULL DEFAULT 'AKAP',
        "origin" character varying(100) NOT NULL DEFAULT 'ALL',
        "destination" character varying(100) NOT NULL DEFAULT 'ALL',
        "rate_type" "public"."crew_rate_rules_rate_type_enum" NOT NULL DEFAULT 'PER_TRIP',
        "meal_allowance" numeric(15, 2) NOT NULL DEFAULT 0.00,
        "trip_incentive" numeric(15, 2) NOT NULL DEFAULT 0.00,
        "full_seat_bonus" numeric(15, 2) NOT NULL DEFAULT 0.00,
        "effective_from" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "effective_until" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_crew_rate_rules_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_crew_rate_rules_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    // 7. Table: restaurants
    await queryRunner.query(`
      CREATE TABLE "restaurants" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(50) NOT NULL,
        "name" character varying(150) NOT NULL,
        "city" character varying(100) NOT NULL,
        "address" text,
        "phone" character varying(50),
        "rate_per_pax" numeric(15, 2) NOT NULL DEFAULT 0.00,
        "settlement_type" "public"."restaurants_settlement_type_enum" NOT NULL DEFAULT 'INVOICED_MONTHLY_AP',
        "contact_person" character varying(100),
        CONSTRAINT "UQ_restaurants_code" UNIQUE ("code"),
        CONSTRAINT "PK_restaurants_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_restaurants_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    // 8. Table: coordinator_fee_rules
    await queryRunner.query(`
      CREATE TABLE "coordinator_fee_rules" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "zone" "public"."coordinator_fee_rules_zone_enum" NOT NULL,
        "coordinator_user_id" uuid,
        "fee_per_pax" numeric(15, 2) NOT NULL DEFAULT 10000.00,
        "effective_from" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "effective_until" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_coordinator_fee_rules_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_coordinator_fee_rules_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_coordinator_fee_rules_user" FOREIGN KEY ("coordinator_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "coordinator_fee_rules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "restaurants" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crew_rate_rules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agent_commission_rules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fare_matrix" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fare_seasons" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."coordinator_fee_rules_zone_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."restaurants_settlement_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."crew_rate_rules_rate_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."crew_rate_rules_service_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."crew_rate_rules_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."agent_commission_rules_rule_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."agents_settlement_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."agents_type_enum"`);
  }
}
