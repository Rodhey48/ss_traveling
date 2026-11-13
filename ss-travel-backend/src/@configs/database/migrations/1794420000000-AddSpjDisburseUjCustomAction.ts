import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpjDisburseUjCustomAction1794420000000 implements MigrationInterface {
  name = 'AddSpjDisburseUjCustomAction1794420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tambahkan custom action "disburse_uj" ke menu /spjs
    await queryRunner.query(`
      UPDATE "menus"
      SET "availableActions" = '["disburse_uj"]'::jsonb
      WHERE "url" = '/spjs'
    `);

    // 2. Berikan izin actions: {"disburse_uj": true} untuk role pengelola keuangan & kasir garasi
    await queryRunner.query(`
      UPDATE "role-menus" rm
      SET "actions" = COALESCE(rm."actions", '{}'::jsonb) || '{"disburse_uj": true}'::jsonb
      FROM "menus" m, "roles" r
      WHERE rm."menuId" = m."id"
        AND rm."roleId" = r."id"
        AND m."url" = '/spjs'
        AND r."name" IN ('SUPER_ADMIN', 'DIRECTOR', 'FINANCE_MANAGER', 'POOL_CASHIER', 'ACCOUNTANT', 'OPS_ADMIN')
    `);

    // 3. Pastikan role lain memiliki actions default: {"disburse_uj": false}
    await queryRunner.query(`
      UPDATE "role-menus" rm
      SET "actions" = COALESCE(rm."actions", '{}'::jsonb) || '{"disburse_uj": false}'::jsonb
      FROM "menus" m, "roles" r
      WHERE rm."menuId" = m."id"
        AND rm."roleId" = r."id"
        AND m."url" = '/spjs'
        AND r."name" NOT IN ('SUPER_ADMIN', 'DIRECTOR', 'FINANCE_MANAGER', 'POOL_CASHIER', 'ACCOUNTANT', 'OPS_ADMIN')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "menus"
      SET "availableActions" = NULL
      WHERE "url" = '/spjs'
    `);

    await queryRunner.query(`
      UPDATE "role-menus" rm
      SET "actions" = rm."actions" - 'disburse_uj'
      FROM "menus" m
      WHERE rm."menuId" = m."id"
        AND m."url" = '/spjs'
        AND rm."actions" IS NOT NULL
    `);
  }
}
