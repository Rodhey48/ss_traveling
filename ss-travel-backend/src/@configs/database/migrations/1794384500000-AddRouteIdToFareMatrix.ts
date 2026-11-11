import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRouteIdToFareMatrix1794384500000 implements MigrationInterface {
  name = 'AddRouteIdToFareMatrix1794384500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tambahkan kolom route_id pada tabel fare_matrix
    await queryRunner.query(
      `ALTER TABLE "fare_matrix" ADD COLUMN IF NOT EXISTS "route_id" uuid`,
    );

    // 2. Tambahkan Foreign Key constraint ke tabel routes
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "fare_matrix"
        ADD CONSTRAINT "FK_fare_matrix_route"
        FOREIGN KEY ("route_id") REFERENCES "routes"("id")
        ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Backfill data existing fare_matrix yang cocok dengan master routes
    await queryRunner.query(`
      UPDATE "fare_matrix" fm
      SET "route_id" = r.id
      FROM "routes" r
      WHERE fm."origin" = r."origin"
        AND fm."destination" = r."destination"
        AND fm."route_id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fare_matrix" DROP CONSTRAINT IF EXISTS "FK_fare_matrix_route"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fare_matrix" DROP COLUMN IF EXISTS "route_id"`,
    );
  }
}
