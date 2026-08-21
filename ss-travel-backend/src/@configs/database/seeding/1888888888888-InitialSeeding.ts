import { BcryptService } from '@services/bcrypt/bcrypt.service';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedInitialData1888888888888 implements MigrationInterface {
  name = 'SeedInitialData1888888888888';

  private readonly bcrypt = new BcryptService();

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Seed Modules
    const modules = [
      {
        id: uuidv4(),
        name: 'AUTH',
        type: 'BACKEND',
        description: 'Authentication and Authorization Module',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'FINANCE',
        type: 'BACKEND',
        description: 'Finance and Accounting Module',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'FLEET',
        type: 'BACKEND',
        description: 'Fleet and Bus Management Module',
        isActive: true,
      },
    ];

    for (const mod of modules) {
      await queryRunner.manager.insert('modules', mod);
    }

    // 2. Seed Roles
    const roles = [
      {
        id: uuidv4(),
        name: 'SUPERADMIN',
        description: 'Super Administrator with full access',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'ADMIN',
        description: 'Standard Administrator',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'USER',
        description: 'Standard User',
        isActive: true,
      },
    ];

    for (const role of roles) {
      await queryRunner.manager.insert('roles', role);
    }

    // 3. Seed Parent Menus logic moved to Step 6

    // 4. Seed Users
    const usersData = [
      {
        id: uuidv4(),
        email: 'superadmin@sstravel.com',
        name: 'Super Admin',
        username: 'superadmin',
        nip: '001',
        phone: '08123456789',
        password: await this.bcrypt.createHashPassword('Admin123!'),
        isActive: true,
        isPasswordChanged: true,
        type: 'admin',
        roleName: 'SUPERADMIN',
      },
      {
        id: uuidv4(),
        email: 'admin@sstravel.com',
        name: 'Admin Operational',
        username: 'admin',
        nip: '002',
        phone: '08123456780',
        password: await this.bcrypt.createHashPassword('Admin123!'),
        isActive: true,
        isPasswordChanged: true,
        type: 'admin',
        roleName: 'ADMIN',
      },
      {
        id: uuidv4(),
        email: 'user@sstravel.com',
        name: 'Standard User',
        username: 'user',
        nip: '003',
        phone: '08123456781',
        password: await this.bcrypt.createHashPassword('Admin123!'),
        isActive: true,
        isPasswordChanged: true,
        type: 'user',
        roleName: 'USER',
      },
    ];

    for (const userData of usersData) {
      const { roleName, ...user } = userData;
      await queryRunner.manager.insert('users', user);

      const role = roles.find((r) => r.name === roleName);
      if (role) {
        await queryRunner.manager.insert('user_roles', {
          id: uuidv4(),
          user: { id: user.id },
          role: { id: role.id },
        });
      }
    }

    // 5. Assign Modules to Roles
    const superAdminRole = roles.find((r) => r.name === 'SUPERADMIN');
    const adminRole = roles.find((r) => r.name === 'ADMIN');
    const userRole = roles.find((r) => r.name === 'USER');

    for (const mod of modules) {
      // SUPERADMIN gets all
      await queryRunner.manager.insert('role_modules', {
        id: uuidv4(),
        role: { id: superAdminRole?.id },
        module: { id: mod.id },
      });

      // ADMIN gets all
      await queryRunner.manager.insert('role_modules', {
        id: uuidv4(),
        role: { id: adminRole?.id },
        module: { id: mod.id },
      });
    }
    // USER only gets AUTH and FLEET
    const userModules = modules.filter(m => m.name === 'AUTH' || m.name === 'FLEET');
    for (const mod of userModules) {
      await queryRunner.manager.insert('role_modules', {
        id: uuidv4(),
        role: { id: userRole?.id },
        module: { id: mod.id },
      });
    }

    // 6. Expanded Menus Seeding
    const allMenus = [
      {
        id: uuidv4(),
        name: 'Dashboard',
        url: '/dashboard',
        icon: 'cil-speedometer',
        sequence: 1,
        isWeb: true,
        isActive: true,
        moduleName: 'AUTH',
      },
      {
        id: uuidv4(),
        name: 'Fleet Management',
        url: '/fleet',
        icon: 'cil-bus-alt',
        sequence: 2,
        isWeb: true,
        isActive: true,
        moduleName: 'FLEET',
      },
      {
        id: uuidv4(),
        name: 'Finance',
        url: '/finance',
        icon: 'cil-money',
        sequence: 3,
        isWeb: true,
        isActive: true,
        moduleName: 'FINANCE',
      },
      {
        id: uuidv4(),
        name: 'User Management',
        url: null,
        icon: 'cil-people',
        sequence: 4,
        isWeb: true,
        isActive: true,
        moduleName: 'AUTH',
      },
      {
        id: uuidv4(),
        name: 'Settings',
        url: '/settings',
        icon: 'cil-settings',
        sequence: 5,
        isWeb: true,
        isActive: true,
        moduleName: 'AUTH',
      },
    ];

    const menuMap = new Map();
    for (const menuData of allMenus) {
      const { moduleName, ...menu } = menuData;
      const moduleId = modules.find((m) => m.name === moduleName)?.id;
      const result = await queryRunner.manager.insert('menus', {
        ...menu,
        module: { id: moduleId },
      });
      menuMap.set(menu.name, menu.id);
    }

    // Seed Sub-menus for User Management
    const userManagementId = menuMap.get('User Management');
    const subMenus = [
      {
        id: uuidv4(),
        name: 'Users',
        url: '/users',
        icon: 'cil-user',
        sequence: 1,
        isWeb: true,
        isActive: true,
        moduleName: 'AUTH',
        parentId: userManagementId,
      },
      {
        id: uuidv4(),
        name: 'Roles',
        url: '/roles',
        icon: 'cil-shield-check',
        sequence: 2,
        isWeb: true,
        isActive: true,
        moduleName: 'AUTH',
        parentId: userManagementId,
      },
      {
        id: uuidv4(),
        name: 'Modules',
        url: '/modules',
        icon: 'cil-puzzle',
        sequence: 3,
        isWeb: true,
        isActive: true,
        moduleName: 'AUTH',
        parentId: userManagementId,
      },
    ];

    for (const sub of subMenus) {
      const { moduleName, parentId, ...menu } = sub;
      const moduleId = modules.find((m) => m.name === moduleName)?.id;
      await queryRunner.manager.insert('menus', {
        ...menu,
        module: { id: moduleId },
        parent: { id: parentId },
      });
      menuMap.set(sub.name, sub.id);
    }

    // 7. Assign Menus to Roles
    const assignMenu = async (roleId, menuId, permissions = { isRead: true, isCreate: true, isUpdate: true, isDelete: true }) => {
      await queryRunner.manager.insert('role-menus', {
        id: uuidv4(),
        role: { id: roleId },
        menu: { id: menuId },
        ...permissions,
      });
    };

    // SUPERADMIN gets all
    for (const [name, id] of menuMap) {
      await assignMenu(superAdminRole?.id, id);
    }

    // ADMIN gets most
    const adminMenuNames = ['Dashboard', 'Fleet Management', 'Finance', 'User Management', 'Users', 'Settings'];
    for (const name of adminMenuNames) {
      const id = menuMap.get(name);
      if (id) await assignMenu(adminRole?.id, id);
    }
    // ADMIN gets Roles and Modules as Read-only
    const adminReadOnly = ['Roles', 'Modules'];
    for (const name of adminReadOnly) {
      const id = menuMap.get(name);
      if (id) await assignMenu(adminRole?.id, id, { isRead: true, isCreate: false, isUpdate: false, isDelete: false });
    }

    // USER gets limited
    const userMenuNames = ['Dashboard', 'Fleet Management', 'Settings'];
    for (const name of userMenuNames) {
      const id = menuMap.get(name);
      if (id) await assignMenu(userRole?.id, id, { isRead: true, isCreate: false, isUpdate: false, isDelete: false });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM "user_roles"');
    await queryRunner.query('DELETE FROM "role_modules"');
    await queryRunner.query('DELETE FROM "role-menus"');
    await queryRunner.query('DELETE FROM "users"');
    await queryRunner.query('DELETE FROM "roles"');
    await queryRunner.query('DELETE FROM "menus"');
    await queryRunner.query('DELETE FROM "modules"');
  }
}
