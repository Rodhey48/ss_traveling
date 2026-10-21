import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export class SeedStandardRolesMenusAndUsers1888888888889 implements MigrationInterface {
  name = 'SeedStandardRolesMenusAndUsers1888888888889';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hashedPassword = await bcrypt.hash('Asd123', 10);

    // 1. Ensure Modules
    const modulesData = [
      { name: 'AUTH', type: 'BACKEND', description: 'Authentication & Access Control' },
      { name: 'FLEET', type: 'BACKEND', description: 'Fleet & Vehicle Management' },
      { name: 'OPERATIONS', type: 'BACKEND', description: 'Scheduling, Dispatch & SPJ' },
      { name: 'FINANCE', type: 'BACKEND', description: 'Cashier, AR & AP Management' },
      { name: 'ACCOUNTING', type: 'BACKEND', description: 'General Ledger, Journals & Reporting' },
      { name: 'CRM', type: 'BACKEND', description: 'Customer & Leads CRM Management' },
    ];

    const moduleMap = new Map<string, string>();
    for (const mod of modulesData) {
      const existing = await queryRunner.query(
        `SELECT id FROM "modules" WHERE name = $1 LIMIT 1`,
        [mod.name],
      );
      if (existing && existing.length > 0) {
        moduleMap.set(mod.name, existing[0].id);
      } else {
        const id = uuidv4();
        await queryRunner.query(
          `INSERT INTO "modules" ("id", "name", "type", "description", "is_active", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
          [id, mod.name, mod.type, mod.description],
        );
        moduleMap.set(mod.name, id);
      }
    }

    // 2. 11 Standard Roles
    const rolesData = [
      { name: 'SUPER_ADMIN', description: 'Super Administrator with full access' },
      { name: 'DIRECTOR', description: 'Direksi / Owner - Executive Analytics' },
      { name: 'FINANCE_MANAGER', description: 'Manajer Keuangan - Otorisasi & Policy' },
      { name: 'ACCOUNTANT', description: 'Akuntan - Jurnal, GL & Tutup Periode' },
      { name: 'FINANCE_AR_AP', description: 'Staff Finance - AR & AP Invoicing' },
      { name: 'POOL_CASHIER', description: 'Kasir Pool - UJ & Penerimaan Kas' },
      { name: 'OPS_ADMIN', description: 'Admin Operasional - Jadwal & SPJ Dispatcher' },
      { name: 'FIELD_COORDINATOR', description: 'Koordinator Lapangan / Korlap' },
      { name: 'CREW_DRIVER', description: 'Pengemudi / Driver Bus' },
      { name: 'CREW_CONDUCTOR', description: 'Kondektur / Helper Bus' },
      { name: 'CREW_STEWARDESS', description: 'Pramugari / Cabin Crew Bus' },
    ];

    const roleMap = new Map<string, string>();
    for (const role of rolesData) {
      const existing = await queryRunner.query(
        `SELECT id FROM "roles" WHERE name = $1 LIMIT 1`,
        [role.name],
      );
      if (existing && existing.length > 0) {
        roleMap.set(role.name, existing[0].id);
      } else {
        const id = uuidv4();
        await queryRunner.query(
          `INSERT INTO "roles" ("id", "name", "description", "is_active", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, true, NOW(), NOW())`,
          [id, role.name, role.description],
        );
        roleMap.set(role.name, id);
      }
    }

    // 3. 14 Testing Users (All with password: Asd123)
    const usersData = [
      {
        email: 'superadmin@sstravel.com',
        name: 'Super Admin',
        nip: 'ADM-001',
        phone: '081200000001',
        type: 'admin',
        roleName: 'SUPER_ADMIN',
      },
      {
        email: 'director@sstravel.com',
        name: 'Pak Wira (Direktur)',
        nip: 'DIR-001',
        phone: '081200000002',
        type: 'admin',
        roleName: 'DIRECTOR',
      },
      {
        email: 'finance.manager@sstravel.com',
        name: 'Pak Hendro (Finance Manager)',
        nip: 'FM-001',
        phone: '081200000003',
        type: 'admin',
        roleName: 'FINANCE_MANAGER',
      },
      {
        email: 'accountant@sstravel.com',
        name: 'Mbak Dewi (Akuntan)',
        nip: 'ACC-001',
        phone: '081200000004',
        type: 'employee',
        roleName: 'ACCOUNTANT',
      },
      {
        email: 'finance.arap@sstravel.com',
        name: 'Staff Finance AR/AP',
        nip: 'FIN-001',
        phone: '081200000005',
        type: 'employee',
        roleName: 'FINANCE_AR_AP',
      },
      {
        email: 'cashier.ciputat@sstravel.com',
        name: 'Mas Deni (Kasir Pool Ciputat)',
        nip: 'CSH-001',
        phone: '081200000006',
        type: 'employee',
        roleName: 'POOL_CASHIER',
      },
      {
        email: 'ops.admin@sstravel.com',
        name: 'Dispatcher Operasional',
        nip: 'OPS-001',
        phone: '081200000007',
        type: 'employee',
        roleName: 'OPS_ADMIN',
      },
      {
        email: 'field.coordinator@sstravel.com',
        name: 'Mas Agus (Korlap Barat)',
        nip: 'FLD-001',
        phone: '081200000008',
        type: 'employee',
        roleName: 'FIELD_COORDINATOR',
      },
      {
        email: 'driver.budi@sstravel.com',
        name: 'Pak Budi (Driver 1 SS-01)',
        nip: 'DRV-001',
        phone: '081200000009',
        type: 'employee',
        roleName: 'CREW_DRIVER',
      },
      {
        email: 'driver.joko@sstravel.com',
        name: 'Pak Joko (Driver 2 SS-01)',
        nip: 'DRV-002',
        phone: '081200000010',
        type: 'employee',
        roleName: 'CREW_DRIVER',
      },
      {
        email: 'driver.hendra@sstravel.com',
        name: 'Pak Hendra (Driver Wisata)',
        nip: 'DRV-003',
        phone: '081200000011',
        type: 'employee',
        roleName: 'CREW_DRIVER',
      },
      {
        email: 'conductor.anto@sstravel.com',
        name: 'Mas Anto (Kondektur SS-01)',
        nip: 'CND-001',
        phone: '081200000012',
        type: 'employee',
        roleName: 'CREW_CONDUCTOR',
      },
      {
        email: 'stewardess.siti@sstravel.com',
        name: 'Mbak Siti (Pramugari Bus)',
        nip: 'STW-001',
        phone: '081200000013',
        type: 'employee',
        roleName: 'CREW_STEWARDESS',
      },
      {
        email: 'stewardess.maya@sstravel.com',
        name: 'Mbak Maya (Pramugari Bus)',
        nip: 'STW-002',
        phone: '081200000014',
        type: 'employee',
        roleName: 'CREW_STEWARDESS',
      },
    ];

    for (const u of usersData) {
      let userId: string;
      const existing = await queryRunner.query(
        `SELECT id FROM "users" WHERE email = $1 LIMIT 1`,
        [u.email],
      );

      if (existing && existing.length > 0) {
        userId = existing[0].id;
        await queryRunner.query(
          `UPDATE "users" 
           SET "password" = $1, "name" = $2, "nip" = $3, "phone" = $4, "type" = $5, "is_active" = true, "isPasswordChanged" = true, "updatedAt" = NOW()
           WHERE "id" = $6`,
          [hashedPassword, u.name, u.nip, u.phone, u.type, userId],
        );
      } else {
        userId = uuidv4();
        await queryRunner.query(
          `INSERT INTO "users" ("id", "email", "name", "nip", "phone", "password", "type", "is_active", "isPasswordChanged", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, NOW(), NOW())`,
          [userId, u.email, u.name, u.nip, u.phone, hashedPassword, u.type],
        );
      }

      const roleId = roleMap.get(u.roleName);
      if (roleId) {
        const existingRel = await queryRunner.query(
          `SELECT id FROM "user_roles" WHERE "userId" = $1 AND "roleId" = $2 LIMIT 1`,
          [userId, roleId],
        );
        if (!existingRel || existingRel.length === 0) {
          await queryRunner.query(
            `INSERT INTO "user_roles" ("id", "userId", "roleId", "is_active", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, true, NOW(), NOW())`,
            [uuidv4(), userId, roleId],
          );
        }
      }
    }

    // 4. Assign Modules to Roles
    for (const [rName, rId] of roleMap) {
      for (const [mName, mId] of moduleMap) {
        const existingMod = await queryRunner.query(
          `SELECT id FROM "role_modules" WHERE "roleId" = $1 AND "moduleId" = $2 LIMIT 1`,
          [rId, mId],
        );
        if (!existingMod || existingMod.length === 0) {
          await queryRunner.query(
            `INSERT INTO "role_modules" ("id", "roleId", "moduleId", "is_active", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, true, NOW(), NOW())`,
            [uuidv4(), rId, mId],
          );
        }
      }
    }

    // 5. Clean up old menus and role-menus to seed fresh comprehensive sidebar hierarchy
    await queryRunner.query(`DELETE FROM "role-menus"`);
    await queryRunner.query(`DELETE FROM "menus"`);

    // Helper to insert menu
    const authModId = moduleMap.get('AUTH');
    const fleetModId = moduleMap.get('FLEET');
    const opsModId = moduleMap.get('OPERATIONS');
    const finModId = moduleMap.get('FINANCE');
    const accModId = moduleMap.get('ACCOUNTING');
    const crmModId = moduleMap.get('CRM');

    // 5.1 Root Menus
    const dashboardId = uuidv4();
    await queryRunner.query(
      `INSERT INTO "menus" ("id", "name", "url", "icon", "sequence", "title", "isWeb", "is_active", "aclName", "moduleId", "createdAt", "updatedAt")
       VALUES ($1, 'Dashboard', '/dashboard', 'LayoutDashboard', 1, false, true, true, 'Dashboard', $2, NOW(), NOW())`,
      [dashboardId, authModId],
    );

    const masterGroupId = uuidv4();
    await queryRunner.query(
      `INSERT INTO "menus" ("id", "name", "url", "icon", "sequence", "title", "isWeb", "is_active", "aclName", "moduleId", "createdAt", "updatedAt")
       VALUES ($1, 'Master Data Perusahaan', NULL, 'Database', 2, true, true, true, 'MasterGroup', $2, NOW(), NOW())`,
      [masterGroupId, fleetModId],
    );

    const opsGroupId = uuidv4();
    await queryRunner.query(
      `INSERT INTO "menus" ("id", "name", "url", "icon", "sequence", "title", "isWeb", "is_active", "aclName", "moduleId", "createdAt", "updatedAt")
       VALUES ($1, 'Jadwal & Operasional', NULL, 'Route', 3, true, true, true, 'OpsGroup', $2, NOW(), NOW())`,
      [opsGroupId, opsModId],
    );

    const cashierGroupId = uuidv4();
    await queryRunner.query(
      `INSERT INTO "menus" ("id", "name", "url", "icon", "sequence", "title", "isWeb", "is_active", "aclName", "moduleId", "createdAt", "updatedAt")
       VALUES ($1, 'Meja Kasir Pool', NULL, 'Banknote', 4, true, true, true, 'CashierGroup', $2, NOW(), NOW())`,
      [cashierGroupId, finModId],
    );

    const financeGroupId = uuidv4();
    await queryRunner.query(
      `INSERT INTO "menus" ("id", "name", "url", "icon", "sequence", "title", "isWeb", "is_active", "aclName", "moduleId", "createdAt", "updatedAt")
       VALUES ($1, 'Keuangan & Akuntansi', NULL, 'Calculator', 5, true, true, true, 'FinanceGroup', $2, NOW(), NOW())`,
      [financeGroupId, accModId],
    );

    const systemGroupId = uuidv4();
    await queryRunner.query(
      `INSERT INTO "menus" ("id", "name", "url", "icon", "sequence", "title", "isWeb", "is_active", "aclName", "moduleId", "createdAt", "updatedAt")
       VALUES ($1, 'Manajemen Sistem', NULL, 'Settings', 6, true, true, true, 'SystemGroup', $2, NOW(), NOW())`,
      [systemGroupId, authModId],
    );

    // 5.2 Sub Menus
    const subMenus = [
      // Master Data Perusahaan
      {
        id: uuidv4(),
        name: 'Armada Bus',
        url: '/vehicles',
        icon: 'Bus',
        sequence: 1,
        aclName: 'Vehicles',
        parentId: masterGroupId,
        moduleId: fleetModId,
      },
      {
        id: uuidv4(),
        name: 'Bagan Akun (COA)',
        url: '/accounts',
        icon: 'FolderTree',
        sequence: 2,
        aclName: 'Accounts',
        parentId: masterGroupId,
        moduleId: accModId,
      },
      {
        id: uuidv4(),
        name: 'Kas & Rekening Bank',
        url: '/cash-bank',
        icon: 'Landmark',
        sequence: 3,
        aclName: 'CashBank',
        parentId: masterGroupId,
        moduleId: finModId,
      },
      {
        id: uuidv4(),
        name: 'Tarif & Musim Tiket',
        url: '/fares',
        icon: 'Tags',
        sequence: 4,
        aclName: 'Fares',
        parentId: masterGroupId,
        moduleId: opsModId,
      },
      {
        id: uuidv4(),
        name: 'Standar Tarif Kru',
        url: '/crew-rates',
        icon: 'Coins',
        sequence: 5,
        aclName: 'Fares',
        parentId: masterGroupId,
        moduleId: opsModId,
      },
      {
        id: uuidv4(),
        name: 'Mitra Agen Penjualan',
        url: '/agents',
        icon: 'Store',
        sequence: 6,
        aclName: 'Agents',
        parentId: masterGroupId,
        moduleId: opsModId,
      },
      {
        id: uuidv4(),
        name: 'Restoran Mitra & Korlap',
        url: '/partners',
        icon: 'UtensilsCrossed',
        sequence: 7,
        aclName: 'Partners',
        parentId: masterGroupId,
        moduleId: opsModId,
      },
      {
        id: uuidv4(),
        name: 'Periode Fiskal',
        url: '/fiscal-periods',
        icon: 'CalendarRange',
        sequence: 8,
        aclName: 'FiscalPeriods',
        parentId: masterGroupId,
        moduleId: accModId,
      },
      {
        id: uuidv4(),
        name: 'Pengaturan Organisasi',
        url: '/organization',
        icon: 'Building2',
        sequence: 8,
        aclName: 'Organization',
        parentId: masterGroupId,
        moduleId: authModId,
      },

      // Jadwal & Operasional
      {
        id: uuidv4(),
        name: 'Pelanggan & CRM Leads',
        url: '/customers',
        icon: 'Users',
        sequence: 1,
        aclName: 'Customers',
        parentId: opsGroupId,
        moduleId: crmModId,
      },
      {
        id: uuidv4(),
        name: 'Jadwal & Plotting Bus',
        url: '/schedules',
        icon: 'CalendarDays',
        sequence: 2,
        aclName: 'TripSchedules',
        parentId: opsGroupId,
        moduleId: opsModId,
      },
      {
        id: uuidv4(),
        name: 'Surat Perintah Jalan (SPJ)',
        url: '/spjs',
        icon: 'FileText',
        sequence: 3,
        aclName: 'SPJ',
        parentId: opsGroupId,
        moduleId: opsModId,
      },

      // Meja Kasir Pool
      {
        id: uuidv4(),
        name: 'Kasir & Settlement Kas',
        url: '/cashier',
        icon: 'HandCoins',
        sequence: 1,
        aclName: 'Cashier',
        parentId: cashierGroupId,
        moduleId: finModId,
      },
      {
        id: uuidv4(),
        name: 'Kas Kecil Pool (Petty Cash)',
        url: '/petty-cash',
        icon: 'Receipt',
        sequence: 2,
        aclName: 'PettyCash',
        parentId: cashierGroupId,
        moduleId: finModId,
      },

      // Keuangan & Akuntansi
      {
        id: uuidv4(),
        name: 'Tagihan Vendor (AP)',
        url: '/ap-invoices',
        icon: 'FileDown',
        sequence: 1,
        aclName: 'ApInvoices',
        parentId: financeGroupId,
        moduleId: finModId,
      },
      {
        id: uuidv4(),
        name: 'Piutang Usaha (AR)',
        url: '/ar-invoices',
        icon: 'FileUp',
        sequence: 2,
        aclName: 'ArInvoices',
        parentId: financeGroupId,
        moduleId: finModId,
      },
      {
        id: uuidv4(),
        name: 'Jurnal Umum',
        url: '/journals',
        icon: 'BookOpen',
        sequence: 3,
        aclName: 'Journals',
        parentId: financeGroupId,
        moduleId: accModId,
      },
      {
        id: uuidv4(),
        name: 'Profitabilitas Trip',
        url: '/reports/trip-profitability',
        icon: 'TrendingUp',
        sequence: 4,
        aclName: 'TripProfitability',
        parentId: financeGroupId,
        moduleId: accModId,
      },
      {
        id: uuidv4(),
        name: 'Buku Besar & Neraca Saldo',
        url: '/reports/general-ledger',
        icon: 'Scale',
        sequence: 5,
        aclName: 'GeneralLedger',
        parentId: financeGroupId,
        moduleId: accModId,
      },
      {
        id: uuidv4(),
        name: 'Tutup Buku Bulanan',
        url: '/period-closing',
        icon: 'Lock',
        sequence: 6,
        aclName: 'PeriodClosing',
        parentId: financeGroupId,
        moduleId: accModId,
      },

      // Manajemen Sistem
      {
        id: uuidv4(),
        name: 'Data Pengguna',
        url: '/users',
        icon: 'UserCheck',
        sequence: 1,
        aclName: 'User',
        parentId: systemGroupId,
        moduleId: authModId,
      },
      {
        id: uuidv4(),
        name: 'Hak Akses & Role',
        url: '/roles',
        icon: 'ShieldCheck',
        sequence: 2,
        aclName: 'Role',
        parentId: systemGroupId,
        moduleId: authModId,
      },
      {
        id: uuidv4(),
        name: 'Manajemen Menu',
        url: '/menu-management',
        icon: 'Menu',
        sequence: 3,
        aclName: 'Menu',
        parentId: systemGroupId,
        moduleId: authModId,
      },
    ];

    const allMenuRecords: Array<{ id: string; aclName: string; parentId: string | null }> = [
      { id: dashboardId, aclName: 'Dashboard', parentId: null },
      { id: masterGroupId, aclName: 'MasterGroup', parentId: null },
      { id: opsGroupId, aclName: 'OpsGroup', parentId: null },
      { id: cashierGroupId, aclName: 'CashierGroup', parentId: null },
      { id: financeGroupId, aclName: 'FinanceGroup', parentId: null },
      { id: systemGroupId, aclName: 'SystemGroup', parentId: null },
    ];

    for (const sub of subMenus) {
      await queryRunner.query(
        `INSERT INTO "menus" ("id", "name", "url", "icon", "sequence", "title", "isWeb", "is_active", "aclName", "parentId", "moduleId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, false, true, true, $6, $7, $8, NOW(), NOW())`,
        [sub.id, sub.name, sub.url, sub.icon, sub.sequence, sub.aclName, sub.parentId, sub.moduleId],
      );
      allMenuRecords.push({ id: sub.id, aclName: sub.aclName, parentId: sub.parentId });
    }

    // 6. Assign Permissions (role-menus)
    const assignPermission = async (
      rName: string,
      menuId: string,
      perms: { isRead: boolean; isCreate: boolean; isUpdate: boolean; isDelete: boolean },
    ) => {
      const rId = roleMap.get(rName);
      if (!rId) return;
      await queryRunner.query(
        `INSERT INTO "role-menus" ("id", "roleId", "menuId", "isRead", "isCreate", "isUpdate", "isDelete", "is_active", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
        [uuidv4(), rId, menuId, perms.isRead, perms.isCreate, perms.isUpdate, perms.isDelete],
      );
    };

    // Helper check
    const isUnderParent = (menuId: string, pId: string) => {
      const m = allMenuRecords.find((x) => x.id === menuId);
      return m && m.parentId === pId;
    };

    for (const item of allMenuRecords) {
      const mId = item.id;
      const acl = item.aclName;

      // 6.1 SUPER_ADMIN gets ALL permissions
      await assignPermission('SUPER_ADMIN', mId, {
        isRead: true,
        isCreate: true,
        isUpdate: true,
        isDelete: true,
      });

      // 6.2 DIRECTOR: Read-only on Dashboard, Master, Ops, Finance
      if (
        mId === dashboardId ||
        mId === masterGroupId ||
        mId === opsGroupId ||
        mId === financeGroupId ||
        isUnderParent(mId, masterGroupId) ||
        isUnderParent(mId, opsGroupId) ||
        isUnderParent(mId, financeGroupId)
      ) {
        await assignPermission('DIRECTOR', mId, {
          isRead: true,
          isCreate: false,
          isUpdate: false,
          isDelete: false,
        });
      }

      // 6.3 FINANCE_MANAGER: Full on Finance & Cashier, Read on Master
      if (
        mId === dashboardId ||
        mId === cashierGroupId ||
        mId === financeGroupId ||
        isUnderParent(mId, cashierGroupId) ||
        isUnderParent(mId, financeGroupId)
      ) {
        await assignPermission('FINANCE_MANAGER', mId, {
          isRead: true,
          isCreate: true,
          isUpdate: true,
          isDelete: true,
        });
      } else if (mId === masterGroupId || isUnderParent(mId, masterGroupId)) {
        await assignPermission('FINANCE_MANAGER', mId, {
          isRead: true,
          isCreate: false,
          isUpdate: false,
          isDelete: false,
        });
      }

      // 6.4 ACCOUNTANT: Full on Journals, GL, COA, Cash/Bank, Period Closing
      if (
        mId === dashboardId ||
        mId === financeGroupId ||
        mId === cashierGroupId ||
        isUnderParent(mId, cashierGroupId) ||
        acl === 'Journals' ||
        acl === 'GeneralLedger' ||
        acl === 'TripProfitability' ||
        acl === 'PeriodClosing' ||
        acl === 'Accounts' ||
        acl === 'CashBank' ||
        acl === 'FiscalPeriods'
      ) {
        if (mId === masterGroupId) {
          await assignPermission('ACCOUNTANT', mId, { isRead: true, isCreate: false, isUpdate: false, isDelete: false });
        } else {
          await assignPermission('ACCOUNTANT', mId, { isRead: true, isCreate: true, isUpdate: true, isDelete: false });
        }
      }

      // 6.5 FINANCE_AR_AP: Full on AP & AR Invoices, Customers, Partners
      if (
        mId === dashboardId ||
        mId === financeGroupId ||
        acl === 'ApInvoices' ||
        acl === 'ArInvoices'
      ) {
        await assignPermission('FINANCE_AR_AP', mId, { isRead: true, isCreate: true, isUpdate: true, isDelete: false });
      } else if (
        mId === masterGroupId ||
        acl === 'Customers' ||
        acl === 'Partners' ||
        acl === 'Agents'
      ) {
        await assignPermission('FINANCE_AR_AP', mId, { isRead: true, isCreate: true, isUpdate: true, isDelete: false });
      } else if (mId === opsGroupId || acl === 'SPJ' || acl === 'TripSchedules') {
        await assignPermission('FINANCE_AR_AP', mId, { isRead: true, isCreate: false, isUpdate: false, isDelete: false });
      }

      // 6.6 POOL_CASHIER: Full on Cashier, Petty Cash, Cash Accounts
      if (
        mId === dashboardId ||
        mId === cashierGroupId ||
        isUnderParent(mId, cashierGroupId) ||
        acl === 'CashBank'
      ) {
        if (acl === 'CashBank') {
          await assignPermission('POOL_CASHIER', masterGroupId, { isRead: true, isCreate: false, isUpdate: false, isDelete: false });
        }
        await assignPermission('POOL_CASHIER', mId, { isRead: true, isCreate: true, isUpdate: true, isDelete: false });
      }

      // 6.7 OPS_ADMIN: Full on Schedules, SPJ, Vehicles, Customers, Fares, Agents, Partners
      if (
        mId === dashboardId ||
        mId === opsGroupId ||
        isUnderParent(mId, opsGroupId) ||
        mId === masterGroupId ||
        acl === 'Vehicles' ||
        acl === 'Customers' ||
        acl === 'Fares' ||
        acl === 'Agents' ||
        acl === 'Partners'
      ) {
        await assignPermission('OPS_ADMIN', mId, { isRead: true, isCreate: true, isUpdate: true, isDelete: false });
      }

      // 6.8 FIELD_COORDINATOR: Read on Schedules, SPJ, Partners
      if (
        mId === dashboardId ||
        mId === opsGroupId ||
        acl === 'TripSchedules' ||
        acl === 'SPJ' ||
        acl === 'Partners'
      ) {
        if (acl === 'Partners') {
          await assignPermission('FIELD_COORDINATOR', masterGroupId, { isRead: true, isCreate: false, isUpdate: false, isDelete: false });
        }
        await assignPermission('FIELD_COORDINATOR', mId, { isRead: true, isCreate: false, isUpdate: false, isDelete: false });
      }

      // 6.9 CREW_DRIVER, CREW_CONDUCTOR, CREW_STEWARDESS: Dashboard & Read SPJ
      if (mId === dashboardId || mId === opsGroupId || acl === 'SPJ') {
        await assignPermission('CREW_DRIVER', mId, { isRead: true, isCreate: false, isUpdate: false, isDelete: false });
        await assignPermission('CREW_CONDUCTOR', mId, { isRead: true, isCreate: false, isUpdate: false, isDelete: false });
        await assignPermission('CREW_STEWARDESS', mId, { isRead: true, isCreate: false, isUpdate: false, isDelete: false });
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "role-menus"`);
    await queryRunner.query(`DELETE FROM "menus"`);
  }
}
