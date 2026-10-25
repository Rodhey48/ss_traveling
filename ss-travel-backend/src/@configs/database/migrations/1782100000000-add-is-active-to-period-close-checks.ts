import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsActiveToPeriodCloseChecks1782100000000
  implements MigrationInterface
{
  name = 'AddIsActiveToPeriodCloseChecks1782100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "period_close_checks" 
      ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "period_close_checks" 
      DROP COLUMN IF EXISTS "is_active";
    `);
  }
}
