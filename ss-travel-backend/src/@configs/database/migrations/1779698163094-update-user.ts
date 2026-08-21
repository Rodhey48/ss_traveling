import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUser1779698163094 implements MigrationInterface {
    name = 'UpdateUser1779698163094'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
    }

}
