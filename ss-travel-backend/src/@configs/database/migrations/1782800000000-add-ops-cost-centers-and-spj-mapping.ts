import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpsCostCentersAndSpjMapping1782800000000 implements MigrationInterface {
  name = 'AddOpsCostCentersAndSpjMapping1782800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tambahkan 2 Cost Center Operasional Khusus: CC-OPS-AKAP dan CC-OPS-WISATA
    await queryRunner.query(`
      INSERT INTO "cost_centers" ("id", "company_id", "code", "name", "description", "is_active", "createdAt", "updatedAt")
      SELECT
        gen_random_uuid(),
        (SELECT id FROM "companies" LIMIT 1),
        'CC-OPS-AKAP',
        'Operasional Divisi AKAP',
        'Biaya operasional perjalanan, BBM solar, tol, komisi agen, dan kupon makan AKAP',
        true,
        NOW(),
        NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "cost_centers" WHERE "code" = 'CC-OPS-AKAP');
    `);

    await queryRunner.query(`
      INSERT INTO "cost_centers" ("id", "company_id", "code", "name", "description", "is_active", "createdAt", "updatedAt")
      SELECT
        gen_random_uuid(),
        (SELECT id FROM "companies" LIMIT 1),
        'CC-OPS-WISATA',
        'Operasional Divisi Pariwisata',
        'Biaya operasional perjalanan wisata, BBM solar, tol, parkir, dan komisi rekanan',
        true,
        NOW(),
        NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "cost_centers" WHERE "code" = 'CC-OPS-WISATA');
    `);

    // 2. Tambahkan kolom cost_center_id pada tabel trip_schedules
    await queryRunner.query(`
      ALTER TABLE "trip_schedules" ADD COLUMN IF NOT EXISTS "cost_center_id" uuid;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_trip_schedules_cost_center'
        ) THEN
          ALTER TABLE "trip_schedules"
          ADD CONSTRAINT "FK_trip_schedules_cost_center"
          FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // 3. Tambahkan kolom cost_center_id pada tabel spjs
    await queryRunner.query(`
      ALTER TABLE "spjs" ADD COLUMN IF NOT EXISTS "cost_center_id" uuid;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_spjs_cost_center'
        ) THEN
          ALTER TABLE "spjs"
          ADD CONSTRAINT "FK_spjs_cost_center"
          FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // 4. Backfill data trip_schedules yang sudah ada
    await queryRunner.query(`
      UPDATE "trip_schedules"
      SET "cost_center_id" = (SELECT id FROM "cost_centers" WHERE "code" = 'CC-OPS-AKAP' LIMIT 1)
      WHERE "service_type" = 'AKAP' AND "cost_center_id" IS NULL;
    `);
    await queryRunner.query(`
      UPDATE "trip_schedules"
      SET "cost_center_id" = (SELECT id FROM "cost_centers" WHERE "code" = 'CC-OPS-WISATA' LIMIT 1)
      WHERE "service_type" = 'WISATA' AND "cost_center_id" IS NULL;
    `);

    // 5. Backfill data spjs yang sudah ada
    await queryRunner.query(`
      UPDATE "spjs"
      SET "cost_center_id" = (SELECT id FROM "cost_centers" WHERE "code" = 'CC-OPS-AKAP' LIMIT 1)
      WHERE "service_type" = 'AKAP' AND "cost_center_id" IS NULL;
    `);
    await queryRunner.query(`
      UPDATE "spjs"
      SET "cost_center_id" = (SELECT id FROM "cost_centers" WHERE "code" = 'CC-OPS-WISATA' LIMIT 1)
      WHERE "service_type" = 'WISATA' AND "cost_center_id" IS NULL;
    `);

    // 6. Backfill relasi cost_center_id, business_unit_id, dan profit_center_id pada journal_lines yang memiliki trip_id
    await queryRunner.query(`
      UPDATE "journal_lines" jl
      SET
        "cost_center_id" = (SELECT id FROM "cost_centers" WHERE "code" = 'CC-OPS-AKAP' LIMIT 1),
        "business_unit_id" = COALESCE(jl."business_unit_id", (SELECT id FROM "business_units" WHERE "code" = 'AKAP' LIMIT 1)),
        "profit_center_id" = COALESCE(jl."profit_center_id", (SELECT id FROM "profit_centers" WHERE "code" = 'PC-AKAP' LIMIT 1))
      FROM "spjs" s
      WHERE jl."trip_id" = s."id" AND s."service_type" = 'AKAP' AND jl."cost_center_id" IS NULL;
    `);

    await queryRunner.query(`
      UPDATE "journal_lines" jl
      SET
        "cost_center_id" = (SELECT id FROM "cost_centers" WHERE "code" = 'CC-OPS-WISATA' LIMIT 1),
        "business_unit_id" = COALESCE(jl."business_unit_id", (SELECT id FROM "business_units" WHERE "code" = 'WISATA' LIMIT 1)),
        "profit_center_id" = COALESCE(jl."profit_center_id", (SELECT id FROM "profit_centers" WHERE "code" = 'PC-WISATA' LIMIT 1))
      FROM "spjs" s
      WHERE jl."trip_id" = s."id" AND s."service_type" = 'WISATA' AND jl."cost_center_id" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "spjs" DROP CONSTRAINT IF EXISTS "FK_spjs_cost_center";
    `);
    await queryRunner.query(`
      ALTER TABLE "spjs" DROP COLUMN IF EXISTS "cost_center_id";
    `);
    await queryRunner.query(`
      ALTER TABLE "trip_schedules" DROP CONSTRAINT IF EXISTS "FK_trip_schedules_cost_center";
    `);
    await queryRunner.query(`
      ALTER TABLE "trip_schedules" DROP COLUMN IF EXISTS "cost_center_id";
    `);
    await queryRunner.query(`
      DELETE FROM "cost_centers" WHERE "code" IN ('CC-OPS-AKAP', 'CC-OPS-WISATA');
    `);
  }
}
