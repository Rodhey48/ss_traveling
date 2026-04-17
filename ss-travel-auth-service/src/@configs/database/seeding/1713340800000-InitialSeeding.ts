import { BcryptService } from '../../@services/bcrypt/bcrypt.service';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedInitialData1713340800000 implements MigrationInterface {
    name = 'SeedInitialData1713340800000';

    private readonly bcrypt = new BcryptService();

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Seed Modules
        const modules = [
            { id: uuidv4(), name: 'AUTH', type: 'BACKEND', description: 'Authentication and Authorization Module', isActive: true },
            { id: uuidv4(), name: 'FINANCE', type: 'BACKEND', description: 'Finance and Accounting Module', isActive: true },
            { id: uuidv4(), name: 'FLEET', type: 'BACKEND', description: 'Fleet and Bus Management Module', isActive: true },
        ];

        for (const mod of modules) {
            await queryRunner.manager.insert('modules', mod);
        }

        // 2. Seed Roles
        const roles = [
            { id: uuidv4(), name: 'SUPERADMIN', description: 'Super Administrator with full access', isActive: true },
            { id: uuidv4(), name: 'ADMIN', description: 'Standard Administrator', isActive: true },
            { id: uuidv4(), name: 'USER', description: 'Standard User', isActive: true },
        ];

        for (const role of roles) {
            await queryRunner.manager.insert('roles', role);
        }

        // 3. Seed Menus for AUTH Module
        const authModuleId = modules.find(m => m.name === 'AUTH')?.id;
        const menus = [
            {
                id: uuidv4(),
                name: 'Dashboard',
                url: '/dashboard',
                icon: 'cil-speedometer',
                sequence: 1,
                isWeb: true,
                isActive: true,
                module: { id: authModuleId }
            },
            {
                id: uuidv4(),
                name: 'User Management',
                url: '/users',
                icon: 'cil-user',
                sequence: 2,
                isWeb: true,
                isActive: true,
                module: { id: authModuleId }
            },
            {
                id: uuidv4(),
                name: 'Role Management',
                url: '/roles',
                icon: 'cil-settings',
                sequence: 3,
                isWeb: true,
                isActive: true,
                module: { id: authModuleId }
            }
        ];

        for (const menu of menus) {
            await queryRunner.manager.insert('menus', menu);
        }

        // 4. Seed Admin User
        const adminUser = {
            id: uuidv4(),
            email: 'admin@sstravel.com',
            name: 'Super Admin SS Travel',
            username: 'admin',
            nip: '000',
            phone: '08123456789',
            password: await this.bcrypt.createHashPassword('Admin123!'),
            isActive: true,
            isPasswordChanged: true,
            type: 'admin'
        };

        const result = await queryRunner.manager.insert('users', adminUser);
        const userId = result.identifiers[0].id;

        // 5. Assign Role to User (SUPERADMIN)
        const superAdminRole = roles.find(r => r.name === 'SUPERADMIN');
        if (superAdminRole) {
            await queryRunner.query(
                `INSERT INTO user_roles ("userId", "roleId") VALUES ('${userId}', '${superAdminRole.id}')`
            );
        }

        // 6. Assign Module to Role
        for (const mod of modules) {
            await queryRunner.query(
                `INSERT INTO role_modules ("roleId", "moduleId") VALUES ('${superAdminRole?.id}', '${mod.id}')`
            );
        }

        // 7. Assign Menus to Role (SUPERADMIN gets all menus)
        for (const menu of menus) {
            await queryRunner.query(
                `INSERT INTO "role-menus" ("roleId", "menuId", "isRead", "isCreate", "isUpdate", "isDelete")
                 VALUES ('${superAdminRole?.id}', '${menu.id}', true, true, true, true)`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM user_roles');
        await queryRunner.query('DELETE FROM role_module');
        await queryRunner.query('DELETE FROM users');
        await queryRunner.query('DELETE FROM roles');
        await queryRunner.query('DELETE FROM menus');
        await queryRunner.query('DELETE FROM modules');
    }
}
