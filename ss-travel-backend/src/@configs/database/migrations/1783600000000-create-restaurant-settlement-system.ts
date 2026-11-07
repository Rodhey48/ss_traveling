import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class CreateRestaurantSettlementSystem1783600000000
  implements MigrationInterface
{
  name = 'CreateRestaurantSettlementSystem1783600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Buat Enum Status Kupon
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."spj_meal_record_status_enum" AS ENUM('UNPAID', 'PENDING_BATCH', 'PAID');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Buat Tabel restaurant_settlement_batches
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "restaurant_settlement_batches" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID REFERENCES "companies"("id") ON DELETE CASCADE,
        "batch_no" VARCHAR(60) NOT NULL UNIQUE,
        "restaurant_id" UUID REFERENCES "restaurants"("id") ON DELETE RESTRICT,
        "restaurant_name" VARCHAR(150),
        "total_spjs" INTEGER NOT NULL DEFAULT 0,
        "total_coupons" INTEGER NOT NULL DEFAULT 0,
        "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "payment_date" DATE NOT NULL,
        "bank_account_id" UUID REFERENCES "cash_accounts"("id") ON DELETE SET NULL,
        "reference_number" VARCHAR(100),
        "receipt_url" TEXT,
        "journal_id" UUID REFERENCES "journal_entries"("id") ON DELETE SET NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
        "notes" TEXT,
        "created_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Buat Tabel spj_meal_records
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "spj_meal_records" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID REFERENCES "companies"("id") ON DELETE CASCADE,
        "spj_id" UUID REFERENCES "spjs"("id") ON DELETE CASCADE,
        "spj_leg_id" UUID REFERENCES "spj_legs"("id") ON DELETE SET NULL,
        "restaurant_id" UUID REFERENCES "restaurants"("id") ON DELETE RESTRICT,
        "manifest_pax" INTEGER NOT NULL DEFAULT 0,
        "actual_pax" INTEGER NOT NULL DEFAULT 0,
        "rate_per_pax" DECIMAL(15,2) NOT NULL DEFAULT 25000.00,
        "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "status" "public"."spj_meal_record_status_enum" NOT NULL DEFAULT 'UNPAID',
        "settlement_batch_id" UUID REFERENCES "restaurant_settlement_batches"("id") ON DELETE SET NULL,
        "journal_id" UUID REFERENCES "journal_entries"("id") ON DELETE SET NULL,
        "discrepancy_notes" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Daftarkan Menu /finance/restaurant-settlements di urutan ke-4 induk Keuangan
    const financeGroup = await queryRunner.query(
      `SELECT id, "moduleId" FROM "menus" WHERE url = '/finance/coordination-fees' LIMIT 1`,
    );

    if (financeGroup && financeGroup.length > 0) {
      const parent = await queryRunner.query(
        `SELECT "parentId", "moduleId" FROM "menus" WHERE url = '/finance/coordination-fees' LIMIT 1`,
      );
      const parentId = parent[0]?.parentId;
      const moduleId = parent[0]?.moduleId;

      // Geser menu urutan 4 ke atas
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 8, "updatedAt" = NOW() WHERE url = '/period-closing' AND "parentId" = $1`,
        [parentId],
      );
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 7, "updatedAt" = NOW() WHERE url = '/reports/general-ledger' AND "parentId" = $1`,
        [parentId],
      );
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 6, "updatedAt" = NOW() WHERE url = '/reports/trip-profitability' AND "parentId" = $1`,
        [parentId],
      );
      await queryRunner.query(
        `UPDATE "menus" SET sequence = 5, "updatedAt" = NOW() WHERE url = '/journals' AND "parentId" = $1`,
        [parentId],
      );

      // Masukkan menu baru di sequence 4
      const menuId = uuidv4();
      await queryRunner.query(
        `INSERT INTO "menus"
          ("id", "name", "url", "icon", "sequence", "title", "isWeb", "is_active", "aclName", "parentId", "moduleId", "createdAt", "updatedAt")
         VALUES ($1, 'Tagihan Restoran Mitra', '/finance/restaurant-settlements', 'UtensilsCrossed', 4, false, true, true, 'Finance', $2, $3, NOW(), NOW())`,
        [menuId, parentId, moduleId],
      );

      // Hak Akses Role
      const roles = await queryRunner.query(`SELECT id, name FROM "roles"`);
      const roleMap = new Map<string, string>();
      for (const r of roles) {
        roleMap.set(r.name, r.id);
      }

      const targetRoles = ['SUPER_ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_AR_AP'];
      for (const roleName of targetRoles) {
        const rId = roleMap.get(roleName);
        if (rId) {
          await queryRunner.query(
            `INSERT INTO "role-menus"
              ("id", "roleId", "menuId", "isRead", "isCreate", "isUpdate", "isDelete", "is_active", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, true, true, true, true, true, NOW(), NOW())`,
            [uuidv4(), rId, menuId],
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "spj_meal_records" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "restaurant_settlement_batches" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."spj_meal_record_status_enum"`);
  }
}
