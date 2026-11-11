import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCashierSettlementData1888888888895 implements MigrationInterface {
  name = 'SeedCashierSettlementData1888888888895';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Data transaksi operasional dikosongkan agar operasional dimulai murni dari 0
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
