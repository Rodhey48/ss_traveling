import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTripSchedulesAndSpjs1781600000000
  implements MigrationInterface
{
  name = 'CreateTripSchedulesAndSpjs1781600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."trip_service_type_enum" AS ENUM('AKAP', 'WISATA', 'SHUTTLE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."trip_schedule_status_enum" AS ENUM('DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_operational_status_enum" AS ENUM('DRAFT', 'ISSUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_financial_status_enum" AS ENUM('PENDING_SETTLEMENT', 'UNDER_REVIEW', 'DISCREPANCY', 'SETTLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_leg_direction_enum" AS ENUM('DEPARTURE', 'RETURN', 'ONE_WAY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_leg_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."crew_assignment_role_enum" AS ENUM('DRIVER', 'CO_DRIVER', 'CONDUCTOR', 'STEWARDESS', 'MECHANIC', 'HELPER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."crew_assignment_status_enum" AS ENUM('ASSIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REPLACED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create trip_schedules table
    await queryRunner.query(`
      CREATE TABLE "trip_schedules" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "schedule_no" character varying(50) NOT NULL,
        "service_type" "public"."trip_service_type_enum" NOT NULL DEFAULT 'AKAP',
        "business_unit_id" uuid,
        "vehicle_id" uuid,
        "planned_departure_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "planned_return_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "origin" character varying(150) NOT NULL,
        "destination" character varying(150) NOT NULL,
        "customer_id" uuid,
        "pic_name" character varying(100),
        "pic_phone" character varying(50),
        "pickup_notes" text,
        "total_package_price" numeric(20,2) NOT NULL DEFAULT '0.00',
        "planned_driver_1_id" uuid,
        "planned_driver_2_id" uuid,
        "planned_conductor_id" uuid,
        "status" "public"."trip_schedule_status_enum" NOT NULL DEFAULT 'DRAFT',
        "spj_id" uuid,
        "notes" text,
        CONSTRAINT "UQ_trip_schedules_schedule_no" UNIQUE ("schedule_no"),
        CONSTRAINT "PK_trip_schedules_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trip_schedules_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_trip_schedules_business_unit" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_trip_schedules_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_trip_schedules_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_trip_schedules_driver1" FOREIGN KEY ("planned_driver_1_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_trip_schedules_driver2" FOREIGN KEY ("planned_driver_2_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_trip_schedules_conductor" FOREIGN KEY ("planned_conductor_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    // 3. Create spjs table
    await queryRunner.query(`
      CREATE TABLE "spjs" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "spj_no" character varying(50) NOT NULL,
        "service_type" "public"."trip_service_type_enum" NOT NULL DEFAULT 'AKAP',
        "trip_schedule_id" uuid,
        "parent_spj_id" uuid,
        "vehicle_id" uuid NOT NULL,
        "business_unit_id" uuid,
        "profit_center_id" uuid,
        "operational_status" "public"."spj_operational_status_enum" NOT NULL DEFAULT 'DRAFT',
        "financial_status" "public"."spj_financial_status_enum" NOT NULL DEFAULT 'PENDING_SETTLEMENT',
        "issued_at" TIMESTAMP WITH TIME ZONE,
        "operationally_completed_at" TIMESTAMP WITH TIME ZONE,
        "closed_at" TIMESTAMP WITH TIME ZONE,
        "notes" text,
        CONSTRAINT "UQ_spjs_spj_no" UNIQUE ("spj_no"),
        CONSTRAINT "PK_spjs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spjs_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spjs_trip_schedule" FOREIGN KEY ("trip_schedule_id") REFERENCES "trip_schedules"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spjs_parent_spj" FOREIGN KEY ("parent_spj_id") REFERENCES "spjs"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spjs_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spjs_business_unit" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spjs_profit_center" FOREIGN KEY ("profit_center_id") REFERENCES "profit_centers"("id") ON DELETE RESTRICT
      )
    `);

    // 4. Add FK from trip_schedules to spjs
    await queryRunner.query(`
      ALTER TABLE "trip_schedules"
      ADD CONSTRAINT "FK_trip_schedules_spj"
      FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE SET NULL
    `);

    // 5. Create spj_legs table
    await queryRunner.query(`
      CREATE TABLE "spj_legs" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "spj_id" uuid NOT NULL,
        "sequence_no" integer NOT NULL DEFAULT 1,
        "direction" "public"."spj_leg_direction_enum" NOT NULL DEFAULT 'DEPARTURE',
        "origin" character varying(150) NOT NULL,
        "destination" character varying(150) NOT NULL,
        "departure_at" TIMESTAMP WITH TIME ZONE,
        "arrival_at" TIMESTAMP WITH TIME ZONE,
        "status" "public"."spj_leg_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "passenger_count" integer NOT NULL DEFAULT 0,
        "meal_pax_count" integer NOT NULL DEFAULT 0,
        "meal_discrepancy_notes" text,
        CONSTRAINT "PK_spj_legs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spj_legs_spj" FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE CASCADE
      )
    `);

    // 6. Create spj_crew_assignments table
    await queryRunner.query(`
      CREATE TABLE "spj_crew_assignments" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "spj_id" uuid NOT NULL,
        "spj_leg_id" uuid,
        "crew_id" uuid NOT NULL,
        "role" "public"."crew_assignment_role_enum" NOT NULL DEFAULT 'DRIVER',
        "assigned_from" TIMESTAMP WITH TIME ZONE,
        "assigned_until" TIMESTAMP WITH TIME ZONE,
        "status" "public"."crew_assignment_status_enum" NOT NULL DEFAULT 'ASSIGNED',
        "replacement_crew_id" uuid,
        "notes" text,
        "meal_allowance_snapshot" numeric(20,2) NOT NULL DEFAULT '0.00',
        "incentive_snapshot" numeric(20,2) NOT NULL DEFAULT '0.00',
        "full_seat_bonus_snapshot" numeric(20,2) NOT NULL DEFAULT '0.00',
        CONSTRAINT "PK_spj_crew_assignments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spj_crew_assignments_spj" FOREIGN KEY ("spj_id") REFERENCES "spjs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spj_crew_assignments_leg" FOREIGN KEY ("spj_leg_id") REFERENCES "spj_legs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_spj_crew_assignments_crew" FOREIGN KEY ("crew_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_spj_crew_assignments_replacement" FOREIGN KEY ("replacement_crew_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    // 7. Create indexes for high-speed queries
    await queryRunner.query(`
      CREATE INDEX "IDX_trip_schedules_departure" ON "trip_schedules" ("planned_departure_at");
      CREATE INDEX "IDX_trip_schedules_return" ON "trip_schedules" ("planned_return_at");
      CREATE INDEX "IDX_trip_schedules_vehicle" ON "trip_schedules" ("vehicle_id");
      CREATE INDEX "IDX_trip_schedules_status" ON "trip_schedules" ("status");
      CREATE INDEX "IDX_spjs_vehicle" ON "spjs" ("vehicle_id");
      CREATE INDEX "IDX_spjs_operational_status" ON "spjs" ("operational_status");
      CREATE INDEX "IDX_spjs_financial_status" ON "spjs" ("financial_status");
      CREATE INDEX "IDX_spj_legs_spj" ON "spj_legs" ("spj_id");
      CREATE INDEX "IDX_spj_crew_spj" ON "spj_crew_assignments" ("spj_id");
      CREATE INDEX "IDX_spj_crew_member" ON "spj_crew_assignments" ("crew_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "spj_crew_assignments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spj_legs" CASCADE`);
    await queryRunner.query(`ALTER TABLE "trip_schedules" DROP CONSTRAINT IF EXISTS "FK_trip_schedules_spj"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spjs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "trip_schedules" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."crew_assignment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."crew_assignment_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."spj_leg_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."spj_leg_direction_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."spj_financial_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."spj_operational_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."trip_schedule_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."trip_service_type_enum"`);
  }
}
