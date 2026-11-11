import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedDefaultRoutesAndMenu1794382900000 implements MigrationInterface {
  name = 'SeedDefaultRoutesAndMenu1794382900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Dapatkan company utama
    const companies = await queryRunner.query(`SELECT id FROM "companies" LIMIT 1`);
    const companyId = companies && companies.length > 0 ? companies[0].id : null;

    // 2. Insert standard routes
    const defaultRoutes = [
      {
        id: uuidv4(),
        code: 'RUT-JKT-YOG-MGL',
        name: 'Jakarta / Tangerang - Yogyakarta (Via Magelang)',
        origin: 'JAKARTA',
        destination: 'YOGYAKARTA',
        via: 'Bawen - Magelang - Jombor',
        distanceKm: 535,
        estimatedHours: 9.5,
        serviceType: 'AKAP',
      },
      {
        id: uuidv4(),
        code: 'RUT-YOG-JKT-MGL',
        name: 'Yogyakarta - Jakarta / Tangerang (Via Magelang)',
        origin: 'YOGYAKARTA',
        destination: 'JAKARTA',
        via: 'Jombor - Magelang - Bawen',
        distanceKm: 535,
        estimatedHours: 9.5,
        serviceType: 'AKAP',
      },
      {
        id: uuidv4(),
        code: 'RUT-JKT-YOG-SLO',
        name: 'Jakarta / Tangerang - Yogyakarta (Via Solo)',
        origin: 'JAKARTA',
        destination: 'YOGYAKARTA',
        via: 'Kartasura - Klaten',
        distanceKm: 550,
        estimatedHours: 10,
        serviceType: 'AKAP',
      },
      {
        id: uuidv4(),
        code: 'RUT-YOG-JKT-SLO',
        name: 'Yogyakarta - Jakarta / Tangerang (Via Solo)',
        origin: 'YOGYAKARTA',
        destination: 'JAKARTA',
        via: 'Klaten - Kartasura',
        distanceKm: 550,
        estimatedHours: 10,
        serviceType: 'AKAP',
      },
    ];

    for (const r of defaultRoutes) {
      await queryRunner.query(
        `INSERT INTO "routes"
          ("id", "company_id", "code", "name", "origin", "destination", "via", "distance_km", "estimated_hours", "service_type", "is_active", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())
         ON CONFLICT ("code") DO NOTHING`,
        [
          r.id,
          companyId,
          r.code,
          r.name,
          r.origin,
          r.destination,
          r.via,
          r.distanceKm,
          r.estimatedHours,
          r.serviceType,
        ],
      );
    }

    // 3. Link existing coordinator_fee_rules to routes based on origin/destination
    const createdRoutes = await queryRunner.query(
      `SELECT id, origin, destination FROM "routes"`,
    );

    for (const cr of createdRoutes) {
      await queryRunner.query(
        `UPDATE "coordinator_fee_rules"
         SET "route_id" = $1
         WHERE "origin" = $2 AND "destination" = $3 AND "route_id" IS NULL`,
        [cr.id, cr.origin, cr.destination],
      );
    }

    // 4. Daftarkan menu "Master Rute & Trayek" di grup Master Data
    const masterGroup = await queryRunner.query(
      `SELECT id, "moduleId" FROM "menus" WHERE name ILIKE '%Master%' AND title = true LIMIT 1`,
    );

    let parentId: string | null = null;
    let moduleId: string | null = null;

    if (masterGroup && masterGroup.length > 0) {
      parentId = masterGroup[0].id;
      moduleId = masterGroup[0].moduleId;
    } else {
      const anyGroup = await queryRunner.query(
        `SELECT id, "moduleId" FROM "menus" WHERE title = true LIMIT 1`,
      );
      if (anyGroup && anyGroup.length > 0) {
        parentId = anyGroup[0].id;
        moduleId = anyGroup[0].moduleId;
      }
    }

    const existingMenu = await queryRunner.query(
      `SELECT id FROM "menus" WHERE url = '/routes' LIMIT 1`,
    );

    let menuId: string;
    if (existingMenu && existingMenu.length > 0) {
      menuId = existingMenu[0].id;
    } else {
      menuId = uuidv4();
      await queryRunner.query(
        `INSERT INTO "menus"
          ("id", "name", "url", "icon", "sequence", "title", "isWeb", "is_active", "aclName", "parentId", "moduleId", "createdAt", "updatedAt")
         VALUES ($1, 'Master Rute & Trayek', '/routes', 'Route', 8, false, true, true, 'Routes', $2, $3, NOW(), NOW())`,
        [menuId, parentId, moduleId],
      );
    }

    // 5. Beri hak akses menu ke role SUPER_ADMIN, DIREKSI, OPERATION_MANAGER, DISPATCHER
    const targetRoles = await queryRunner.query(
      `SELECT id FROM "roles" WHERE name IN ('SUPER_ADMIN', 'DIREKSI', 'OPERATION_MANAGER', 'DISPATCHER', 'BRANCH_MANAGER', 'FINANCE_MANAGER')`,
    );

    for (const role of targetRoles) {
      const hasMenu = await queryRunner.query(
        `SELECT id FROM "role-menus" WHERE "roleId" = $1 AND "menuId" = $2 LIMIT 1`,
        [role.id, menuId],
      );
      if (!hasMenu || hasMenu.length === 0) {
        await queryRunner.query(
          `INSERT INTO "role-menus" ("id", "roleId", "menuId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [uuidv4(), role.id, menuId],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "role-menus" WHERE "menuId" IN (SELECT id FROM "menus" WHERE url = '/routes')`);
    await queryRunner.query(`DELETE FROM "menus" WHERE url = '/routes'`);
    await queryRunner.query(`DELETE FROM "routes" WHERE code LIKE 'RUT-%'`);
  }
}
