import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSchedulesAndSpjs1888888888893 implements MigrationInterface {
  name = 'SeedSchedulesAndSpjs1888888888893';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ambil data master yang sudah ada
    const companies = await queryRunner.query(`SELECT id FROM "companies" LIMIT 1`);
    const companyId = companies.length > 0 ? companies[0].id : null;

    const bus01 = await queryRunner.query(`SELECT id FROM "vehicles" WHERE "code" = 'SS-01' LIMIT 1`);
    const bus02 = await queryRunner.query(`SELECT id FROM "vehicles" WHERE "code" = 'SS-02' LIMIT 1`);
    const bus03 = await queryRunner.query(`SELECT id FROM "vehicles" WHERE "code" = 'SS-03' LIMIT 1`);

    const bus01Id = bus01.length > 0 ? bus01[0].id : null;
    const bus02Id = bus02.length > 0 ? bus02[0].id : null;
    const bus03Id = bus03.length > 0 ? bus03[0].id : null;

    const buAkap = await queryRunner.query(`SELECT id FROM "business_units" WHERE "code" = 'AKAP' LIMIT 1`);
    const buWisata = await queryRunner.query(`SELECT id FROM "business_units" WHERE "code" = 'PARIWISATA' LIMIT 1`);
    const buAkapId = buAkap.length > 0 ? buAkap[0].id : null;
    const buWisataId = buWisata.length > 0 ? buWisata[0].id : null;

    const pcAkap = await queryRunner.query(`SELECT id FROM "profit_centers" WHERE "code" = 'PC-AKAP' LIMIT 1`);
    const pcWisata = await queryRunner.query(`SELECT id FROM "profit_centers" WHERE "code" = 'PC-WISATA' LIMIT 1`);
    const pcAkapId = pcAkap.length > 0 ? pcAkap[0].id : null;
    const pcWisataId = pcWisata.length > 0 ? pcWisata[0].id : null;

    const driverBudi = await queryRunner.query(`SELECT id FROM "users" WHERE "email" = 'driver.budi@sstravel.com' LIMIT 1`);
    const driverJoko = await queryRunner.query(`SELECT id FROM "users" WHERE "email" = 'driver.joko@sstravel.com' LIMIT 1`);
    const driverHendra = await queryRunner.query(`SELECT id FROM "users" WHERE "email" = 'driver.hendra@sstravel.com' LIMIT 1`);
    const conductorAnto = await queryRunner.query(`SELECT id FROM "users" WHERE "email" = 'conductor.anto@sstravel.com' LIMIT 1`);

    const budiId = driverBudi.length > 0 ? driverBudi[0].id : null;
    const jokoId = driverJoko.length > 0 ? driverJoko[0].id : null;
    const hendraId = driverHendra.length > 0 ? driverHendra[0].id : null;
    const antoId = conductorAnto.length > 0 ? conductorAnto[0].id : null;

    const customerMitra = await queryRunner.query(`SELECT id FROM "customers" WHERE "code" = 'CUST-0001' LIMIT 1`);
    const customerMitraId = customerMitra.length > 0 ? customerMitra[0].id : null;

    // IDs terencana
    const sched01Id = 'e0000000-0000-0000-0000-000000000001';
    const sched02Id = 'e0000000-0000-0000-0000-000000000002';
    const spj01Id = 'f0000000-0000-0000-0000-000000000001';
    const spj02Id = 'f0000000-0000-0000-0000-000000000002';

    // 2. Insert Jadwal Dinas (awal spj_id = NULL)
    // Jadwal 1: AKAP Reguler PP Bus SS-01
    await queryRunner.query(`
      INSERT INTO "trip_schedules" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "schedule_no",
        "service_type", "business_unit_id", "vehicle_id", "planned_departure_at",
        "planned_return_at", "origin", "destination", "planned_driver_1_id",
        "planned_driver_2_id", "planned_conductor_id", "status", "notes"
      ) VALUES (
        '${sched01Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        'SCH/AKP/2610/0001', 'AKAP', ${buAkapId ? `'${buAkapId}'` : 'NULL'},
        ${bus01Id ? `'${bus01Id}'` : 'NULL'}, '2026-10-19 07:30:00+07', '2026-10-20 18:00:00+07',
        'Pool Ciputat / Jakarta', 'Terminal Giwangan Yogyakarta',
        ${budiId ? `'${budiId}'` : 'NULL'}, ${jokoId ? `'${jokoId}'` : 'NULL'},
        ${antoId ? `'${antoId}'` : 'NULL'}, 'IN_PROGRESS',
        'Trayek reguler PP Executive Combi Sleeper + Luxury 2-1 (Skenario 1)'
      ) ON CONFLICT ("schedule_no") DO NOTHING
    `);

    // Jadwal 2: Sewa Wisata 5 Hari Bus SS-02 (PT Mitra Sejahtera Abadi - Skenario 2)
    await queryRunner.query(`
      INSERT INTO "trip_schedules" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "schedule_no",
        "service_type", "business_unit_id", "vehicle_id", "planned_departure_at",
        "planned_return_at", "origin", "destination", "customer_id", "pic_name",
        "pic_phone", "pickup_notes", "total_package_price", "planned_driver_1_id",
        "planned_driver_2_id", "planned_conductor_id", "status", "notes"
      ) VALUES (
        '${sched02Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        'SCH/WIS/2610/0001', 'WISATA', ${buWisataId ? `'${buWisataId}'` : 'NULL'},
        ${bus02Id ? `'${bus02Id}'` : 'NULL'}, '2026-10-22 06:00:00+07', '2026-10-26 21:00:00+07',
        'Pool Ciputat / Tangerang', 'Wisata DIY & Jawa Tengah (5D4N)',
        ${customerMitraId ? `'${customerMitraId}'` : 'NULL'}, 'Pak Hendra (Panitia)',
        '081234567890', 'Lobi Gedung PT Mitra Sejahtera Abadi Jl. Sudirman',
        17500000.00, ${hendraId ? `'${hendraId}'` : 'NULL'}, ${jokoId ? `'${jokoId}'` : 'NULL'},
        ${antoId ? `'${antoId}'` : 'NULL'}, 'CONFIRMED',
        'Sewa bus pariwisata 5 hari 4 malam (Skenario 2 DP 30% + Pelunasan AR 70%)'
      ) ON CONFLICT ("schedule_no") DO NOTHING
    `);

    // 3. Insert Dokumen SPJ
    // SPJ 1: SPJ/AKP/2610/0001 (Bus SS-01, IN_PROGRESS)
    await queryRunner.query(`
      INSERT INTO "spjs" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_no",
        "service_type", "trip_schedule_id", "vehicle_id", "business_unit_id",
        "profit_center_id", "operational_status", "financial_status", "issued_at",
        "notes"
      ) VALUES (
        '${spj01Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        'SPJ/AKP/2610/0001', 'AKAP', '${sched01Id}', ${bus01Id ? `'${bus01Id}'` : 'NULL'},
        ${buAkapId ? `'${buAkapId}'` : 'NULL'}, ${pcAkapId ? `'${pcAkapId}'` : 'NULL'},
        'IN_PROGRESS', 'PENDING_SETTLEMENT', '2026-10-19 06:45:00+07',
        'SPJ Trayek Reguler Tangerang-Yogya PP Bus SS-01'
      ) ON CONFLICT ("spj_no") DO NOTHING
    `);

    // Hubungkan kembali spj_id di jadwal 1
    await queryRunner.query(`
      UPDATE "trip_schedules" SET "spj_id" = '${spj01Id}' WHERE "id" = '${sched01Id}'
    `);

    // Legs SPJ 1: Leg 1 (Berangkat) & Leg 2 (Pulang)
    await queryRunner.query(`
      INSERT INTO "spj_legs" (
        "id", "is_active", "createdAt", "updatedAt", "spj_id", "sequence_no",
        "direction", "origin", "destination", "departure_at", "status",
        "passenger_count", "meal_pax_count", "meal_discrepancy_notes"
      ) VALUES
      (
        'f1000000-0000-0000-0000-000000000001', true, NOW(), NOW(), '${spj01Id}',
        1, 'DEPARTURE', 'Pool Ciputat / Jakarta', 'Terminal Giwangan Yogyakarta',
        '2026-10-19 07:30:00+07', 'IN_PROGRESS', 24, 22,
        '2 penumpang tidur/puasa sehingga kupon makan tidak ditukarkan di RM Taman Selera'
      ),
      (
        'f1000000-0000-0000-0000-000000000002', true, NOW(), NOW(), '${spj01Id}',
        2, 'RETURN', 'Terminal Giwangan Yogyakarta', 'Pool Ciputat / Jakarta',
        NULL, 'SCHEDULED', 20, 20, NULL
      )
      ON CONFLICT ("id") DO NOTHING
    `);

    // Kru SPJ 1 & Snapshot Kompensasi
    await queryRunner.query(`
      INSERT INTO "spj_crew_assignments" (
        "id", "is_active", "createdAt", "updatedAt", "spj_id", "crew_id", "role",
        "status", "meal_allowance_snapshot", "incentive_snapshot", "full_seat_bonus_snapshot"
      ) VALUES
      (
        'f2000000-0000-0000-0000-000000000001', true, NOW(), NOW(), '${spj01Id}',
        ${budiId ? `'${budiId}'` : 'NULL'}, 'DRIVER', 'ACTIVE',
        150000.00, 250000.00, 50000.00
      ),
      (
        'f2000000-0000-0000-0000-000000000002', true, NOW(), NOW(), '${spj01Id}',
        ${jokoId ? `'${jokoId}'` : 'NULL'}, 'CO_DRIVER', 'ACTIVE',
        150000.00, 250000.00, 50000.00
      ),
      (
        'f2000000-0000-0000-0000-000000000003', true, NOW(), NOW(), '${spj01Id}',
        ${antoId ? `'${antoId}'` : 'NULL'}, 'CONDUCTOR', 'ACTIVE',
        100000.00, 150000.00, 50000.00
      )
      ON CONFLICT ("id") DO NOTHING
    `);

    // SPJ 2: Kasus Anomali Breakdown Tol Cipali (Skenario 3 - SPJ Pengganti Bus SS-03)
    await queryRunner.query(`
      INSERT INTO "spjs" (
        "id", "is_active", "createdAt", "updatedAt", "company_id", "spj_no",
        "service_type", "parent_spj_id", "vehicle_id", "business_unit_id",
        "profit_center_id", "operational_status", "financial_status", "issued_at",
        "notes"
      ) VALUES (
        '${spj02Id}', true, NOW(), NOW(), ${companyId ? `'${companyId}'` : 'NULL'},
        'SPJ/AKP/2610/0002', 'AKAP', '${spj01Id}', ${bus03Id ? `'${bus03Id}'` : 'NULL'},
        ${buAkapId ? `'${buAkapId}'` : 'NULL'}, ${pcAkapId ? `'${pcAkapId}'` : 'NULL'},
        'IN_PROGRESS', 'PENDING_SETTLEMENT', '2026-10-19 14:15:00+07',
        'SPJ Pengganti pasca insiden breakdown radiator bus SS-01 di KM 214 Tol Cipali (Skenario 3)'
      ) ON CONFLICT ("spj_no") DO NOTHING
    `);

    // Leg SPJ 2 Lanjutan
    await queryRunner.query(`
      INSERT INTO "spj_legs" (
        "id", "is_active", "createdAt", "updatedAt", "spj_id", "sequence_no",
        "direction", "origin", "destination", "departure_at", "status", "passenger_count"
      ) VALUES (
        'f1000000-0000-0000-0000-000000000003', true, NOW(), NOW(), '${spj02Id}',
        1, 'DEPARTURE', 'KM 214 Tol Cipali', 'Terminal Giwangan Yogyakarta',
        '2026-10-19 14:30:00+07', 'IN_PROGRESS', 24
      ) ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "spj_crew_assignments" WHERE "spj_id" IN ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002')`);
    await queryRunner.query(`DELETE FROM "spj_legs" WHERE "spj_id" IN ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002')`);
    await queryRunner.query(`UPDATE "trip_schedules" SET "spj_id" = NULL WHERE "id" = 'e0000000-0000-0000-0000-000000000001'`);
    await queryRunner.query(`DELETE FROM "spjs" WHERE "id" IN ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002')`);
    await queryRunner.query(`DELETE FROM "trip_schedules" WHERE "id" IN ('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002')`);
  }
}
