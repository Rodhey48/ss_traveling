import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedFinanceMaster1888888888891 implements MigrationInterface {
  name = 'SeedFinanceMaster1888888888891';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Get Company ID (PT SS Traveling Official)
    const companyRows = await queryRunner.query(
      `SELECT id FROM "companies" WHERE code = 'SST' LIMIT 1`,
    );
    const companyId = companyRows.length > 0 ? companyRows[0].id : null;

    // 2. Get Users & Cost Centers
    const cashierRows = await queryRunner.query(
      `SELECT id FROM "users" WHERE email = 'cashier.ciputat@sstravel.com' LIMIT 1`,
    );
    const cashierId = cashierRows.length > 0 ? cashierRows[0].id : null;

    const poolCcRows = await queryRunner.query(
      `SELECT id FROM "cost_centers" WHERE code = 'CC-OPS-POOL' LIMIT 1`,
    );
    const poolCcId = poolCcRows.length > 0 ? poolCcRows[0].id : null;

    const mntCcRows = await queryRunner.query(
      `SELECT id FROM "cost_centers" WHERE code = 'CC-MNT-GARASI' LIMIT 1`,
    );
    const mntCcId = mntCcRows.length > 0 ? mntCcRows[0].id : null;

    // 3. Define Chart of Accounts Hierarchies
    interface AccountSeed {
      code: string;
      name: string;
      type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
      normalBalance: 'DEBIT' | 'CREDIT';
      parentCode: string | null;
      isPostable: boolean;
      description?: string;
    }

    const coaList: AccountSeed[] = [
      // 1. ASET
      { code: '1', name: 'ASET', type: 'ASSET', normalBalance: 'DEBIT', parentCode: null, isPostable: false },
      { code: '11', name: 'Kas dan Bank', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1', isPostable: false },
      { code: '11101', name: 'Kas Operasional Pool (Ciputat/Jakarta)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Kas fisik harian kasir garasi Ciputat' },
      { code: '11102', name: 'Kas Operasional Cabang (Yogyakarta)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Kas fisik cabang perwakilan Yogya' },
      { code: '11103', name: 'Kas Kecil (Petty Cash Garasi)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Kas kecil biaya harian operasional & mekanik bengkel' },
      { code: '11104', name: 'Bank Operasional Perusahaan', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Rekening bank operasional utama perusahaan' },
      { code: '11105', name: 'Kas Kartu Uang Elektronik (Pool E-Toll)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Saldo kartu e-toll pool untuk perjalanan bus' },
      { code: '11999', name: 'Selisih Kas Operasional Sementara (Penampung Skenario 4)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Akun penampung neraca selisih kas kasir belum investigasi agar tutup buku unblocked' },

      { code: '12', name: 'Piutang Usaha (AR)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1', isPostable: false },
      { code: '12101', name: 'Piutang Sewa Charter Bus Wisata', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '12', isPostable: true, description: 'Piutang tagihan invoice sewa bus pariwisata' },
      { code: '12102', name: 'Piutang Agen Penjualan Online (AR OTA - RedBus/Traveloka)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '12', isPostable: true, description: 'Piutang omzet penjualan tiket platform online' },
      { code: '12103', name: 'Piutang Agen Penjualan Tiket Offline (Loket Terminal)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '12', isPostable: true, description: 'Piutang penjualan tiket loket terminal agen offline' },
      { code: '12901', name: 'Piutang Klaim Selisih Kas Kru (Hasil Investigasi Skenario 4)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '12', isPostable: true, description: 'Piutang klaim potongan gaji kru atas kelalaian kas yang terbukti' },

      { code: '13', name: 'Uang Muka Operasional Kru', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1', isPostable: false },
      { code: '13101', name: 'Uang Jalan (UJ) Kru Perjalanan Bus', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '13', isPostable: true, description: 'Plafon uang jalan kru bus yang wajib dipertanggungjawabkan' },

      { code: '14', name: 'Persediaan & Suku Cadang Bengkel', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1', isPostable: false },
      { code: '14101', name: 'Persediaan Sparepart & Bahan Bengkel', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '14', isPostable: true },

      { code: '15', name: 'Aset Tetap', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1', isPostable: false },
      { code: '15101', name: 'Kendaraan / Armada Bus', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '15', isPostable: true, description: 'Nilai perolehan 10 unit armada bus' },
      { code: '15102', name: 'Peralatan Bengkel & Pool', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '15', isPostable: true },

      { code: '16', name: 'Akumulasi Penyusutan Aset Tetap', type: 'ASSET', normalBalance: 'CREDIT', parentCode: '1', isPostable: false },
      { code: '16101', name: 'Akumulasi Penyusutan Armada Bus', type: 'ASSET', normalBalance: 'CREDIT', parentCode: '16', isPostable: true },
      { code: '16102', name: 'Akumulasi Penyusutan Peralatan Bengkel & Pool', type: 'ASSET', normalBalance: 'CREDIT', parentCode: '16', isPostable: true },

      // 2. LIABILITAS
      { code: '2', name: 'LIABILITAS', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: null, isPostable: false },
      { code: '21', name: 'Utang Usaha (AP)', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2', isPostable: false },
      { code: '21101', name: 'Utang Vendor Restoran Mitra (Servis Makan Penumpang)', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '21', isPostable: true, description: 'Tagihan berkala servis kupon makan RM mitra' },
      { code: '21102', name: 'Utang Vendor Suku Cadang & Bengkel Rekanan', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '21', isPostable: true },
      { code: '21103', name: 'Utang Vendor Karoseri / Chasis', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '21', isPostable: true },

      { code: '22', name: 'Utang Pihak Ketiga & Keagenan', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2', isPostable: false },
      { code: '22101', name: 'Utang Komisi Agen Penjualan Tiket', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '22', isPostable: true, description: 'Komisi tiket agen loket terminal terjadwal' },
      { code: '22102', name: 'Utang Jasa Koordinator Lapangan (Barat & Timur)', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '22', isPostable: true, description: 'Hak uang korlap wilayah Barat & Timur' },
      { code: '22103', name: 'Utang Komisi / Cashback Rekanan Wisata', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '22', isPostable: true, description: 'Cashback B2B travel rekanan wisata & shuttle' },

      { code: '23', name: 'Utang Kompensasi Kru Operasional', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2', isPostable: false },
      { code: '23101', name: 'Utang Uang Makan & Premi Ritase Kru', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '23', isPostable: true, description: 'Premi ritase kru dialokasikan ke payroll bulanan' },

      { code: '24', name: 'Pendapatan Diterima di Muka', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2', isPostable: false },
      { code: '24101', name: 'Pendapatan Diterima di Muka (DP Sewa Wisata / Tiket Prabayar)', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '24', isPostable: true, description: 'Titipan DP booking sewa bus wisata sebelum trip selesai' },

      { code: '25', name: 'Utang Pajak', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2', isPostable: false },
      { code: '25101', name: 'Utang Pajak PPN / PPh', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '25', isPostable: true },

      { code: '26', name: 'Utang Jangka Panjang & Pembiayaan Armada', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2', isPostable: false },
      { code: '26101', name: 'Utang Bank / Leasing Armada Bus', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '26', isPostable: true, description: 'Pokok utang leasing 3 unit armada (SS-08, SS-09, SS-10)' },

      { code: '27', name: 'Utang Pihak Berelasi / Pemegang Saham', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2', isPostable: false },
      { code: '27101', name: 'Utang Pemegang Saham / Talangan Modal Owner', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '27', isPostable: true },

      // 3. EKUITAS
      { code: '3', name: 'EKUITAS', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: null, isPostable: false },
      { code: '31', name: 'Modal Disetor', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3', isPostable: false },
      { code: '31101', name: 'Modal Disetor Pemilik / Investor', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '31', isPostable: true },
      { code: '32', name: 'Saldo Laba Ditahan', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3', isPostable: false },
      { code: '32101', name: 'Saldo Laba Ditahan Tahun Lalu', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '32', isPostable: true },
      { code: '33', name: 'Laba/Rugi Tahun Berjalan', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3', isPostable: false },
      { code: '33101', name: 'Laba / Rugi Periode Berjalan', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '33', isPostable: true },

      // 4. PENDAPATAN
      { code: '4', name: 'PENDAPATAN', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: null, isPostable: false },
      { code: '41', name: 'Pendapatan Tiket AKAP Reguler', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4', isPostable: false },
      { code: '41101', name: 'Pendapatan Tiket AKAP Reguler', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '41', isPostable: true, description: 'Omzet bruto tiket bus AKAP Tangerang-Yogya' },
      { code: '42', name: 'Pendapatan Sewa Bus Pariwisata / Charter', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4', isPostable: false },
      { code: '42101', name: 'Pendapatan Sewa Bus Pariwisata / Charter', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '42', isPostable: true, description: 'Omzet bruto kontrak sewa charter bus wisata' },
      { code: '43', name: 'Pendapatan Kargo & Paket Bagasi Bus', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4', isPostable: false },
      { code: '43101', name: 'Pendapatan Kargo & Paket Bagasi Bus (Motor & Kardus)', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '43', isPostable: true, description: 'Omzet bruto pengiriman paket bagasi motor & kardus' },
      { code: '44', name: 'Pendapatan Layanan Shuttle & Rental Lain', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4', isPostable: false },
      { code: '44101', name: 'Pendapatan Layanan Shuttle & Rental Lain', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '44', isPostable: true },

      // 5. BEBAN
      { code: '5', name: 'BEBAN', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: null, isPostable: false },
      { code: '51', name: 'Beban Langsung Armada & Layanan Penumpang', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5', isPostable: false },
      { code: '51101', name: 'Beban Bahan Bakar Minyak (Solar Bus)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '51', isPostable: true, description: 'Biaya solar armada terverifikasi struk SPBU & odometer' },
      { code: '51102', name: 'Beban Service Makan Penumpang Restoran Mitra (Partner RM)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '51', isPostable: true, description: 'Biaya servis makan RM mitra via tagihan AP berkala' },

      { code: '52', name: 'Beban Tol, Parkir, & Fasilitas Perjalanan', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5', isPostable: false },
      { code: '52101', name: 'Beban Tol / Top-up E-Toll Perjalanan', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '52', isPostable: true },
      { code: '52102', name: 'Beban Parkir, TPR, & Penyeberangan Ferry', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '52', isPostable: true },
      { code: '52103', name: 'Beban Cuci Bus & Perlengkapan Armada', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '52', isPostable: true },
      { code: '52104', name: 'Beban Snack, Amenity, & Fasilitas Onboard Bus', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '52', isPostable: true, description: 'Snack, air mineral, teh, kopi, parfum kabin, kuota Wi-Fi' },

      { code: '53', name: 'Beban Kompensasi & Hak Kru Operasional', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5', isPostable: false },
      { code: '53101', name: 'Beban Uang Makan Kru Bus (SPJ)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '53', isPostable: true },
      { code: '53102', name: 'Beban Premi / Insentif Ritase Kru (SPJ)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '53', isPostable: true },
      { code: '53103', name: 'Beban Bonus Full Seat Kru (Okupansi 100%)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '53', isPostable: true },
      { code: '53104', name: 'Beban Komisi / Insentif Kargo Kru', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '53', isPostable: true, description: 'Komisi 20% resi kargo untuk kru' },
      { code: '53105', name: 'Beban Uang Makan Standby Kru (Non-SPJ Garasi)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '53', isPostable: true },
      { code: '53106', name: 'Beban Insentif Langsir & Dinas Teknis Kru (Non-SPJ Bengkel/Karoseri)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '53', isPostable: true },

      { code: '54', name: 'Beban Keagenan & Koordinator Lapangan', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5', isPostable: false },
      { code: '54101', name: 'Beban Komisi Agen Penjualan Tiket', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '54', isPostable: true },
      { code: '54102', name: 'Beban Uang Jasa Koordinator Lapangan (Barat & Timur)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '54', isPostable: true },
      { code: '54103', name: 'Beban Komisi / Cashback Agen Rekanan Wisata', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '54', isPostable: true },

      { code: '55', name: 'Beban Perawatan, Perbaikan, & Bengkel Armada', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5', isPostable: false },
      { code: '55101', name: 'Beban Servis & Perawatan Rutin Armada', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '55', isPostable: true },
      { code: '55102', name: 'Beban Penggantian Suku Cadang (Sparepart)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '55', isPostable: true },
      { code: '55103', name: 'Beban Oli & Pelumas Mesin Bus', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '55', isPostable: true },
      { code: '55104', name: 'Beban Ban Bus (Baru & Vulkanisir)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '55', isPostable: true },
      { code: '55105', name: 'Beban Perbaikan AC & Kelistrikan Bus', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '55', isPostable: true },
      { code: '55106', name: 'Beban Karoseri, Bodi, & Pengecatan', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '55', isPostable: true },

      { code: '56', name: 'Beban Penyusutan Armada & Peralatan', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5', isPostable: false },
      { code: '56101', name: 'Beban Penyusutan Armada Bus', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '56', isPostable: true },
      { code: '56102', name: 'Beban Penyusutan Peralatan Bengkel & Pool', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '56', isPostable: true },

      { code: '57', name: 'Beban Umum, Administrasi, & Pool', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5', isPostable: false },
      { code: '57101', name: 'Beban Legalitas, Pajak STNK, & KIR Armada', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },
      { code: '57102', name: 'Beban Asuransi Kendaraan & Jasa Raharja', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },
      { code: '57103', name: 'Beban Perlengkapan & Kebersihan Pool', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },
      { code: '57104', name: 'Beban Listrik, Air, & Internet Pool/Kantor', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },
      { code: '57105', name: 'Beban Gaji Karyawan Kantor & Manajemen', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },
      { code: '57106', name: 'Beban Gaji Mekanik & Teknisi Bengkel Pool', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },
      { code: '57107', name: 'Beban Upah Lembur Karyawan & Mekanik (Overtime)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },
      { code: '57108', name: 'Beban Uang Makan & Konsumsi Staf Kantor/Garasi', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },
      { code: '57109', name: 'Beban Perjalanan Dinas & Transport Staf Kantor', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },
      { code: '57110', name: 'Beban ATK, Kertas, & Percetakan Dokumen', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },
      { code: '57111', name: 'Beban Retribusi Lingkungan & Keamanan Pool', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '57', isPostable: true },

      { code: '58', name: 'Beban Selisih Kas Operasional (Pasca Investigasi Kasir)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5', isPostable: false },
      { code: '58101', name: 'Beban Selisih Kasir Pool (Dispensasi Perusahaan)', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '58', isPostable: true, description: 'Dispensasi resmi selisih kasir pasca investigasi FM' },

      { code: '59', name: 'Beban Bunga & Biaya Keuangan', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5', isPostable: false },
      { code: '59101', name: 'Beban Bunga Pinjaman Bank / Leasing Armada', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '59', isPostable: true },
      { code: '59102', name: 'Beban Administrasi Bank', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '59', isPostable: true },

      // 8. PENDAPATAN & BEBAN NON-OPERASIONAL
      { code: '8', name: 'PENDAPATAN & BEBAN NON-OPERASIONAL', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: null, isPostable: false },
      { code: '81', name: 'Pendapatan Non-Operasional', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '8', isPostable: false },
      { code: '81101', name: 'Pendapatan Bunga Bank & Jasa Giro', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '81', isPostable: true },
      { code: '81102', name: 'Keuntungan Penjualan Aset Bus / Scrap Besi Tua', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '81', isPostable: true },
      { code: '82', name: 'Beban Non-Operasional', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '8', isPostable: false },
      { code: '82101', name: 'Kerugian Pelepasan / Penjualan Aset Bus', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '82', isPostable: true },
    ];

    // Map to keep track of generated account IDs by code
    const accountIdMap = new Map<string, string>();

    // Seed in hierarchical order: level 1 (null parent), level 2 (length 2), level 3 (length 5)
    const sortedCoa = [...coaList].sort((a, b) => a.code.length - b.code.length);

    for (const item of sortedCoa) {
      const id = uuidv4();
      accountIdMap.set(item.code, id);
      const parentId = item.parentCode ? accountIdMap.get(item.parentCode) || null : null;

      await queryRunner.query(
        `INSERT INTO "accounts" 
          ("id", "company_id", "code", "name", "type", "normal_balance", "parent_id", "is_postable", "description", "is_active")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         ON CONFLICT ("code") DO UPDATE SET
          "name" = EXCLUDED."name",
          "is_postable" = EXCLUDED."is_postable",
          "description" = EXCLUDED."description"`,
        [
          id,
          companyId,
          item.code,
          item.name,
          item.type,
          item.normalBalance,
          parentId,
          item.isPostable,
          item.description || null,
        ],
      );
    }

    // Refresh map with actual IDs from database
    const dbAccounts = await queryRunner.query(`SELECT id, code FROM "accounts"`);
    for (const row of dbAccounts) {
      accountIdMap.set(row.code, row.id);
    }

    // 4. Seed Cash Accounts
    const cashPoolAccountId = accountIdMap.get('11101');
    const cashYogyaAccountId = accountIdMap.get('11102');
    const cashPettyAccountId = accountIdMap.get('11103');

    if (cashPoolAccountId) {
      await queryRunner.query(
        `INSERT INTO "cash_accounts" 
          ("id", "company_id", "code", "name", "account_id", "custodian_user_id", "cost_center_id", "description", "is_active")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT ("code") DO NOTHING`,
        [
          uuidv4(),
          companyId,
          'CASH-POOL-CIPUTAT',
          'Kas Operasional Pool Ciputat',
          cashPoolAccountId,
          cashierId,
          poolCcId,
          'Kas fisik utama laci kasir pool Ciputat untuk penerimaan tiket/kargo & pencairan UJ',
        ],
      );
    }

    if (cashYogyaAccountId) {
      await queryRunner.query(
        `INSERT INTO "cash_accounts" 
          ("id", "company_id", "code", "name", "account_id", "custodian_user_id", "cost_center_id", "description", "is_active")
         VALUES ($1, $2, $3, $4, $5, null, null, $6, true)
         ON CONFLICT ("code") DO NOTHING`,
        [
          uuidv4(),
          companyId,
          'CASH-BRANCH-YOGYA',
          'Kas Operasional Cabang Yogyakarta',
          cashYogyaAccountId,
          'Kas fisik perwakilan terminal Giwangan Yogyakarta',
        ],
      );
    }

    if (cashPettyAccountId) {
      await queryRunner.query(
        `INSERT INTO "cash_accounts" 
          ("id", "company_id", "code", "name", "account_id", "custodian_user_id", "cost_center_id", "description", "is_active")
         VALUES ($1, $2, $3, $4, $5, null, $6, $7, true)
         ON CONFLICT ("code") DO NOTHING`,
        [
          uuidv4(),
          companyId,
          'CASH-PETTY-GARASI',
          'Kas Kecil (Petty Cash Garasi)',
          cashPettyAccountId,
          mntCcId,
          'Kas kecil bengkel garasi untuk belanja darurat perlengkapan bus & alat teknik',
        ],
      );
    }

    // 5. Seed Bank Accounts
    const bankGlAccountId = accountIdMap.get('11104');
    if (bankGlAccountId) {
      await queryRunner.query(
        `INSERT INTO "bank_accounts" 
          ("id", "company_id", "code", "bank_name", "account_name", "account_number", "account_number_masked", "account_id", "currency", "description", "is_active")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'IDR', $9, true)
         ON CONFLICT ("code") DO NOTHING`,
        [
          uuidv4(),
          companyId,
          'BANK-BCA-OPS',
          'BCA',
          'PT SS Traveling Official',
          '8229994370',
          '•••• •••• 4370',
          bankGlAccountId,
          'Rekening korporat BCA KCU Ciputat operasional utama',
        ],
      );

      await queryRunner.query(
        `INSERT INTO "bank_accounts" 
          ("id", "company_id", "code", "bank_name", "account_name", "account_number", "account_number_masked", "account_id", "currency", "description", "is_active")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'IDR', $9, true)
         ON CONFLICT ("code") DO NOTHING`,
        [
          uuidv4(),
          companyId,
          'BANK-MANDIRI-OPS',
          'Bank Mandiri',
          'PT SS Traveling Official',
          '1560012345678',
          '•••• •••• 5678',
          bankGlAccountId,
          'Rekening cadangan penerimaan transfer bank Mandiri',
        ],
      );
    }

    // 6. Seed Fiscal Year 2026 & 12 Periods
    const fiscalYearId = uuidv4();
    await queryRunner.query(
      `INSERT INTO "fiscal_years" 
        ("id", "company_id", "year", "start_date", "end_date", "status", "is_active")
       VALUES ($1, $2, 2026, '2026-01-01', '2026-12-31', 'OPEN', true)
       ON CONFLICT ("year") DO NOTHING`,
      [fiscalYearId, companyId],
    );

    const yearRows = await queryRunner.query(
      `SELECT id FROM "fiscal_years" WHERE year = 2026 LIMIT 1`,
    );
    const activeYearId = yearRows.length > 0 ? yearRows[0].id : fiscalYearId;

    const monthNames = [
      'Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026',
      'Mei 2026', 'Juni 2026', 'Juli 2026', 'Agustus 2026',
      'September 2026', 'Oktober 2026', 'November 2026', 'Desember 2026',
    ];

    const monthEnds = [
      '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30',
      '2026-05-31', '2026-06-30', '2026-07-31', '2026-08-31',
      '2026-09-30', '2026-10-31', '2026-11-30', '2026-12-31',
    ];

    for (let i = 0; i < 12; i++) {
      const periodNo = i + 1;
      const monthStr = String(periodNo).padStart(2, '0');
      const startDate = `2026-${monthStr}-01`;
      const endDate = monthEnds[i];
      const name = monthNames[i];

      const existingPeriod = await queryRunner.query(
        `SELECT id FROM "fiscal_periods" WHERE "fiscal_year_id" = $1 AND "period_no" = $2`,
        [activeYearId, periodNo],
      );

      if (existingPeriod.length === 0) {
        await queryRunner.query(
          `INSERT INTO "fiscal_periods" 
            ("id", "fiscal_year_id", "period_no", "name", "start_date", "end_date", "status", "is_active")
           VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', true)`,
          [uuidv4(), activeYearId, periodNo, name, startDate, endDate],
        );
      }
    }

    // 7. Seed Initial Document Sequences for Period 2610 (Oktober 2026)
    const initialSequences = [
      { type: 'SPJ_AKP', prefix: 'SPJ/AKP/2610', periodKey: '2610' },
      { type: 'SPJ_WIS', prefix: 'SPJ/WIS/2610', periodKey: '2610' },
      { type: 'BKM', prefix: 'BKM/2610', periodKey: '2610' },
      { type: 'BKK', prefix: 'BKK/2610', periodKey: '2610' },
      { type: 'JOURNAL', prefix: 'JV/2610', periodKey: '2610' },
      { type: 'AR_INVOICE', prefix: 'INV/AR/2610', periodKey: '2610' },
      { type: 'AP_INVOICE', prefix: 'INV/AP/2610', periodKey: '2610' },
      { type: 'SCHEDULE', prefix: 'SCH/2610', periodKey: '2610' },
    ];

    for (const seq of initialSequences) {
      await queryRunner.query(
        `INSERT INTO "document_sequences" 
          ("id", "company_id", "document_type", "period_key", "prefix", "last_number", "padding", "is_active")
         VALUES ($1, $2, $3, $4, $5, 0, 4, true)
         ON CONFLICT ("document_type", "period_key") DO NOTHING`,
        [uuidv4(), companyId, seq.type, seq.periodKey, seq.prefix],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "document_sequences" WHERE period_key = '2610'`);
    await queryRunner.query(`DELETE FROM "fiscal_periods" WHERE fiscal_year_id IN (SELECT id FROM "fiscal_years" WHERE year = 2026)`);
    await queryRunner.query(`DELETE FROM "fiscal_years" WHERE year = 2026`);
    await queryRunner.query(`DELETE FROM "bank_accounts" WHERE code IN ('BANK-BCA-OPS', 'BANK-MANDIRI-OPS')`);
    await queryRunner.query(`DELETE FROM "cash_accounts" WHERE code IN ('CASH-POOL-CIPUTAT', 'CASH-BRANCH-YOGYA', 'CASH-PETTY-GARASI')`);
    await queryRunner.query(`DELETE FROM "accounts"`);
  }
}
