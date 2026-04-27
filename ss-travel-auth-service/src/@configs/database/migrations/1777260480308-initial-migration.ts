import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1777260480308 implements MigrationInterface {
    name = 'InitialMigration1777260480308'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_type_enum" AS ENUM('admin', 'employee', 'user')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "name" character varying, "email" character varying, "nip" character varying, "phone" character varying, "password" character varying NOT NULL, "token" character varying, "lastLogin" TIMESTAMP, "isPasswordChanged" boolean NOT NULL DEFAULT true, "type" "public"."users_type_enum" NOT NULL DEFAULT 'employee', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_9fe1d41682c0112df58dc745057" UNIQUE ("nip"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role-menus" ("id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "isRead" boolean NOT NULL DEFAULT true, "isCreate" boolean NOT NULL DEFAULT true, "isUpdate" boolean NOT NULL DEFAULT true, "isDelete" boolean NOT NULL DEFAULT true, "roleId" uuid, "menuId" uuid, CONSTRAINT "UQ_c885f44ad0b0806fcac33ed7d92" UNIQUE ("roleId", "menuId"), CONSTRAINT "PK_2546fafbc60959259761a67f191" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "menus" ("id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "name" character varying NOT NULL, "url" character varying, "icon" character varying, "activityName" character varying, "isWeb" boolean NOT NULL DEFAULT true, "isMobile" boolean NOT NULL DEFAULT false, "badge" json, "attributes" json, "title" boolean NOT NULL DEFAULT false, "divider" boolean NOT NULL DEFAULT false, "sequence" integer NOT NULL DEFAULT '0', "isIndent" boolean NOT NULL DEFAULT false, "parentClass" character varying, "aclName" character varying, "aclParam" character varying, "parentId" uuid, "moduleId" uuid, CONSTRAINT "PK_3fec3d93327f4538e0cbd4349c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "modules" ("id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "name" character varying NOT NULL, "type" character varying, "description" text, CONSTRAINT "PK_7dbefd488bd96c5bf31f0ce0c95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_modules" ("id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "roleId" uuid, "moduleId" uuid, CONSTRAINT "UQ_2ccda4b46a7fe72c45403952183" UNIQUE ("roleId", "moduleId"), CONSTRAINT "PK_39cccfce9ba045b2887019727d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "name" character varying NOT NULL, "description" character varying, "nsleft" integer NOT NULL DEFAULT '1', "nsright" integer NOT NULL DEFAULT '2', "parentId" uuid, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "userId" uuid, "roleId" uuid, CONSTRAINT "UQ_88481b0c4ed9ada47e9fdd67475" UNIQUE ("userId", "roleId"), CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "role-menus" ADD CONSTRAINT "FK_db61a079ed208ae7d311694807d" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role-menus" ADD CONSTRAINT "FK_b3e8fb35567dd64ef190f1949b6" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menus" ADD CONSTRAINT "FK_8523e13f1ba719e16eb474657ec" FOREIGN KEY ("parentId") REFERENCES "menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menus" ADD CONSTRAINT "FK_7f88674c8b796a945cf168c71f0" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_modules" ADD CONSTRAINT "FK_ef57addf96e200b187873f6a1a7" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_modules" ADD CONSTRAINT "FK_1fc92bfda7fa60b57ac8b8099b4" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_633896956090cdd56c930423f6d" FOREIGN KEY ("parentId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_86033897c009fcca8b6505d6be2"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_472b25323af01488f1f66a06b67"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_633896956090cdd56c930423f6d"`);
        await queryRunner.query(`ALTER TABLE "role_modules" DROP CONSTRAINT "FK_1fc92bfda7fa60b57ac8b8099b4"`);
        await queryRunner.query(`ALTER TABLE "role_modules" DROP CONSTRAINT "FK_ef57addf96e200b187873f6a1a7"`);
        await queryRunner.query(`ALTER TABLE "menus" DROP CONSTRAINT "FK_7f88674c8b796a945cf168c71f0"`);
        await queryRunner.query(`ALTER TABLE "menus" DROP CONSTRAINT "FK_8523e13f1ba719e16eb474657ec"`);
        await queryRunner.query(`ALTER TABLE "role-menus" DROP CONSTRAINT "FK_b3e8fb35567dd64ef190f1949b6"`);
        await queryRunner.query(`ALTER TABLE "role-menus" DROP CONSTRAINT "FK_db61a079ed208ae7d311694807d"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "role_modules"`);
        await queryRunner.query(`DROP TABLE "modules"`);
        await queryRunner.query(`DROP TABLE "menus"`);
        await queryRunner.query(`DROP TABLE "role-menus"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_type_enum"`);
    }

}
