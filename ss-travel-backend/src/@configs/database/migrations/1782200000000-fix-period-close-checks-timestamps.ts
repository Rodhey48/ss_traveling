import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPeriodCloseChecksTimestamps1782200000000
  implements MigrationInterface
{
  name = 'FixPeriodCloseChecksTimestamps1782200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'period_close_checks' AND column_name = 'created_at'
        ) THEN
          ALTER TABLE "period_close_checks" RENAME COLUMN "created_at" TO "createdAt";
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'period_close_checks' AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE "period_close_checks" RENAME COLUMN "updated_at" TO "updatedAt";
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'period_close_checks' AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE "period_close_checks" ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'period_close_checks' AND column_name = 'updatedAt'
        ) THEN
          ALTER TABLE "period_close_checks" ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'period_close_checks' AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE "period_close_checks" RENAME COLUMN "createdAt" TO "created_at";
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'period_close_checks' AND column_name = 'updatedAt'
        ) THEN
          ALTER TABLE "period_close_checks" RENAME COLUMN "updatedAt" TO "updated_at";
        END IF;
      END $$;
    `);
  }
}
