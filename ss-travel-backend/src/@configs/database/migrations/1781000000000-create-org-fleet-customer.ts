import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrgFleetCustomer1781000000000 implements MigrationInterface {
  name = 'CreateOrgFleetCustomer1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums
    await queryRunner.query(
      `CREATE TYPE "public"."vehicles_vehicle_type_enum" AS ENUM('BIG_BUS', 'MEDIUM_BUS', 'MINIBUS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vehicles_ownership_status_enum" AS ENUM('OWNED_PAID_OFF', 'LEASING', 'RENTAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vehicle_seat_classes_class_name_enum" AS ENUM('SLEEPER', 'LUXURY_2_1', 'EXECUTIVE', 'STANDARD')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customers_customer_type_enum" AS ENUM('CORPORATE', 'SCHOOL', 'COMMUNITY', 'INDIVIDUAL', 'GOVERNMENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customers_lead_source_enum" AS ENUM('DIRECT', 'WHATSAPP', 'INSTAGRAM', 'WEBSITE', 'REFERRAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customers_customer_tier_enum" AS ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')`,
    );

    // 2. Create companies
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "code" character varying(20) NOT NULL,
        "name" character varying(150) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'IDR',
        "timezone" character varying(50) NOT NULL DEFAULT 'Asia/Jakarta',
        "address" text,
        "phone" character varying(50),
        "email" character varying(100),
        "website" character varying(100),
        CONSTRAINT "UQ_companies_code" UNIQUE ("code"),
        CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")
      )
    `);

    // 3. Create business_units
    await queryRunner.query(`
      CREATE TABLE "business_units" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(20) NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        CONSTRAINT "UQ_business_units_code" UNIQUE ("code"),
        CONSTRAINT "PK_business_units_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_business_units_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    // 4. Create cost_centers
    await queryRunner.query(`
      CREATE TABLE "cost_centers" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(30) NOT NULL,
        "name" character varying(100) NOT NULL,
        "parent_id" uuid,
        "description" text,
        CONSTRAINT "UQ_cost_centers_code" UNIQUE ("code"),
        CONSTRAINT "PK_cost_centers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cost_centers_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_cost_centers_parent" FOREIGN KEY ("parent_id") REFERENCES "cost_centers"("id") ON DELETE RESTRICT
      )
    `);

    // 5. Create profit_centers
    await queryRunner.query(`
      CREATE TABLE "profit_centers" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "business_unit_id" uuid,
        "code" character varying(30) NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        CONSTRAINT "UQ_profit_centers_code" UNIQUE ("code"),
        CONSTRAINT "PK_profit_centers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_profit_centers_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_profit_centers_bu" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE RESTRICT
      )
    `);

    // 6. Create vehicles
    await queryRunner.query(`
      CREATE TABLE "vehicles" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(20) NOT NULL,
        "nickname" character varying(100),
        "plate_number" character varying(20) NOT NULL,
        "vehicle_type" "public"."vehicles_vehicle_type_enum" NOT NULL DEFAULT 'BIG_BUS',
        "chassis_model" character varying(100),
        "body_model" character varying(100),
        "ownership_status" "public"."vehicles_ownership_status_enum" NOT NULL DEFAULT 'OWNED_PAID_OFF',
        "capacity" integer NOT NULL DEFAULT 0,
        "year" integer,
        CONSTRAINT "UQ_vehicles_code" UNIQUE ("code"),
        CONSTRAINT "UQ_vehicles_plate_number" UNIQUE ("plate_number"),
        CONSTRAINT "PK_vehicles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vehicles_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    // 7. Create vehicle_seat_classes
    await queryRunner.query(`
      CREATE TABLE "vehicle_seat_classes" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "vehicle_id" uuid NOT NULL,
        "class_name" "public"."vehicle_seat_classes_class_name_enum" NOT NULL,
        "seat_capacity" integer NOT NULL,
        "seat_layout" character varying(50),
        CONSTRAINT "PK_vehicle_seat_classes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vehicle_seat_classes_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE
      )
    `);

    // 8. Create customers
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(30) NOT NULL,
        "customer_type" "public"."customers_customer_type_enum" NOT NULL DEFAULT 'CORPORATE',
        "institution_name" character varying(150),
        "pic_name" character varying(100) NOT NULL,
        "phone" character varying(30) NOT NULL,
        "email" character varying(100),
        "address" text,
        "city" character varying(100),
        "lead_source" "public"."customers_lead_source_enum" NOT NULL DEFAULT 'DIRECT',
        "customer_tier" "public"."customers_customer_tier_enum" NOT NULL DEFAULT 'BRONZE',
        "last_trip_date" TIMESTAMP WITH TIME ZONE,
        "total_trips_count" integer NOT NULL DEFAULT 0,
        "special_notes" text,
        CONSTRAINT "UQ_customers_code" UNIQUE ("code"),
        CONSTRAINT "PK_customers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_customers_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "customers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_seat_classes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "profit_centers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cost_centers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "business_units" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."customers_customer_tier_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."customers_lead_source_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."customers_customer_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."vehicle_seat_classes_class_name_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."vehicles_ownership_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."vehicles_vehicle_type_enum"`);
  }
}
