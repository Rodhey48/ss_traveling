import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReorderCoordinationFeesMenuSequence1783500000000
  implements MigrationInterface
{
  name = 'ReorderCoordinationFeesMenuSequence1783500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const parent = await queryRunner.query(
      `SELECT "parentId" FROM "menus" WHERE url = '/finance/coordination-fees' LIMIT 1`,
    );

    const parentId = parent && parent.length > 0 ? parent[0].parentId : null;

    // 1. Ubah sequence /finance/coordination-fees menjadi 3
    await queryRunner.query(
      `UPDATE "menus" SET sequence = 3, "updatedAt" = NOW() WHERE url = '/finance/coordination-fees'`,
    );

    if (parentId) {
      // 2. Geser Jurnal Umum (3 -> 4)
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 4, "updatedAt" = NOW() WHERE url = '/journals' AND "parentId" = $1`,
        [parentId],
      );

      // 3. Geser Profitabilitas Trip (4 -> 5)
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 5, "updatedAt" = NOW() WHERE url = '/reports/trip-profitability' AND "parentId" = $1`,
        [parentId],
      );

      // 4. Geser Buku Besar & Neraca Saldo (5 -> 6)
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 6, "updatedAt" = NOW() WHERE url = '/reports/general-ledger' AND "parentId" = $1`,
        [parentId],
      );

      // 5. Geser Tutup Buku Bulanan (6 -> 7)
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 7, "updatedAt" = NOW() WHERE url = '/period-closing' AND "parentId" = $1`,
        [parentId],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const parent = await queryRunner.query(
      `SELECT "parentId" FROM "menus" WHERE url = '/finance/coordination-fees' LIMIT 1`,
    );
    const parentId = parent && parent.length > 0 ? parent[0].parentId : null;

    await queryRunner.query(
      `UPDATE "menus" SET sequence = 7, "updatedAt" = NOW() WHERE url = '/finance/coordination-fees'`,
    );
    if (parentId) {
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 3, "updatedAt" = NOW() WHERE url = '/journals' AND "parentId" = $1`,
        [parentId],
      );
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 4, "updatedAt" = NOW() WHERE url = '/reports/trip-profitability' AND "parentId" = $1`,
        [parentId],
      );
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 5, "updatedAt" = NOW() WHERE url = '/reports/general-ledger' AND "parentId" = $1`,
        [parentId],
      );
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 6, "updatedAt" = NOW() WHERE url = '/period-closing' AND "parentId" = $1`,
        [parentId],
      );
    }
  }
}
