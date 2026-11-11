import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSchedulesAndSpjs1888888888893 implements MigrationInterface {
  name = 'SeedSchedulesAndSpjs1888888888893';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Data transaksi operasional dikosongkan agar operasional dimulai murni dari 0
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
