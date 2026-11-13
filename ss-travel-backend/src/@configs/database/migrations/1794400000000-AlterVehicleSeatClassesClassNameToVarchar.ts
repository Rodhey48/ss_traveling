import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterVehicleSeatClassesClassNameToVarchar1794400000000
  implements MigrationInterface
{
  name = 'AlterVehicleSeatClassesClassNameToVarchar1794400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_seat_classes"
      ALTER COLUMN "class_name" TYPE character varying(50) USING "class_name"::text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_seat_classes"
      ALTER COLUMN "class_name" TYPE "vehicle_seat_classes_class_name_enum" USING "class_name"::"vehicle_seat_classes_class_name_enum"
    `);
  }
}
