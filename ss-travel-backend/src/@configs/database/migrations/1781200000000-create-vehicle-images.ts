import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class CreateVehicleImages1781200000000 implements MigrationInterface {
  name = 'CreateVehicleImages1781200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create table vehicle_images
    await queryRunner.query(`
      CREATE TABLE "vehicle_images" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "vehicle_id" uuid NOT NULL,
        "image_url" text NOT NULL,
        "caption" character varying(150),
        "is_primary" boolean NOT NULL DEFAULT false,
        "sequence" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_vehicle_images_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vehicle_images_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_images_vehicle_id" ON "vehicle_images" ("vehicle_id")
    `);

    // 2. Seed Foto Sampel untuk 10 Armada Bus SS Traveling
    const vehicles = await queryRunner.query(
      `SELECT "id", "code", "nickname", "vehicle_type" FROM "vehicles" ORDER BY "code" ASC`,
    );

    // Koleksi URL foto bus representatif (Unsplash Bus & Luxury Interior)
    const exteriorImages = [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80', // Modern Coach
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80', // Luxury Bus Exterior
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80', // Tour Bus
      'https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&w=1200&q=80', // Intercity Bus
    ];

    const interiorImages = [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', // Luxury Cabin
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', // Panoramic View
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80', // Night Coach Interior
    ];

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const coverUrl = exteriorImages[i % exteriorImages.length];
      const interiorUrl = interiorImages[i % interiorImages.length];

      // Foto 1: Cover Eksterior
      await queryRunner.query(`
        INSERT INTO "vehicle_images" (
          "id", "vehicle_id", "image_url", "caption", "is_primary", "sequence", "is_active"
        ) VALUES (
          '${uuidv4()}',
          '${v.id}',
          '${coverUrl}',
          'Eksterior ${v.nickname || v.code}',
          true,
          0,
          true
        )
      `);

      // Foto 2: Interior Kabin Penumpang
      await queryRunner.query(`
        INSERT INTO "vehicle_images" (
          "id", "vehicle_id", "image_url", "caption", "is_primary", "sequence", "is_active"
        ) VALUES (
          '${uuidv4()}',
          '${v.id}',
          '${interiorUrl}',
          'Kenyamanan Kabin Penumpang ${v.code}',
          false,
          1,
          true
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_images" CASCADE`);
  }
}
