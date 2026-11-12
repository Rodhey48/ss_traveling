import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoordinatorsMasterTableAndLinkRules1794390000000
  implements MigrationInterface
{
  name = 'CreateCoordinatorsMasterTableAndLinkRules1794390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Buat Enum coordinator_type_enum jika belum ada
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."coordinator_type_enum" AS ENUM('INDIVIDUAL', 'ORGANIZATION');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Buat Tabel coordinators (Master Koordinator Lapangan Eksternal)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coordinators" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID REFERENCES "companies"("id") ON DELETE RESTRICT,
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "name" VARCHAR(150) NOT NULL,
        "type" "public"."coordinator_type_enum" NOT NULL DEFAULT 'INDIVIDUAL',
        "organization_name" VARCHAR(150),
        "phone" VARCHAR(50) NOT NULL,
        "email" VARCHAR(100),
        "area" VARCHAR(100) NOT NULL DEFAULT 'ALL',
        "address" TEXT,
        "bank_name" VARCHAR(50) NOT NULL,
        "bank_account_number" VARCHAR(50) NOT NULL,
        "bank_account_holder" VARCHAR(150) NOT NULL,
        "notes" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMPTZ
      );
    `);

    // 3. Tambahkan kolom coordinator_id pada tabel coordinator_fee_rules
    await queryRunner.query(`
      ALTER TABLE "coordinator_fee_rules" ADD COLUMN IF NOT EXISTS "coordinator_id" UUID;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "coordinator_fee_rules" ADD CONSTRAINT "FK_coordinator_fee_rules_coordinator" 
        FOREIGN KEY ("coordinator_id") REFERENCES "coordinators"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 4. Tambahkan kolom coordinator_id pada tabel spj_coordination_fees
    await queryRunner.query(`
      ALTER TABLE "spj_coordination_fees" ADD COLUMN IF NOT EXISTS "coordinator_id" UUID;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "spj_coordination_fees" ADD CONSTRAINT "FK_spj_coordination_fees_coordinator" 
        FOREIGN KEY ("coordinator_id") REFERENCES "coordinators"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 5. Tambahkan kolom coordinator_id dan snapshot data rekening pada tabel coordination_fee_batches
    await queryRunner.query(`
      ALTER TABLE "coordination_fee_batches" ADD COLUMN IF NOT EXISTS "coordinator_id" UUID;
      ALTER TABLE "coordination_fee_batches" ADD COLUMN IF NOT EXISTS "coordinator_bank_name" VARCHAR(50);
      ALTER TABLE "coordination_fee_batches" ADD COLUMN IF NOT EXISTS "coordinator_bank_account_no" VARCHAR(50);
      ALTER TABLE "coordination_fee_batches" ADD COLUMN IF NOT EXISTS "coordinator_bank_account_holder" VARCHAR(150);
      ALTER TABLE "coordination_fee_batches" ADD COLUMN IF NOT EXISTS "coordinator_phone" VARCHAR(50);
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "coordination_fee_batches" ADD CONSTRAINT "FK_coordination_fee_batches_coordinator" 
        FOREIGN KEY ("coordinator_id") REFERENCES "coordinators"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 6. Seed Data Master Koordinator Lapangan Eksternal Standar
    await queryRunner.query(`
      INSERT INTO "coordinators" (
        "id", "company_id", "code", "name", "type", "organization_name",
        "phone", "email", "area", "address",
        "bank_name", "bank_account_number", "bank_account_holder", "notes", "is_active"
      )
      SELECT 
        gen_random_uuid(), c.id, 'KOR-BRT-01', 'H. Ahmad Sodik', 'ORGANIZATION'::"public"."coordinator_type_enum", 'Paguyuban Pengurus Jalur Barat (Jabodetabek)',
        '081298765432', 'korlap.barat@sstravelink.id', 'JAKARTA - TERMINAL PULO GEBANG & KALIDERES', 'Posko Pengurus Jalur Pulo Gebang Lt. 2',
        'BCA', '8830192847', 'Ahmad Sodik', 'Koordinator wilayah barat pemberangkatan Jabodetabek', true
      FROM companies c
      WHERE NOT EXISTS (SELECT 1 FROM coordinators WHERE code = 'KOR-BRT-01');

      INSERT INTO "coordinators" (
        "id", "company_id", "code", "name", "type", "organization_name",
        "phone", "email", "area", "address",
        "bank_name", "bank_account_number", "bank_account_holder", "notes", "is_active"
      )
      SELECT 
        gen_random_uuid(), c.id, 'KOR-TMR-01', 'Bambang Triyono', 'ORGANIZATION'::"public"."coordinator_type_enum", 'Paguyuban Jalur Timur (DIY - Solo)',
        '081387654321', 'korlap.timur@sstravelink.id', 'YOGYAKARTA - TERMINAL GIWANGAN & TIRTONADI', 'Pos Pengurus Jalur Giwangan Depan Jalur Keberangkatan',
        'MANDIRI', '1370019283746', 'Bambang Triyono', 'Koordinator wilayah timur kepulangan Yogyakarta & Solo', true
      FROM companies c
      WHERE NOT EXISTS (SELECT 1 FROM coordinators WHERE code = 'KOR-TMR-01');

      INSERT INTO "coordinators" (
        "id", "company_id", "code", "name", "type", "organization_name",
        "phone", "email", "area", "address",
        "bank_name", "bank_account_number", "bank_account_holder", "notes", "is_active"
      )
      SELECT 
        gen_random_uuid(), c.id, 'KOR-TGH-01', 'Sutrisno Widodo', 'INDIVIDUAL'::"public"."coordinator_type_enum", 'Korlap Jalur Tengah (Magelang - Bawen)',
        '081234567890', 'korlap.tengah@sstravelink.id', 'MAGELANG - TERMINAL TIDAR', 'Pos Korlap Terminal Tidar Magelang',
        'BRI', '002901029384501', 'Sutrisno Widodo', 'Koordinator jalur tengah rute Magelang/Bawen', true
      FROM companies c
      WHERE NOT EXISTS (SELECT 1 FROM coordinators WHERE code = 'KOR-TGH-01');
    `);

    // 7. Backfill relasi coordinator_id pada coordinator_fee_rules yang ada
    await queryRunner.query(`
      UPDATE coordinator_fee_rules
      SET coordinator_id = (SELECT id FROM coordinators WHERE code = 'KOR-BRT-01' LIMIT 1)
      WHERE coordinator_id IS NULL AND (origin ILIKE '%JAKARTA%' OR origin = 'ALL');

      UPDATE coordinator_fee_rules
      SET coordinator_id = (SELECT id FROM coordinators WHERE code = 'KOR-TMR-01' LIMIT 1)
      WHERE coordinator_id IS NULL AND origin ILIKE '%YOGYAKARTA%';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Rollback FK dan kolom di coordination_fee_batches
    await queryRunner.query(`ALTER TABLE "coordination_fee_batches" DROP CONSTRAINT IF EXISTS "FK_coordination_fee_batches_coordinator"`);
    await queryRunner.query(`ALTER TABLE "coordination_fee_batches" DROP COLUMN IF EXISTS "coordinator_phone"`);
    await queryRunner.query(`ALTER TABLE "coordination_fee_batches" DROP COLUMN IF EXISTS "coordinator_bank_account_holder"`);
    await queryRunner.query(`ALTER TABLE "coordination_fee_batches" DROP COLUMN IF EXISTS "coordinator_bank_account_no"`);
    await queryRunner.query(`ALTER TABLE "coordination_fee_batches" DROP COLUMN IF EXISTS "coordinator_bank_name"`);
    await queryRunner.query(`ALTER TABLE "coordination_fee_batches" DROP COLUMN IF EXISTS "coordinator_id"`);

    // 2. Rollback FK dan kolom di spj_coordination_fees
    await queryRunner.query(`ALTER TABLE "spj_coordination_fees" DROP CONSTRAINT IF EXISTS "FK_spj_coordination_fees_coordinator"`);
    await queryRunner.query(`ALTER TABLE "spj_coordination_fees" DROP COLUMN IF EXISTS "coordinator_id"`);

    // 3. Rollback FK dan kolom di coordinator_fee_rules
    await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" DROP CONSTRAINT IF EXISTS "FK_coordinator_fee_rules_coordinator"`);
    await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" DROP COLUMN IF EXISTS "coordinator_id"`);

    // 4. Drop tabel coordinators
    await queryRunner.query(`DROP TABLE IF EXISTS "coordinators"`);

    // 5. Drop ENUM
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."coordinator_type_enum"`);
  }
}
