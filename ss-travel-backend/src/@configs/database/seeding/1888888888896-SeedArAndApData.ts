import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedArAndApData1888888888896 implements MigrationInterface {
  name = 'SeedArAndApData1888888888896';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Data transaksi operasional dikosongkan agar operasional dimulai murni dari 0
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
