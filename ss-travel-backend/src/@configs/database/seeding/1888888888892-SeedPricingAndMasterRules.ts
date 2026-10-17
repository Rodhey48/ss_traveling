import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedPricingAndMasterRules1888888888892 implements MigrationInterface {
  name = 'SeedPricingAndMasterRules1888888888892';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Get Company ID
    const companyRows = await queryRunner.query(
      `SELECT id FROM "companies" WHERE code = 'SST' LIMIT 1`,
    );
    const companyId = companyRows.length > 0 ? companyRows[0].id : null;

    // 2. Get Field Coordinator User
    const coordRows = await queryRunner.query(
      `SELECT id FROM "users" WHERE email = 'field.coordinator@sstravel.com' LIMIT 1`,
    );
    const coordinatorId = coordRows.length > 0 ? coordRows[0].id : null;

    // 3. Get Seat Classes
    const seatClassRows = await queryRunner.query(
      `SELECT id, code FROM "seat_classes"`,
    );
    const seatClassMap: Record<string, string> = {};
    for (const sc of seatClassRows) {
      seatClassMap[sc.code] = sc.id;
    }

    // 4. Seed Fare Seasons
    const seasonsData = [
      {
        id: uuidv4(),
        code: 'REGULER',
        name: 'Tarif Reguler Harian',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        description: 'Tarif tiket standar operasional AKAP di luar hari raya / musim liburan',
      },
      {
        id: uuidv4(),
        code: 'LEBARAN_2026',
        name: 'Tuslah Lebaran H-7 s.d. H+7',
        startDate: '2026-03-15',
        endDate: '2026-03-31',
        description: 'Penyesuaian tarif angkutan mudik & balik Idul Fitri 1447H',
      },
      {
        id: uuidv4(),
        code: 'LIBUR_SEKOLAH_2026',
        name: 'Peak Season Liburan Sekolah',
        startDate: '2026-06-15',
        endDate: '2026-07-15',
        description: 'Penyesuaian tarif musim libur kenaikan kelas & pertengahan tahun',
      },
    ];

    const seasonMap: Record<string, string> = {};
    for (const s of seasonsData) {
      seasonMap[s.code] = s.id;
      await queryRunner.query(
        `INSERT INTO "fare_seasons" ("id", "company_id", "code", "name", "start_date", "end_date", "description", "is_active")
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT ("code") DO NOTHING`,
        [s.id, companyId, s.code, s.name, s.startDate, s.endDate, s.description],
      );
    }

    // 5. Seed Fare Matrix
    // Routes: TANGERANG/JAKARTA <-> YOGYAKARTA
    const routes = [
      { origin: 'TANGERANG', destination: 'YOGYAKARTA' },
      { origin: 'JAKARTA', destination: 'YOGYAKARTA' },
      { origin: 'YOGYAKARTA', destination: 'TANGERANG' },
      { origin: 'YOGYAKARTA', destination: 'JAKARTA' },
    ];

    const ratesBySeason: Record<string, Record<string, number>> = {
      REGULER: {
        SLEEPER: 420000.0,
        LUXURY_2_1: 330000.0,
        EXECUTIVE: 250000.0,
        STANDARD: 200000.0,
      },
      LEBARAN_2026: {
        SLEEPER: 650000.0,
        LUXURY_2_1: 520000.0,
        EXECUTIVE: 400000.0,
        STANDARD: 320000.0,
      },
      LIBUR_SEKOLAH_2026: {
        SLEEPER: 480000.0,
        LUXURY_2_1: 380000.0,
        EXECUTIVE: 290000.0,
        STANDARD: 240000.0,
      },
    };

    for (const [seasonCode, classFares] of Object.entries(ratesBySeason)) {
      const seasonId = seasonMap[seasonCode];
      if (!seasonId) continue;

      for (const r of routes) {
        for (const [classCode, amount] of Object.entries(classFares)) {
          const seatClassId = seatClassMap[classCode];
          if (!seatClassId) continue;

          await queryRunner.query(
            `INSERT INTO "fare_matrix" ("id", "company_id", "fare_season_id", "origin", "destination", "seat_class_id", "amount", "effective_from", "is_active")
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, true)`,
            [uuidv4(), companyId, seasonId, r.origin, r.destination, seatClassId, amount],
          );
        }
      }
    }

    // 6. Seed Agents (Offline Terminals & Online OTAs)
    const agentsData = [
      {
        id: uuidv4(),
        code: 'AGT-CPT-01',
        name: 'Agen Pool Ciputat Tangerang',
        agentType: 'OFFLINE',
        city: 'TANGERANG',
        phone: '0812999901',
        email: 'agen.ciputat@sstravel.com',
        address: 'Jl. Pahlawan Gerbang No. 08, Rempoa, Ciputat Timur',
        settlementType: 'CASH_TO_OFFICE',
        contactPerson: 'Pak Slamet',
      },
      {
        id: uuidv4(),
        code: 'AGT-PLG-01',
        name: 'Agen Terminal Pulo Gebang',
        agentType: 'OFFLINE',
        city: 'JAKARTA',
        phone: '0812999902',
        email: 'agen.pulogebang@sstravel.com',
        address: 'Terminal Bus Terpadu Pulo Gebang, Lantai 2 Loket No. 14, Jakarta Timur',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Pak Wahyu',
      },
      {
        id: uuidv4(),
        code: 'AGT-GWG-01',
        name: 'Agen Terminal Giwangan Yogya',
        agentType: 'OFFLINE',
        city: 'YOGYAKARTA',
        phone: '0812999903',
        email: 'agen.giwangan@sstravel.com',
        address: 'Terminal Penumpang Tipe A Giwangan, Loket 28, Umbulharjo, Yogyakarta',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Mas Danang',
      },
      {
        id: uuidv4(),
        code: 'AGT-JMB-01',
        name: 'Agen Terminal Jombor Sleman',
        agentType: 'OFFLINE',
        city: 'YOGYAKARTA',
        phone: '0812999904',
        email: 'agen.jombor@sstravel.com',
        address: 'Terminal Jombor, Jl. Magelang KM 6.5, Mlati, Sleman',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Pak Bambang',
      },
      {
        id: uuidv4(),
        code: 'AGT-REDBUS',
        name: 'RedBus Indonesia (OTA)',
        agentType: 'ONLINE_OTA',
        city: 'ALL',
        phone: '02180625000',
        email: 'support@redbus.id',
        address: 'South Quarter Tower C Lt. 10, Cilandak Barat, Jakarta Selatan',
        settlementType: 'BANK_TRANSFER',
        contactPerson: 'Partnership Team RedBus',
      },
      {
        id: uuidv4(),
        code: 'AGT-TRVLK',
        name: 'Traveloka Bus & Shuttle (OTA)',
        agentType: 'ONLINE_OTA',
        city: 'ALL',
        phone: '02129775000',
        email: 'bus-partnership@traveloka.com',
        address: 'Wisma Barito Pacific Tower A Lt. 5, Palmerah, Jakarta Barat',
        settlementType: 'BANK_TRANSFER',
        contactPerson: 'Supply Team Traveloka',
      },
    ];

    const agentMap: Record<string, string> = {};
    for (const a of agentsData) {
      agentMap[a.code] = a.id;
      await queryRunner.query(
        `INSERT INTO "agents" ("id", "company_id", "code", "name", "agent_type", "city", "phone", "email", "address", "settlement_type", "contact_person", "is_active")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
         ON CONFLICT ("code") DO NOTHING`,
        [a.id, companyId, a.code, a.name, a.agentType, a.city, a.phone, a.email, a.address, a.settlementType, a.contactPerson],
      );
    }

    // 7. Seed Commission Rules
    // For Offline: Flat commission per seat class (Sleeper: 30k, Luxury: 20k, Exec: 20k, Standard: 15k)
    const offlineAgentCodes = ['AGT-CPT-01', 'AGT-PLG-01', 'AGT-GWG-01', 'AGT-JMB-01'];
    const flatRates: Record<string, number> = {
      SLEEPER: 30000.0,
      LUXURY_2_1: 20000.0,
      EXECUTIVE: 20000.0,
      STANDARD: 15000.0,
    };

    for (const code of offlineAgentCodes) {
      const agentId = agentMap[code];
      if (!agentId) continue;

      for (const [classCode, commValue] of Object.entries(flatRates)) {
        const scId = seatClassMap[classCode];
        if (!scId) continue;

        await queryRunner.query(
          `INSERT INTO "agent_commission_rules" ("id", "company_id", "agent_id", "seat_class_id", "rule_type", "commission_value", "effective_from", "is_active")
           VALUES ($1, $2, $3, $4, 'FLAT_PER_TICKET', $5, CURRENT_TIMESTAMP, true)`,
          [uuidv4(), companyId, agentId, scId, commValue],
        );
      }
    }

    // For Online OTAs: Percentage 10% for ALL classes
    const otaCodes = ['AGT-REDBUS', 'AGT-TRVLK'];
    for (const code of otaCodes) {
      const agentId = agentMap[code];
      if (!agentId) continue;

      await queryRunner.query(
        `INSERT INTO "agent_commission_rules" ("id", "company_id", "agent_id", "seat_class_id", "rule_type", "commission_value", "effective_from", "is_active")
         VALUES ($1, $2, $3, NULL, 'PERCENTAGE', 10.00, CURRENT_TIMESTAMP, true)`,
        [uuidv4(), companyId, agentId],
      );
    }

    // 8. Seed Crew Rate Rules
    // AKAP PP rates (PER_TRIP)
    const akapCrewRates = [
      { role: 'DRIVER', meal: 150000.0, incentive: 250000.0, bonus: 50000.0 },
      { role: 'CO_DRIVER', meal: 150000.0, incentive: 250000.0, bonus: 50000.0 },
      { role: 'CONDUCTOR', meal: 100000.0, incentive: 150000.0, bonus: 50000.0 },
      { role: 'STEWARDESS', meal: 100000.0, incentive: 150000.0, bonus: 50000.0 },
    ];

    for (const r of akapCrewRates) {
      await queryRunner.query(
        `INSERT INTO "crew_rate_rules" ("id", "company_id", "role", "service_type", "origin", "destination", "rate_type", "meal_allowance", "trip_incentive", "full_seat_bonus", "effective_from", "is_active")
         VALUES ($1, $2, $3, 'AKAP', 'ALL', 'ALL', 'PER_TRIP', $4, $5, $6, CURRENT_TIMESTAMP, true)`,
        [uuidv4(), companyId, r.role, r.meal, r.incentive, r.bonus],
      );
    }

    // Tourism rates (PER_DAY)
    const tourismCrewRates = [
      { role: 'DRIVER', meal: 100000.0, incentive: 150000.0, bonus: 0.0 },
      { role: 'CO_DRIVER', meal: 100000.0, incentive: 150000.0, bonus: 0.0 },
      { role: 'CONDUCTOR', meal: 75000.0, incentive: 100000.0, bonus: 0.0 },
      { role: 'STEWARDESS', meal: 75000.0, incentive: 100000.0, bonus: 0.0 },
    ];

    for (const r of tourismCrewRates) {
      await queryRunner.query(
        `INSERT INTO "crew_rate_rules" ("id", "company_id", "role", "service_type", "origin", "destination", "rate_type", "meal_allowance", "trip_incentive", "full_seat_bonus", "effective_from", "is_active")
         VALUES ($1, $2, $3, 'TOURISM', 'ALL', 'ALL', 'PER_DAY', $4, $5, $6, CURRENT_TIMESTAMP, true)`,
        [uuidv4(), companyId, r.role, r.meal, r.incentive, r.bonus],
      );
    }

    // 9. Seed Restaurants
    const restaurantsData = [
      {
        id: uuidv4(),
        code: 'RM-01',
        name: 'RM Taman Selera (Cipali KM 102)',
        city: 'SUBANG',
        address: 'Rest Area Tol Cipali KM 102 A, Subang, Jawa Barat',
        phone: '0260412345',
        ratePerPax: 25000.0,
        settlementType: 'INVOICED_MONTHLY_AP',
        contactPerson: 'Ibu Haryati',
      },
      {
        id: uuidv4(),
        code: 'RM-02',
        name: 'RM Raos Eco (Gringsing)',
        city: 'GRINGSING',
        address: 'Jl. Raya Pantura No. 88, Gringsing, Batang, Jawa Tengah',
        phone: '0285623456',
        ratePerPax: 25000.0,
        settlementType: 'INVOICED_MONTHLY_AP',
        contactPerson: 'Pak Sugeng',
      },
      {
        id: uuidv4(),
        code: 'RM-03',
        name: 'RM Kendil Mas (Batang)',
        city: 'BATANG',
        address: 'Kawasan Wisata Bahari Batang, Jawa Tengah',
        phone: '0285712345',
        ratePerPax: 25000.0,
        settlementType: 'PAID_BY_CREW_UJ',
        contactPerson: 'H. Widodo',
      },
    ];

    for (const rest of restaurantsData) {
      await queryRunner.query(
        `INSERT INTO "restaurants" ("id", "company_id", "code", "name", "city", "address", "phone", "rate_per_pax", "settlement_type", "contact_person", "is_active")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
         ON CONFLICT ("code") DO NOTHING`,
        [rest.id, companyId, rest.code, rest.name, rest.city, rest.address, rest.phone, rest.ratePerPax, rest.settlementType, rest.contactPerson],
      );
    }

    // 10. Seed Coordinator Fee Rules
    // Zone WEST (Jabodetabek)
    await queryRunner.query(
      `INSERT INTO "coordinator_fee_rules" ("id", "company_id", "zone", "coordinator_user_id", "fee_per_pax", "effective_from", "is_active")
       VALUES ($1, $2, 'WEST', $3, 10000.00, CURRENT_TIMESTAMP, true)`,
      [uuidv4(), companyId, coordinatorId],
    );

    // Zone EAST (Jateng & DIY)
    await queryRunner.query(
      `INSERT INTO "coordinator_fee_rules" ("id", "company_id", "zone", "coordinator_user_id", "fee_per_pax", "effective_from", "is_active")
       VALUES ($1, $2, 'EAST', NULL, 10000.00, CURRENT_TIMESTAMP, true)`,
      [uuidv4(), companyId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "coordinator_fee_rules"`);
    await queryRunner.query(`DELETE FROM "restaurants"`);
    await queryRunner.query(`DELETE FROM "crew_rate_rules"`);
    await queryRunner.query(`DELETE FROM "agent_commission_rules"`);
    await queryRunner.query(`DELETE FROM "agents"`);
    await queryRunner.query(`DELETE FROM "fare_matrix"`);
    await queryRunner.query(`DELETE FROM "fare_seasons"`);
  }
}
