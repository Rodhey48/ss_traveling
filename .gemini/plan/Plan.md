# Master Plan: SS Traveling ERP

## Phase 1: Infrastructure & Auth (Completed)
- [x] API Gateway & Monolith Core Setup.
- [x] Auth Service (User, Role, Hierarchical Menus).
- [x] Frontend Shell & Management UI.
- [x] **Hybrid Action-based Permissions** (Dynamic custom actions like approve, export).
- [x] **Dual-Strategy Auth & Security Hardening**:
  - HttpOnly Cookie (Web) + Bearer Token (Mobile).
  - Single Device Login (SDL) & Stateless Device Fingerprinting (`x-device-id` + `User-Agent`).
  - Standardized Machine-Readable Error Codes (`TOKEN_EXPIRED`, `INVALID_DEVICE_CONTEXT`, etc.).
  - Logout API (`POST /api/v1/auth/logout`) with server-side session revocation and cookie clearing.
  - Complete Frontend Implementation Guide: [AUTH_SPECIFICATION_AND_FE_GUIDE.md](./AUTH_SPECIFICATION_AND_FE_GUIDE.md).
- [x] **Backend & Frontend Foundation Alignment (2026-10-15)**:
  - Standardized global API prefix to `/api/v1` and Swagger to `/api/v1/docs`.
  - Installed `decimal.js` and implemented `MoneyHelper` (`src/@common/helpers/money.helper.ts`) with 100% test pass rate.
  - Migrated `BaseEntity` and `UsersEntity` timestamp columns to `timestamptz`.
  - Aligned frontend API services to `/api/v1` without leading slashes.

---

## Phase 2: Design Verification & Simulation Test Cases (Completed & Locked)
- [x] **Skenario 1: Operasional Normal AKAP PP & Siklus Keuangan Penuh** (LOCKED)
  - Detail: [skenario-1-operasional-normal-akap.md](../blueprint/test-cases/skenario-1-operasional-normal-akap.md)
  - Tagihan servis makan berkala (2x seminggu via AP vendor, bebas beban UJ kru), komisi kargo dinamis 20%, multi-line UJ & talangan nombok kru, komisi agen berjenjang (Sleeper Rp30rb vs Luxury Rp20rb), fleksibilitas 2–4+ kru per SPJ.
- [x] **Skenario 2: Sewa Wisata / Charter Multi-Day & B2B Partner Cashback** (LOCKED)
  - Detail: [skenario-2-operasional-wisata-charter.md](../blueprint/test-cases/skenario-2-operasional-wisata-charter.md)
  - Kontrak charter 5 hari, DP sewa 30% (`24101`), pelunasan AR 70%, pengakuan pendapatan accrual saat selesai, master rate kru harian (`PER_DAY`), pencairan sebagian premi di jalan (*early payout*), beban parkir wisata & homestay kru, komisi/cashback rekanan B2B non-UJ via transfer bank kantor.
- [x] **Skenario 3: Anomali AKAP — Emergency Breakdown & Penggantian Armada di Tol** (LOCKED)
  - Detail: [skenario-3-anomali-breakdown-penggantian-armada.md](../blueprint/test-cases/skenario-3-anomali-breakdown-penggantian-armada.md)
  - Breakdown KM 214 Tol Cipali, SPJ Pengganti via `parent_spj_id`, proteksi anti-double revenue manifes, mutasi serah-terima sisa UJ (*UJ Rollover*), pemisahan biaya derek & bengkel ke aset bus rusak (`SS-01`), laporan ganda per bus vs kelompok perjalanan (*journey group*).
- [x] **Skenario 4: Rekonsiliasi Kasir Bermasalah, Musyawarah Kru & Resolusi Selisih Kas** (LOCKED)
  - Detail: [skenario-4-rekonsiliasi-discrepancy-kasir.md](../blueprint/test-cases/skenario-4-rekonsiliasi-discrepancy-kasir.md)
  - Prinsip 2 lapis: Lapis 1 Musyawarah kru di meja kasir (talangan tiket kurang Rp200rb $\to$ status penerimaan `MATCHED`) vs Lapis 2 Jalur sistemik nota BBM hilang Rp300rb (`financial_status = DISCREPANCY`), investigasi telematika/GPS, otorisasi Finance Manager (Dispensasi `58101` vs Klaim `12901`), penutupan periode fiskal unblocked via akun penampung `11999`.

---

## Phase 3: Core Implementation (10-Stage Execution Roadmap)

### 📌 Tahap 1: Master Organisasi, Dimensi, & Armada Bus
* **Entitas TypeORM (`src/@models/`)**:
  * `companies`: Entitas hukum PT SS Traveling (`code`, `name`, `currency`, `timezone`).
  * `business_units`: Unit usaha operasional (`AKAP`, `PARIWISATA`, `SHUTTLE`).
  * `cost_centers`: Tempat terjadinya biaya (`Pool Ciputat`, `Bengkel Garasi`, `Kantor Pusat`).
  * `profit_centers`: Unit analisis pendapatan per lini bisnis.
  * `vehicles`: Data fisik armada bus (`code`/nomor lambung, `nickname`, `plate_number`, `vehicle_type`, `capacity`, `isActive`).
  * `vehicle_seat_classes`: Konfigurasi multi-class kursi per bus (*Sleeper*, *Luxury 2-1*, *Executive*) sebagai batas fisik (*hard ceiling*) manifes.
* **Database Seeder & Migration**:
  * Inisialisasi data organisasi, cost centers, dan pendaftaran 10 bus existing (7 unit lunas, 3 unit cicilan leasing sesuai Addendum v1.13).
* **Deliverable**: Model entity TypeORM, migrasi database, dan seeder data armada.

---

### 📌 Tahap 2: Master Keuangan, Hierarki COA (Kelompok 1-8), & Kas/Bank
* **Entitas TypeORM (`src/@models/`)**:
  * `accounts`: Chart of Accounts (COA) hierarkis (parent-child, code unik, `type`: ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE, `normal_balance`: DEBIT/CREDIT, `is_postable`, `is_active`).
  * `cash_accounts`: Kas fisik (`Kas Operasional Pool Ciputat`, `Kas Cabang Yogya`, `Kas Kecil Petty Cash`).
  * `bank_accounts`: Rekening bank korporat (`Bank BCA Operasional`, `Bank Mandiri`).
  * `fiscal_years` & `fiscal_periods`: Pengendalian kalender akuntansi bulanan (`OPEN`, `CLOSING`, `CLOSED`).
  * `document_sequences`: Generator nomor dokumen anti-tabrakan berbasis row lock (`SPJ/AKP/YYMM/XXXX`, `SPJ/WIS/YYMM/XXXX`, `BKM`, `BKK`, `JV`).
* **Database Seeder**:
  * Template COA lengkap perusahaan bus standar Blueprint Bab 6.2 (Akun 11101 s.d. 82101).
* **Deliverable**: Struktur COA tervalidasi dan periode fiskal aktif terbentuk.

---

### 📌 Tahap 3: Master Aturan Bisnis & Tarif Lapangan
* **Entitas TypeORM (`src/@models/`)**:
  * `fare_seasons`: Kalender musim tarif (`REGULER`, `TUSLAH_LEBARAN`, `LIBURAN_SEKOLAH`).
  * `fare_matrix`: Matriks tarif dasar berversi (origin, destination, seat_class, amount, effective_date).
  * `agents`: Master agen tiket offline loket terminal vs online OTA (RedBus, Traveloka) dengan filter kota (`JAKARTA`, `YOGYAKARTA`, `ALL`) dan cara penyelesaian.
  * `agent_commission_rules`: Aturan komisi agen per kelas kursi (flat per pax atau persentase).
  * `crew_rate_rules`: Standar uang makan (`meal_allowance`), premi ritase (`trip_incentive`), dan bonus full seat (`full_seat_bonus`) per peran kru (`DRIVER`, `CO_DRIVER`, `CONDUCTOR`) dengan tipe AKAP (`PER_TRIP`) vs Wisata (`PER_DAY`).
  * `restaurants`: Master rumah makan mitra servis makan AKAP (tarif per pax, metode penyelesaian AP bulanan vs UJ).
  * `coordinator_fee_rules`: Aturan fee koordinator wilayah Barat & Timur (default Rp10.000/pax).
* **Seeder**:
  * Matriks 10 Role Standar SS Traveling (Addendum v1.11) pada tabel `roles` dan seeder aturan tarif awal.
* **Deliverable**: Master aturan lapangan siap di-snapshot ke transaksi operasional.

---

### 📌 Tahap 4: Accounting Core Engine (Jantung ERP)
* **Entitas TypeORM (`src/@models/`)**:
  * `journal_entries`: Header jurnal umum (`journal_no`, `journal_date`, `period_id`, `source_type`, `source_id`, `status: POSTED`, `reversal_of_id`).
  * `journal_lines`: Baris debet & kredit dengan dimensi lengkap (`account_id`, `debit`, `credit`, `business_unit_id`, `cost_center_id`, `profit_center_id`, `spj_id`, `vehicle_id`, `counterparty_type`, `counterparty_id`).
  * `accounting_events`: Jejak idempotensi transaksi posting (`source_type`, `source_id`, `event_type`, `idempotency_key`, `journal_entry_id`).
* **Domain Service (`AccountingPostingService`)**:
  * Transaksi atomik satu pintu (`DataSource.transaction`), row lock dokumen sumber, validasi akun aktif & postable, validasi periode terbuka, validasi keseimbangan debet = kredit via `MoneyHelper.isBalanced()`, serta pencegahan jurnal ganda.
  * Mekanisme Reversal: Posting jurnal pembalik otomatis tanpa pernah menghapus atau mengubah jurnal lama.
* **Deliverable**: `AccountingPostingService` lulus pengujian unit invariant akuntansi.

---

### 📌 Tahap 5: SPJ Life Cycle & Multi-Leg State Machine
* **Entitas TypeORM (`src/@models/`)**:
  * `spjs`: Dokumen Surat Perintah Jalan (`spj_no`, `service_type: AKAP/TOURISM`, `parent_spj_id`, `business_unit_id`, `operational_status`, `financial_status`, `issued_at`, `closed_at`).
  * `spj_legs`: Segmen rute perjalanan (`sequence_no`, `direction: DEPARTURE/RETURN`, `origin`, `destination`, `meal_pax_count`, `meal_discrepancy_notes`, `status`).
  * `spj_crew_assignments`: Penugasan kru fleksibel (2–4+ kru) per leg perjalanan dengan validasi minimal 1 Driver.
* **State Machine & Validasi**:
  * Pemisahan independen `operational_status` (`DRAFT` $\to$ `ISSUED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED` / `CANCELLED`) dari `financial_status`.
  * Snapshot otomatis hak kompensasi kru dari `crew_rate_rules` ke `crew_meal_payments` saat penugasan.
  * Penautan darurat `parent_spj_id` untuk penggantian armada di jalan (Skenario 3).
* **Deliverable**: Modul SPJ dengan penomoran otomatis dan lifecycle terverifikasi.

---

### 📌 Tahap 6: Uang Jalan (UJ), Biaya SPJ, & Deklarasi Penerimaan
* **Entitas TypeORM (`src/@models/`)**:
  * `spj_expenses`: Seluruh biaya perjalanan (BBM solar + liter + odometer, tol, parkir, cuci, retribusi, servis makan).
  * `spj_uj`: Amplop pertanggungjawaban UJ kru ($1:N$ per SPJ).
  * `spj_uj_disbursements`: Baris pencairan UJ (multi-line: kas pool awal + transfer bank darurat).
  * `spj_uj_expenses`: Alokasi pengeluaran riil yang dibayar dari UJ.
  * `spj_uj_returns`: Pengembalian fisik sisa dana UJ ke laci kasir pool.
  * `spj_uj_additional_requests`: Pengajuan tambahan UJ di jalan.
  * `spj_revenue_declarations`: Rekap deklarasi penerimaan tiket tunai kru, kargo motor, dan kargo kardus (dengan persentase komisi dinamis kru 20%).
* **Fitur Kritis**:
  * Estafet UJ (*UJ Rollover*) antar-SPJ saat pergantian armada darurat (Skenario 3).
  * Pemisahan tegas kas penerimaan bruto tiket/kargo dari pengeluaran UJ (*Anti-Netting*).
* **Deliverable**: Modul UJ multi-line, biaya SPJ, dan deklarasi penerimaan tervalidasi.

---

### 📌 Tahap 7: Meja Kasir Pool, Settlement Kas Kru, & Resolusi Selisih
* **Entitas TypeORM (`src/@models/`)**:
  * `crew_cash_settlements`: Header verifikasi kasir pool per SPJ (`uj_status`, `revenue_status`, `status: SETTLED/DISCREPANCY`).
  * `crew_cash_remittances`: Setoran fisik uang tunai ke kasir pool.
  * `crew_cash_remittance_allocations`: Alokasi setoran ke deklarasi penerimaan tiket/kargo.
  * `crew_cash_discrepancies`: Temuan selisih kas (kurang setor, nota BBM hilang).
* **Alur Bisnis Terkunci**:
  * Jalur 1 Musyawarah Kru: Talangan mandiri antar-kru di meja kasir $\to$ status penerimaan `MATCHED` (Skenario 4 Kasus 1).
  * Jalur 2 Pencatatan Sistem: Nota hilang / selisih dicatat di `crew_cash_discrepancies` $\to$ `financial_status = DISCREPANCY` (Skenario 4 Kasus 2).
  * Otorisasi Finance Manager: Putusan Dispensasi Perusahaan (`58101`) vs Klaim Piutang Kru (`12901`).
  * Tutup Buku Bulanan Unblocked: Pemanfaatan akun penampung neraca sementara `11999` agar sengketa selisih tidak menahan tutup periode.
  * Jurnal Otomatis Kasir: Menghasilkan jurnal penyelesaian SPJ terintegrasi ke `AccountingPostingService` (saldo UJ tuntas menjadi Rp 0).
* **Deliverable**: Layar meja kasir pool, settlement anti-netting, dan posting jurnal otomatis.

---

### 📌 Tahap 8: Modul Piutang (AR) & Utang (AP)
* **Entitas TypeORM (`src/@models/`)**:
  * `ar_invoices`, `ar_invoice_lines`, `ar_receipts`, `ar_allocations`: Tagihan piutang pelanggan charter/wisata, AR OTA RedBus/Traveloka, dan alokasi penerimaan bank.
  * `ap_invoices`, `ap_invoice_lines`, `ap_payments`, `ap_allocations`: Tagihan utang vendor restoran servis makan mitra, bengkel rekanan/karoseri, sparepart, dan komisi agen.
* **Fitur Terkunci**:
  * Tagihan AP Servis Makan Restoran Mitra: Form khusus tarik SPJ belum ditagih, validasi toleransi kupon riil vs manifes (`meal_pax_count`), anti-double billing, nol beban kas kru (Skenario 1).
  * Siklus AR Wisata: Uang muka DP sewa 30% (`24101`), pelunasan invoice 70%, dan pengakuan pendapatan accrual saat trip selesai (Skenario 2).
  * Pembayaran Utang Komisi Agen & Cashback Rekanan B2B Wisata (`54103`) via transfer bank korporat.
* **Deliverable**: Modul AR/AP terhubung penuh dengan dimensi SPJ perjalanan.

---

### 📌 Tahap 9: Laporan Finansial, Trip Profitability (Margin), & Tutup Buku
* **Domain Service Pelaporan**:
  * Buku Besar (General Ledger) & Neraca Saldo (Trial Balance) bersumber murni dari baris jurnal `POSTED`.
  * Laporan Laba Rugi Perusahaan & Laporan Neraca.
  * Laporan Kontribusi Laba SPJ (*Trip Contribution Margin*):
    * Tampilan per Bus (`vehicle_id`): Mengisolasi performa unit (misal: defisit bus rusak `SS-01` vs margin bus pengganti `SS-03` pada Skenario 3).
    * Tampilan per Kelompok Perjalanan (*Journey Group*): Mengagregasikan seluruh omzet dan beban langsung satu kesatuan perjalanan ekonomi.
* **Tutup Buku Bulanan (*Period Close*)**:
  * Checklist pemeriksaan otomatis (jurnal seimbang, kasir tuntas, rekonsiliasi kas/bank, rekap SPJ berselisih di akun `11999`).
  * Penguncian status periode `CLOSED` (menolak posting baru) dan otorisasi `REOPEN`.
* **Deliverable**: Mesin laporan finansial multi-dimensi dan workflow tutup buku bulanan.

---

### 📌 Tahap 10: Integrasi Frontend UI & E2E Verification
* **Frontend Modules (`ss-travel-frontend/src/`)**:
  * Master Data UI: Pengelolaan Armada Bus, Kelas Kursi, Agen, Restoran Mitra, COA, dan Aturan Tarif.
  * SPJ Dispatcher UI: Form pembuatan & plotting SPJ, manifes penumpang multi-class, penugasan kru per-leg.
  * Meja Kasir Pool UI: Form pencairan UJ (BKK), form penerimaan kas setoran tiket/kargo (BKM), rekonsiliasi dua kantong saldo (Anti-Netting), dan modal penyelesaian selisih kas.
  * Finance AP/AR UI: Form tagihan servis makan mitra (tarik SPJ), tagihan sewa wisata, pelunasan transfer bank.
  * Accounting UI: Buku besar, jurnal memorial, neraca saldo, checklist tutup buku, dan dashboard laba/rugi trip.
* **Pengujian End-to-End**:
  * Menjalankan simulasi penuh 4 Test Case Skenario terkunci melalui antarmuka web.
* **Deliverable**: Aplikasi ERP lengkap siap pakai untuk operasional harian.
