import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoutesAndLinkToSchedulesAndRules1794382343229 implements MigrationInterface {
    name = 'CreateRoutesAndLinkToSchedulesAndRules1794382343229'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Buat tipe ENUM service_type untuk routes jika belum ada
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."routes_service_type_enum" AS ENUM('AKAP', 'WISATA', 'SHUTTLE');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 2. Buat tabel master routes
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "routes" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "company_id" uuid,
                "code" character varying(50) NOT NULL,
                "name" character varying(150) NOT NULL,
                "origin" character varying(100) NOT NULL,
                "destination" character varying(100) NOT NULL,
                "via" character varying(150),
                "distance_km" numeric(8,2),
                "estimated_hours" numeric(5,2),
                "service_type" "public"."routes_service_type_enum" NOT NULL DEFAULT 'AKAP',
                CONSTRAINT "UQ_routes_code" UNIQUE ("code"),
                CONSTRAINT "PK_routes_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_routes_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
            )
        `);

        // 3. Tambahkan kolom route_id pada tabel spjs
        await queryRunner.query(`ALTER TABLE "spjs" ADD COLUMN IF NOT EXISTS "route_id" uuid`);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "spjs" ADD CONSTRAINT "FK_spjs_route" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 4. Tambahkan kolom route_id pada tabel trip_schedules
        await queryRunner.query(`ALTER TABLE "trip_schedules" ADD COLUMN IF NOT EXISTS "route_id" uuid`);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "trip_schedules" ADD CONSTRAINT "FK_trip_schedules_route" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 5. Tambahkan kolom route_id pada tabel coordinator_fee_rules
        await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" ADD COLUMN IF NOT EXISTS "route_id" uuid`);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "coordinator_fee_rules" ADD CONSTRAINT "FK_coordinator_fee_rules_route" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE SET NULL;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback coordinator_fee_rules
        await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" DROP CONSTRAINT IF EXISTS "FK_coordinator_fee_rules_route"`);
        await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" DROP COLUMN IF EXISTS "route_id"`);

        // Rollback trip_schedules
        await queryRunner.query(`ALTER TABLE "trip_schedules" DROP CONSTRAINT IF EXISTS "FK_trip_schedules_route"`);
        await queryRunner.query(`ALTER TABLE "trip_schedules" DROP COLUMN IF EXISTS "route_id"`);

        // Rollback spjs
        await queryRunner.query(`ALTER TABLE "spjs" DROP CONSTRAINT IF EXISTS "FK_spjs_route"`);
        await queryRunner.query(`ALTER TABLE "spjs" DROP COLUMN IF EXISTS "route_id"`);

        // Rollback tabel routes
        await queryRunner.query(`DROP TABLE IF EXISTS "routes"`);

        // Rollback ENUM type
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."routes_service_type_enum"`);
    }
}
