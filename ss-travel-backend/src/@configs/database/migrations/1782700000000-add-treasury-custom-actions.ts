import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTreasuryCustomActions1782700000000 implements MigrationInterface {
  name = 'AddTreasuryCustomActions1782700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tambahkan custom action "approve" ke menu /treasury
    await queryRunner.query(`
      UPDATE "menus"
      SET "availableActions" = '["approve"]'::jsonb
      WHERE "url" = '/treasury'
    `);

    // 2. Berikan izin actions: {"approve": true} untuk role SUPER_ADMIN, DIRECTOR, dan FINANCE_MANAGER
    await queryRunner.query(`
      UPDATE "role-menus" rm
      SET "actions" = '{"approve": true}'::jsonb
      FROM "menus" m, "roles" r
      WHERE rm."menuId" = m."id"
        AND rm."roleId" = r."id"
        AND m."url" = '/treasury'
        AND r."name" IN ('SUPER_ADMIN', 'DIRECTOR', 'FINANCE_MANAGER')
    `);

    // 3. Pastikan role lain memiliki actions default: {"approve": false}
    await queryRunner.query(`
      UPDATE "role-menus" rm
      SET "actions" = COALESCE(rm."actions", '{}'::jsonb) || '{"approve": false}'::jsonb
      FROM "menus" m, "roles" r
      WHERE rm."menuId" = m."id"
        AND rm."roleId" = r."id"
        AND m."url" = '/treasury'
        AND r."name" NOT IN ('SUPER_ADMIN', 'DIRECTOR', 'FINANCE_MANAGER')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "menus"
      SET "availableActions" = NULL
      WHERE "url" = '/treasury'
    `);

    await queryRunner.query(`
      UPDATE "role-menus" rm
      SET "actions" = NULL
      FROM "menus" m
      WHERE rm."menuId" = m."id"
        AND m."url" = '/treasury'
    `);
  }
}
