import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedVehicleImages1888888888897 implements MigrationInterface {
  name = 'SeedVehicleImages1888888888897';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const vehicles = await queryRunner.query(
      `SELECT "id", "code", "nickname", "vehicle_type" FROM "vehicles" ORDER BY "code" ASC`,
    );

    if (!vehicles || vehicles.length === 0) {
      return;
    }

    // Variasi foto bus eksterior berkualitas tinggi & interior representatif
    const busImageCatalog: Record<
      string,
      { cover: string; interior: string; coverCaption: string; interiorCaption: string }
    > = {
      'SS-01': {
        cover:
          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        interior:
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        coverCaption: 'Tampak Eksterior Jetbus 5 Combi SS-01',
        interiorCaption: 'Kabin Sleeper 1-1 & Luxury 2-1 SS-01',
      },
      'SS-02': {
        cover:
          'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
        interior:
          'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
        coverCaption: 'Eksterior Luxury Pariwisata SS-02',
        interiorCaption: 'Interior Kursi Kapten Luxury 2-1 SS-02',
      },
      'SS-03': {
        cover:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
        interior:
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        coverCaption: 'Armada Executive Royal Avante H8 SS-03',
        interiorCaption: 'Legrest & AVOD Entertainment SS-03',
      },
      'SS-04': {
        cover:
          'https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&w=1200&q=80',
        interior:
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        coverCaption: 'Double Decker Super Suite SS-04',
        interiorCaption: 'First Class Sleeper Pods SS-04',
      },
      'SS-05': {
        cover:
          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        interior:
          'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
        coverCaption: 'Sultan Class 2-1 Tourista SS-05',
        interiorCaption: 'Kabin Eksklusif Sultan SS-05',
      },
      'SS-06': {
        cover:
          'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
        interior:
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        coverCaption: 'Executive AKAP Legacy SR2 HD Prime SS-06',
        interiorCaption: 'Reclining Seat Executive SS-06',
      },
      'SS-07': {
        cover:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
        interior:
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        coverCaption: 'Combi Dreamliner Skylander SS-07',
        interiorCaption: 'Kombinasi Sleeper & Captain Seat SS-07',
      },
      'SS-08': {
        cover:
          'https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&w=1200&q=80',
        interior:
          'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
        coverCaption: 'Pariwisata Executive Jetbus 3+ SS-08',
        interiorCaption: 'Konfigurasi Kursi 2-2 Nyaman SS-08',
      },
      'SS-09': {
        cover:
          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        interior:
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        coverCaption: 'Grand Captain Sleeper Avante H8 SS-09',
        interiorCaption: 'Top-tier Sleeper Deck SS-09',
      },
      'SS-10': {
        cover:
          'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
        interior:
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        coverCaption: 'Platinum Voyager Legacy SR3 Ultimate SS-10',
        interiorCaption: 'Air Suspension Cabin Executive SS-10',
      },
    };

    for (const v of vehicles) {
      // Periksa apakah vehicle ini sudah memiliki gambar
      const existing = await queryRunner.query(
        `SELECT COUNT(*) FROM "vehicle_images" WHERE "vehicle_id" = '${v.id}'`,
      );

      if (parseInt(existing[0]?.count || '0', 10) > 0) {
        continue;
      }

      const imgInfo =
        busImageCatalog[v.code] || {
          cover:
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
          interior:
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
          coverCaption: `Eksterior Bus ${v.code}`,
          interiorCaption: `Kabin Penumpang Bus ${v.code}`,
        };

      // 1. Cover Eksterior
      await queryRunner.query(`
        INSERT INTO "vehicle_images" (
          "id", "vehicle_id", "image_url", "caption", "is_primary", "sequence", "is_active"
        ) VALUES (
          '${uuidv4()}',
          '${v.id}',
          '${imgInfo.cover}',
          '${imgInfo.coverCaption}',
          true,
          0,
          true
        )
      `);

      // 2. Interior Kabin
      await queryRunner.query(`
        INSERT INTO "vehicle_images" (
          "id", "vehicle_id", "image_url", "caption", "is_primary", "sequence", "is_active"
        ) VALUES (
          '${uuidv4()}',
          '${v.id}',
          '${imgInfo.interior}',
          '${imgInfo.interiorCaption}',
          false,
          1,
          true
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "vehicle_images"`);
  }
}
