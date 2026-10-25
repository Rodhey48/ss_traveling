import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePeriodClosingAndReports1782000000000
  implements MigrationInterface
{
  name = 'CreatePeriodClosingAndReports1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create enum for period check status
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'period_close_checks_status_enum') THEN
          CREATE TYPE "public"."period_close_checks_status_enum" AS ENUM('PASSED', 'WARNING', 'BLOCKED');
        END IF;
      END $$;
    `);

    // 2. Create period_close_checks table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "period_close_checks" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "period_id" uuid NOT NULL,
        "check_code" character varying(50) NOT NULL,
        "check_name" character varying(150) NOT NULL,
        "status" "public"."period_close_checks_status_enum" NOT NULL DEFAULT 'PASSED',
        "details" jsonb,
        "checked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "checked_by" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT "PK_period_close_checks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_period_close_checks_period" FOREIGN KEY ("period_id") REFERENCES "fiscal_periods"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_period_close_checks_user" FOREIGN KEY ("checked_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // 3. Create indices
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_period_close_checks_period_id" ON "period_close_checks" ("period_id");
      CREATE INDEX IF NOT EXISTS "IDX_period_close_checks_check_code" ON "period_close_checks" ("check_code");
    `);

    // 4. Add checklist_snapshot column to fiscal_periods table
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'fiscal_periods' AND column_name = 'checklist_snapshot'
        ) THEN
          ALTER TABLE "fiscal_periods" ADD COLUMN "checklist_snapshot" jsonb;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fiscal_periods" DROP COLUMN IF EXISTS "checklist_snapshot";
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "period_close_checks" CASCADE;
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."period_close_checks_status_enum";
    `);
  }
}
