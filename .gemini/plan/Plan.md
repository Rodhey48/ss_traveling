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

## Phase 3: Core Implementation (Detailed 10-Stage Execution Roadmap)

Setiap tahap di bawah ini mencakup siklus pengembangan penuh: **Model & Skema, DTO & Validasi, Service & Logika Bisnis, Controller & REST Endpoints, serta Pengujian (Unit Tests & Seeder)**.

---

### 📌 Tahap 1: Master Organisasi, Dimensi, Armada Bus, & Pelanggan / CRM Leads
* [ ] **Models & Entities (`src/@models/`)**:
  * [ ] `companies`: Entitas hukum PT SS Traveling (`code`, `name`, `currency`, `timezone`).
  * [ ] `business_units`: Unit usaha operasional (`AKAP`, `PARIWISATA`, `SHUTTLE`).
  * [ ] `cost_centers`: Tempat terjadinya biaya (`Pool Ciputat`, `Bengkel Garasi`, `Kantor Pusat`).
  * [ ] `profit_centers`: Unit analisis pendapatan per lini bisnis.
  * [ ] `vehicles`: Data fisik armada bus (`code`/nomor lambung, `nickname`, `plate_number`, `vehicle_type`, `capacity`, `isActive`).
  * [ ] `vehicle_seat_classes`: Konfigurasi multi-class kursi per bus (*Sleeper*, *Luxury 2-1*, *Executive*) sebagai batas fisik (*hard ceiling*) manifes.
  * [ ] `customers`: Master pelanggan & database CRM leads penyewa wisata (`code`, `customer_type: CORPORATE/SCHOOL/TRAVEL_AGENT/COMMUNITY/INDIVIDUAL`, `institution_name`, `pic_name`, `phone`, `email`, `address`, `city`, `lead_source`, `customer_tier`, `last_trip_date`, `total_trips_count`, `special_notes`, `isActive`).
* [ ] **DTOs & Validations (`src/@dto/`)**:
  * [ ] `CreateCompanyDto`, `UpdateCompanyDto`
  * [ ] `CreateBusinessUnitDto`, `UpdateBusinessUnitDto`
  * [ ] `CreateCostCenterDto`, `UpdateCostCenterDto`
  * [ ] `CreateProfitCenterDto`, `UpdateProfitCenterDto`
  * [ ] `CreateVehicleDto`, `UpdateVehicleDto`, `VehicleQueryFilterDto`
  * [ ] `CreateVehicleSeatClassDto`, `UpdateVehicleSeatClassDto`
  * [ ] `CreateCustomerDto`, `UpdateCustomerDto`, `CustomerQueryFilterDto`
* [ ] **Services & Domain Logic (`src/modules/`)**:
  * [ ] `OrganizationService`: Pengelolaan unit bisnis, hierarki cost center, dan profit center.
  * [ ] `VehiclesService`: Validasi nopol & kode lambung unik, pendaftaran multi-class kursi, kalkulasi kapasitas fisik total bus.
  * [ ] `CustomersService`: Pengelolaan database prospek/leads, pencarian autocomplete nama/telepon, auto-update riwayat trip dan frekuensi sewa.
* [ ] **Controllers & REST Endpoints (`src/modules/`)**:
  * [ ] `GET/POST/PUT` `/api/v1/companies`
  * [ ] `GET/POST/PUT` `/api/v1/business-units`
  * [ ] `GET/POST/PUT` `/api/v1/cost-centers`
  * [ ] `GET/POST/PUT` `/api/v1/profit-centers`
  * [ ] `GET/POST/PUT/DELETE` `/api/v1/vehicles` (dengan filter paginasi & Swagger docs)
  * [ ] `GET/POST/PUT` `/api/v1/vehicles/:id/seat-classes`
  * [ ] `GET/POST/PUT/DELETE` `/api/v1/customers` (manajemen pelanggan & CRM filter leads)
* [ ] **Database Seeder & Migration**:
  * [ ] Migration skema tabel organisasi, armada, dan pelanggan/leads.
  * [ ] Seeder: PT SS Traveling, Unit AKAP & Wisata, Cost Centers (Ciputat, Bengkel, Kantor).
  * [ ] Seeder: 10 Unit Bus Existing SS Traveling (7 lunas, 3 cicilan leasing sesuai Addendum v1.13) lengkap dengan kursi Sleeper & Luxury 2-1.
  * [ ] Seeder: Data awal pelanggan B2B (misal: PT Mitra Sejahtera Abadi, SMA 1 Tangerang).
* [ ] **Automated Tests**:
  * [ ] Unit test `VehiclesService` (validasi kapasitas multi-class, nopol duplikat).
  * [ ] Unit test `CustomersService` (pencarian lead, update last trip).
  * [ ] Unit test `OrganizationService`.

---

### 📌 Tahap 2: Master Keuangan, Hierarki COA (Kelompok 1-8), & Kas/Bank
* [ ] **Models & Entities (`src/@models/`)**:
  * [ ] `accounts`: Chart of Accounts (COA) hierarkis (parent-child, code unik, `type`: ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE, `normal_balance`: DEBIT/CREDIT, `is_postable`, `is_active`).
  * [ ] `cash_accounts`: Kas fisik (`Kas Operasional Pool Ciputat`, `Kas Cabang Yogya`, `Kas Kecil Petty Cash`).
  * [ ] `bank_accounts`: Rekening bank korporat (`Bank BCA Operasional`, `Bank Mandiri`).
  * [ ] `fiscal_years` & `fiscal_periods`: Pengendalian kalender akuntansi bulanan (`OPEN`, `CLOSING`, `CLOSED`).
  * [ ] `document_sequences`: Generator nomor dokumen anti-tabrakan berbasis row lock (`SPJ/AKP/YYMM/XXXX`, `SPJ/WIS/YYMM/XXXX`, `BKM`, `BKK`, `JV`).
* [ ] **DTOs & Validations (`src/@dto/`)**:
  * [ ] `CreateAccountDto`, `UpdateAccountDto`, `AccountQueryFilterDto`
  * [ ] `CreateCashAccountDto`, `UpdateCashAccountDto`
  * [ ] `CreateBankAccountDto`, `UpdateBankAccountDto`
  * [ ] `CreateFiscalYearDto`, `CreateFiscalPeriodDto`
* [ ] **Services & Domain Logic**:
  * [ ] `AccountsService`: Validasi parent-child akun, pencegahan circular relation, penguncian akun header agar tidak bisa dijurnal (`is_postable=false`).
  * [ ] `CashBankAccountsService`: Pengelolaan rekening korporat dan kasir pool penanggung jawab.
  * [ ] `FiscalPeriodsService`: Validasi periode aktif dan pencegahan overlap tanggal periode.
  * [ ] `DocumentSequenceService`: Algoritma penomoran transaksi concurrency-safe dengan pessimistic row lock.
* [ ] **Controllers & REST Endpoints**:
  * [ ] `GET/POST/PUT` `/api/v1/accounts` (dukungan kueri hierarki tree COA)
  * [ ] `GET/POST/PUT` `/api/v1/cash-accounts`
  * [ ] `GET/POST/PUT` `/api/v1/bank-accounts`
  * [ ] `GET/POST/PUT` `/api/v1/fiscal-periods`
* [ ] **Database Seeder & Migration**:
  * [ ] Migration skema tabel COA, kas/bank, dan periode fiskal.
  * [ ] Seeder: COA Standar Lengkap Perusahaan Bus (Akun 11101 s.d. 82101 sesuai Blueprint Bab 6.2).
  * [ ] Seeder: Kas Pool Ciputat, Cabang Yogya, Kas Kecil, Bank BCA, serta Kalender Fiskal Aktif Tahun Berjalan.
* [ ] **Automated Tests**:
  * [ ] Unit test `AccountsService` (tree COA, postable validation).
  * [ ] Unit test `DocumentSequenceService` (uji konkurensi penomoran dokumen).

---

### 📌 Tahap 3: Master Aturan Bisnis & Tarif Lapangan
* [ ] **Models & Entities (`src/@models/`)**:
  * [ ] `fare_seasons`: Kalender musim tarif (`REGULER`, `TUSLAH_LEBARAN`, `LIBURAN_SEKOLAH`).
  * [ ] `fare_matrix`: Matriks tarif dasar berversi (origin, destination, seat_class, amount, effective_date).
  * [ ] `agents`: Master agen tiket offline loket terminal vs online OTA (RedBus, Traveloka) dengan filter kota (`JAKARTA`, `YOGYAKARTA`, `ALL`) dan cara penyelesaian kas.
  * [ ] `agent_commission_rules`: Aturan komisi agen per kelas kursi (flat per pax atau persentase).
  * [ ] `crew_rate_rules`: Standar uang makan (`meal_allowance`), premi ritase (`trip_incentive`), dan bonus full seat (`full_seat_bonus`) per peran kru (`DRIVER`, `CO_DRIVER`, `CONDUCTOR`) dengan tipe AKAP (`PER_TRIP`) vs Wisata (`PER_DAY`).
  * [ ] `restaurants`: Master rumah makan mitra servis makan AKAP (tarif per pax, metode penyelesaian AP bulanan vs UJ).
  * [ ] `coordinator_fee_rules`: Aturan fee koordinator wilayah Barat & Timur (default Rp10.000/pax).
* [ ] **DTOs & Validations (`src/@dto/`)**:
  * [ ] `CreateFareSeasonDto`, `CreateFareMatrixDto`
  * [ ] `CreateAgentDto`, `CreateAgentCommissionRuleDto`
  * [ ] `CreateCrewRateRuleDto`, `UpdateCrewRateRuleDto`
  * [ ] `CreateRestaurantDto`, `UpdateRestaurantDto`
  * [ ] `CreateCoordinatorFeeRuleDto`
* [ ] **Services & Domain Logic**:
  * [ ] `FareMatrixService`: Kalkulasi tarif tiket dinamis sesuai tanggal keberangkatan dan kelas kursi.
  * [ ] `AgentsService`: Smart filter agen sesuai arah leg rute perjalanan (Jakarta vs Yogya) untuk mencegah salah input manifes.
  * [ ] `CrewRatesService`: Aturan rate snapshotting hak kru ke SPJ.
  * [ ] `RestaurantsService` & `CoordinatorFeeService`.
* [ ] **Controllers & REST Endpoints**:
  * [ ] `GET/POST/PUT` `/api/v1/fare-seasons`, `/api/v1/fare-matrix`
  * [ ] `GET/POST/PUT` `/api/v1/agents`, `/api/v1/agents/:id/commission-rules`
  * [ ] `GET/POST/PUT` `/api/v1/crew-rate-rules`
  * [ ] `GET/POST/PUT` `/api/v1/restaurants`
  * [ ] `GET/POST/PUT` `/api/v1/coordinator-fee-rules`
* [ ] **Database Seeder & Migration**:
  * [ ] Migration skema aturan tarif, agen, kompensasi kru, dan restoran.
  * [ ] Seeder: Matriks 10 Role Standar SS Traveling (Addendum v1.11) pada tabel `roles`.
  * [ ] Seeder: Matriks tarif awal Jakarta-Yogya, aturan komisi agen loket vs OTA, rate kompensasi kru, dan RM Taman Selera.
* [ ] **Automated Tests**:
  * [ ] Unit test `FareMatrixService` (penentuan tarif musiman & snapshotting).
  * [ ] Unit test `AgentsService` (filter arah rute).

---

### 📌 Tahap 4: Accounting Core Engine (Jantung ERP)
* [ ] **Models & Entities (`src/@models/`)**:
  * [ ] `journal_entries`: Header jurnal umum (`journal_no`, `journal_date`, `period_id`, `source_type`, `source_id`, `status: POSTED`, `reversal_of_id`).
  * [ ] `journal_lines`: Baris debet & kredit dengan dimensi lengkap (`account_id`, `debit`, `credit`, `business_unit_id`, `cost_center_id`, `profit_center_id`, `spj_id`, `vehicle_id`, `counterparty_type`, `counterparty_id`).
  * [ ] `accounting_events`: Jejak idempotensi transaksi posting (`source_type`, `source_id`, `event_type`, `idempotency_key`, `journal_entry_id`).
* [ ] **DTOs & Validations (`src/@dto/`)**:
  * [ ] `CreateManualJournalDto`, `JournalLineInputDto`
  * [ ] `ReverseJournalDto`
  * [ ] `JournalFilterQueryDto` (filter nomor jurnal, rentang tanggal, akun, dimensi trip/bus)
* [ ] **Services & Domain Logic**:
  * [ ] `AccountingPostingService`: Satu-satunya pintu pembuatan jurnal:
    * Eksekusi transaksi atomik via `DataSource.transaction()`.
    * Row lock dokumen sumber.
    * Validasi akun aktif & `is_postable = true`.
    * Validasi tanggal berada dalam periode akuntansi yang `OPEN`.
    * Validasi keseimbangan mutlak Total Debet = Total Kredit menggunakan `MoneyHelper.isBalanced()`.
    * Validasi idempotency key untuk mencegah posting ganda dari API/jaringan.
  * [ ] `JournalReversalService`: Mekanisme pembatalan jurnal posted melalui pembuatan jurnal pembalik (*reversal*) otomatis dengan referensi `reversal_of_id`.
* [ ] **Controllers & REST Endpoints**:
  * [ ] `GET` `/api/v1/journals` (daftar jurnal terposting dengan paginasi & filter dimensi)
  * [ ] `GET` `/api/v1/journals/:id` (detail jurnal dan rincian lines)
  * [ ] `POST` `/api/v1/journals/manual` (pembuatan jurnal memorial berizin khusus)
  * [ ] `POST` `/api/v1/journals/:id/reverse` (eksekusi reversal jurnal)
* [ ] **Database Migration**:
  * [ ] Migration tabel `journal_entries`, `journal_lines`, dan `accounting_events` dengan indeks FK dan unique constraint idempotency.
* [ ] **Automated Tests**:
  * [ ] Unit test `AccountingPostingService`:
    * Sukses memposting jurnal seimbang debet = kredit.
    * Menolak jurnal tidak seimbang (throw `JOURNAL_NOT_BALANCED`).
    * Menolak posting pada periode `CLOSED` (throw `PERIOD_CLOSED`).
    * Menolak posting pada akun header non-postable.
    * Menolak posting duplikat dengan idempotency key yang sama.
    * Sukses membuat jurnal reversal pembalik.

---

### 📌 Tahap 5A: Perencanaan Jadwal Bus & Dispatch Plotting (`trip_schedules`)
* [ ] **Models & Entities (`src/@models/`)**:
  * [ ] `trip_schedules`: Dokumen rencana jadwal dinas bus (`schedule_no`, `service_type: AKAP/TOURISM`, `vehicle_id`, `planned_departure_at`, `planned_return_at`, `origin`, `destination`, `customer_id`, `pic_name`, `pic_phone`, `pickup_notes`, `itinerary_notes`, `planned_driver_1_id`, `planned_driver_2_id`, `planned_conductor_id`, `status: DRAFT/CONFIRMED/SPJ_ISSUED/COMPLETED/CANCELLED`, `spj_id`).
* [ ] **DTOs & Validations (`src/@dto/`)**:
  * [ ] `CreateTripScheduleDto` (rute, bus, rencana jam berangkat/pulang, kru, customer/lead wisata, titik jemput)
  * [ ] `UpdateTripScheduleDto`
  * [ ] `ScheduleConflictCheckDto` (cek irisan jadwal bus & kru)
  * [ ] `TripScheduleQueryFilterDto` (filter tanggal, nopol bus, status jadwal, unit usaha)
* [ ] **Services & Domain Logic (`src/modules/`)**:
  * [ ] `TripSchedulesService`:
    * Generator nomor jadwal unik `SCH/AKP/YYMM/XXXX` atau `SCH/WIS/YYMM/XXXX` via `DocumentSequenceService`.
    * **Validasi Anti-Bentrok (*Overlap Conflict Validation*)**: Menolak plotting bus atau kru yang sama pada rentang waktu yang beririsan.
    * **Peringatan Jeda Istirahat (*Rest Buffer Warning*)**: Alert jika jeda kepulangan armada dengan jadwal berikutnya kurang dari 3 jam.
    * **Integrasi Otomatis Lead Penyewa**: Pendaftaran otomatis lead baru ke `customers` jika nomor telepon belum ada di database.
    * **Aksi 1-Klik Generate SPJ**: Menyalin seluruh data matang jadwal ke dokumen `spjs` saat armada siap jalan di hari H.
* [ ] **Controllers & REST Endpoints (`src/modules/`)**:
  * [ ] `GET/POST/PUT` `/api/v1/trip-schedules`
  * [ ] `GET` `/api/v1/trip-schedules/calendar` (data visualisasi timeline kalender/Gantt armada)
  * [ ] `POST` `/api/v1/trip-schedules/:id/confirm` (mengunci jadwal & reservasi armada)
  * [ ] `POST` `/api/v1/trip-schedules/:id/generate-spj` (menerbitkan SPJ dari jadwal)
  * [ ] `POST` `/api/v1/trip-schedules/:id/cancel`
* [ ] **Database Migration**:
  * [ ] Migration tabel `trip_schedules`.
* [ ] **Automated Tests**:
  * [ ] Unit test `TripSchedulesService` (deteksi tabrakan jadwal bus & kru, buffer time warning, auto-lead).

---

### 📌 Tahap 5B: Eksekusi SPJ Life Cycle & Multi-Leg State Machine (`spjs`)
* [ ] **Models & Entities (`src/@models/`)**:
  * [ ] `spjs`: Dokumen Surat Perintah Jalan (`spj_no`, `service_type: AKAP/TOURISM`, `parent_spj_id`, `business_unit_id`, `operational_status`, `financial_status`, `issued_at`, `closed_at`).
  * [ ] `spj_legs`: Segmen rute perjalanan (`sequence_no`, `direction: DEPARTURE/RETURN`, `origin`, `destination`, `meal_pax_count`, `meal_discrepancy_notes`, `status`).
  * [ ] `spj_crew_assignments`: Penugasan kru fleksibel (2–4+ kru) per leg perjalanan (`crew_id`, `role: DRIVER/CO_DRIVER/CONDUCTOR`).
* [ ] **DTOs & Validations (`src/@dto/`)**:
  * [ ] `CreateSpjDto` (pilihan layanan AKAP/Wisata, armada bus, rute legs, kru, atau generated dari schedule_id)
  * [ ] `UpdateSpjDto`, `AssignCrewDto`, `ReplaceCrewDto`
  * [ ] `SpjQueryFilterDto` (filter status operasional, finansial, nopol bus, tanggal)
* [ ] **Services & Domain Logic**:
  * [ ] `SpjService`:
    * Generator cerdas nomor dokumen `SPJ/AKP/YYMM/XXXX` atau `SPJ/WIS/YYMM/XXXX` via `DocumentSequenceService`.
    * State machine `operational_status`: `DRAFT` $\to$ `ISSUED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED` / `CANCELLED`.
    * Validasi kapasitas: Memastikan total penumpang manifes tidak melebihi kapasitas fisik kelas kursi armada (`vehicle_seat_classes`).
    * Validasi kru minimal: Wajib memiliki minimal 1 orang bertindak sebagai `DRIVER`.
    * Otomasi Rate Snapshotting: Menyalin nilai uang makan dan premi dari `crew_rate_rules` ke `crew_meal_payments` saat penugasan.
    * Alur Breakdown Darurat: Penautan `parent_spj_id` saat bus mogok dan penerbitan SPJ pengganti tanpa duplikasi omzet (Skenario 3).
* [ ] **Controllers & REST Endpoints**:
  * [ ] `GET` `/api/v1/spjs`, `GET` `/api/v1/spjs/:id`
  * [ ] `POST` `/api/v1/spjs` (penerbitan dokumen SPJ baru)
  * [ ] `POST` `/api/v1/spjs/:id/start` (keberangkatan armada $\to$ `IN_PROGRESS`)
  * [ ] `POST` `/api/v1/spjs/:id/complete` (kedatangan di garasi $\to$ `COMPLETED`)
  * [ ] `POST` `/api/v1/spjs/:id/replace-crew` (pergantian/pembatalan kru di tengah jalan)
  * [ ] `POST` `/api/v1/spjs/:id/emergency-replace-vehicle` (penerbitan SPJ pengganti insiden)
* [ ] **Database Migration**:
  * [ ] Migration tabel `spjs`, `spj_legs`, dan `spj_crew_assignments`.
* [ ] **Automated Tests**:
  * [ ] Unit test transisi status state machine SPJ.
  * [ ] Unit test validasi hard-limit kapasitas kursi dan kru minimal 1 Driver.
  * [ ] Unit test penautan `parent_spj_id` (Skenario 3).

---

### 📌 Tahap 6: Uang Jalan (UJ), Biaya SPJ, & Deklarasi Penerimaan
* [ ] **Models & Entities (`src/@models/`)**:
  * [ ] `spj_expenses`: Seluruh biaya perjalanan (BBM solar + liter + odometer, tol, parkir, cuci, retribusi terminal, penginapan).
  * [ ] `spj_uj`: Amplop pertanggungjawaban UJ kru ($1:N$ per SPJ).
  * [ ] `spj_uj_disbursements`: Baris pencairan dana UJ (multi-line: kas pool awal + transfer bank darurat).
  * [ ] `spj_uj_expenses`: Alokasi nota pengeluaran operasional ke amplop UJ.
  * [ ] `spj_uj_returns`: Pengembalian fisik sisa dana UJ ke laci kasir pool.
  * [ ] `spj_uj_additional_requests`: Permintaan tambahan UJ di jalan.
  * [ ] `spj_revenue_declarations`: Deklarasi penerimaan operasional (tiket langsung naik pool, kargo motor, kargo kardus).
  * [ ] `crew_meal_payments`: Rincian hak kompensasi kru (uang makan, premi, bonus full seat, komisi kargo).
* [ ] **DTOs & Validations (`src/@dto/`)**:
  * [ ] `DisburseUjDto` (pilihan akun kas/bank, nominal, metode pencairan awal/tambahan)
  * [ ] `CreateSpjExpenseDto` (kategori biaya, nominal, liter, odometer, bukti upload)
  * [ ] `DeclareRevenueDto` (jenis penerimaan tiket/kargo, tarif bruto, komisi dinamis 20%)
  * [ ] `ReturnUjDto`, `EarlyPayoutCrewDto` (pencairan sebagian premi di jalan)
* [ ] **Services & Domain Logic**:
  * [ ] `SpjUjService`:
    * Multi-line disbursement: Akumulasi plafon UJ yang dipegang kru.
    * Jurnal atomik pencairan UJ: Debit `13101 Uang Jalan Kru`, Kredit Kas/Bank.
    * Estafet UJ (*UJ Rollover*): Pengalihan saldo sisa UJ antar-SPJ saat breakdown (Skenario 3).
  * [ ] `SpjExpensesService`: Validasi nota fisik, pencatatan odometer, dan pemisahan sumber pembayaran (UJ vs Kas Kantor).
  * [ ] `SpjRevenueService`: Prinsip Anti-Netting (setoran tunai tiket/kargo wajib 100% bruto dan dilarang dipotong mandiri di jalan).
* [ ] **Controllers & REST Endpoints**:
  * [ ] `GET/POST` `/api/v1/spjs/:id/uj/disburse`
  * [ ] `POST` `/api/v1/spjs/:id/uj/expenses`
  * [ ] `POST` `/api/v1/spjs/:id/uj/returns`
  * [ ] `POST` `/api/v1/spjs/:id/uj/additional-requests`
  * [ ] `GET/POST` `/api/v1/spjs/:id/expenses`
  * [ ] `GET/POST` `/api/v1/spjs/:id/revenue-declarations`
  * [ ] `POST` `/api/v1/spjs/:id/crew-payments/early-payout` (pencairan nafkah premi di jalan)
* [ ] **Database Migration**:
  * [ ] Migration tabel `spj_expenses`, `spj_uj`, `spj_uj_disbursements`, `spj_uj_expenses`, `spj_uj_returns`, `spj_revenue_declarations`, `crew_meal_payments`.
* [ ] **Automated Tests**:
  * [ ] Unit test multi-line UJ disbursement & jurnal debit UJ.
  * [ ] Unit test UJ rollover antar-SPJ (Skenario 3).
  * [ ] Unit test kalkulasi komisi dinamis kargo kru 20%.

---

### 📌 Tahap 7: Meja Kasir Pool, Settlement Kas Kru, & Resolusi Selisih
* [ ] **Models & Entities (`src/@models/`)**:
  * [ ] `crew_cash_settlements`: Header verifikasi rekonsiliasi kasir pool per SPJ (`uj_status`, `revenue_status`, `status: SETTLED/DISCREPANCY`).
  * [ ] `crew_cash_remittances`: Setoran fisik uang tunai ke kasir pool.
  * [ ] `crew_cash_remittance_allocations`: Alokasi setoran ke deklarasi penerimaan tiket/kargo.
  * [ ] `crew_cash_discrepancies`: Temuan selisih kas (kurang setor, nota BBM hilang, salah kembalian).
* [ ] **DTOs & Validations (`src/@dto/`)**:
  * [ ] `CreateCrewSettlementDto`
  * [ ] `ProcessRemittanceDto`
  * [ ] `RecordDiscrepancyDto` (catatan nota hilang, odometer, kronologi)
  * [ ] `ResolveDiscrepancyDto` (putusan FM: `DISPENSASI_PERUSAHAAN` vs `KLAIM_KRU`)
* [ ] **Services & Domain Logic**:
  * [ ] `CashierSettlementService`:
    * Gerbang Validasi: Settlement hanya sah jika `uj_status = BALANCED` dan `revenue_status = MATCHED` (atau `DISCREPANCY_RECORDED`).
    * Lapis 1 Musyawarah Kru: Talangan mandiri antar-kru di meja kasir $\to$ fisik genap, status `MATCHED` tanpa catatan sengketa (Skenario 4 Kasus 1).
    * Lapis 2 Jalur Sistemik: Nota BBM hilang dicatat di `crew_cash_discrepancies` $\to$ status `DISCREPANCY` (Skenario 4 Kasus 2).
    * Otorisasi Finance Manager: Mengubah status selisih menjadi `RESOLVED` (Dispensasi `58101` atau Piutang Klaim Kru `12901`).
    * Tutup Buku Unblocked: Pemanfaatan akun penampung neraca `11999` agar SPJ berselisih tidak menahan tutup periode.
    * Jurnal Rekonsiliasi Akhir SPJ: Mengirimkan instruksi posting multi-line ke `AccountingPostingService` (menutup saldo UJ `13101` menjadi Rp 0, mengakui seluruh beban riil, pendapatan tiket/kargo, dan kas fisik masuk/keluar).
* [ ] **Controllers & REST Endpoints**:
  * [ ] `GET/POST` `/api/v1/spjs/:id/cash-settlement`
  * [ ] `POST` `/api/v1/spjs/:id/cash-settlement/remit` (penerimaan setoran kasir pool)
  * [ ] `POST` `/api/v1/spjs/:id/cash-settlement/verify` (verifikasi akhir & posting jurnal)
  * [ ] `POST` `/api/v1/discrepancies/:id/resolve` (otorisasi keputusan Finance Manager)
* [ ] **Database Migration**:
  * [ ] Migration tabel `crew_cash_settlements`, `crew_cash_remittances`, `crew_cash_remittance_allocations`, `crew_cash_discrepancies`.
* [ ] **Automated Tests**:
  * [ ] Unit test rekonsiliasi normal AKAP PP (Skenario 1: jurnal imbang Rp 16.680.000, saldo UJ Rp 0).
  * [ ] Unit test resolusi selisih kasir & dispensasi perusahaan (Skenario 4: jurnal imbang Rp 11.860.000).

---

### 📌 Tahap 8: Modul Piutang (AR) & Utang (AP)
* [ ] **Models & Entities (`src/@models/`)**:
  * [ ] `ar_invoices`, `ar_invoice_lines`, `ar_receipts`, `ar_allocations`: Piutang sewa charter wisata, piutang AR OTA RedBus/Traveloka, pelunasan transfer bank.
  * [ ] `ap_invoices`, `ap_invoice_lines`, `ap_payments`, `ap_allocations`: Utang vendor restoran servis makan mitra, tagihan bengkel rekanan/derek tol, utang komisi agen.
* [ ] **DTOs & Validations (`src/@dto/`)**:
  * [ ] `CreateArInvoiceDto`, `CreateArReceiptDto`, `AllocateArReceiptDto`
  * [ ] `CreateApInvoiceDto`, `CreateApPaymentDto`, `AllocateApPaymentDto`
  * [ ] `PullUnbilledSpjForRestaurantDto` (form tarik SPJ tagihan restoran)
* [ ] **Services & Domain Logic**:
  * [ ] `ApService`:
    * Tagihan Servis Makan Restoran Mitra: Form tarik SPJ belum ditagih, validasi kupon makan riil vs manifes (`meal_pax_count`), proteksi anti-double billing, nol dampak ke UJ kas kru (Skenario 1).
    * Tagihan Tempo Bengkel/Derek: Pengakuan utang vendor rekanan teratribusi ke `vehicle_id` bus yang rusak (Skenario 3).
    * Pembayaran utang komisi agen offline/OTA & cashback rekanan B2B wisata (`54103`) via bank.
  * [ ] `ArService`:
    * Siklus Sewa Wisata: Penerimaan DP 30% ke liabilitas `24101 Pendapatan Diterima di Muka`, pelunasan invoice 70%, dan pelepasan DP menjadi Pendapatan Sewa `42101` saat SPJ completed (Skenario 2).
* [ ] **Controllers & REST Endpoints**:
  * [ ] `GET/POST/PUT` `/api/v1/ar/invoices`, `/api/v1/ar/invoices/:id/post`
  * [ ] `POST` `/api/v1/ar/receipts`, `/api/v1/ar/receipts/:id/allocate`
  * [ ] `GET/POST/PUT` `/api/v1/ap/invoices`, `/api/v1/ap/invoices/:id/post`
  * [ ] `GET` `/api/v1/ap/invoices/unbilled-spjs/:restaurantId` (tarik SPJ belum ditagih RM)
  * [ ] `POST` `/api/v1/ap/payments`, `/api/v1/ap/payments/:id/allocate`
* [ ] **Database Migration**:
  * [ ] Migration tabel `ar_invoices`, `ar_invoice_lines`, `ar_receipts`, `ar_allocations`, `ap_invoices`, `ap_invoice_lines`, `ap_payments`, `ap_allocations`.
* [ ] **Automated Tests**:
  * [ ] Unit test siklus DP & pelunasan piutang charter wisata (Skenario 2).
  * [ ] Unit test penagihan servis makan mitra & anti-double billing (Skenario 1).

---

### 📌 Tahap 9: Laporan Finansial, Trip Profitability (Margin), & Tutup Buku
* [ ] **DTOs & Validations (`src/@dto/`)**:
  * [ ] `ReportFilterDto` (rentang tanggal, unit usaha, armada bus, rute)
  * [ ] `PeriodCloseChecklistDto`
* [ ] **Services & Domain Logic**:
  * [ ] `FinancialReportsService`:
    * Buku Besar (General Ledger) dan Neraca Saldo (Trial Balance) bersumber murni dari baris jurnal `POSTED`.
    * Laporan Laba Rugi Perusahaan dan Laporan Neraca.
  * [ ] `TripProfitabilityService`:
    * Laporan Margin Kontribusi SPJ:
      * Tampilan per Bus (`vehicle_id`): Isolasi kinerja aset individual (defisit bus rusak `SS-01` vs margin bus pengganti `SS-03` pada Skenario 3).
      * Tampilan per Kelompok Perjalanan (`journey_group_id`): Konsolidasi 1 perjalanan ekonomi utuh.
  * [ ] `PeriodClosingService`:
    * Checklist otomatis tutup buku (jurnal balance, kasir tuntas, rekonsiliasi kas/bank, selisih kasir `11999` tercatat).
    * Penguncian status periode `CLOSED` (menolak mutlak posting baru) dan otorisasi `REOPEN`.
* [ ] **Controllers & REST Endpoints**:
  * [ ] `GET` `/api/v1/reports/general-ledger`
  * [ ] `GET` `/api/v1/reports/trial-balance`
  * [ ] `GET` `/api/v1/reports/income-statement`
  * [ ] `GET` `/api/v1/reports/trip-profitability` (filter per bus vs per journey group)
  * [ ] `POST` `/api/v1/fiscal-periods/:id/start-close`
  * [ ] `POST` `/api/v1/fiscal-periods/:id/close`
  * [ ] `POST` `/api/v1/fiscal-periods/:id/reopen`
* [ ] **Automated Tests**:
  * [ ] Unit test kalkulasi GL & Trial Balance.
  * [ ] Unit test laporan margin kontribusi SPJ per bus vs journey group (Skenario 3).
  * [ ] Unit test penguncian periode closed (menolak posting).

---

### 📌 Tahap 10: Integrasi Frontend UI & E2E Verification
* [ ] **Frontend Modules (`ss-travel-frontend/src/`)**:
  * [ ] Master Data UI: Manajemen Armada Bus, Kelas Kursi, Agen Tiket, Restoran Mitra, COA, dan Aturan Tarif.
  * [ ] SPJ Dispatcher UI: Form plotting SPJ, manifes penumpang multi-class, penugasan kru per leg.
  * [ ] Meja Kasir Pool UI: Form pencairan UJ (BKK), form penerimaan setoran kas tiket/kargo (BKM), rekonsiliasi anti-netting, dan modal penyelesaian selisih kas.
  * [ ] Finance AP/AR UI: Form tagihan servis makan mitra (modal tarik SPJ), tagihan kontrak sewa wisata, pelunasan transfer bank.
  * [ ] Accounting UI: Buku besar, jurnal memorial, neraca saldo, checklist tutup buku bulanan, dashboard profitabilitas trip.
* [ ] **Service Layer Frontend**:
  * [ ] Pembaruan Axios service calls ke seluruh endpoint `/api/v1/...`.
* [ ] **End-to-End Simulation Tests (4 Skenario Terkunci)**:
  * [ ] E2E Skenario 1: AKAP PP Normal, Tagihan Restoran AP, Komisi Kargo Dinamis, Settlement Kasir Imbang Rp 16.68jt.
  * [ ] E2E Skenario 2: Sewa Wisata 5 Hari, DP 30%, Early Payout Premi di Jalan, Pelunasan AR, Settlement Imbang Rp 27.075jt.
  * [ ] E2E Skenario 3: Breakdown Tol Cipali, SPJ Pengganti (`parent_spj_id`), UJ Rollover, Isolasi Biaya Derek ke Bus Rusak, Laporan Ganda.
  * [ ] E2E Skenario 4: Rekonsiliasi Kasir Bermasalah (Musyawarah Kru Talangan Tiket Rp 200rb vs Nota BBM Hilang Rp 300rb), Otorisasi FM Dispensasi `58101`, Tutup Buku Unblocked via `11999`.
* [ ] **Final Deployment & Verification**:
  * [ ] Backend & Frontend build 100% clean.
  * [ ] Dokumentasi penggunaan sistem.
