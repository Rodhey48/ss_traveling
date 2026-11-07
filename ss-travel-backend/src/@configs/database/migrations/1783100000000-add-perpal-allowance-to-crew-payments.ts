import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerpalAllowanceToCrewPayments1783100000000
  implements MigrationInterface
{
  name = 'AddPerpalAllowanceToCrewPayments1783100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."crew_meal_payment_category_enum" ADD VALUE IF NOT EXISTS 'PERPAL_ALLOWANCE';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Enum values in Postgres cannot be removed safely without recreate
  }
}
