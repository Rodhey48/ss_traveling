import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigrationLoging1787947654142 implements MigrationInterface {
    name = 'InitialMigrationLoging1787947654142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "transactionDetail"`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "transaction_detail" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "tax" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_605baeb040ff0fae995404cea37" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_605baeb040ff0fae995404cea37"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "tax"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "transaction_detail"`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "transactionDetail" character varying`);
    }

}
