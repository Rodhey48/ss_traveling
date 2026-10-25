import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddTreasuryMenu1782600000000 implements MigrationInterface {
  name = 'AddTreasuryMenu1782600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Cari Parent Menu "Meja Kasir Pool"
    const cashierGroup = await queryRunner.query(
      `SELECT id, "moduleId" FROM "menus" WHERE name = 'Meja Kasir Pool' LIMIT 1`,
    );

    if (!cashierGroup || cashierGroup.length === 0) {
      console.log('Skipping AddTreasuryMenu: Meja Kasir Pool group menu not found');
      return;
    }

    const parentId = cashierGroup[0].id;
    const moduleId = cashierGroup[0].moduleId;

    // 2. Cek apakah menu /treasury sudah ada
    const existing = await queryRunner.query(
      `SELECT id FROM "menus" WHERE url = '/treasury' LIMIT 1`,
    );

    let menuId: string;
    if (existing && existing.length > 0) {
      menuId = existing[0].id;
    } else {
      menuId = uuidv4();
      await queryRunner.query(
        `INSERT INTO "menus" 
          ("id", "name", "url", "icon", "sequence", "title", "isWeb", "is_active", "aclName", "parentId", "moduleId", "createdAt", "updatedAt")
         VALUES ($1, 'Mutasi Kas & Rekening Bank', '/treasury', 'ArrowRightLeft', 3, false, true, true, 'CashBank', $2, $3, NOW(), NOW())`,
        [menuId, parentId, moduleId],
      );
    }

    // 3. Beri akses role-menus untuk role yang relevan
    const roles = await queryRunner.query(`SELECT id, name FROM "roles"`);
    const roleMap = new Map<string, string>();
    for (const r of roles) {
      roleMap.set(r.name, r.id);
    }

    const targetRoles = [
      { name: 'SUPER_ADMIN', perms: { isRead: true, isCreate: true, isUpdate: true, isDelete: true } },
      { name: 'DIRECTOR', perms: { isRead: true, isCreate: true, isUpdate: true, isDelete: true } },
      { name: 'FINANCE_MANAGER', perms: { isRead: true, isCreate: true, isUpdate: true, isDelete: true } },
      { name: 'ACCOUNTANT', perms: { isRead: true, isCreate: true, isUpdate: true, isDelete: true } },
      { name: 'FINANCE_AR_AP', perms: { isRead: true, isCreate: true, isUpdate: true, isDelete: true } },
      { name: 'POOL_CASHIER', perms: { isRead: true, isCreate: true, isUpdate: true, isDelete: false } },
    ];

    for (const tr of targetRoles) {
      const rId = roleMap.get(tr.name);
      if (rId) {
        const existPerm = await queryRunner.query(
          `SELECT id FROM "role-menus" WHERE "roleId" = $1 AND "menuId" = $2 LIMIT 1`,
          [rId, menuId],
        );
        if (!existPerm || existPerm.length === 0) {
          await queryRunner.query(
            `INSERT INTO "role-menus" 
              ("id", "roleId", "menuId", "isRead", "isCreate", "isUpdate", "isDelete", "is_active", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
            [uuidv4(), rId, menuId, tr.perms.isRead, tr.perms.isCreate, tr.perms.isUpdate, tr.perms.isDelete],
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const menu = await queryRunner.query(`SELECT id FROM "menus" WHERE url = '/treasury' LIMIT 1`);
    if (menu && menu.length > 0) {
      const menuId = menu[0].id;
      await queryRunner.query(`DELETE FROM "role-menus" WHERE "menuId" = $1`, [menuId]);
      await queryRunner.query(`DELETE FROM "menus" WHERE id = $1`, [menuId]);
    }
  }
}
