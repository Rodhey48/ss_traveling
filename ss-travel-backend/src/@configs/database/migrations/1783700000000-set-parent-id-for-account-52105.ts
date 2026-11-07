import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetParentIdForAccount521051783700000000
  implements MigrationInterface
{
  name = 'SetParentIdForAccount521051783700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE accounts
      SET parent_id = (SELECT id FROM accounts WHERE code = '52' LIMIT 1),
          "updatedAt" = NOW()
      WHERE code = '52105' AND parent_id IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE accounts
      SET parent_id = NULL,
          "updatedAt" = NOW()
      WHERE code = '52105';
    `);
  }
}
