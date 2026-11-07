import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsActiveToCoordinationTables1783400000000
  implements MigrationInterface
{
  name = 'AddIsActiveToCoordinationTables1783400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "coordination_fee_batches"
      ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
    `);

    await queryRunner.query(`
      ALTER TABLE "spj_coordination_fees"
      ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "coordination_fee_batches" DROP COLUMN IF EXISTS "is_active";
    `);
    await queryRunner.query(`
      ALTER TABLE "spj_coordination_fees" DROP COLUMN IF EXISTS "is_active";
    `);
  }
}
