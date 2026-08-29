import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionUserId1787948693036 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$ BEGIN
      ALTER TABLE "transaction" ADD COLUMN "userId" uuid;
    EXCEPTION WHEN duplicate_column THEN null; END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      ALTER TABLE "transaction" ADD CONSTRAINT "FK_transaction_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "FK_transaction_user"`,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN IF EXISTS "userId"`);
  }
}
