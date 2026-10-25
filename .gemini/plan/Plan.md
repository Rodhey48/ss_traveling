# Master Plan: SS Traveling ERP

## Phase 1: Infrastructure & Auth (Completed)
- [x] API Gateway & Monolith Core Setup.
- [x] Auth Service (User, Role, Hierarchical Menus).
- [x] Frontend Shell & Management UI.
- [x] **Hybrid Action-based Permissions** (Dynamic custom actions like approve, export).
- [x] **Dual-Strategy Auth & Security Hardening**:
  - [x] HttpOnly Cookie (Web) + Bearer Token (Mobile).
  - [x] Single Device Login (SDL) & Stateless Device Fingerprinting (`x-device-id` + `User-Agent`).
  - [x] Standardized Machine-Readable Error Codes (`TOKEN_EXPIRED`, `INVALID_DEVICE_CONTEXT`, etc.).
  - [x] Logout API (`POST /api/v1/auth/logout`) with server-side session revocation and cookie clearing.
  - [x] Complete Frontend Implementation Guide: [AUTH_SPECIFICATION_AND_FE_GUIDE.md](./AUTH_SPECIFICATION_AND_FE_GUIDE.md).
- [x] **Backend & Frontend Foundation Alignment (2026-10-15)**:
  - [x] Standardized global API prefix to `/api/v1` and Swagger to `/api/v1/docs`.
  - [x] Installed `decimal.js` and implemented `MoneyHelper` (`src/@common/helpers/money.helper.ts`) with 100% test pass rate.
  - [x] Migrated `BaseEntity` and `UsersEntity` timestamp columns to `timestamptz`.
  - [x] Aligned frontend API services to `/api/v1` without leading slashes.

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

## Phase 3: Core Implementation (Vertical Slice Roadmap — BE + FE per Tahap)

Setiap tahap dikerjakan secara paralel per fitur (*Vertical Slice*): **Database $\to$ Backend API (DTO, Service, Controller, Unit Test) $\to$ Frontend UI (Halaman, Komponen, Service Client)** sehingga setiap tahap langsung menghasilkan fitur fungsional yang dapat dicoba di browser.

---

### 📌 Tahap 0: Fondasi RBAC, Matriks 11 Role Standar, User Testing, & Seeder Menu Sidebar (Completed)
* [x] **Backend RBAC & Seeder Implementation (`ss-travel-backend`)**:
  * [x] **Matriks 11 Role Standar Terdaftar**: `SUPER_ADMIN`, `DIRECTOR`, `FINANCE_MANAGER`, `ACCOUNTANT`, `FINANCE_AR_AP`, `POOL_CASHIER`, `OPS_ADMIN`, `FIELD_COORDINATOR`, `CREW_DRIVER`, `CREW_CONDUCTOR`, `CREW_STEWARDESS` (Pramugari Bus).
  * [x] **14 Akun Pengguna Testing Siap Pakai** (Password seragam: `Asd123`):
    * `superadmin@sstravel.com` (Super Admin, role: `SUPER_ADMIN`)
    * `director@sstravel.com` (Pak Wira, role: `DIRECTOR`)
    * `finance.manager@sstravel.com` (Pak Hendro, role: `FINANCE_MANAGER`)
    * `accountant@sstravel.com` (Mbak Dewi, role: `ACCOUNTANT`)
    * `finance.arap@sstravel.com` (Staff AR/AP, role: `FINANCE_AR_AP`)
    * `cashier.ciputat@sstravel.com` (Mas Deni, role: `POOL_CASHIER`)
    * `ops.admin@sstravel.com` (Dispatcher Ops, role: `OPS_ADMIN`)
    * `field.coordinator@sstravel.com` (Korlap Barat, role: `FIELD_COORDINATOR`)
    * `driver.budi@sstravel.com` (Pak Budi, role: `CREW_DRIVER`)
    * `driver.joko@sstravel.com` (Pak Joko, role: `CREW_DRIVER`)
    * `driver.hendra@sstravel.com` (Pak Hendra, role: `CREW_DRIVER`)
    * `conductor.anto@sstravel.com` (Mas Anto, role: `CREW_CONDUCTOR`)
    * `stewardess.siti@sstravel.com` (Mbak Siti, role: `CREW_STEWARDESS`)
    * `stewardess.maya@sstravel.com` (Mbak Maya, role: `CREW_STEWARDESS`)
  * [x] **Struktur Pohon Menu Sidebar Lengkap & Ikon Lucide Terpasang**:
    * Dashboard (`/dashboard`)
    * Master Data & CRM (`/vehicles`, `/customers`, `/accounts`, `/cash-bank`, `/fares`, `/agents`, `/partners`, `/fiscal-periods`, `/organization`)
    * Jadwal & Operasional (`/schedules`, `/spjs`)
    * Meja Kasir Pool (`/cashier`, `/petty-cash`)
    * Keuangan & Akuntansi (`/ap-invoices`, `/ar-invoices`, `/journals`, `/reports/trip-profitability`, `/reports/general-ledger`, `/period-closing`)
    * Manajemen Sistem (`/users`, `/roles`, `/menu-management`)
  * [x] **Matriks Otorisasi Role-Menus Terpetakan Lengkap**:
    * `SUPER_ADMIN`: 100% full akses CRUD ke seluruh menu.
    * Pemetaan izin role lainnya sesuai SoD dan tupoksi operasional masing-masing.
  * [x] **Automated Testing**: 5/5 skenario E2E test suite lulus di `test/rbac-auth.e2e-spec.ts`.

---

### 📌 Tahap 1: Master Organisasi, Dimensi, Armada Bus, & Pelanggan / CRM Leads (BE + FE) (Completed)
* [x] **Backend Implementation (`ss-travel-backend`)**:
  * [x] **Models & Entities (`src/@models/`)**:
    * [x] `companies`: Entitas hukum PT SS Traveling (`code`, `name`, `currency`, `timezone`).
    * [x] `business_units`: Unit usaha operasional (`AKAP`, `PARIWISATA`, `SHUTTLE`).
    * [x] `cost_centers`: Tempat terjadinya biaya (`Pool Ciputat`, `Bengkel Garasi`, `Kantor Pusat`).
    * [x] `profit_centers`: Unit analisis pendapatan per lini bisnis.
    * [x] `seat_classes`: Master Data Standar Kelas Kursi (`id`, `company_id`, `code`, `name`, `default_layout`, `description`, `is_active`) sebagai *single source of truth* untuk konfigurasi armada dan matriks harga tiket (Addendum v1.17).
    * [x] `vehicles`: Data fisik armada bus (`code`/nomor lambung, `nickname`, `plate_number`, `vehicle_type`, `capacity`, `isActive`).
    * [x] `vehicle_images`: Galeri foto multi-image armada bus (1:N) dengan penanda foto sampul utama (`is_primary`) dan urutan galeri (`sequence`) untuk kesiapan etalase landing page publik SS Traveling (Addendum v1.18).
    * [x] `vehicle_seat_classes`: Konfigurasi multi-class kursi per bus (*Sleeper*, *Luxury 2-1*, *Executive*) dengan relasi FK ke `seat_classes` sebagai batas fisik (*hard ceiling*) manifes.
    * [x] `customers`: Master pelanggan & database CRM leads penyewa wisata (`code`, `customer_type`, `institution_name`, `pic_name`, `phone`, `email`, `address`, `city`, `lead_source`, `customer_tier`, `last_trip_date`, `total_trips_count`, `special_notes`, `isActive`).
  * [x] **DTOs & Validations (`src/@dto/`)**:
    * [x] DTO Organisasi: `CreateCompanyDto`, `CreateBusinessUnitDto`, `CreateCostCenterDto`, `CreateProfitCenterDto`.
    * [x] DTO Kelas Kursi & Armada: `CreateSeatClassDto`, `UpdateSeatClassDto`, `CreateVehicleDto`, `UpdateVehicleDto`, `CreateVehicleSeatClassDto`, `CreateVehicleImageDto`, `VehicleQueryFilterDto`.
    * [x] DTO Pelanggan: `CreateCustomerDto`, `UpdateCustomerDto`, `CustomerQueryFilterDto`.
  * [x] **Services & Domain Logic**:
    * [x] `OrganizationService`: Pengelolaan unit bisnis, hierarki cost center, dan profit center.
    * [x] `VehiclesService`: Validasi nopol & kode lambung unik, CRUD master `seat_classes`, relasi multi-image `vehicle_images`, pendaftaran multi-class kursi terikat FK, kalkulasi kapasitas fisik total bus.
    * [x] `CustomersService`: Pengelolaan database prospek/leads, pencarian autocomplete nama/telepon, auto-update riwayat trip dan frekuensi sewa.
  * [x] **Controllers & REST Endpoints**:
    * [x] `GET/POST/PUT` `/api/v1/companies`, `/api/v1/business-units`, `/api/v1/cost-centers`, `/api/v1/profit-centers`
    * [x] `GET/POST/PUT/DELETE` `/api/v1/seat-classes` (Master Kelas Kursi)
    * [x] `GET/POST/PUT/DELETE` `/api/v1/vehicles`, `/api/v1/vehicles/:id/seat-classes`, `/api/v1/vehicles/:id/images`
    * [x] `GET/POST/PUT/DELETE` `/api/v1/customers`
  * [x] **Seeder & Migration**:
    * [x] Migration skema tabel organisasi, armada, dan pelanggan/leads (`1781000000000-create-org-fleet-customer.ts`).
    * [x] Migration skema tabel `seat_classes`, relasi FK ke `vehicle_seat_classes`, dan seeder default 4 kelas kursi (`1781100000000-create-seat-classes.ts`).
    * [x] Migration skema tabel `vehicle_images` dan seeder foto eksterior/interior 10 armada bus (`1781200000000-create-vehicle-images.ts`).
    * [x] Seeder: PT SS Traveling, Unit AKAP & Wisata, Cost Centers (Ciputat, Bengkel, Kantor).
    * [x] Seeder: 10 Unit Bus Existing SS Traveling (7 lunas, 3 cicilan leasing sesuai Addendum v1.13) lengkap dengan relasi ke master kursi Sleeper & Luxury 2-1 serta galeri foto.
    * [x] Seeder: Data awal pelanggan B2B (misal: PT Mitra Sejahtera Abadi, SMA 1 Tangerang).
  * [x] **Automated Tests**:
    * [x] Unit test `VehiclesService` (termasuk seat classes & vehicle images) dan `CustomersService` (34 passed).
* [x] **Frontend Implementation (`ss-travel-frontend`)**:
  * [x] **API Service Clients (`src/services/`)**:
    * [x] `vehicle.service.ts`: Panggilan API `/api/v1/vehicles` & `/api/v1/seat-classes` & gambar armada.
    * [x] `customer.service.ts`: Panggilan API `/api/v1/customers`.
    * [x] `organization.service.ts`: Panggilan API unit bisnis & cost centers.
  * [x] **Pages & Components (`src/pages/`)**:
    * [x] Halaman **Manajemen Armada Bus (`/vehicles`)**: Grid Kartu visual menampilkan foto cover bus modern, badge foto galeri, badge kepemilikan, modal tambah/edit armada dengan form galeri foto dan konfigurasi kursi ber-header, serta modal **Master Kelas Kursi**.
    * [x] Modal **Detail Armada Bus (`VehicleDetailModal`)**: Muncul saat kartu bus diklik, menampilkan galeri foto besar resolusi tinggi dengan thumbnail selector, spesifikasi bodi/chasis, rincian kelas kursi & fasilitas kabin dari master data, dan badge kesiapan landing page.
    * [x] Halaman **Database Pelanggan & CRM Leads (`/customers`)**: Tabel prospek penyewa wisata, filter segmen (Sekolah, Korporat, Komunitas), status tier lead, dan riwayat trip sewa.
    * [x] Halaman **Pengaturan Organisasi & Cost Center (`/organization`)**.

---

### 📌 Tahap 2: Master Keuangan, Hierarki COA (Kelompok 1-8), & Kas/Bank (BE + FE) (Completed)
* [x] **Backend Implementation (`ss-travel-backend`)**:
  * [x] **Models & Entities (`src/@models/`)**:
    * [x] `accounts`: COA hierarkis (parent-child, `is_postable`, `normal_balance`, `type`).
    * [x] `cash_accounts`: Kas fisik (`Kas Operasional Pool Ciputat`, `Kas Cabang Yogya`, `Kas Kecil Petty Cash`).
    * [x] `bank_accounts`: Rekening korporat (`Bank BCA Operasional`, `Bank Mandiri`).
    * [x] `fiscal_years` & `fiscal_periods`: Kalender akuntansi bulanan (`OPEN`, `CLOSING`, `CLOSED`).
    * [x] `document_sequences`: Generator nomor transaksi anti-tabrakan berbasis row lock.
  * [x] **DTOs & Validations**:
    * [x] `CreateAccountDto`, `UpdateAccountDto`, `AccountQueryFilterDto`.
    * [x] `CreateCashAccountDto`, `CreateBankAccountDto`, `CreateFiscalPeriodDto`, `GenerateSequenceDto`.
  * [x] **Services & Controllers**:
    * [x] `AccountsService` & `AccountsController`: Validasi parent-child akun, pencegahan circular relation, kueri hierarki tree COA.
    * [x] `CashBankService`, `CashAccountsController`, & `BankAccountsController`: Pengelolaan kasir pool penanggung jawab dan masking rekening bank.
    * [x] `FiscalPeriodsService` & `FiscalPeriodsController`: Validasi periode aktif dan pencegahan overlap tanggal.
    * [x] `DocumentSequenceService` & `DocumentSequenceController`: Algoritma nomor transaksi concurrency-safe.
  * [x] **Seeder & Migration**:
    * [x] Migration skema tabel COA, kas/bank, dan periode fiskal (`1781300000000-create-finance-master.ts`).
    * [x] Seeder: COA Standar Lengkap Perusahaan Bus (Akun 11101 s.d. 82101 sesuai Blueprint Bab 6.2).
    * [x] Seeder: Kas Pool Ciputat, Cabang Yogya, Kas Kecil, Bank BCA & Mandiri, serta Kalender Fiskal Aktif Tahun Berjalan (`1888888888891-SeedFinanceMaster.ts`).
  * [x] **Automated Tests**:
    * [x] Unit test `AccountsService` dan `DocumentSequenceService` (49 tests total passed).
* [x] **Frontend Implementation (`ss-travel-frontend`)**:
  * [x] **API Service Clients (`src/services/`)**:
    * [x] `account.service.ts`: Panggilan API `/api/v1/accounts` (tree kueri).
    * [x] `cash-bank.service.ts`: Panggilan API `/api/v1/cash-accounts` & `/api/v1/bank-accounts`.
    * [x] `fiscal-period.service.ts`: Panggilan API `/api/v1/fiscal-periods`.
  * [x] **Pages & Components (`src/pages/`)**:
    * [x] Halaman **Bagan Akun / COA (`/accounts`)**: Tampilan visual pohon hierarki akun parent-child, badge tipe akun, indikator header vs postable, dan modal tambah/edit akun.
    * [x] Halaman **Kas & Rekening Bank (`/cash-bank`)**: Manajemen kas pool, kas kecil garasi, dan rekening korporat perusahaan.
    * [x] Halaman **Periode Fiskal Akuntansi (`/fiscal-periods`)**: Kalender akuntansi bulanan dan status periode (Open/Closed).

---

### 📌 Tahap 3: Master Aturan Bisnis & Tarif Lapangan (BE + FE)
* [x] **Backend Implementation (`ss-travel-backend`)**:
  * [x] **Models & Entities (`src/@models/`)**:
    * [x] `fare_seasons`, `fare_matrix`: Kalender musim tarif & matriks tarif dinamis berversi.
    * [x] `agents`, `agent_commission_rules`: Master agen offline loket vs online OTA (RedBus, Traveloka), filter kota, dan aturan komisi berjenjang per kelas kursi.
    * [x] `crew_rate_rules`: Standar uang makan, premi ritase, dan bonus full seat kru (AKAP `PER_TRIP` vs Wisata `PER_DAY`).
    * [x] `restaurants`: Master rumah makan mitra servis makan AKAP.
    * [x] `coordinator_fee_rules`: Aturan fee koordinator wilayah Barat & Timur.
  * [x] **DTOs, Services, & Controllers**:
    * [x] `FareMatrixService`: Penentuan tarif tiket dinamis sesuai tanggal dan kelas kursi.
    * [x] `AgentsService`: Smart filter agen sesuai arah leg rute (Jakarta vs Yogya).
    * [x] `CrewRatesService`: Aturan rate snapshotting kompensasi kru.
    * [x] Controller untuk masing-masing master aturan dengan Swagger dan `@RequirePermissions`.
  * [x] **Seeder & Migration**:
    * [x] Migration tabel tarif, agen, komisi, kompensasi kru, dan restoran (`1781400000000-create-pricing-and-rules.ts`).
    * [x] Seeder: Matriks tarif awal Jakarta-Yogya, komisi agen loket vs OTA, rate kompensasi kru, dan RM Taman Selera (`1888888888892-SeedPricingAndMasterRules.ts`).
  * [x] **Automated Tests**:
    * [x] Unit test kalkulasi tarif musiman, filter arah rute agen, komisi flat/persen, snapshot kompensasi kru, servis makan, dan fee korlap (71/71 tests passing).
* [x] **Frontend Implementation (`ss-travel-frontend`)**:
  * [x] **API Service Clients (`src/services/`)**:
    * [x] `fare.service.ts`, `agent.service.ts`, `crew-rate.service.ts`, `partner.service.ts`.
  * [x] **Pages & Components (`src/pages/`)**:
    * [x] Halaman **Matriks Tarif & Musim Tiket (`/fares`)**: Pengaturan kalender musim (Reguler, Tuslah, Liburan) dan matriks harga tiket per kelas kursi dengan simulator kalkulasi dinamis.
    * [x] Halaman **Mitra Agen & Aturan Komisi (`/agents`)**: Pengelolaan agen loket fisik vs OTA, pengaturan komisi (flat per tiket vs persentase), dan validasi smart filter rute SPJ.
    * [x] Halaman **Standar Kompensasi Kru (`/crew-rates`)**: Tabel tarif uang makan & premi harian/ritase supir dan kondektur dengan engine snapshotting kompensasi SPJ.
    * [x] Halaman **Restoran Mitra & Korlap (`/partners`)**: Manajemen rumah makan servis makan dan fee koordinator lapangan lengkap dengan kalkulator pengeluaran akuntansi.

---

### 📌 Tahap 4: Accounting Core Engine & Jurnal Umum (BE + FE) (Completed)
* [x] **Backend Implementation (`ss-travel-backend`)**:
  * [x] **Models & Entities (`src/@models/`)**:
    * [x] `journal_entries`, `journal_lines`, `accounting_events`.
  * [x] **DTOs & Validations**:
    * [x] `CreateManualJournalDto`, `JournalLineInputDto`, `ReverseJournalDto`, `JournalFilterQueryDto`.
  * [x] **Services & Domain Logic**:
    * [x] `AccountingPostingService`: Posting satu pintu via `DataSource.transaction()`, row lock, validasi akun postable & aktif, validasi periode terbuka, validasi debet=kredit dengan `MoneyHelper.isBalanced()`, dan proteksi idempotency key.
    * [x] `JournalReversalService`: Pembuatan jurnal pembalik (*reversal*) otomatis tanpa edit/hapus jurnal lama.
  * [x] **Controllers & REST Endpoints**:
    * [x] `GET` `/api/v1/journals`, `GET` `/api/v1/journals/:id`
    * [x] `POST` `/api/v1/journals/manual` (pembuatan jurnal memorial berizin khusus)
    * [x] `POST` `/api/v1/journals/:id/reverse` (eksekusi reversal jurnal)
  * [x] **Automated Tests**:
    * [x] Unit test posting jurnal seimbang, penolakan jurnal tak seimbang, proteksi periode closed, dan reversal (90/90 tests passing).
    * [x] E2E test lifecycle jurnal dan reversal (`test/journals.e2e-spec.ts`, 12/12 E2E tests passing).
* [x] **Frontend Implementation (`ss-travel-frontend`)**:
  * [x] **API Service Clients (`src/services/`)**:
    * [x] `journal.service.ts`: Panggilan API `/api/v1/journals`.
  * [x] **Pages & Components (`src/pages/`)**:
    * [x] Halaman **Daftar Jurnal Umum (`/journals`)**: Tabel jurnal terposting, filter rentang tanggal, filter status, filter sumber transaksi, filter akun/dimensi, kartu statistik transaksi, dan paginasi.
    * [x] Modal **Detail Jurnal (`JournalDetailModal`)**: Rincian baris jurnal debet-kredit, informasi akun COA, dimensi terikat (armada, cost center, SPJ), dan banner status reversal.
    * [x] Modal **Entri Jurnal Memorial (`CreateJournalModal`)**: Form pembuatan jurnal multi-line dengan kalkulator live debet-kredit balance indicator.
    * [x] Modal **Reversal Jurnal (`ReverseJournalModal`)**: Dialog konfirmasi alasan pembatalan dan penerbitan jurnal pembalik.

---

### 📌 Tahap 5: Perencanaan Jadwal Bus & Eksekusi SPJ (BE + FE) (Completed)
* [x] **Backend Implementation (`ss-travel-backend`)**:
  * [x] **Models & Entities (`src/@models/`)**:
    * [x] `trip_schedules`: Dokumen rencana jadwal dinas bus (`schedule_no`, `service_type`, `vehicle_id`, `planned_departure_at`, `planned_return_at`, `origin`, `destination`, `customer_id`, `pic_name`, `pic_phone`, `pickup_notes`, `planned_driver_1_id`, `planned_driver_2_id`, `planned_conductor_id`, `status`, `spj_id`).
    * [x] `spjs`: Dokumen Surat Perintah Jalan (`spj_no`, `service_type`, `parent_spj_id`, `operational_status`, `financial_status`).
    * [x] `spj_legs`, `spj_crew_assignments`.
  * [x] **Services & Domain Logic**:
    * [x] `TripSchedulesService`: Generator nomor jadwal, validasi anti-bentrok armada & kru (*Overlap Conflict*), peringatan buffer rest time (minimal 3 jam), auto-link customer/lead wisata, dan aksi 1-klik *Generate SPJ*.
    * [x] `SpjService`: State machine status operasional SPJ (`DRAFT` $\to$ `ISSUED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED`), validasi kapasitas kursi, validasi minimal 1 Driver, snapshot rate hak kru, dan penautan darurat `parent_spj_id` (Skenario 3).
  * [x] **Controllers & REST Endpoints**:
    * [x] `GET/POST/PUT/DELETE` `/api/v1/trip-schedules`, `/api/v1/trip-schedules/calendar`, `/api/v1/trip-schedules/check-conflict`
    * [x] `POST` `/api/v1/trip-schedules/:id/confirm`, `/api/v1/trip-schedules/:id/cancel`, `/api/v1/trip-schedules/:id/generate-spj`
    * [x] `GET/POST` `/api/v1/spjs`, `/api/v1/spjs/:id/issue`, `/api/v1/spjs/:id/start`, `/api/v1/spjs/:id/complete`, `/api/v1/spjs/:id/replace-crew`, `/api/v1/spjs/:id/emergency-replace-bus`, `/api/v1/spjs/legs/:legId`
  * [x] **Seeder & Database Migration**:
    * [x] Migration skema tabel jadwal dan SPJ (`1781600000000-create-trip-schedules-and-spjs.ts`).
    * [x] Seeder data real-world: Jadwal AKAP SS-01, Jadwal Wisata SS-02, SPJ aktif SS-01 dan SPJ breakdown pengganti SS-03 (`1888888888893-SeedSchedulesAndSpjs.ts`).
  * [x] **Automated Tests**:
    * [x] Unit test deteksi bentrok jadwal bus & kru, buffer time alert, transisi lifecycle SPJ, revisi kru, dan emergency replacement (108/108 passing).
* [x] **Frontend Implementation (`ss-travel-frontend`)**:
  * [x] **API Service Clients (`src/services/`)**:
    * [x] `trip-schedule.service.ts`, `spj.service.ts`.
  * [x] **Pages & Components (`src/pages/`)**:
    * [x] Halaman **Jadwal & Plotting Armada (`/schedules`)**: Visualisasi **Kalender Timeline Armada (Gantt Chart)** per bus `SS-01` s.d. `SS-10`, indikator warna status, peringatan jadwal bentrok / sisa istirahat mepet.
    * [x] Form **Booking Jadwal Wisata & AKAP Mingguan (`ScheduleModal`)**: Input bus, kru, titik jemput/drop, live conflict/buffer checker, dan pencarian instan nama/nomor WA penyewa (CRM auto-complete).
    * [x] Halaman **Operasional SPJ Dispatcher (`/spjs`)**: Monitoring bus aktif di jalan, kartu metrik ringkasan, tombol aksi 1-klik terbitkan SPJ dari jadwal, tombol keberangkatan (`IN_PROGRESS`), kepulangan (`COMPLETED`), modal pergantian kru darurat (`ReplaceCrewModal`), modal penanganan breakdown di tol (`EmergencyReplaceBusModal`), serta modal rincian leg & snapshot kompensasi (`SpjDetailModal`).

---

### 📌 Tahap 6: Uang Jalan (UJ), Biaya SPJ, & Deklarasi Penerimaan (BE + FE) (Completed)
* [x] **Backend Implementation (`ss-travel-backend`)**:
  * [x] **Models & Entities (`src/@models/`)**:
    * [x] `spj_expenses` (BBM solar + liter + odometer, tol, parkir, retribusi).
    * [x] `spj_uj`, `spj_uj_disbursements` (multi-line), `spj_uj_expenses`, `spj_uj_returns`, `spj_uj_additional_requests`.
    * [x] `spj_revenue_declarations` (tiket tunai, kargo motor, kargo kardus dengan komisi dinamis kru 20%).
    * [x] `crew_meal_payments` (hak makan, premi, bonus full seat, komisi kargo).
  * [x] **Services & Domain Logic**:
    * [x] `SpjUjService`: Multi-line disbursement, pencatatan otomatis debit UJ `13101`, dan estafet UJ (*UJ Rollover*) saat breakdown (Skenario 3).
    * [x] `SpjExpensesService`: Validasi nota fisik & odometer.
    * [x] `SpjRevenueService`: Penegakan prinsip Anti-Netting kas bruto.
    * [x] `CrewMealPaymentsService`: Snapshotting kompensasi kru, sync penugasan, dan early payout mid-trip (Skenario 2).
  * [x] **Controllers & Endpoints**:
    * [x] `SpjFinanceController`: Endpoint pencairan UJ, pengajuan tambahan UJ, input biaya SPJ, deklarasi penerimaan tiket/kargo, dan early payout.
  * [x] **Database Migration & Seeder**:
    * [x] Migrasi `1781700000000-create-spj-uj-expenses-and-revenue.ts` dan seeder riil Skenario 1 & 2 `1888888888894-SeedSpjFinanceData.ts`.
  * [x] **Automated Tests**:
    * [x] Unit test multi-line disbursement, UJ rollover, fuel expense odometer validation, komisi dinamis kargo 20%, dan early transfer (121/121 passing).
* [x] **Frontend Implementation (`ss-travel-frontend`)**:
  * [x] **API Service Clients (`src/services/`)**:
    * [x] `spj-finance.service.ts`: Panggilan API UJ, expenses, revenue declarations, dan crew meal payments tanpa leading slash.
  * [x] **Pages & Components (`src/pages/`)**:
    * [x] Modal **Keuangan & UJ SPJ (`SpjFinanceModal`)**:
      * [x] Tab 1: **Uang Jalan (UJ)**: 4 kartu metrik saldo amplop UJ (Total Dicairkan, Terpakai di Jalan, Dikembalikan Kasir, Sisa Saldo UJ), riwayat pencairan multi-line, riwayat pengembalian fisik, form pengajuan tambahan UJ, dan estafet rollover UJ saat breakdown di tol (Skenario 3).
      * [x] Tab 2: **Biaya Operasional SPJ**: Rincian nota BBM solar (liter + odometer KM + SPBU), tol, parkir, retribusi, servis makan, serta verifikasi kasir.
      * [x] Tab 3: **Deklarasi Penerimaan Kas Kru (Anti-Netting)**: Input tiket tunai langsung naik pool dan resi kargo (pilihan kargo motor vs kardus + slider/preset persentase komisi kru 20%).
      * [x] Tab 4: **Hak Kompensasi Kru & Early Payout**: Daftar hak uang makan, premi ritase, bonus full seat, komisi kargo, serta tombol pencairan nafkah premi di jalan via transfer bank (Skenario 2).
    * [x] Integrasi tombol aksi cepat `[💰 Keuangan & UJ]` pada setiap baris tabel dokumen SPJ (`/spjs`) dan modal detail SPJ.

---

### 📌 Tahap 7: Meja Kasir Pool, Settlement Kas Kru, & Resolusi Selisih (BE + FE) (Completed)
* [x] **Backend Implementation (`ss-travel-backend`)**:
  * [x] **Models & Entities (`src/@models/`)**:
    * [x] `crew_cash_settlements`, `crew_cash_remittances`, `crew_cash_remittance_allocations`, `crew_cash_discrepancies`.
  * [x] **Services & Domain Logic**:
    * [x] `CashierSettlementService`: Gerbang validasi UJ=BALANCED & Revenue=MATCHED/DISCREPANCY_RECORDED, alur musyawarah kru (Lapis 1) vs pencatatan sistemik (Lapis 2), otorisasi FM dispensasi `58101` vs klaim kru `12901`, penampung neraca `11999` (tutup buku unblocked), dan pengiriman instruksi posting jurnal rekonsiliasi SPJ ke `AccountingPostingService` (menutup saldo UJ `13101` menjadi Rp 0).
    * [x] `CashierDiscrepancyService`: Investigasi selisih kasir, pencatatan kronologi telematika GPS, otorisasi putusan FM (`COMPANY_WAIVER`, `CHARGE_TO_CREW`, `ALLOCATION_CORRECTION`), dan posting jurnal penyesuaian selisih otomatis.
  * [x] **Controllers & Endpoints**:
    * [x] Endpoint meja kasir pool: `GET /api/v1/cashier/pending-spjs`, `GET /api/v1/cashier/settlements`, `GET /api/v1/cashier/spjs/:spjId/summary`, `POST /api/v1/cashier/settlements`, `POST /api/v1/cashier/settlements/:id/unblock-period-closing`.
    * [x] Endpoint resolusi selisih: `GET /api/v1/cashier/discrepancies`, `GET /api/v1/cashier/discrepancies/:id`, `POST /api/v1/cashier/discrepancies`, `PUT /api/v1/cashier/discrepancies/:id/resolve`.
  * [x] **Database Migration & Seeder**:
    * [x] Migrasi `1781800000000-create-crew-cash-settlements-and-discrepancies.ts`.
    * [x] Seeder data riil Skenario 1 (AKAP normal seimbang) & Skenario 4 (nota BBM darurat Palimanan hilang Rp 300rb dalam investigasi FM) `1888888888895-SeedCashierSettlementData.ts`.
  * [x] **Automated Tests**:
    * [x] Unit test simulasi Skenario 1 (normal imbang BKM & BKK Rp 1.7jt), Skenario 4 (selisih nota hilang Rp 300rb & dispensasi FM akun 58101), klaim kru akun 12901, serta unblock tutup buku via akun 11999 (129/129 passing 100%).
* [x] **Frontend Implementation (`ss-travel-frontend`)**:
  * [x] **API Service Clients (`src/services/`)**:
    * [x] `cashier.service.ts`: Panggilan API meja kasir pool & resolusi selisih tanpa leading slash.
  * [x] **Pages & Components (`src/pages/`)**:
    * [x] Halaman **Meja Kasir Pool (`/cashier`)**: Antarmuka kasir pool saat bus tiba di garasi dengan 4 kartu metrik dan 3 Tab (SPJ Siap Rekonsiliasi, Riwayat Dokumen Settlement, dan Pusat Investigasi Selisih FM Hub).
    * [x] Modal **Rekonsiliasi Kasir Pool (`CashierSettlementModal`)**:
      * [x] Visualisasi **Dua Kantong Kas Kru (Anti-Netting)**:
        * Kantong 1: Pertanggungjawaban UJ (Plafon vs Nota vs Sisa Fisik Dikembalikan $\to$ Status UJ `BALANCED` vs `DISCREPANCY`).
        * Kantong 2: Setoran Bruto Penerimaan Tiket & Kargo (Target Manifes vs Uang Fisik Diserahkan $\to$ Status Setoran `MATCHED` vs `DISCREPANCY_RECORDED`).
      * [x] Mode **Musyawarah Kru di Meja Kasir (Lapis 1)**: Kalkulator patungan/talangan tunai kru di tempat untuk menggenapkan kekurangan kembalian kecil.
      * [x] Posisi fisik laci kasir pool (BKM masuk vs BKK hak kru dibayar di tempat vs net fisik kasir).
    * [x] Cetak **Bukti Kas Masuk (BKM) & Bukti Kas Keluar (BKK)** fisik kasir (`CashReceiptVoucherModal`): Format resmi voucher tanda terima PT SS Traveling Indonesia siap print.
    * [x] Modal **Resolusi Selisih Kasir & Investigasi (`DiscrepancyResolutionModal`)**: Layar otorisasi khusus Finance Manager untuk memeriksa kronologi telematika GPS dan memilih putusan (Dispensasi Perusahaan `58101` vs Klaim Gaji Kru `12901`).
    * [x] Modal **Pencatatan Selisih Sistemik Kasir (`CreateDiscrepancyModal`)**: Layar Lapis 2 Kasir untuk meneruskan perselisihan kas ke meja Finance Manager.

---

### 📌 Tahap 8: Modul Piutang (AR) & Utang (AP) (BE + FE) (Completed)
* [x] **Backend Implementation (`ss-travel-backend`)**:
  * [x] **Models & Entities (`src/@models/`)**:
    * [x] `ar_invoices`, `ar_invoice_lines`, `ar_receipts`, `ar_allocations`.
    * [x] `ap_invoices`, `ap_invoice_lines`, `ap_payments`, `ap_allocations`.
  * [x] **Services & Controllers**:
    * [x] `ApService`: Tagihan berkala servis makan restoran mitra (tarik SPJ belum ditagih, validasi kupon riil vs manifes `meal_pax_count`, anti-double bill, bebas beban kas kru), tagihan vendor bengkel/derek bus rusak (Skenario 3), dan pembayaran komisi agen.
    * [x] `ArService`: Siklus DP sewa wisata 30% (`24101`), pelunasan invoice 70%, AR OTA RedBus/Traveloka, dan pengakuan pendapatan sewa 100% saat SPJ completed.
  * [x] **Database Migration & Seeder**:
    * [x] Migrasi tabel AR/AP `1781900000000-create-ar-and-ap-invoices.ts`.
    * [x] Seeder data riil Skenario 1 (Tagihan RM Taman Selera Rp 1.050.000), Skenario 2 (DP 30% Rp 5.250.000 & Pelunasan AR 70% Rp 12.250.000), dan Skenario 3 (Tagihan Bengkel Cirebon Diesel Motor Rp 2.500.000) `1888888888896-SeedArAndApData.ts`.
  * [x] **Automated Tests**:
    * [x] Unit test siklus AR wisata (Skenario 2) dan tagihan servis makan AP berkala (Skenario 1) (136/136 tests passing 100%).
* [x] **Frontend Implementation (`ss-travel-frontend`)**:
  * [x] **API Service Clients (`src/services/`)**:
    * [x] `ar.service.ts`, `ap.service.ts`.
  * [x] **Pages & Components (`src/pages/`)**:
    * [x] Halaman **Tagihan Vendor / AP Invoices (`/ap-invoices`)**: 4 kartu metrik, filter status/tipe vendor/pencarian, daftar tagihan dan riwayat pembayaran, modal **`[+ Tagihan Servis Makan Restoran]`** dengan dialog **`[+ Tarik SPJ Belum Ditagih]`** anti-double billing, kupon riil vs manifes warning, modal **`[+ Tagihan Vendor Bengkel]`**, modal **`[Bayar Faktur AP]`** kas/bank, dan modal detail tagihan AP.
    * [x] Halaman **Piutang Usaha / AR Invoices (`/ar-invoices`)**: 4 kartu metrik piutang & DP, modal **`[+ Terima DP Sewa Wisata (30%)]`** (Skenario 2 akun `24101`), modal **`[+ Invoice Pelunasan Wisata (70%)]`** (Skenario 2 akun `12101`), modal **`[Pelunasan Piutang]`** bank/kas, dan modal detail invoice AR.
    * [x] Pendaftaran rute `/ap-invoices` dan `/ar-invoices` di `AppRouter`.

---

### 📌 Tahap 9: Laporan Finansial, Trip Profitability (Margin), & Tutup Buku (BE + FE) (Completed)
* [x] **Backend Implementation (`ss-travel-backend`)**:
  * [x] **Models & Entities (`src/@models/`)**:
    * [x] `period_close_checks`: Entitas audit checklist penutupan periode fiskal (`period_id`, `check_code`, `check_name`, `status`, `details`, `checked_at`, `checked_by`).
    * [x] `fiscal_periods.checklist_snapshot`: Kolom JSONB untuk snapshot permanen hasil checklist saat tutup buku.
    * [x] Migrasi TypeORM `1782000000000-create-period-closing-and-reports.ts`.
  * [x] **Services & Controllers**:
    * [x] `FinancialReportsService`: Buku Besar (GL) dengan opening & running balance, Neraca Saldo (Trial Balance) seimbang, Laporan Laba Rugi Komprehensif berjenjang (Gross Profit, Operating Profit, Net Income), dan Neraca Keuangan (Aset = Liabilitas + Ekuitas).
    * [x] `TripProfitabilityService`: Laporan Margin Kontribusi SPJ:
      * Tampilan per Bus (`vehicle_id`): Isolasi kinerja aset individual (defisit bus rusak `SS-01` vs margin bus pengganti `SS-03` pada Skenario 3).
      * Tampilan per Kelompok Perjalanan (`journey_group_id`): Konsolidasi 1 perjalanan ekonomi utuh yang menggabungkan parent SPJ dan child SPJ pengganti tanpa distorsi.
    * [x] `PeriodClosingService`: Checklist otomatis 6-poin tutup buku bulanan, kepatuhan Kemerdekaan Tutup Buku unblocked via akun penampung `11999` (Skenario 4), penguncian periode `CLOSED`, dan otorisasi `REOPEN`.
  * [x] **Automated Tests**:
    * [x] Unit test kalkulasi GL, neraca saldo, margin trip (By Bus vs Journey Group), dan checklist tutup buku (149/149 tests passing 100%).
* [x] **Frontend Implementation (`ss-travel-frontend`)**:
  * [x] **API Service Clients (`src/services/`)**:
    * [x] `report.service.ts`, `period-closing.service.ts`.
  * [x] **Pages & Components (`src/pages/`)**:
    * [x] Halaman **Laporan Profitabilitas Trip (`/reports/trip-profitability`)**: 4 kartu metrik live, toolbar filter rute & layanan, toggle sudut pandang (Per Bus vs Per Kelompok Perjalanan), tabel breakdown omzet vs biaya langsung vs margin (%), dan modal **Audit Detail Margin Trip (`TripProfitabilityDetailModal.tsx`)**.
    * [x] Halaman **Buku Besar & Neraca Saldo (`/reports/general-ledger`)**: 4 Tab navigasi terpadu (Buku Besar Akun COA, Neraca Saldo Trial Balance, Laba Rugi, dan Neraca Keuangan).
    * [x] Halaman **Tutup Buku Bulanan (`/period-closing`)**: Selector periode fiskal, status badge, kartu kesiapan Ready to Close vs Blocked, banner SOP akuntansi bus PT SS Traveling Official, grid 6-point checklist interaktif, modal konfirmasi **Kunci & Tutup Buku (`ClosePeriodModal.tsx`)**, dan modal otorisasi **Buka Kembali Periode (`ReopenPeriodModal.tsx`)**.
    * [x] Pendaftaran rute `/reports/trip-profitability`, `/reports/general-ledger`, dan `/period-closing` di `AppRouter`.

---

### 📌 Modul Kas Kecil Pool (Petty Cash) (BE + FE) (Completed)
* [x] **Backend Implementation (`ss-travel-backend`)**:
  * [x] **Models & Entities (`src/@models/`)**:
    * [x] `cash_transactions`: Entitas transaksi kas kecil pool (`transaction_no` format `BKK-KAS` & `BKM-KAS`, `cash_account_id`, `type`: `DISBURSEMENT` / `REPLENISHMENT`, `amount`, `recipient`, `expense_account_id`, `source_bank_account_id`, `source_cash_account_id`, `vehicle_id`, `cost_center_id`, `category`, `description`, `receipt_no`, `status`: `DRAFT`/`SUBMITTED`/`VERIFIED`/`REJECTED`, `journal_entry_id`).
    * [x] Enums: `CashTransactionType`, `CashTransactionStatus`, `PettyCashCategory` (`FACILITY_SNACK`, `STANDBY_CREW`, `DEADHEAD_INSENTIF`, `POOL_SUPPLIES`, `OVERTIME_MEKANIK`, `OFFICE_CONSUMPTION`, `OFFICE_TRAVEL`, `WORKSHOP_EMERGENCY`, `OTHER`).
    * [x] Migrasi `1782300000000-create-cash-transactions.ts` dengan seeder data riil kas kecil garasi (Replenishment Rp 10jt, snack kabin SS-01 Rp 350rb, uang makan standby driver Rp 150rb, insentif langsir SS-03 Rp 200rb, sabun cuci bus Rp 120rb, kopi piket lembur Rp 180rb).
  * [x] **Services & Controllers**:
    * [x] `PettyCashService`: Ringkasan saldo berjalan kas kecil, rekap pengeluaran bulanan, input BKK pengeluaran garasi, input BKM pengisian kembali (replenishment) dari bank/kas induk, verifikasi akuntan dengan posting jurnal otomatis ke GL (`postJournal`), penolakan (reject), dan pembatalan (delete).
    * [x] `PettyCashController`: REST endpoints `/api/v1/petty-cash` terproteksi RBAC `@RequirePermissions('PettyCash:...')`.
  * [x] **Automated Tests**:
    * [x] 8 unit tests di `petty-cash.service.spec.ts` (157/157 tests total passing 100%).
* [x] **Frontend Implementation (`ss-travel-frontend`)**:
  * [x] **API Service Client**: `PettyCashService` (`src/services/petty-cash.service.ts`).
  * [x] **Halaman Kas Kecil Pool (`/petty-cash`)**:
    * [x] 4 kartu metrik live (Sisa Saldo Kas Kecil, Pengeluaran Bulan Ini, Menunggu Verifikasi Akuntan, Aktivitas Hari Ini).
    * [x] Toolbar filter kas, kategori pengeluaran, status verifikasi, dan live search.
    * [x] Tabel mutasi kas kecil dengan badge kategori warna-warni, badge status, nominal, dan aksi cepat.
    * [x] Modal **Input Pengeluaran Kas Kecil BKK (`CreatePettyCashModal.tsx`)** dengan 8 tombol preset cepat SOP bus (Standby Driver 53105, Langsir 53106, Snack Onboard 52104, Cuci Bus 57102, Lembur Mekanik 57107, Kopi Piket 57108, Transport Dinas 57109, Sparepart 55102), selector armada bus, dan opsi langsung posting GL.
    * [x] Modal **Pengisian Kembali Kas Kecil BKM (`ReplenishPettyCashModal.tsx`)** dari Bank BCA atau Kas Induk Pool.
    * [x] Modal **Detail & Cetak Voucher Resmi Kasir BKK/BKM (`PettyCashDetailModal.tsx`)** dengan preview jurnal GL terposting dan slip tanda terima resmi siap print.
    * [x] Pendaftaran rute `/petty-cash` di `AppRouter`.

---

### 📌 Tahap 10: E2E Simulation Testing & System Polish (Final Verification)
* [ ] **Simulasi End-to-End Penuh di Browser**:
  * [ ] **Simulasi Skenario 1**: Penerbitan Jadwal & SPJ AKAP PP Bus SS-01 $\to$ Pencairan UJ Rp 3.5jt $\to$ Penjualan Tiket Bruto & Kargo Motor Komisi 20% $\to$ Rekonsiliasi Kasir Pool (Kantong UJ Balanced Rp 0 + Kantong Setoran Matched) $\to$ Posting Jurnal SPJ Rp 16.68jt $\to$ Penagihan AP Servis Makan RM Taman Selera Subang $\to$ Cek Laporan Margin Trip (+Rp 6.57jt).
  * [ ] **Simulasi Skenario 2**: Booking Sewa Wisata 5 Hari PT Mitra Sejahtera $\to$ DP 30% Rp 5.25jt $\to$ Penerbitan SPJ Wisata $\to$ Pencairan UJ Rp 6jt $\to$ Tambahan UJ Bank Rp 1jt $\to$ Early Payout Premi di Jalan Rp 800rb $\to$ Pelunasan AR 70% Rp 12.25jt $\to$ Settlement Kasir Pool $\to$ Pengakuan Pendapatan Accrual Rp 17.5jt & Jurnal Rp 27.075jt $\to$ Pembayaran Cashback Rekanan B2B Wisata Rp 300rb.
  * [ ] **Simulasi Skenario 3**: AKAP Berangkat Bus SS-01 Mogok di KM 214 Tol Cipali $\to$ Penerbitan SPJ Pengganti Bus SS-03 (`parent_spj_id`) $\to$ UJ Rollover Rp 2jt $\to$ Derek Tol & Tagihan Bengkel Cirebon ke Bus SS-01 $\to$ Tiba di Yogya & Settlement $\to$ Cek Laporan Laba Rugi Ganda (Defisit SS-01 -Rp 5.5jt vs Margin SS-03 +Rp 4.215jt vs Margin Gabungan Perjalanan +Rp 2.715jt).
  * [ ] **Simulasi Skenario 4**: SPJ Tiba di Kasir Pool $\to$ Kasus 1: Selisih Tiket Kurang Rp 200rb selesai via Musyawarah Kru di Meja Kasir (Status Matched) $\to$ Kasus 2: Struk BBM Hilang Rp 300rb dicatat transparan di `crew_cash_discrepancies` (`financial_status = DISCREPANCY`) $\to$ Investigasi GPS $\to$ Otorisasi FM Dispensasi Perusahaan `58101` $\to$ Jurnal SPJ Seimbang Rp 11.86jt $\to$ Eksekusi Tutup Buku Bulanan Unblocked via akun `11999`.
* [ ] **Final System Polish**:
  * [ ] Pemeriksaan keamanan, sanitize input, dan audit logging.
  * [ ] Backend build & frontend build 100% bebas warning/error.
  * [ ] Dokumentasi user manual lengkap.
