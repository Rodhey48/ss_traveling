import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedAdditionalNetworkAgents1783000000000
  implements MigrationInterface
{
  name = 'SeedAdditionalNetworkAgents1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ambil ID Company
    const companies = await queryRunner.query(
      `SELECT id FROM "companies" LIMIT 1`,
    );
    const companyId = companies[0]?.id;
    if (!companyId) return;

    // 2. Ambil Seat Classes
    const seatClasses = await queryRunner.query(
      `SELECT id, code FROM "seat_classes"`,
    );
    const scMap: Record<string, string> = {};
    for (const sc of seatClasses) {
      scMap[sc.code] = sc.id;
    }

    // 3. Daftar Agen Jaringan Riil SS Travelink Official (Barat, Timur, dan Online)
    const newAgents = [
      // --- BARAT (Jabodetabek & Banten) ---
      {
        code: 'AGT-LBB-01',
        name: 'Agen Terminal Lebak Bulus',
        agentType: 'OFFLINE',
        city: 'JAKARTA',
        phone: '0812999911',
        email: 'agen.lebakbulus@sstravel.com',
        address: 'Terminal Lintasan Lebak Bulus, Kios No. 05, Cilandak, Jakarta Selatan',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Bpk. Mulyadi',
      },
      {
        code: 'AGT-KDR-01',
        name: 'Agen Terminal Kalideres',
        agentType: 'OFFLINE',
        city: 'JAKARTA',
        phone: '0812999912',
        email: 'agen.kalideres@sstravel.com',
        address: 'Terminal Bus Antarkota Kalideres, Loket AKAP No. 18, Jakarta Barat',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Pak Hendra',
      },
      {
        code: 'AGT-KMR-01',
        name: 'Agen Terminal Kampung Rambutan',
        agentType: 'OFFLINE',
        city: 'JAKARTA',
        phone: '0812999913',
        email: 'agen.rambutan@sstravel.com',
        address: 'Terminal Kampung Rambutan, Lantai Dasar Loket 12, Ciracas, Jakarta Timur',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Mas Faisal',
      },
      {
        code: 'AGT-GRG-01',
        name: 'Agen Grogol / Pesing',
        agentType: 'OFFLINE',
        city: 'JAKARTA',
        phone: '0812999914',
        email: 'agen.grogol@sstravel.com',
        address: 'Jl. Daan Mogot KM 1.5 No. 42, Grogol Petamburan, Jakarta Barat',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Ibu Ratna',
      },
      {
        code: 'AGT-PDP-01',
        name: 'Agen Pondok Pinang',
        agentType: 'OFFLINE',
        city: 'JAKARTA',
        phone: '0812999915',
        email: 'agen.pondokpinang@sstravel.com',
        address: 'Jl. Ciputat Raya No. 88, Pondok Pinang, Kebayoran Lama, Jakarta Selatan',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Pak Suwarno',
      },
      {
        code: 'AGT-PRS-01',
        name: 'Agen Terminal Poris Plawad',
        agentType: 'OFFLINE',
        city: 'TANGERANG',
        phone: '0812999916',
        email: 'agen.poris@sstravel.com',
        address: 'Terminal Terpadu Poris Plawad, Loket 21, Cipondoh, Tangerang',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Mas Bagus',
      },
      {
        code: 'AGT-BKS-01',
        name: 'Agen Terminal Bekasi Timur',
        agentType: 'OFFLINE',
        city: 'BEKASI',
        phone: '0812999917',
        email: 'agen.bekasi@sstravel.com',
        address: 'Terminal Induk Kota Bekasi, Kios Loket 08, Duren Jaya, Bekasi Timur',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Pak Joko',
      },
      {
        code: 'AGT-BGR-01',
        name: 'Agen Terminal Baranangsiang',
        agentType: 'OFFLINE',
        city: 'BOGOR',
        phone: '0812999918',
        email: 'agen.bogor@sstravel.com',
        address: 'Terminal Bus Baranangsiang, Loket Jalur 3, Bogor Timur',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Pak Rahmat',
      },

      // --- TIMUR (DIY & Jawa Tengah) ---
      {
        code: 'AGT-KLT-01',
        name: 'Agen Terminal Ir. Soekarno Klaten',
        agentType: 'OFFLINE',
        city: 'KLATEN',
        phone: '0812999921',
        email: 'agen.klaten@sstravel.com',
        address: 'Terminal Bus Buntalan, Jl. Bypass Klaten Selatan, Kabupaten Klaten',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Mas Arif',
      },
      {
        code: 'AGT-SLO-01',
        name: 'Agen Terminal Tirtonadi Solo',
        agentType: 'OFFLINE',
        city: 'SOLO',
        phone: '0812999922',
        email: 'agen.tirtonadi@sstravel.com',
        address: 'Terminal Tirtonadi, Lantai 1 Loket AKAP No. 24, Banjarsari, Surakarta',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Pak Suparman',
      },
      {
        code: 'AGT-KTS-01',
        name: 'Agen Kartasura Sukoharjo',
        agentType: 'OFFLINE',
        city: 'SOLO',
        phone: '0812999923',
        email: 'agen.kartasura@sstravel.com',
        address: 'Jl. Ahmad Yani No. 102, Ngadirejo, Kartasura, Sukoharjo',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Mas Dwi',
      },
      {
        code: 'AGT-WTS-01',
        name: 'Agen Terminal Wates Kulon Progo',
        agentType: 'OFFLINE',
        city: 'YOGYAKARTA',
        phone: '0812999924',
        email: 'agen.wates@sstravel.com',
        address: 'Terminal Wates, Jl. Wates - Purworejo KM 2, Pengasih, Kulon Progo',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Pak Nugroho',
      },
      {
        code: 'AGT-PRM-01',
        name: 'Agen Prambanan',
        agentType: 'OFFLINE',
        city: 'YOGYAKARTA',
        phone: '0812999925',
        email: 'agen.prambanan@sstravel.com',
        address: 'Jl. Raya Jogja - Solo KM 16, Bokoharjo, Prambanan, Sleman',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Mas Bayu',
      },
      {
        code: 'AGT-MNT-01',
        name: 'Agen Muntilan Magelang',
        agentType: 'OFFLINE',
        city: 'MAGELANG',
        phone: '0812999926',
        email: 'agen.muntilan@sstravel.com',
        address: 'Terminal Drs. Prajitno Muntilan, Kios Loket 04, Muntilan, Magelang',
        settlementType: 'CASH_TO_CREW',
        contactPerson: 'Pak Trisno',
      },

      // --- ONLINE OTA ---
      {
        code: 'AGT-TIKET',
        name: 'Tiket.com Bus & Travel (OTA)',
        agentType: 'ONLINE_OTA',
        city: 'ALL',
        phone: '02139730888',
        email: 'partner.bus@tiket.com',
        address: 'Wisma Barito Pacific Tower B Lt. 12, Slipi, Palmerah, Jakarta Barat',
        settlementType: 'BANK_TRANSFER',
        contactPerson: 'Commercial Bus Lead Tiket.com',
      },
    ];

    for (const ag of newAgents) {
      const agentId = uuidv4();
      await queryRunner.query(
        `INSERT INTO "agents" ("id", "company_id", "code", "name", "agent_type", "city", "phone", "email", "address", "settlement_type", "contact_person", "is_active")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
         ON CONFLICT ("code") DO NOTHING`,
        [
          agentId,
          companyId,
          ag.code,
          ag.name,
          ag.agentType,
          ag.city,
          ag.phone,
          ag.email,
          ag.address,
          ag.settlementType,
          ag.contactPerson,
        ],
      );

      // Cek ID agen (baik baru dibuat maupun yang sudah ada)
      const existingAgent = await queryRunner.query(
        `SELECT id FROM "agents" WHERE "code" = $1`,
        [ag.code],
      );
      const actualAgentId = existingAgent[0]?.id || agentId;

      // Buat aturan komisi standar per kelas kursi
      // 1. Default ALL Classes: Rp 20.000 / tiket
      await queryRunner.query(
        `INSERT INTO "agent_commission_rules" ("id", "company_id", "agent_id", "seat_class_id", "rule_type", "commission_value", "effective_from", "is_active")
         VALUES ($1, $2, $3, NULL, 'FLAT_PER_TICKET', 20000.00, CURRENT_TIMESTAMP, true)`,
        [uuidv4(), companyId, actualAgentId],
      );

      // 2. Sleeper: Rp 30.000 / tiket
      if (scMap['SLEEPER']) {
        await queryRunner.query(
          `INSERT INTO "agent_commission_rules" ("id", "company_id", "agent_id", "seat_class_id", "rule_type", "commission_value", "effective_from", "is_active")
           VALUES ($1, $2, $3, $4, 'FLAT_PER_TICKET', 30000.00, CURRENT_TIMESTAMP, true)`,
          [uuidv4(), companyId, actualAgentId, scMap['SLEEPER']],
        );
      }

      // 3. Luxury 2-1: Rp 25.000 / tiket
      if (scMap['LUXURY_2_1']) {
        await queryRunner.query(
          `INSERT INTO "agent_commission_rules" ("id", "company_id", "agent_id", "seat_class_id", "rule_type", "commission_value", "effective_from", "is_active")
           VALUES ($1, $2, $3, $4, 'FLAT_PER_TICKET', 25000.00, CURRENT_TIMESTAMP, true)`,
          [uuidv4(), companyId, actualAgentId, scMap['LUXURY_2_1']],
        );
      }

      // 4. Executive: Rp 20.000 / tiket
      if (scMap['EXECUTIVE']) {
        await queryRunner.query(
          `INSERT INTO "agent_commission_rules" ("id", "company_id", "agent_id", "seat_class_id", "rule_type", "commission_value", "effective_from", "is_active")
           VALUES ($1, $2, $3, $4, 'FLAT_PER_TICKET', 20000.00, CURRENT_TIMESTAMP, true)`,
          [uuidv4(), companyId, actualAgentId, scMap['EXECUTIVE']],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = [
      'AGT-LBB-01',
      'AGT-KDR-01',
      'AGT-KMR-01',
      'AGT-GRG-01',
      'AGT-PDP-01',
      'AGT-PRS-01',
      'AGT-BKS-01',
      'AGT-BGR-01',
      'AGT-KLT-01',
      'AGT-SLO-01',
      'AGT-KTS-01',
      'AGT-WTS-01',
      'AGT-PRM-01',
      'AGT-MNT-01',
      'AGT-TIKET',
    ];
    await queryRunner.query(
      `DELETE FROM "agents" WHERE "code" = ANY($1)`,
      [codes],
    );
  }
}
