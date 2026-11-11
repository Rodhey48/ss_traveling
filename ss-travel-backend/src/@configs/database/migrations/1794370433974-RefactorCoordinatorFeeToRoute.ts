import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorCoordinatorFeeToRoute1794370433974 implements MigrationInterface {
    name = 'RefactorCoordinatorFeeToRoute1794370433974'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // coordinator_fee_rules
        await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" ADD "origin" character varying(100) NOT NULL DEFAULT 'ALL'`);
        await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" ADD "destination" character varying(100) NOT NULL DEFAULT 'ALL'`);
        await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" DROP COLUMN "zone"`);

        // spj_coordination_fees
        await queryRunner.query(`ALTER TABLE "spj_coordination_fees" ADD "origin" character varying(100) NOT NULL DEFAULT 'ALL'`);
        await queryRunner.query(`ALTER TABLE "spj_coordination_fees" ADD "destination" character varying(100) NOT NULL DEFAULT 'ALL'`);
        await queryRunner.query(`ALTER TABLE "spj_coordination_fees" DROP COLUMN "zone"`);

        // coordination_fee_batches
        await queryRunner.query(`ALTER TABLE "coordination_fee_batches" ADD "origin" character varying(100) NOT NULL DEFAULT 'ALL'`);
        await queryRunner.query(`ALTER TABLE "coordination_fee_batches" ADD "destination" character varying(100) NOT NULL DEFAULT 'ALL'`);
        await queryRunner.query(`ALTER TABLE "coordination_fee_batches" DROP COLUMN "zone"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // coordinator_fee_rules
        await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" ADD "zone" character varying NOT NULL DEFAULT 'WEST'`);
        await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" DROP COLUMN "origin"`);
        await queryRunner.query(`ALTER TABLE "coordinator_fee_rules" DROP COLUMN "destination"`);

        // spj_coordination_fees
        await queryRunner.query(`ALTER TABLE "spj_coordination_fees" ADD "zone" character varying NOT NULL DEFAULT 'WEST'`);
        await queryRunner.query(`ALTER TABLE "spj_coordination_fees" DROP COLUMN "origin"`);
        await queryRunner.query(`ALTER TABLE "spj_coordination_fees" DROP COLUMN "destination"`);

        // coordination_fee_batches
        await queryRunner.query(`ALTER TABLE "coordination_fee_batches" ADD "zone" character varying NOT NULL DEFAULT 'WEST'`);
        await queryRunner.query(`ALTER TABLE "coordination_fee_batches" DROP COLUMN "origin"`);
        await queryRunner.query(`ALTER TABLE "coordination_fee_batches" DROP COLUMN "destination"`);
    }
}
