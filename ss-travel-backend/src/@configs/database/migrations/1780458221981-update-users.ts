import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUsers1780458221981 implements MigrationInterface {
    name = 'UpdateUsers1780458221981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "session_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "refresh_token" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_origin" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_origin"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refresh_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "session_token"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "token" character varying`);
    }

}
