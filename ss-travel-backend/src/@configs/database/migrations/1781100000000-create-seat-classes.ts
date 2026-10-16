import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class CreateSeatClasses1781100000000 implements MigrationInterface {
  name = 'CreateSeatClasses1781100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create table seat_classes
    await queryRunner.query(`
      CREATE TABLE "seat_classes" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "company_id" uuid,
        "code" character varying(30) NOT NULL,
        "name" character varying(100) NOT NULL,
        "default_layout" character varying(50),
        "description" text,
        CONSTRAINT "UQ_seat_classes_code" UNIQUE ("code"),
        CONSTRAINT "PK_seat_classes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_seat_classes_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )
    `);

    // 2. Add seat_class_id column to vehicle_seat_classes
    await queryRunner.query(`
      ALTER TABLE "vehicle_seat_classes"
      ADD COLUMN "seat_class_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicle_seat_classes"
      ADD CONSTRAINT "FK_vehicle_seat_classes_master"
      FOREIGN KEY ("seat_class_id") REFERENCES "seat_classes"("id") ON DELETE RESTRICT
    `);

    // 3. Seed Master Kelas Kursi Default
    const compRows = await queryRunner.query(
      `SELECT "id" FROM "companies" WHERE "code" = 'SST' LIMIT 1`,
    );
    const activeCompanyId = compRows[0]?.id;

    const sleeperId = uuidv4();
    const luxuryId = uuidv4();
    const execId = uuidv4();
    const stdId = uuidv4();

    await queryRunner.query(`
      INSERT INTO "seat_classes" (
        "id", "company_id", "code", "name", "default_layout", "description", "is_active"
      ) VALUES
        ('${sleeperId}', ${activeCompanyId ? `'${activeCompanyId}'` : 'NULL'}, 'SLEEPER', 'Sleeper Class', '1-1', 'Kabin tidur pribadi dengan fasilitas bantal, selimut, dan AVOD', true),
        ('${luxuryId}', ${activeCompanyId ? `'${activeCompanyId}'` : 'NULL'}, 'LUXURY_2_1', 'Luxury Seat 2-1', '2-1', 'Kursi jumbo lebar formasi 2-1 dengan legrest & USB charger', true),
        ('${execId}', ${activeCompanyId ? `'${activeCompanyId}'` : 'NULL'}, 'EXECUTIVE', 'Executive Class', '2-2', 'Kursi ergonomis 2-2 dengan legrest & fasilitas toilet kabin', true),
        ('${stdId}', ${activeCompanyId ? `'${activeCompanyId}'` : 'NULL'}, 'STANDARD', 'Standard Class', '2-2', 'Kursi pariwisata standar kapasitas maksimal rombongan', true)
      ON CONFLICT ("code") DO NOTHING
    `);

    // 4. Update data vehicle_seat_classes existing agar terhubung ke master seat_classes
    await queryRunner.query(`
      UPDATE "vehicle_seat_classes" vsc
      SET "seat_class_id" = sc."id"
      FROM "seat_classes" sc
      WHERE vsc."class_name"::text = sc."code"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_seat_classes" DROP CONSTRAINT IF EXISTS "FK_vehicle_seat_classes_master"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_seat_classes" DROP COLUMN IF EXISTS "seat_class_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "seat_classes" CASCADE`);
  }
}
