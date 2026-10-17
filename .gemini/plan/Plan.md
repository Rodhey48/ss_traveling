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

### 📌 Tahap 4: Accounting Core Engine & Jurnal Umum (BE + FE)
* [ ] **Backend Implementation (`ss-travel-backend`)**:
  * [ ] **Models & Entities (`src/@models/`)**:
    * [ ] `journal_entries`, `journal_lines`, `accounting_events`.
  * [ ] **DTOs & Validations**:
    * [ ] `CreateManualJournalDto`, `JournalLineInputDto`, `ReverseJournalDto`, `JournalFilterQueryDto`.
  * [ ] **Services & Domain Logic**:
    * [ ] `AccountingPostingService`: Posting satu pintu via `DataSource.transaction()`, row lock, validasi akun postable & aktif, validasi periode terbuka, validasi debet=kredit dengan `MoneyHelper.isBalanced()`, dan proteksi idempotency key.
    * [ ] `JournalReversalService`: Pembuatan jurnal pembalik (*reversal*) otomatis tanpa edit/hapus jurnal lama.
  * [ ] **Controllers & REST Endpoints**:
    * [ ] `GET` `/api/v1/journals`, `GET` `/api/v1/journals/:id`
    * [ ] `POST` `/api/v1/journals/manual` (pembuatan jurnal memorial berizin khusus)
    * [ ] `POST` `/api/v1/journals/:id/reverse` (eksekusi reversal jurnal)
  * [ ] **Automated Tests**:
    * [ ] Unit test posting jurnal seimbang, penolakan jurnal tak seimbang, proteksi periode closed, dan reversal.
* [ ] **Frontend Implementation (`ss-travel-frontend`)**:
  * [ ] **API Service Clients (`src/services/`)**:
    * [ ] `journal.service.ts`: Panggilan API `/api/v1/journals`.
  * [ ] **Pages & Components (`src/pages/`)**:
    * [ ] Halaman **Daftar Jurnal Umum (`/journals`)**: Tabel jurnal terposting, filter rentang tanggal, filter akun, filter dimensi (SPJ/Bus), dan modal detail rincian baris debet-kredit.
    * [ ] Modal **Entri Jurnal Memorial (`/journals/create`)**: Form pembuatan jurnal multi-line dengan kalkulator live debet-kredit balance indicator.
    * [ ] Aksi **Reversal Jurnal**: Tombol reversal dengan dialog konfirmasi alasan pembatalan.

---

### 📌 Tahap 5: Perencanaan Jadwal Bus & Eksekusi SPJ (BE + FE)
* [ ] **Backend Implementation (`ss-travel-backend`)**:
  * [ ] **Models & Entities (`src/@models/`)**:
    * [ ] `trip_schedules`: Dokumen rencana jadwal dinas bus (`schedule_no`, `service_type`, `vehicle_id`, `planned_departure_at`, `planned_return_at`, `origin`, `destination`, `customer_id`, `pic_name`, `pic_phone`, `pickup_notes`, `planned_driver_1_id`, `planned_driver_2_id`, `planned_conductor_id`, `status`, `spj_id`).
    * [ ] `spjs`: Dokumen Surat Perintah Jalan (`spj_no`, `service_type`, `parent_spj_id`, `operational_status`, `financial_status`).
    * [ ] `spj_legs`, `spj_crew_assignments`.
  * [ ] **Services & Domain Logic**:
    * [ ] `TripSchedulesService`: Generator nomor jadwal, validasi anti-bentrok armada & kru (*Overlap Conflict*), peringatan buffer rest time (minimal 3 jam), auto-link customer/lead wisata, dan aksi 1-klik *Generate SPJ*.
    * [ ] `SpjService`: State machine status operasional SPJ (`DRAFT` $\to$ `ISSUED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED`), validasi kapasitas kursi, validasi minimal 1 Driver, snapshot rate hak kru, dan penautan darurat `parent_spj_id` (Skenario 3).
  * [ ] **Controllers & REST Endpoints**:
    * [ ] `GET/POST/PUT` `/api/v1/trip-schedules`, `/api/v1/trip-schedules/calendar`
    * [ ] `POST` `/api/v1/trip-schedules/:id/confirm`, `/api/v1/trip-schedules/:id/generate-spj`
    * [ ] `GET/POST` `/api/v1/spjs`, `/api/v1/spjs/:id/start`, `/api/v1/spjs/:id/complete`, `/api/v1/spjs/:id/replace-crew`
  * [ ] **Automated Tests**:
    * [ ] Unit test deteksi bentrok jadwal bus & kru, buffer time alert, dan transisi lifecycle SPJ.
* [ ] **Frontend Implementation (`ss-travel-frontend`)**:
  * [ ] **API Service Clients (`src/services/`)**:
    * [ ] `trip-schedule.service.ts`, `spj.service.ts`.
  * [ ] **Pages & Components (`src/pages/`)**:
    * [ ] Halaman **Jadwal & Plotting Armada (`/schedules`)**: Visualisasi **Kalender Timeline Armada (Gantt Chart)** per bus `SS-01` s.d. `SS-10`, indikator warna status, peringatan jadwal bentrok / sisa istirahat mepet.
    * [ ] Form **Booking Jadwal Wisata & AKAP Mingguan**: Input bus, kru, titik jemput/drop, dan pencarian instan nama/nomor WA penyewa (CRM auto-complete).
    * [ ] Halaman **Operasional SPJ Dispatcher (`/spjs`)**: Monitoring bus aktif di jalan, tombol aksi 1-klik terbitkan SPJ dari jadwal, tombol keberangkatan (`IN_PROGRESS`), kepulangan (`COMPLETED`), dan pergantian kru darurat.

---

### 📌 Tahap 6: Uang Jalan (UJ), Biaya SPJ, & Deklarasi Penerimaan (BE + FE)
* [ ] **Backend Implementation (`ss-travel-backend`)**:
  * [ ] **Models & Entities (`src/@models/`)**:
    * [ ] `spj_expenses` (BBM solar + liter + odometer, tol, parkir, retribusi).
    * [ ] `spj_uj`, `spj_uj_disbursements` (multi-line), `spj_uj_expenses`, `spj_uj_returns`, `spj_uj_additional_requests`.
    * [ ] `spj_revenue_declarations` (tiket tunai, kargo motor, kargo kardus dengan komisi dinamis kru 20%).
    * [ ] `crew_meal_payments` (hak makan, premi, bonus full seat, komisi kargo).
  * [ ] **Services & Domain Logic**:
    * [ ] `SpjUjService`: Multi-line disbursement, pencatatan otomatis debit UJ `13101`, dan estafet UJ (*UJ Rollover*) saat breakdown (Skenario 3).
    * [ ] `SpjExpensesService`: Validasi nota fisik & odometer.
    * [ ] `SpjRevenueService`: Penegakan prinsip Anti-Netting kas bruto.
  * [ ] **Controllers & Endpoints**:
    * [ ] Endpoint pencairan UJ, pengajuan tambahan UJ, input biaya SPJ, dan deklarasi penerimaan tiket/kargo.
  * [ ] **Automated Tests**:
    * [ ] Unit test multi-line disbursement, UJ rollover, dan komisi dinamis kargo.
* [ ] **Frontend Implementation (`ss-travel-frontend`)**:
  * [ ] **API Service Clients (`src/services/`)**:
    * [ ] `spj-finance.service.ts`: Panggilan API UJ, expenses, dan revenue declarations.
  * [ ] **Pages & Components (`src/pages/`)**:
    * [ ] Tab **Uang Jalan & Pengeluaran SPJ (`/spjs/:id/finance`)**: Form pencairan UJ bertahap (kasir/bank), rincian nota BBM (liter + foto odometer), tol, dan fasilitas perjalanan.
    * [ ] Form **Deklarasi Penerimaan Kas Kru**: Form input tiket langsung naik pool dan resi kargo (pilihan kargo motor vs kardus + slider/preset persentase komisi kru 20%).
    * [ ] Modal **Pencairan Nafkah Premi di Jalan (*Early Payout*)**: Form transfer uang keluarga kru di tengah tour wisata (Skenario 2).

---

### 📌 Tahap 7: Meja Kasir Pool, Settlement Kas Kru, & Resolusi Selisih (BE + FE)
* [ ] **Backend Implementation (`ss-travel-backend`)**:
  * [ ] **Models & Entities (`src/@models/`)**:
    * [ ] `crew_cash_settlements`, `crew_cash_remittances`, `crew_cash_remittance_allocations`, `crew_cash_discrepancies`.
  * [ ] **Services & Domain Logic**:
    * [ ] `CashierSettlementService`: Gerbang validasi UJ=BALANCED & Revenue=MATCHED/DISCREPANCY_RECORDED, alur musyawarah kru (Lapis 1) vs pencatatan sistemik (Lapis 2), otorisasi FM dispensasi `58101` vs klaim kru `12901`, penampung neraca `11999` (tutup buku unblocked), dan pengiriman instruksi posting jurnal rekonsiliasi SPJ ke `AccountingPostingService` (menutup saldo UJ `13101` menjadi Rp 0).
  * [ ] **Controllers & Endpoints**:
    * [ ] Endpoint meja kasir pool, verifikasi settlement, dan resolusi keputusan selisih Finance Manager.
  * [ ] **Automated Tests**:
    * [ ] Unit test simulasi Skenario 1 (normal imbang Rp 16.68jt) dan Skenario 4 (selisih nota hilang & dispensasi FM Rp 11.86jt).
* [ ] **Frontend Implementation (`ss-travel-frontend`)**:
  * [ ] **API Service Clients (`src/services/`)**:
    * [ ] `cashier.service.ts`: Panggilan API meja kasir pool & resolusi selisih.
  * [ ] **Pages & Components (`src/pages/`)**:
    * [ ] Halaman **Meja Kasir Pool (`/cashier`)**: Antarmuka kasir pool saat bus tiba di garasi.
    * [ ] Widget **Dua Kantong Kas Kru (Anti-Netting)**:
      * Kantong 1: Pertanggungjawaban UJ (Plafon vs Nota vs Sisa Fisik Dikembalikan $\to$ Status UJ).
      * Kantong 2: Setoran Bruto Penerimaan Tiket & Kargo (Target Manifes vs Uang Fisik Diserahkan $\to$ Status Setoran).
    * [ ] Cetak **Bukti Kas Masuk (BKM) & Bukti Kas Keluar (BKK)** fisik kasir.
    * [ ] Modal **Resolusi Selisih Kasir & Investigasi**: Layar otorisasi khusus Finance Manager untuk memeriksa data GPS dan memilih putusan (Dispensasi Perusahaan vs Klaim Gaji Kru).

---

### 📌 Tahap 8: Modul Piutang (AR) & Utang (AP) (BE + FE)
* [ ] **Backend Implementation (`ss-travel-backend`)**:
  * [ ] **Models & Entities (`src/@models/`)**:
    * [ ] `ar_invoices`, `ar_invoice_lines`, `ar_receipts`, `ar_allocations`.
    * [ ] `ap_invoices`, `ap_invoice_lines`, `ap_payments`, `ap_allocations`.
  * [ ] **Services & Controllers**:
    * [ ] `ApService`: Tagihan berkala servis makan restoran mitra (tarik SPJ belum ditagih, validasi kupon riil vs manifes `meal_pax_count`, anti-double bill, bebas beban kas kru), tagihan vendor bengkel/derek bus rusak (Skenario 3), dan pembayaran komisi agen.
    * [ ] `ArService`: Siklus DP sewa wisata 30% (`24101`), pelunasan invoice 70%, AR OTA RedBus/Traveloka, dan pengakuan pendapatan sewa 100% saat SPJ completed.
  * [ ] **Automated Tests**:
    * [ ] Unit test siklus AR wisata (Skenario 2) dan tagihan servis makan AP berkala (Skenario 1).
* [ ] **Frontend Implementation (`ss-travel-frontend`)**:
  * [ ] **API Service Clients (`src/services/`)**:
    * [ ] `ar.service.ts`, `ap.service.ts`.
  * [ ] **Pages & Components (`src/pages/`)**:
    * [ ] Halaman **Tagihan Vendor / AP Invoices (`/ap-invoices`)**: Daftar tagihan rekanan, form tagihan baru dengan fitur khusus modal **`[+ Tarik SPJ Belum Ditagih]`** untuk restoran mitra, input kupon riil, serta peringatan otomatis jika melebihi manifes.
    * [ ] Halaman **Piutang Usaha / AR Invoices (`/ar-invoices`)**: Penerbitan invoice kontrak sewa wisata, invoice pelunasan, dan pencatatan penerimaan mutasi bank (alokasi pelunasan invoice).
    * [ ] Dialog **Pembayaran Komisi Agen & Cashback Wisata B2B**: Eksekusi transfer bank atas hak agen dan mitra sewa bus.

---

### 📌 Tahap 9: Laporan Finansial, Trip Profitability (Margin), & Tutup Buku (BE + FE)
* [ ] **Backend Implementation (`ss-travel-backend`)**:
  * [ ] **Services & Controllers**:
    * [ ] `FinancialReportsService`: Buku Besar (GL) & Neraca Saldo (Trial Balance) bersumber murni dari baris jurnal `POSTED`, Laporan Laba Rugi, dan Neraca.
    * [ ] `TripProfitabilityService`: Laporan Margin Kontribusi SPJ:
      * Tampilan per Bus (`vehicle_id`): Isolasi kinerja aset individual (defisit bus rusak `SS-01` vs margin bus pengganti `SS-03` pada Skenario 3).
      * Tampilan per Kelompok Perjalanan (`journey_group_id`): Konsolidasi 1 perjalanan ekonomi utuh.
    * [ ] `PeriodClosingService`: Checklist otomatis tutup buku bulanan, pengalihan selisih `11999`, penguncian periode `CLOSED`, dan otorisasi `REOPEN`.
  * [ ] **Automated Tests**:
    * [ ] Unit test kalkulasi GL, neraca saldo, margin trip, dan proteksi periode closed.
* [ ] **Frontend Implementation (`ss-travel-frontend`)**:
  * [ ] **API Service Clients (`src/services/`)**:
    * [ ] `report.service.ts`.
  * [ ] **Pages & Components (`src/pages/`)**:
    * [ ] Halaman **Laporan Profitabilitas Trip (`/reports/trip-profitability`)**: Kartu ringkasan margin perjalanan bus, filter per nomor SPJ / rute / armada, tabel breakdown pendapatan vs beban langsung armada vs hak kru vs servis makan, serta toggle sudut pandang (Per Bus vs Per Kelompok Perjalanan).
    * [ ] Halaman **Buku Besar & Neraca Saldo (`/reports/general-ledger`)**: Penelusuran mutasi per akun COA dengan drill-down langsung ke dokumen sumber.
    * [ ] Halaman **Tutup Buku Bulanan (`/period-closing`)**: Wizard checklist penutupan buku (status jurnal balance, kasir tuntas, rekonsiliasi kas/bank, daftar SPJ berselisih di akun `11999`), tombol eksekusi *Kunci Periode*, dan otorisasi *Buka Kembali Periode*.

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
