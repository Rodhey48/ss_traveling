import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSpjFinanceData1888888888894 implements MigrationInterface {
  name = 'SeedSpjFinanceData1888888888894';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Data transaksi operasional dikosongkan agar operasional dimulai murni dari 0
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
