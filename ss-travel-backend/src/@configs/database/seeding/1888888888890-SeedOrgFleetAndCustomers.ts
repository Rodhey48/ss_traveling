import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedOrgFleetAndCustomers1888888888890
  implements MigrationInterface
{
  name = 'SeedOrgFleetAndCustomers1888888888890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Seed Company
    const companyId = uuidv4();
    await queryRunner.query(`
      INSERT INTO "companies" ("id", "code", "name", "currency", "timezone", "address", "phone", "email", "website", "is_active")
      VALUES (
        '${companyId}',
        'SST',
        'PT SS Traveling Official',
        'IDR',
        'Asia/Jakarta',
        'Jl Pahlawan Gerbang No 08 Rempoa Ciputat Timur, South Tangerang',
        '082299943700',
        'info@sstravelink.id',
        'https://www.sstravelink.id',
        true
      )
      ON CONFLICT ("code") DO NOTHING
    `);

    // Ambil ID company yang aktif
    const compRows = await queryRunner.query(
      `SELECT "id" FROM "companies" WHERE "code" = 'SST' LIMIT 1`,
    );
    const activeCompanyId = compRows[0]?.id || companyId;

    // 2. Seed Business Units
    const buAkapId = uuidv4();
    const buWisataId = uuidv4();
    const buShuttleId = uuidv4();

    await queryRunner.query(`
      INSERT INTO "business_units" ("id", "company_id", "code", "name", "description", "is_active")
      VALUES
        ('${buAkapId}', '${activeCompanyId}', 'AKAP', 'AKAP Reguler', 'Layanan Bus Antar Kota Antar Provinsi rute Tangerang - Yogya', true),
        ('${buWisataId}', '${activeCompanyId}', 'WISATA', 'Pariwisata / Charter', 'Layanan sewa charter bus pariwisata multi-day & city tour', true),
        ('${buShuttleId}', '${activeCompanyId}', 'SHUTTLE', 'Shuttle & Bandara', 'Layanan shuttle point-to-point dan antar-jemput bandara CGK/YIA', true)
      ON CONFLICT ("code") DO NOTHING
    `);

    // 3. Seed Cost Centers
    const ccOpsPoolId = uuidv4();
    const ccMntGarasiId = uuidv4();
    const ccAdmHqId = uuidv4();
    const ccOpsAkapId = uuidv4();
    const ccOpsWisataId = uuidv4();

    await queryRunner.query(`
      INSERT INTO "cost_centers" ("id", "company_id", "code", "name", "description", "is_active")
      VALUES
        ('${ccOpsPoolId}', '${activeCompanyId}', 'CC-OPS-POOL', 'Operasional Pool Ciputat', 'Biaya operasional perjalanan, solar, tol, dan pool garasi', true),
        ('${ccMntGarasiId}', '${activeCompanyId}', 'CC-MNT-GARASI', 'Bengkel Garasi & Pemeliharaan', 'Biaya suku cadang, oli, ban, servis mekanik internal', true),
        ('${ccAdmHqId}', '${activeCompanyId}', 'CC-ADM-HQ', 'Administrasi Kantor Pusat', 'Biaya umum, overhead kantor, utilitas, dan legalitas', true),
        ('${ccOpsAkapId}', '${activeCompanyId}', 'CC-OPS-AKAP', 'Operasional Divisi AKAP', 'Biaya operasional perjalanan, BBM solar, tol, komisi agen, dan kupon makan AKAP', true),
        ('${ccOpsWisataId}', '${activeCompanyId}', 'CC-OPS-WISATA', 'Operasional Divisi Pariwisata', 'Biaya operasional perjalanan wisata, BBM solar, tol, parkir, dan komisi rekanan', true)
      ON CONFLICT ("code") DO NOTHING
    `);

    // 4. Seed Profit Centers
    const buRows = await queryRunner.query(
      `SELECT "id", "code" FROM "business_units" WHERE "code" IN ('AKAP', 'WISATA')`,
    );
    const akapBu = buRows.find((r: any) => r.code === 'AKAP');
    const wisataBu = buRows.find((r: any) => r.code === 'WISATA');

    const pcAkapId = uuidv4();
    const pcWisataId = uuidv4();

    await queryRunner.query(`
      INSERT INTO "profit_centers" ("id", "company_id", "business_unit_id", "code", "name", "description", "is_active")
      VALUES
        ('${pcAkapId}', '${activeCompanyId}', ${akapBu ? `'${akapBu.id}'` : 'NULL'}, 'PC-AKAP', 'Profit Center AKAP Reguler', 'Analisis pendapatan dan laba bersih AKAP', true),
        ('${pcWisataId}', '${activeCompanyId}', ${wisataBu ? `'${wisataBu.id}'` : 'NULL'}, 'PC-WISATA', 'Profit Center Sewa Wisata', 'Analisis pendapatan dan laba sewa charter pariwisata', true)
      ON CONFLICT ("code") DO NOTHING
    `);

    // 5. Seed 10 Unit Bus Existing SS Traveling (7 Lunas, 3 Cicilan Leasing sesuai Addendum v1.13)
    const fleetData = [
      {
        code: 'SS-01',
        nickname: 'Executive Combi',
        plateNumber: 'B 7123 SS',
        vehicleType: 'BIG_BUS',
        chassisModel: 'Mercedes-Benz OH 1626',
        bodyModel: 'Jetbus 5 Combi',
        ownershipStatus: 'OWNED_PAID_OFF',
        capacity: 24,
        year: 2024,
        seatClasses: [
          { className: 'SLEEPER', seatCapacity: 4, seatLayout: '1-1 Sleeper' },
          { className: 'LUXURY_2_1', seatCapacity: 20, seatLayout: '2-1 Luxury' },
        ],
      },
      {
        code: 'SS-02',
        nickname: 'Luxury Pariwisata',
        plateNumber: 'B 7234 SS',
        vehicleType: 'BIG_BUS',
        chassisModel: 'Hino RK8 R260',
        bodyModel: 'Jetbus 3+ MHD',
        ownershipStatus: 'OWNED_PAID_OFF',
        capacity: 30,
        year: 2023,
        seatClasses: [
          { className: 'LUXURY_2_1', seatCapacity: 30, seatLayout: '2-1 Luxury' },
        ],
      },
      {
        code: 'SS-03',
        nickname: 'Executive Royal',
        plateNumber: 'B 7345 SS',
        vehicleType: 'BIG_BUS',
        chassisModel: 'Mercedes-Benz OH 1626',
        bodyModel: 'Avante H8',
        ownershipStatus: 'OWNED_PAID_OFF',
        capacity: 28,
        year: 2023,
        seatClasses: [
          { className: 'EXECUTIVE', seatCapacity: 28, seatLayout: '2-2 Executive' },
        ],
      },
      {
        code: 'SS-04',
        nickname: 'Super Executive',
        plateNumber: 'B 7456 SS',
        vehicleType: 'BIG_BUS',
        chassisModel: 'Hino RK8 R260',
        bodyModel: 'Legacy SR2 HD Prime',
        ownershipStatus: 'OWNED_PAID_OFF',
        capacity: 28,
        year: 2022,
        seatClasses: [
          { className: 'EXECUTIVE', seatCapacity: 28, seatLayout: '2-2 Executive' },
        ],
      },
      {
        code: 'SS-05',
        nickname: 'Dream Sleeper',
        plateNumber: 'B 7567 SS',
        vehicleType: 'BIG_BUS',
        chassisModel: 'Mercedes-Benz OH 1626',
        bodyModel: 'Suites Class Laksana',
        ownershipStatus: 'OWNED_PAID_OFF',
        capacity: 22,
        year: 2024,
        seatClasses: [
          { className: 'SLEEPER', seatCapacity: 22, seatLayout: '1-1 Suites' },
        ],
      },
      {
        code: 'SS-06',
        nickname: 'Medium Luxury',
        plateNumber: 'B 7678 SS',
        vehicleType: 'MEDIUM_BUS',
        chassisModel: 'Mitsubishi Canter FE 84G',
        bodyModel: 'Jetbus 3+ MD',
        ownershipStatus: 'OWNED_PAID_OFF',
        capacity: 31,
        year: 2023,
        seatClasses: [
          { className: 'EXECUTIVE', seatCapacity: 31, seatLayout: '2-2 Medium' },
        ],
      },
      {
        code: 'SS-07',
        nickname: 'Medium Pariwisata',
        plateNumber: 'B 7789 SS',
        vehicleType: 'MEDIUM_BUS',
        chassisModel: 'Isuzu NQR 71',
        bodyModel: 'Tourista Laksana',
        ownershipStatus: 'OWNED_PAID_OFF',
        capacity: 33,
        year: 2022,
        seatClasses: [
          { className: 'STANDARD', seatCapacity: 33, seatLayout: '2-2 Standard' },
        ],
      },
      {
        code: 'SS-08',
        nickname: 'Grand Captain',
        plateNumber: 'B 7890 SS',
        vehicleType: 'BIG_BUS',
        chassisModel: 'Scania K360IB Opticruise',
        bodyModel: 'Jetbus 5 Dream Coach',
        ownershipStatus: 'LEASING',
        capacity: 24,
        year: 2025,
        seatClasses: [
          { className: 'SLEEPER', seatCapacity: 4, seatLayout: '1-1 Sleeper' },
          { className: 'LUXURY_2_1', seatCapacity: 20, seatLayout: '2-1 Luxury' },
        ],
      },
      {
        code: 'SS-09',
        nickname: 'Imperial Suites',
        plateNumber: 'B 7901 SS',
        vehicleType: 'BIG_BUS',
        chassisModel: 'Mercedes-Benz OH 1626',
        bodyModel: 'Avante H8 Grand Captain',
        ownershipStatus: 'LEASING',
        capacity: 24,
        year: 2025,
        seatClasses: [
          { className: 'SLEEPER', seatCapacity: 4, seatLayout: '1-1 Sleeper' },
          { className: 'LUXURY_2_1', seatCapacity: 20, seatLayout: '2-1 Luxury' },
        ],
      },
      {
        code: 'SS-10',
        nickname: 'Platinum Voyager',
        plateNumber: 'B 7012 SS',
        vehicleType: 'BIG_BUS',
        chassisModel: 'Hino RM 280 Air Suspension',
        bodyModel: 'Legacy SR3 Ultimate',
        ownershipStatus: 'LEASING',
        capacity: 28,
        year: 2025,
        seatClasses: [
          { className: 'EXECUTIVE', seatCapacity: 28, seatLayout: '2-2 Executive' },
        ],
      },
    ];

    for (const v of fleetData) {
      const vehicleId = uuidv4();
      await queryRunner.query(`
        INSERT INTO "vehicles" (
          "id", "company_id", "code", "nickname", "plate_number",
          "vehicle_type", "chassis_model", "body_model", "ownership_status",
          "capacity", "year", "is_active"
        ) VALUES (
          '${vehicleId}', '${activeCompanyId}', '${v.code}', '${v.nickname}', '${v.plateNumber}',
          '${v.vehicleType}', '${v.chassisModel}', '${v.bodyModel}', '${v.ownershipStatus}',
          ${v.capacity}, ${v.year}, true
        )
        ON CONFLICT ("code") DO NOTHING
      `);

      const vRow = await queryRunner.query(
        `SELECT "id" FROM "vehicles" WHERE "code" = '${v.code}' LIMIT 1`,
      );
      const insertedVehicleId = vRow[0]?.id || vehicleId;

      for (const sc of v.seatClasses) {
        const scId = uuidv4();
        await queryRunner.query(`
          INSERT INTO "vehicle_seat_classes" (
            "id", "vehicle_id", "class_name", "seat_capacity", "seat_layout", "is_active"
          ) VALUES (
            '${scId}', '${insertedVehicleId}', '${sc.className}', ${sc.seatCapacity}, '${sc.seatLayout}', true
          )
        `);
      }
    }

    // 6. Seed Customers & Leads Awal
    const customersData = [
      {
        code: 'CUST-0001',
        customerType: 'CORPORATE',
        institutionName: 'PT Mitra Sejahtera Abadi',
        picName: 'Bpk. Aris Setiawan',
        phone: '081234567890',
        email: 'procurement@mitrasejahtera.co.id',
        address: 'Kawasan Industri MM2100 Blok C-4, Cikarang Barat',
        city: 'Bekasi',
        leadSource: 'DIRECT',
        customerTier: 'PLATINUM',
        totalTripsCount: 12,
        specialNotes: 'Klien korporat langganan charter gathering tahunan & shuttle eksekutif',
      },
      {
        code: 'CUST-0002',
        customerType: 'SCHOOL',
        institutionName: 'SMA Negeri 1 Tangerang',
        picName: 'Ibu Ratna Dewi, M.Pd.',
        phone: '081398765432',
        email: 'info@sman1tangerang.sch.id',
        address: 'Jl. Daan Mogot No. 50, Sukasari',
        city: 'Tangerang',
        leadSource: 'REFERRAL',
        customerTier: 'GOLD',
        totalTripsCount: 4,
        specialNotes: 'Study tour tahunan kelas XI ke Yogyakarta & Solo (4 armada big bus)',
      },
      {
        code: 'CUST-0003',
        customerType: 'COMMUNITY',
        institutionName: 'Komunitas Gowes Bintaro Raya',
        picName: 'Mas Hendra Wijaya',
        phone: '085712345678',
        email: 'hendra.gowes@gmail.com',
        address: 'Bintaro Jaya Sektor 9, Pondok Aren',
        city: 'Tangerang Selatan',
        leadSource: 'INSTAGRAM',
        customerTier: 'SILVER',
        totalTripsCount: 2,
        specialNotes: 'Sewa bus pariwisata combi bagasi muat sepeda untuk rute Jogja - Merapi',
      },
      {
        code: 'CUST-0004',
        customerType: 'GOVERNMENT',
        institutionName: 'Dinas Pariwisata Kota Tangerang Selatan',
        picName: 'Bpk. Danang Prasetyo, S.Sos.',
        phone: '082187654321',
        email: 'dispar@tangselkota.go.id',
        address: 'Komp. Perkantoran Pemkot Tangsel, Pamulang',
        city: 'Tangerang Selatan',
        leadSource: 'DIRECT',
        customerTier: 'GOLD',
        totalTripsCount: 5,
        specialNotes: 'Kunjungan kerja dinas dan tamu VIP kementerian',
      },
    ];

    for (const c of customersData) {
      const custId = uuidv4();
      await queryRunner.query(`
        INSERT INTO "customers" (
          "id", "company_id", "code", "customer_type", "institution_name",
          "pic_name", "phone", "email", "address", "city",
          "lead_source", "customer_tier", "total_trips_count", "special_notes", "is_active"
        ) VALUES (
          '${custId}', '${activeCompanyId}', '${c.code}', '${c.customerType}', '${c.institutionName}',
          '${c.picName}', '${c.phone}', '${c.email}', '${c.address}', '${c.city}',
          '${c.leadSource}', '${c.customerTier}', ${c.totalTripsCount}, '${c.specialNotes}', true
        )
        ON CONFLICT ("code") DO NOTHING
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "customers" WHERE "code" LIKE 'CUST-%'`);
    await queryRunner.query(`DELETE FROM "vehicle_seat_classes"`);
    await queryRunner.query(`DELETE FROM "vehicles" WHERE "code" LIKE 'SS-%'`);
    await queryRunner.query(`DELETE FROM "profit_centers" WHERE "code" LIKE 'PC-%'`);
    await queryRunner.query(`DELETE FROM "cost_centers" WHERE "code" LIKE 'CC-%'`);
    await queryRunner.query(`DELETE FROM "business_units" WHERE "code" IN ('AKAP', 'WISATA', 'SHUTTLE')`);
    await queryRunner.query(`DELETE FROM "companies" WHERE "code" = 'SST'`);
  }
}
