import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCoaParentHierarchyForOrphanedAccounts1794410000000
  implements MigrationInterface
{
  name = 'FixCoaParentHierarchyForOrphanedAccounts1794410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Link Bank accounts (11111, 11112, 11121, 11122, 11123, 11124) to parent '11' (Kas dan Bank)
    await queryRunner.query(`
      UPDATE accounts
      SET parent_id = (SELECT id FROM accounts WHERE code = '11' LIMIT 1),
          "updatedAt" = NOW()
      WHERE code IN ('11111', '11112', '11121', '11122', '11123', '11124');
    `);

    // 2. Link Utang Koordinator (22102) to parent '22' (Utang Pihak Ketiga & Keagenan)
    await queryRunner.query(`
      UPDATE accounts
      SET parent_id = (SELECT id FROM accounts WHERE code = '22' LIMIT 1),
          "updatedAt" = NOW()
      WHERE code = '22102';
    `);

    // 3. Link Beban Koordinator (52105) to parent '52' (Beban Tol, Parkir, & Fasilitas Perjalanan)
    await queryRunner.query(`
      UPDATE accounts
      SET parent_id = (SELECT id FROM accounts WHERE code = '52' LIMIT 1),
          "updatedAt" = NOW()
      WHERE code = '52105';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE accounts
      SET parent_id = NULL,
          "updatedAt" = NOW()
      WHERE code IN ('11111', '11112', '11121', '11122', '11123', '11124', '22102', '52105');
    `);
  }
}
