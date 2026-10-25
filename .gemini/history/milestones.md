# Project Milestones: SS Traveling

## Phase 3: Core Implementation (In Progress)

### 2026-10-25: Modul Treasury, Persetujuan Pemindahan Dana & Rekening Koran Digital Completed
- **Pemisahan Tegas Master Data vs Operasional Likuiditas**:
  - Halaman **`/cash-bank`**: Dipertahankan murni sebagai **Master Data Kas & Rekening Bank** (CRUD data rekening kas fisik, rekening bank, pemetaan akun COA, cost center, dan masking nomor rekening).
  - Halaman Baru **`/treasury`**: Terdaftar di bawah induk menu **Meja Kasir Pool** (`sequence: 3`) khusus operasional likuiditas kas & bank:
    * **Desain Visual Bersih & Netral (Clean & Subtle Aesthetics)**:
      - 4 Kartu Ringkasan Likuiditas KPI di bagian atas dengan kotak ikon netral lembut (`bg-muted text-muted-foreground`), angka tebal mono yang elegan, dan subteks informatif.
      - Seluruh ikon menggunakan wadah abu-abu netral (`bg-muted`), menghilangkan warna background kontras tinggi.
      - Seluruh badge menggunakan varian bersih `variant="outline"` dengan teks netral `text-muted-foreground`, serasi dan sejuk di mata pada tema terang maupun gelap.
    * **Tab 1: Rekening Koran Digital (*Bank Statement*)**:
      - Kartu visual rekening induk (penerimaan), operasional (pengeluaran), dan kas pool dengan saldo real-time GL.
      - **Preset Rentang Tanggal Cepat**: Tombol pintas 1-klik (*Bulan Ini*, *Bulan Lalu*, *30 Hari Terakhir*, *Tahun Berjalan*) serta pemilih tanggal kustom.
      - **Pencarian Cepat (*Live Search*)**: Menyaring instan berdasarkan nomor jurnal (`JV/...`), tanggal, dan uraian transaksi.
      - **Filter Tipe Dokumen & Arah Aliran**: Filter multi-kategori (*Semua Dokumen*, *SPJ Kru*, *Mutasi Transfer*, *Piutang AR*, *Utang AP*, *Kas Pool BKK*, *Jurnal Memorial*) serta pemilah arah dana (*Semua*, *Hanya Masuk/Debit*, *Hanya Keluar/Kredit*).
      - **Urutan Kronologis Fleksibel (*Sorting*)**: Beralih urutan tanggal dengan tombol sort atau klik header tabel (*Terlama &rarr; Terbaru / Kronologis* vs *Terbaru &rarr; Terlama*).
      - **Paginasi Lengkap**: Pengatur limit baris (10, 25, 50, 100 baris/halaman), navigasi nomor halaman, tombol Sebelumnya/Berikutnya, serta cetak dokumen A4 resmi.
    * **Tab 2: Riwayat Pemindahan Dana**:
      - Tabel mutasi dana dengan tombol **`[Detail]` (ikon mata `Eye`)** pada setiap baris untuk membuka modal dokumen transfer lengkap.
      - Modal permohonan transfer (`CreateTransferModal`) dengan template cerdas (Dropping Induk &rarr; Ops, Ops &rarr; Ops, Setor Kas Pool, Tarik Tunai Bank).
    * **Tab 3: Meja Persetujuan (Approval Desk)**:
      - Kartu antrean review pengajuan transfer berstatus `PENDING_APPROVAL` dengan tombol **`[Detail]`** untuk audit rincian sebelum tindakan.
      - **Otorisasi Murni Berbasis Custom Permission Menu (`actions?.approve`)**:
        * Menambahkan migrasi database `1782700000000-add-treasury-custom-actions.ts` yang mendaftarkan `availableActions: '["approve"]'` pada menu `/treasury` (`menus`) dan memberikan izin `actions: '{"approve": true}'` pada `role-menus` untuk `SUPER_ADMIN`, `DIRECTOR`, dan `FINANCE_MANAGER`.
        * Menghapus seluruh hardcode pengecekan nama role (`SUPER_ADMIN`, `DIRECTOR`, `FINANCE_MANAGER`) di frontend `TreasuryPage`. Logika otorisasi kini 100% didelegasikan ke `actions?.approve` dari hook `usePermission()`.
        * Memberikan fleksibilitas penuh bagi administrator untuk mengaktifkan atau mencabut hak approval per role secara dinamis melalui antarmuka Manajemen Role (`/roles`).
      - **Dialog Konfirmasi UI Modern (*Zero Native Browser Alert*)**:
        * Menghilangkan seluruh `window.confirm()` bawaan browser.
        * Aksi **`[✓ Setujui & Posting]`**: Membuka `ConfirmDialog` bertema primary dengan rincian nomor transfer, nominal rupiah, dan edukasi posting otomatis ke GL.
        * Aksi **`[✕ Tolak]`**: Membuka `ConfirmDialog` bertema danger lengkap dengan input form alasan penolakan wajib (*prompt input*).
        * Konsisten digunakan baik pada kartu antrean Tab 3 maupun di dalam modal `TransferDetailModal`.
    * **Modal Detail Dokumen Pemindahan Dana (`TransferDetailModal.tsx`)**:
      - Pratinjau dokumen transfer resmi (`TRF/YYMM/XXXX`) dengan alur visual rekening pengirim (kredit) dan penerima (debit).
      - Rincian nominal, tujuan dropping, bukti M-Banking/referensi, audit trail pemohon (*Maker*), tanggal pengajuan, serta informasi jurnal GL terposting (*Checker*).
      - Tombol **`[Cetak Bukti Transfer]`** siap print fisik (`window.print()`), serta tombol approval langsung di dalam modal.
- **Refaktor Query ke Pure TypeORM QueryBuilder (`CashBankService`)**:
  - Menghapus seluruh query SQL mentah (*raw queries*) dan menggantikannya dengan repositori resmi TypeORM `JournalLineEntity` (`lineRepo.createQueryBuilder('line')`).
  - Menangani pemetaan otomatis kolom `"createdAt"` dan relasi `line.journalEntry` secara aman dan portabel tanpa potensi error *column does not exist*.
  - Helper `calculateAccountBalance` menghitung saldo berjalan akun GL dari seluruh jurnal berstatus `POSTED` secara atomik.
- **Struktur Rekening Bank Korporat Terpisah (2 Induk + 4 Operasional) (`ss-travel-backend`)**:
  - Migrasi `1782500000000-create-fund-transfers.ts` menambahkan 6 akun COA baru:
    * `11111` — Bank BCA Induk (Pusat Penerimaan) $\to$ `BANK-BCA-MAIN`
    * `11112` — Bank Mandiri Induk (Pusat Penerimaan) $\to$ `BANK-MANDIRI-MAIN`
    * `11121` — Bank BCA Operasional AKAP $\to$ `BANK-BCA-OPS-AKAP`
    * `11122` — Bank BCA Operasional Wisata $\to$ `BANK-BCA-OPS-WIS`
    * `11123` — Bank Mandiri Operasional AKAP $\to$ `BANK-MANDIRI-OPS-AKAP`
    * `11124` — Bank Mandiri Operasional Wisata $\to$ `BANK-MANDIRI-OPS-WIS`
- **Sistem Pemindahan Dana (*Fund Transfers*) & Persetujuan Atasan (*Maker-Checker*)**:
  - Entitas `FundTransferEntity` (`fund_transfers`) mencatat permohonan dropping dana berdokumen resmi `TRF/YYMM/XXXX`.
  - Siklus status: `PENDING_APPROVAL` $\to$ `APPROVED` (atau `REJECTED`).
  - Posting Jurnal Otomatis via `AccountingPostingService` saat disetujui Manajer Keuangan / Direktur (Debit Rekening Penerima, Kredit Rekening Pengirim).
  - Controller `FundTransfersController` (`/api/v1/fund-transfers`) dengan otorisasi RBAC `CashBank:create` dan `CashBank:approve`.
- **Verifikasi Kualitas**:
  - Seluruh 27 test suites backend (160 unit tests) lulus 100%.
  - Build Backend NestJS dan Frontend Vite TypeScript lulus 100% bebas error.

### 2026-10-25: Dashboard Live & Cetak Dokumen Operasional SPJ / AR Completed (Refinement)
- **Backend Dashboard Module & REST API (`ss-travel-backend`)**:
  - `DashboardService`: Agregasi multi-tabel real-time untuk status armada (aktif di rute, standby garasi, bengkel), operasional SPJ (di jalan, menunggu meja kasir, selesai bulan ini), likuiditas kas fisik garasi + bank operasional (GL saldo berjalan akun `11101`, `11102`, `11103`, `11104`), alert piutang terbuka (AR), alert utang jatuh tempo (AP), kasus selisih kasir akun `11999` dalam investigasi FM, bon kas kecil status `SUBMITTED`, dan daftar perjalanan SPJ terbaru.
  - `DashboardController`: Endpoint `GET /api/v1/dashboard/summary` dengan proteksi otorisasi JWT & RBAC.
  - Unit test `dashboard.service.spec.ts` (2 tests) lulus 100%, total **27 test suites backend (159 unit tests) lulus 100%**.
- **Frontend Dashboard Utama Live (`ss-travel-frontend/src/pages/dashboard/index.tsx`)**:
  - Menggantikan kartu placeholder statis dengan tampilan kendali operasional & finansial real-time berbasis Glassmorphism.
  - 4 Kartu Metrik Utama KPI (Armada Bus di Rute vs Garasi, SPJ Aktif di Jalan vs Kasir, Total Kas & Bank GL, Piutang Terbuka AR).
  - Pintas Operasional Cepat (Booking Jadwal Bus, Monitoring SPJ Lapangan, Meja Kasir Pool, Kas Kecil BKK, Profitabilitas Trip).
  - Kolom Posisi Kas Operasional & Rekening Bank dengan saldo dinamis Rupiah.
  - Kolom Alert Keuangan & Pengendalian Internal (Jatuh tempo AP, piutang AR, selisih kasir akun 11999 Skenario 4, bon kas kecil BKK).
  - Tabel Monitoring Perjalanan SPJ Terbaru dengan link cepat navigasi.
- **Cetak Dokumen Fisik Surat Perintah Jalan (SPJ) Resmi Supir (`SpjPrintModal.tsx`)**:
  - Modal cetak dokumen fisik A4 standar industri transportasi bus PT SS Traveling Official (`window.print()`).
  - Kop surat resmi, tipe layanan (AKAP/Wisata), nomor lambung bus, pelat nomor, kapasitas kursi.
  - Susunan kru dinas (Pengemudi Utama / Driver 1, Pengemudi Pengganti / Driver 2, Kondektur/Pramugari).
  - Segmen rute leg, jam keberangkatan, manifes kursi, dan rumah makan servis makan rekanan (RM Taman Selera).
  - Tata tertib operasional dan kepatuhan keuangan (SOP Anti-Netting dan rekonsiliasi kasir maksimal 2 jam).
  - 4 Kolom paraf resmi: Dispatcher/Pengawas, Kasir Pool, Pengemudi 1, Pengemudi 2.
- **Cetak Faktur Tagihan AR & Kwitansi DP Sewa Wisata (`ArInvoicePrintModal.tsx`)**:
  - Modal cetak faktur invoice / kwitansi resmi PT SS Traveling untuk penagihan ke pelanggan sewa bus.
  - Kop surat resmi, nomor faktur, data instansi penyewa & PIC, referensi SPJ, tanggal faktur, dan tanggal jatuh tempo.
  - Tabel rincian paket sewa armada, subtotal, PPN, nilai faktur, pembayaran DP yang telah diterima, dan sisa tagihan pelunasan.
  - Petunjuk rekening pembayaran transfer Bank BCA Operasional No. Rek `8830-1928-31` a/n PT SS Traveling Official.
  - Kolom tanda tangan resmi Kasir Piutang Usaha (AR) dan Penyewa.
- **Verifikasi Kualitas Penuh**:
  - 27 unit test suites backend (159 unit tests) lulus 100%.
  - Backend NestJS `yarn build` sukses 100% bebas error.
  - Frontend Vite `yarn build` sukses 100% bebas error.

### 2026-10-25: Modul Kas Kecil Pool (Petty Cash) Completed (BE + FE)
- **Model Database & Migrasi PostgreSQL (`cash_transactions`)**:
  - Model `cash_transactions` untuk pencatatan transaksi kas kecil non-SPJ garasi pool (`transaction_no` format `BKK-KAS/YYMM/XXXX` & `BKM-KAS/YYMM/XXXX`, `cash_account_id` relasi ke `cash_accounts`, `type`: `DISBURSEMENT` / `REPLENISHMENT`, `amount`, `recipient`, `expense_account_id`, `source_bank_account_id`, `source_cash_account_id`, `vehicle_id`, `cost_center_id`, `category`, `description`, `receipt_no`, `status`: `DRAFT`, `SUBMITTED`, `VERIFIED`, `REJECTED`, `journal_entry_id`, `created_by_id`, `verified_by_id`, `verified_at`).
  - Enums: `CashTransactionType`, `CashTransactionStatus`, `PettyCashCategory` (`FACILITY_SNACK`, `STANDBY_CREW`, `DEADHEAD_INSENTIF`, `POOL_SUPPLIES`, `OVERTIME_MEKANIK`, `OFFICE_CONSUMPTION`, `OFFICE_TRAVEL`, `WORKSHOP_EMERGENCY`, `OTHER`).
  - Migrasi `1782300000000-create-cash-transactions.ts` sukses dieksekusi 100% pada database PostgreSQL lengkap dengan seeder data riil kas kecil garasi (Replenishment Rp 10jt, snack kabin bus SS-01 Rp 350rb, uang makan standby driver Rp 150rb, insentif langsir SS-03 Rp 200rb, sabun cuci bus Rp 120rb, kopi lembur Rp 180rb).
- **Service Layer & Accounting Core Integration (`ss-travel-backend`)**:
  - `PettyCashService`:
    - `getSummary`: Menghitung saldo berjalan kas kecil dari buku besar GL atau mutasi bersih transaksi, total pengeluaran bulan ini, antrean nota menunggu verifikasi akuntan (`SUBMITTED`), dan transaksi hari ini.
    - `getTransactions`: Kueri daftar mutasi kas kecil dengan filter tanggal, rekening kas, kategori beban, status verifikasi, dan pencarian teks.
    - `createDisbursement`: Menerbitkan Bukti Kas Keluar (BKK) dengan penomoran concurrency-safe `BKK-KAS/YYMM/XXXX` via `DocumentSequenceService`, validasi akun postable, dan opsi langsung posting GL jika `autoVerify`.
    - `createReplenishment`: Pencairan dana pengisian kembali kas kecil (BKM) dari rekening Bank BCA Operasional (`11104`) atau Kas Induk Pool (`11101`) dengan posting jurnal otomatis Debit `11103 Kas Kecil Pool`, Kredit `11104 Bank BCA` / `11101 Kas Induk`.
    - `verifyTransaction`: Otorisasi verifikasi nota oleh Akuntan dan posting jurnal otomatis Debit Akun Beban (52104 / 53105 / 53106 / 57102 / 57107 / 57108), Kredit `11103 Kas Kecil Pool` via `AccountingPostingService`.
    - `rejectTransaction`: Penolakan nota pengeluaran kas kecil dengan alasan wajib.
    - `deleteTransaction`: Pembatalan transaksi jika belum berstatus `VERIFIED`.
  - `PettyCashController`: Endpoint REST API `/api/v1/petty-cash` lengkap dengan dokumentasi Swagger dan proteksi izin `@RequirePermissions('PettyCash:...')`.
  - Unit test `petty-cash.service.spec.ts` (8 tests) lulus 100%, total 26 test suites backend (157 unit tests) lulus 100%.
- **Frontend Halaman & Modal Terpadu (`ss-travel-frontend`)**:
  - API Client Service: `PettyCashService` (`src/services/petty-cash.service.ts`) terstandarisasi tanpa leading slash.
  - Halaman **Kas Kecil Pool (`/petty-cash`)**: 4 kartu metrik live (Sisa Saldo Kas Kecil, Pengeluaran Bulan Ini, Menunggu Verifikasi Akuntan, Aktivitas Hari Ini), toolbar filter kaya, dan tabel riwayat mutasi kas kecil.
  - Modal **Input Pengeluaran Kas Kecil BKK (`CreatePettyCashModal.tsx`)**: 8 tombol preset cepat SOP akuntansi bus (Standby Driver 53105, Langsir Armada 53106, Snack Onboard 52104, Cuci Bus & ATK 57102, Lembur Mekanik 57107, Kopi Piket 57108, Transport Dinas 57109, Sparepart Darurat 55102), selector armada bus, format rupiah titik, dan checkbox langsung posting GL.
  - Modal **Pengisian Kembali Kas Kecil BKM (`ReplenishPettyCashModal.tsx`)**: Form transfer bank atau kas pool induk ke kas kecil garasi.
  - Modal **Detail & Cetak Slip Voucher Resmi Kasir BKK/BKM (`PettyCashDetailModal.tsx`)**: Preview jurnal GL terposting, tanda tangan otorisasi (Penerima, Kasir Pool, Akuntan), tombol verifikasi & tolak bon, serta cetak voucher siap print fisik.
  - Rute `/petty-cash` didaftarkan di `AppRouter`.
- **Verifikasi Kualitas Penuh**:
  - 26 unit test suites backend (157 tests) lulus 100%.
  - Backend NestJS `yarn build` sukses 100% bebas error.
  - Frontend Vite `yarn build` sukses 100% bebas error.

### 2026-10-25: Stage 9 Completed & Stabilized — Laporan Finansial, Trip Profitability (Margin), & Tutup Buku Bulanan (BE + FE)
- **Hotfix & Stabilisasi Relasi / Skema TypeORM**:
  - Memperbaiki pemanggilan relasi kru di `TripProfitabilityService` dan `PeriodClosingService` dari `crewAssignments.user` ke `crewAssignments.crew`.
  - Menyelaraskan filter tanggal jadwal perjalanan ke `schedule.plannedDepartureAt`.
  - Menjalankan migrasi `1782100000000-add-is-active-to-period-close-checks.ts` dan `1782200000000-fix-period-close-checks-timestamps.ts` untuk memastikan kolom `is_active`, `"createdAt"`, dan `"updatedAt"` tersedia sesuai kontrak TypeORM `BaseEntity`.
  - Seluruh fungsionalitas laporan profitabilitas trip, buku besar/neraca, dan checklist tutup buku 6-poin teruji berjalan normal tanpa error di Backend & Frontend.
- **Model Database & Migrasi PostgreSQL (`period_close_checks`, `fiscal_periods.checklist_snapshot`)**:
  - `period_close_checks`: Entitas audit checklist penutupan buku bulanan per periode (`period_id`, `check_code`, `check_name`, `status`: `PASSED`, `WARNING`, `BLOCKED`, `details`: JSONB, `checked_at`, `checked_by`).
  - Kolom `checklist_snapshot` (JSONB) pada tabel `fiscal_periods` untuk menyimpan arsip permanen hasil audit 6-point checklist saat penutupan buku dieksekusi.
  - Migrasi `1782000000000-create-period-closing-and-reports.ts` sukses dieksekusi 100% pada database PostgreSQL.
- **Service Layer & Domain Accounting Engine (`ss-travel-backend`)**:
  - `FinancialReportsService`:
    - `getGeneralLedger`: Menghasilkan Buku Besar (GL) per akun dan rentang tanggal dengan saldo awal sebelum periode, mutasi debit/kredit baris-demi-baris dengan referensi dokumen sumber, dan running balance dinamis berdasarkan saldo normal (`DEBIT` vs `CREDIT`).
    - `getTrialBalance`: Menghasilkan Neraca Saldo lengkap (Saldo Awal Debit/Kredit, Mutasi Periode Debit/Kredit, dan Saldo Akhir Debit/Kredit) dengan validasi matematis keseimbangan total (`isBalanced`).
    - `getIncomeStatement`: Laporan Laba Rugi Komprehensif (Pendapatan Operasional kelompok 4 & 81, Beban Langsung Armada & Fasilitas 51 & 52, Beban Kru 53, Beban Agen/Korlap 54, Beban Bengkel 55, Beban Pool & Lainnya 56-59, Gross Profit, Operating Profit, dan Net Income).
    - `getBalanceSheet`: Neraca Keuangan posisi per tanggal (Aset kelompok 1, Liabilitas kelompok 2, Ekuitas kelompok 3, dan Laba/Rugi Bersih Berjalan, dengan validasi seimbang Aset = Liabilitas + Ekuitas).
  - `TripProfitabilityService`:
    - Laporan Margin Kontribusi Perjalanan Bus dengan 2 sudut pandang sesuai Blueprint Bab 16 & Skenario 3:
      - *Tampilan Per Bus (`BY_BUS`)*: Mengisolasi kinerja armada individual fisik (misal: defisit bus rusak SS-01 yang menanggung derek & bengkel darurat Rp 1.5jt vs margin bus pengganti SS-03 penerus rute).
      - *Tampilan Per Kelompok Perjalanan (`BY_JOURNEY_GROUP`)*: Konsolidasi 1 unit ekonomi perjalanan utuh yang menyatukan SPJ Induk (SS-01) dan SPJ Pengganti (SS-03), menggabungkan omzet tiket + kargo (Rp 6.35jt), biaya solar, tol, makan kru, serta perbaikan darurat untuk menyajikan margin kontribusi rute Tangerang-Yogya yang sebenarnya tanpa distorsi (+Rp 2.25jt s.d. +Rp 2.715jt / ~42.75%).
    - `getTripProfitabilityDetail`: Audit trail lengkap per perjalanan mencakup rincian akun pendapatan, breakdown pos beban langsung, daftar armada terkait, dan seluruh entri jurnal terposting.
  - `PeriodClosingService`:
    - Checklist Otomatis 6-Poin:
      1. `JOURNAL_BALANCE`: Memverifikasi seluruh jurnal berstatus `POSTED` seimbang dan tidak ada jurnal `DRAFT` tertinggal (`PASSED` / `BLOCKED`).
      2. `CASHIER_SPJ_STATUS`: Mendeteksi dokumen SPJ yang belum tuntas di meja kasir pool sebagai exception peringatan sesuai Blueprint Bab 5 (`WARNING`, BUKAN pemblokir tutup buku).
      3. `UNRESOLVED_DISCREPANCY_11999`: Memverifikasi saldo akun penampung `11999` dan kasus investigasi terbuka FM sesuai Skenario 4 (`WARNING`, Kemerdekaan Tutup Buku Unblocked).
      4. `CASH_BANK_RECON`: Merekonsiliasi posisi saldo kas fisik pool (11101, 11102, 11103) dan bank operasional (11104).
      5. `OPEN_AR_AP`: Menyajikan ringkasan saldo terbuka faktur piutang (AR) dan tagihan vendor (AP).
      6. `TRIAL_BALANCE_EQUAL`: Memvalidasi neraca saldo akhir seimbang (`PASSED` / `BLOCKED`).
    - `closePeriod`: Mengunci periode fiskal menjadi `CLOSED`, mencatat `closedBy`, `closedAt`, alasan, dan snapshot audit checklist ke database.
    - `reopenPeriod`: Otorisasi pembukaan kembali periode tertutup untuk Finance Manager dengan kewajiban input alasan audit tertulis.
- **REST Endpoints & Controllers**:
  - `GET /api/v1/reports/general-ledger`, `GET /api/v1/reports/trial-balance`, `GET /api/v1/reports/income-statement`, `GET /api/v1/reports/balance-sheet`.
  - `GET /api/v1/reports/trip-profitability`, `GET /api/v1/reports/trip-profitability/:id`.
  - `GET /api/v1/period-closing/periods`, `GET /api/v1/period-closing/:periodId/checklist`, `POST /api/v1/period-closing/:periodId/run-checklist`, `POST /api/v1/period-closing/:periodId/close`, `POST /api/v1/period-closing/:periodId/reopen`.
- **Frontend Halaman & Modal Terpadu (`ss-travel-frontend`)**:
  - API Client Services: `ReportService` (`src/services/report.service.ts`) dan `PeriodClosingService` (`src/services/period-closing.service.ts`).
  - Halaman **Laporan Profitabilitas Trip (`/reports/trip-profitability`)**: 4 kartu metrik live (Omzet, Beban Langsung, Margin Bersih, % Margin), toolbar filter rute & layanan, toggle sudut pandang *Per Kelompok Perjalanan* vs *Per Bus Fisik*, tabel breakdown performa SPJ, dan modal **Audit Detail Margin Trip (`TripProfitabilityDetailModal.tsx`)**.
  - Halaman **Buku Besar & Neraca Saldo (`/reports/general-ledger`)**: 4 Tab navigasi terpadu (Buku Besar Akun COA dengan running balance, Neraca Saldo Saldo Awal/Mutasi/Saldo Akhir, Laporan Laba Rugi Komprehensif berjenjang, dan Neraca Keuangan Aktiva vs Pasiva).
  - Halaman **Tutup Buku Bulanan (`/period-closing`)**: Selector periode fiskal, banner status periode, kartu kesiapan penutupan (Ready to Close vs Blocked), banner edukasi kepatuhan SOP akuntansi bus PT SS Traveling Official, grid 6-point checklist interaktif, modal konfirmasi **Kunci & Tutup Buku (`ClosePeriodModal.tsx`)**, dan modal otorisasi **Buka Kembali Periode (`ReopenPeriodModal.tsx`)**.
- **Verifikasi Kualitas Penuh**:
  - 25 unit test suites backend (149 tests total) lulus 100%.
  - Backend NestJS `yarn build` sukses 100% bebas error.
  - Frontend Vite `yarn build` sukses 100% bebas error.

### 2026-10-22: Stage 8 Completed — Modul Utang Usaha (AP) & Piutang Usaha (AR) (BE + FE)
- **Model Database & Migrasi PostgreSQL (`ap_invoices`, `ap_invoice_lines`, `ap_payments`, `ap_allocations`, `ar_invoices`, `ar_invoice_lines`, `ar_receipts`, `ar_allocations`)**:
  - `ap_invoices` & `ap_invoice_lines`: Header dan rincian faktur tagihan rekanan vendor (`bill_no`, `vendor_invoice_no`, `vendor_type`: `RESTAURANT`, `WORKSHOP`, `AGENT`, `OTHER`, `ap_account_id`: `21101` RM, `21102` Bengkel, `22101` Agen). Lines mencakup akun beban debit (`51102`, `55101`, `54101`), kupon riil, manifes pax SPJ, catatan selisih, dan dimensi armada/SPJ.
  - `ap_payments` & `ap_allocations`: Pencatatan bukti bayar utang vendor via Bank BCA (`11104`) atau Kas Pool (`11101`) dengan alokasi otomatis ke faktur dan pembaruan status faktur (`PAID` / `PARTIALLY_PAID`).
  - `ar_invoices` & `ar_invoice_lines`: Header dan rincian invoice piutang usaha (`invoice_no`, `customer_id`, `trip_id`, `ar_account_id`: `12101`, status `DRAFT`, `APPROVED`, `PARTIALLY_PAID`, `PAID`, `CANCELLED`).
  - `ar_receipts` & `ar_allocations`: Pencatatan penerimaan pembayaran piutang dan penerimaan DP Sewa Wisata 30% (`is_down_payment = true`, liabilitas akun `24101`).
  - Migrasi `1781900000000-create-ar-and-ap-invoices.ts` dan seeder data riil Skenario 1 (Tagihan RM Taman Selera Rp 1.050.000), Skenario 2 (DP 30% Rp 5.250.000 & Invoice Pelunasan 70% Rp 12.250.000), serta Skenario 3 (Tagihan Bengkel Cirebon Diesel Motor Rp 2.500.000) `1888888888896-SeedArAndApData.ts`.
- **Service Layer & Accounting Engine (`ss-travel-backend`)**:
  - `ApService`:
    - `findUnbilledSpjsForRestaurant`: Tarik daftar SPJ AKAP yang belum pernah ditagihkan oleh restoran mitra dengan validasi ketat Anti-Double Billing.
    - `createRestaurantBill`: Penerbitan tagihan servis makan berkala (Skenario 1) dengan audit jumlah kupon riil vs manifes fisik dan warning over-capacity.
    - `approveApInvoice`: Posting jurnal utang atomik satu pintu via `AccountingPostingService` (Debit Beban `51102` / `55101` / `54101`, Kredit Utang `21101` / `21102` / `22101`).
    - `createPayment`: Pelunasan tagihan AP via transfer bank atau kas pool dengan posting jurnal otomatis.
  - `ArService`:
    - `createDownPaymentReceipt`: Penerimaan DP sewa wisata 30% (Skenario 2) dengan posting jurnal Debit Bank BCA `11104` dan Kredit `24101 Pendapatan Diterima di Muka (DP Sewa Wisata)`.
    - `createCharterPelunasanInvoice`: Penerbitan faktur pelunasan 70% kontrak sewa wisata terkait SPJ dan Customer ke akun `12101`.
    - `createReceipt`: Pencatatan pelunasan piutang dengan alokasi invoice dan posting jurnal Debit Bank `11104`, Kredit Piutang `12101`.
- **REST Endpoints & Controllers**:
  - AP Endpoints: `GET /api/v1/ap/unbilled-spjs/:restaurantId`, `POST /api/v1/ap/restaurant-bill`, `POST /api/v1/ap/invoices`, `GET /api/v1/ap/invoices`, `GET /api/v1/ap/invoices/:id`, `PUT /api/v1/ap/invoices/:id/approve`, `PUT /api/v1/ap/invoices/:id/cancel`, `POST /api/v1/ap/payments`, `GET /api/v1/ap/payments`.
  - AR Endpoints: `POST /api/v1/ar/down-payment`, `POST /api/v1/ar/charter-pelunasan`, `POST /api/v1/ar/invoices`, `GET /api/v1/ar/invoices`, `GET /api/v1/ar/invoices/:id`, `PUT /api/v1/ar/invoices/:id/approve`, `POST /api/v1/ar/receipts`, `GET /api/v1/ar/receipts`, `GET /api/v1/ar/charter-status/:tripId`.
- **Frontend Halaman, Modal Terpadu & Penyempurnaan UI/UX (`ss-travel-frontend`)**:
  - Services `ApService` (`src/services/ap.service.ts`) dan `ArService` (`src/services/ar.service.ts`) terstandarisasi tanpa leading slash.
  - Halaman **Tagihan Vendor / AP Invoices (`/ap-invoices`)**: 4 kartu metrik live, tab daftar tagihan vs riwayat pembayaran, modal **`[+ Tagihan Servis Makan Restoran]`** dengan dialog **`[+ Tarik SPJ Belum Ditagih]`**, modal **`[+ Tagihan Vendor Bengkel / Umum]`**, modal **`[Bayar Faktur AP]`**, dan modal detail faktur AP dengan preview jurnal terposting.
  - Halaman **Piutang Usaha / AR Invoices (`/ar-invoices`)**: 4 kartu metrik piutang & DP, modal **`[+ Terima DP Sewa Wisata (30%)]`** (Skenario 2), modal **`[+ Invoice Pelunasan Wisata (70%)]`**, modal **`[+ Invoice Piutang Umum (AR)]`**, modal **`[Pelunasan Piutang]`**, dan modal detail invoice AR.
  - **Penyempurnaan Ergonomi & Tata Letak Modal (UI/UX Overhaul)**:
    - *Pelebaran Modal Transaksi*: Seluruh modal diperlebar secara proporsional (`max-w-5xl` / `1024px+` untuk faktur tagihan AP, AR umum, dan tagihan berkala RM; `max-w-2xl` / `672px` untuk DP 30%, Pelunasan 70%, Bukti Bayar AP, dan Bukti Terima AR).
    - *Pengelompokan Akun COA Terstruktur (`<optgroup>`)*: Mengatasi kebingungan user dalam memilih akun buku besar dengan menyusun dropdown COA ke dalam kategori fungsional resmi akuntansi bus (51 Beban Langsung Armada, 52 Beban Tol & Parkir, 53 Beban Kru, 54 Beban Keagenan, 55 Beban Perawatan Bengkel & Sparepart, 57 Beban Umum & Pool, 211 Utang Usaha Vendor, 212 Utang Gaji & Akrual, 121 Piutang Usaha, 41 Pendapatan AKAP, 42 Pendapatan Wisata) lengkap dengan badge rekomendasi template otomatis (`★ Rekomendasi Template`).
    - *Layout Kartu Berjenjang (Two-Tier Line Items)*: Menghilangkan kesan sempit dan penumpukan input pada rincian baris biaya dengan memisahkan baris atas (Deskripsi barang/jasa & pilihan armada bus) dan baris bawah (Pilihan Akun COA Debit/Kredit, Qty, Harga Satuan format titik, tombol hapus, dan subtotal dinamis).
    - *Pemisah Ribuan & Shortcut Pelunasan*: Format mata uang otomatis titik (`.`) saat pengetikan nominal dan tombol pintas *"Bayar Lunas"* untuk kalkulasi seketika.
- **Verifikasi Kualitas Penuh**:
  - 22 unit test suites backend (136 tests total) lulus 100%.
  - Frontend TypeScript `yarn build` sukses 100% bebas error.

### 2026-10-21: Stage 7 Completed — Meja Kasir Pool, Settlement Kas Kru, & Resolusi Selisih Kasir (Anti-Netting)
- **Model Database & Migrasi PostgreSQL (`crew_cash_settlements`, `crew_cash_remittances`, `crew_cash_remittance_allocations`, `crew_cash_discrepancies`)**:
  - `crew_cash_settlements`: Header dokumen rekonsiliasi kas meja kasir pool per SPJ (`settlement_no`, `status`: `DRAFT`, `SUBMITTED`, `VERIFIED`, `REJECTED`), status independen Dua Kantong Kas Kru (`uj_status`: `PENDING`, `BALANCED`, `DISCREPANCY`; `revenue_status`: `PENDING`, `MATCHED`, `DISCREPANCY_RECORDED`), pelacakan kas fisik kasir (`total_cash_received`, `total_cash_paid`), nomor voucher resmi kasir (`bkm_no`, `bkk_no`), dan foreign key ke jurnal rekonsiliasi yang terbentuk (`journal_entry_id`).
  - `crew_cash_remittances`: Pencatatan setoran uang fisik aktual bruto penerimaan dari kru bus ke laci kasir pool (`remittance_no`, `depositor_crew_id`, `amount`, `cash_account_id`, `payment_method`: `CASH`, `BANK_TRANSFER`, `status`: `VERIFIED`).
  - `crew_cash_remittance_allocations`: Tabel relasi pelunasan setoran kas aktual ke masing-masing deklarasi tiket fisik dan kargo paket bagasi bus.
  - `crew_cash_discrepancies`: Register temuan selisih kas kasir (Lapis 2 Jalur Sistemik) (`discrepancy_no`, `source_type`: `UJ_EXPENSE_UNVERIFIED`, `REVENUE_SHORTAGE`, `REVENUE_OVERAGE`, `OTHER`), nominal selisih `difference_amount`, alasan kru, kronologi telematika GPS, status resolusi (`PENDING_INVESTIGATION`, `RESOLVED`, `REJECTED`), keputusan Finance Manager (`COMPANY_WAIVER`, `CHARGE_TO_CREW`, `ALLOCATION_CORRECTION`), dan akun buku besar tujuan (`resolution_account_id`: `58101` atau `12901`).
  - Migrasi `1781800000000-create-crew-cash-settlements-and-discrepancies.ts` dan seeder data riil Skenario 1 (AKAP normal seimbang) & Skenario 4 (nota BBM darurat Palimanan hilang Rp 300rb dalam investigasi FM) `1888888888895-SeedCashierSettlementData.ts` sukses dieksekusi 100% pada PostgreSQL.
- **Service Layer & Domain Accounting Engine (`ss-travel-backend`)**:
  - `CashierSettlementService`:
    - Perhitungan real-time Dua Kantong Kas Kru (Anti-Netting) dari mutasi database live.
    - Gerbang validasi kelayakan settlement: hanya dapat berstatus `VERIFIED` bila `uj_status === 'BALANCED'` dan `revenue_status === 'MATCHED' | 'DISCREPANCY_RECORDED'`.
    - Otomatisasi penerbitan nomor Bukti Kas Masuk (BKM) dan Bukti Kas Keluar (BKK) kru via `DocumentSequenceService`.
    - Posting Jurnal Rekonsiliasi SPJ atomik via `AccountingPostingService`: menutup saldo UJ `13101` ke Rp 0, mendebit `11101` Kas Pool untuk kas fisik bersih, mendebit beban-beban operasional sah, dan mengkredit pendapatan.
    - Kemerdekaan Tutup Buku Bulanan (*Period Closing Unblocked*): Pengalihan selisih kas yang masih dalam investigasi ke akun penampung `11999 Selisih Kas Operasional Sementara` sehingga penutupan buku bulanan tidak terblokir.
  - `CashierDiscrepancyService`:
    - Pencatatan temuan selisih transparan (Lapis 2 Jalur Sistemik) dengan pengubahan status SPJ ke `DISCREPANCY`.
    - Otorisasi Putusan Finance Manager:
      - Opsi A (`COMPANY_WAIVER`): Membebankan selisih ke perusahaan (akun `58101 Beban Selisih Kasir Pool`), mengubah status UJ ke `BALANCED`, dan memposting jurnal rekonsiliasi SPJ seimbang (Skenario 4 Kasus 2).
      - Opsi B (`CHARGE_TO_CREW`): Mengakui piutang klaim kru (akun `12901 Piutang Klaim Selisih Kas Kru`), mengubah status UJ ke `BALANCED`, dan memposting jurnal rekonsiliasi SPJ seimbang.
- **REST API Endpoints & RBAC Security**:
  - Cashier Desk: `GET /api/v1/cashier/pending-spjs`, `GET /api/v1/cashier/settlements`, `GET /api/v1/cashier/spjs/:spjId/summary`, `POST /api/v1/cashier/settlements`, `POST /api/v1/cashier/settlements/:id/unblock-period-closing`.
  - Discrepancy Hub: `GET /api/v1/cashier/discrepancies`, `GET /api/v1/cashier/discrepancies/:id`, `POST /api/v1/cashier/discrepancies`, `PUT /api/v1/cashier/discrepancies/:id/resolve`.
- **Frontend Halaman Meja Kasir Pool (`/cashier`) & Modal Terpadu (`ss-travel-frontend`)**:
  - Service `CashierService` (`src/services/cashier.service.ts`) terstandarisasi tanpa leading slash.
  - Halaman **Meja Kasir Pool (`src/pages/cashier/index.tsx`)**: 4 kartu metrik live (SPJ Siap Settle, Menunggu Investigasi FM, Settlement Tuntas, Kas Fisik Masuk Hari Ini) dan 3 Tab navigasi (SPJ Siap Rekonsiliasi, Riwayat Dokumen Settlement, dan Pusat Investigasi Selisih FM Hub).
  - Modal **Rekonsiliasi Kasir Pool (`CashierSettlementModal.tsx`)**:
    - Kartu visual Kantong 1 Uang Jalan (Plafon vs Nota vs Sisa Fisik Kembali) dengan indikator saldo & badge status.
    - Kartu visual Kantong 2 Setoran Kas Kru dengan kalkulator bantuan Musyawarah Kru di Meja Kasir (Lapis 1).
    - Ringkasan fisik laci kasir pool (BKM masuk, BKK keluar pembayaran tunai hak kru, net kas pool).
  - Modal **Otorisasi Putusan Manajer Keuangan (`DiscrepancyResolutionModal.tsx`)**:
    - Layar khusus Finance Manager untuk menelaah temuan kasir, alasan kru, dan bukti telematika GPS.
    - Pilihan putusan radio interaktif (Dispensasi Perusahaan `58101` vs Klaim Piutang Kru `12901`) dan eksekusi posting jurnal SPJ seimbang.
  - Modal **Voucher Resmi Kasir BKM & BKK (`CashReceiptVoucherModal.tsx`)**:
    - Tampilan tanda terima resmi PT SS Traveling Indonesia siap cetak fisik printer (`window.print()`).
  - Modal **Pencatatan Selisih Sistemik Kasir (`CreateDiscrepancyModal.tsx`)**.
  - Pendaftaran rute baru `/cashier` di `AppRouter`.
- **Verifikasi Kualitas Penuh**:
  - 20 unit test suites backend (129 tests total) lulus 100%.
  - Frontend TypeScript `yarn build` sukses 100% bebas error.

### 2026-10-21: Stage 6 Completed — Uang Jalan (UJ), Biaya Operasional SPJ (BBM/Tol), & Deklarasi Penerimaan Kas Kru (Anti-Netting)
- **Model Database & Migrasi PostgreSQL (`spj_expenses`, `spj_uj`, `spj_uj_disbursements`, `spj_uj_expenses`, `spj_uj_returns`, `spj_uj_additional_requests`, `spj_revenue_declarations`, `crew_meal_payments`)**:
  - `spj_expenses`: Pencatatan beban riil perjalanan armada (`expense_type`: `FUEL`, `TOLL`, `PARKING`, `RETRIBUTION`, `RESTAURANT_MEAL_SERVICE`, `COORDINATOR_FEE`, `CREW_LODGING`, `EMERGENCY_REPAIR`, `TOWING`, dll.), metadata solar BBM (volume liter, odometer KM, SPBU lokasi), nomor struk nota, status verifikasi akuntansi (`PENDING`, `APPROVED`, `REJECTED`), dan sumber pendanaan (`UJ`, `OFFICE_CASH`, `OFFICE_BANK`, `CREW_POCKET`, `OFFICE_AP`).
  - `spj_uj`: Rekening amplop pertanggungjawaban UJ per SPJ (`crew_id` pemegang UJ, `status`: `DRAFT`, `DISBURSED`, `BALANCED`, `DISCREPANCY`), akumulasi live (`total_disbursed`, `total_spent`, `total_returned`, `balance`), serta relasi estafet darurat `rollover_from_spj_id` & `rollover_to_spj_id` (Skenario 3).
  - `spj_uj_disbursements`: Pencairan UJ bertahap multi-line (`INITIAL` di pool garasi, `ADDITIONAL` via bank di jalan, `ROLLOVER_IN`), referensi BKK kas keluar, metode pembayaran (`CASH`, `BANK_TRANSFER`, `ROLLOVER`), dan akun sumber.
  - `spj_uj_expenses`: Relasi m:n pemotongan saldo amplop UJ otomatis saat nota lapangan diinput dengan sumber dana UJ.
  - `spj_uj_returns`: Pencatatan fisik pengembalian sisa saldo UJ kru di meja kasir pool saat kepulangan bus (referensi BKM kas masuk, status otomatis `BALANCED` saat saldo habis).
  - `spj_uj_additional_requests`: Form pengajuan tambahan UJ oleh kru di tengah rute dinas dengan persetujuan kasir/dispatcher (`PENDING` ➔ `APPROVED` / `REJECTED`).
  - `spj_revenue_declarations`: Penerapan tegas prinsip **Anti-Netting Kas Kru** (Addendum v1.9 & Skenario 1) untuk tiket tunai langsung naik pool (`TICKET_CASH`), titipan setoran agen terminal (`AGENT_DEPOSIT`), kargo motor (`CARGO_MOTORCYCLE`), kargo paket/kardus (`CARGO_BOX`), dan pelunasan sewa wisata di lapangan (`CHARTER_CASH`).
  - *Dynamic Crew Cargo Commission*: Perhitungan otomatis hak komisi kru kargo (preset 15%, 20%, 25% atau custom) yang otomatis mendaftarkan hak rupiah kru ke tabel `crew_meal_payments` kategori `CARGO_COMMISSION`.
  - `crew_meal_payments`: Manajemen hak kompensasi kru per SPJ (uang makan `MEAL_ALLOWANCE`, premi ritase `TRIP_INCENTIVE`, bonus full-seat `FULL_SEAT_BONUS`, komisi kargo `CARGO_COMMISSION`), status pembayaran (`PENDING`, `PAID`, `CANCELLED`), serta dukungan **Early Payout Mid-Trip** via transfer bank (Skenario 2).
  - Migrasi `1781700000000-create-spj-uj-expenses-and-revenue.ts` dan seeder data riil `1888888888894-SeedSpjFinanceData.ts` sukses dieksekusi 100% pada PostgreSQL.
- **Service Layer & Domain Accounting Logic (`ss-travel-backend`)**:
  - `SpjUjService`: Logika pencairan multi-line, auto-update saldo amplop via `MoneyHelper`, penanganan return fisik, approval tambahan UJ, dan eksekusi estafet **UJ Rollover** saat armada breakdown di tol (Skenario 3).
  - `SpjExpensesService`: Validasi nota fisik & odometer, auto-deduct saldo amplop UJ jika `paymentSource === 'UJ'`, verifikasi kasir, dan pengembalian saldo UJ jika pengeluaran dibatalkan.
  - `SpjRevenueService`: Penegakan prinsip Anti-Netting (kas bruto disetor utuh), perhitungan dinamis komisi kargo kru 20%, dan pendaftaran otomatis kompensasi kru.
  - `CrewMealPaymentsService`: Sinkronisasi otomatis uang makan & premi dari snapshot penugasan kru (`syncFromCrewAssignments`), serta eksekusi transfer uang dapur di tengah perjalanan wisata (`disburseEarlyPayment`, Skenario 2).
- **REST API Endpoints & RBAC Security**:
  - UJ: `GET /api/v1/spjs/:id/uj`, `POST /api/v1/spjs/:id/uj/disburse`, `POST /api/v1/spjs/:id/uj/return`, `POST /api/v1/spjs/:id/uj/additional-request`, `PUT /api/v1/spjs/uj/additional-requests/:requestId/process`, `POST /api/v1/spjs/:id/uj/rollover`.
  - Expenses: `GET /api/v1/spjs/:id/expenses`, `POST /api/v1/spjs/:id/expenses`, `PUT /api/v1/spjs/expenses/:expenseId/verify`, `DELETE /api/v1/spjs/expenses/:expenseId`.
  - Revenues: `GET /api/v1/spjs/:id/revenues`, `POST /api/v1/spjs/:id/revenues`, `PUT /api/v1/spjs/revenues/:revenueId/verify`, `DELETE /api/v1/spjs/revenues/:revenueId`.
  - Crew Payments: `GET /api/v1/spjs/:id/crew-payments`, `POST /api/v1/spjs/:id/crew-payments`, `POST /api/v1/spjs/:id/crew-payments/sync`, `POST /api/v1/spjs/crew-payments/:paymentId/early-disburse`.
- **Frontend `SpjFinanceModal.tsx` & Service Client (`ss-travel-frontend`)**:
  - Service `SpjFinanceService` dengan pemanggilan Axios terstandarisasi tanpa leading slash (`api.get('api/v1/spjs/...')`).
  - Modal komprehensif `SpjFinanceModal` dengan 4 sub-tab:
    1. *Uang Jalan (UJ)*: 4 kartu metrik saldo amplop, tabel multi-line disbursement, riwayat return fisik, dialog pencairan kasir, dan tombol rollover estafet breakdown.
    2. *Biaya Operasional SPJ*: Rincian nota BBM solar (liter + odometer + SPBU), tol, parkir, servis makan, serta tombol verifikasi kasir.
    3. *Deklarasi Penerimaan Kas Kru*: Form tiket langsung & kargo dengan live slider persentase komisi kru (15%, 20%, 25%) dan kalkulator instan net setoran ke kantor.
    4. *Hak Kompensasi Kru*: Daftar hak kompensasi per supir/kondektur, tombol sinkronisasi penugasan, dan modal transfer nafkah keluarga kru di jalan (*Early Payout*).
  - Tombol aksi cepat `[💰 Keuangan & UJ]` pada setiap baris tabel dokumen SPJ dan footer detail SPJ.
- **Verifikasi Kualitas Penuh**:
  - 18 unit test suites backend (121 tests total) lulus 100%.
  - Frontend TypeScript `yarn build` sukses 100% bebas error.

### 2026-10-21: Stage 5 Enhancement — Visualisasi Segmen 2 Leg AKAP, Fleksibilitas Kompensasi Kru (Addendum v1.19), dan Review SPJ Modal
- **Addendum v1.19 Diresmikan di Blueprint**:
  - Membakukan prinsip kesetaraan satuan: Di AKAP $1 \text{ Hari} = 1 \text{ Leg}$ (rute PP = 2 Leg/2 Hari, rute engkel = 1 Leg/1 Hari). Di pariwisata dihitung berdasarkan durasi hari pemakaian kalender ($N \text{ Hari}$).
  - Mengadopsi variabel tipe armada bus (*Unit-Aware Base Rates*): bus mewah (Sleeper/Luxury) memiliki base rate rekomendasi yang berbeda dengan kelas standar.
  - Otorisasi penuh Dispatcher untuk meng-override (*In-SPJ Customizer*) nominal Uang Makan dan Premi Kru secara transparan di modal Review SPJ sesuai kesepakatan lapangan.
  - Opsi waktu pembayaran premi kru: `AT_SETTLEMENT` (bayar di kasir pool saat kepulangan bus) vs `EARLY_DISBURSEMENT` (bayar di muka/transfer saat berangkat).
- **Backend Tri-Module Alignment (`SpjService`, `trip-schedule.dto.ts`, `spj.dto.ts`)**:
  - DTO `GenerateSpjFromScheduleDto` mendukung `isRoundTrip?: boolean` dan array `customCrewRates?: CustomCrewRateDto[]`.
  - DTO `CreateSpjCrewAssignmentDto` mendukung snapshot custom `mealAllowanceSnapshot`, `incentiveSnapshot`, `fullSeatBonusSnapshot`, dan `payoutTiming`.
  - Logika `SpjService.generateFromSchedule` otomatis menghitung multiplier Leg/Hari jika tidak di-override, atau menggunakan nilai kesepakatan dispatcher jika di-override.
- **Frontend `ReviewPublishSpjModal.tsx` & UI Polish**:
  - Visualisasi rute 2 Leg (Arah Berangkat DEPARTURE & Arah Pulang RETURN) vs 1 Leg (ONE-WAY).
  - Tampilan dinamis personel kru yang ditugaskan di masing-masing leg beserta panduan SOP revisi supir di kota transit (Yogyakarta).
  - Panel editor kompensasi kru interaktif: input nominal Uang Makan & Premi per supir/kondektur, toggle waktu pencairan (Kasir Pool vs Bayar Awal), tombol Reset Rekomendasi, dan kalkulator live total kompensasi.
- **Verifikasi Kualitas Penuh**:
  - Frontend TypeScript `yarn build` sukses 100% tanpa error.
  - Backend `yarn build` dan 17 unit test di trips services lulus 100%.

### 2026-10-18: Stage 5 Completed — Perencanaan Jadwal Bus & Eksekusi SPJ (BE + FE)
- **Model Database & Migrasi PostgreSQL (`trip_schedules`, `spjs`, `spj_legs`, `spj_crew_assignments`)**:
  - Model `trip_schedules` sebagai pintu masuk perencanaan jadwal dinas armada (`schedule_no` format `SCH/AKP/YYMM/XXXX`, `service_type`, `vehicle_id`, `planned_departure_at`, `planned_return_at`, `origin`, `destination`, relasi pelanggan CRM wisata `customer_id`, PIC, catatan jemput, `total_package_price`, supir 1, supir 2, kondektur, status `DRAFT`/`CONFIRMED`/`IN_PROGRESS`/`COMPLETED`/`CANCELLED`, dan relasi `spj_id`).
  - Model `spjs` (Surat Perintah Jalan) dengan pemisahan status ganda independen (Blueprint Bab 8.2 & Addendum v1.5): `operational_status` (`DRAFT`, `ISSUED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) dan `financial_status` (`PENDING_SETTLEMENT`, `UNDER_REVIEW`, `DISCREPANCY`, `SETTLED`). Penomoran pintar unik `SPJ/AKP/YYMM/XXXX` atau `SPJ/WIS/YYMM/XXXX`, serta relasi darurat self-referencing `parent_spj_id` untuk penanganan breakdown di jalan (Skenario 3).
  - Model `spj_legs` mendukung segmen perjalanan multi-leg (Leg 1 Berangkat & Leg 2 Pulang untuk AKAP, Leg 1 One-Way untuk wisata), waktu keberangkatan/kedatangan, manifes jumlah penumpang (`passenger_count`), kupon servis makan riil restoran mitra (`meal_pax_count`), dan catatan selisih kupon (`meal_discrepancy_notes`, Addendum v1.12).
  - Model `spj_crew_assignments` dengan dukungan 2–4+ kru fleksibel, pergantian kru sakit mid-trip (`replacement_crew_id`), serta *Rate Snapshotting* otomatis hak kompensasi kru (`meal_allowance_snapshot`, `incentive_snapshot`, `full_seat_bonus_snapshot`, Addendum v1.8 & v1.10).
  - Migrasi `1781600000000-create-trip-schedules-and-spjs.ts` dan seeder data riil `1888888888893-SeedSchedulesAndSpjs.ts` sukses dieksekusi di database PostgreSQL.
- **Engine Validasi Anti-Bentrok Jadwal & Buffer Rest Time (`TripSchedulesService`)**:
  - *Overlap Conflict Formula*: Mendeteksi dan menolak tegas jadwal bertabrakan pada rentang waktu `plannedDepartureAt` s.d. `plannedReturnAt` untuk armada bus yang sama maupun personel kru yang sama.
  - *Buffer Rest Time Alert (Minimal 3 Jam)*: Menghitung selisih waktu antara kepulangan dinas sebelumnya dengan keberangkatan dinas baru (< 180 menit) dan menampilkan peringatan transparan agar kru tidak kelelahan.
  - Integrasi CRM Prospek Sewa Wisata: Mengaitkan akun penyewa, memperbarui `totalTripsCount` dan `lastTripDate`, serta mencatat nilai kontrak sewa paket.
- **State Machine Operasional & Modul SPJ Komprehensif (`SpjService`)**:
  - *Penerbitan SPJ Berbasis Review & Preview (`ReviewPublishSpjModal`)*: Alur penerbitan SPJ dari jadwal kini melalui tahap verifikasi dokumen lengkap di mana dispatcher dapat melihat pratinjau bentuk fisik SPJ resmi, menukar armada, menyesuaikan kru Driver 1/Driver 2/Kondektur di menit-menit akhir, dan menambahkan instruksi dinas khusus sebelum SPJ resmi berstatus ISSUED.
  - Validasi ketat penerbitan SPJ (`issue`): Menolak penerbitan jika tidak memiliki minimal 1 personel berstatus `DRIVER`.
  - Transisi operasional: Keberangkatan bus (`start`) mengaktifkan leg 1 dan kru dinas; kepulangan bus (`complete`) menuntaskan seluruh leg aktif, mencatat `operationallyCompletedAt`, dan mengalihkan status finansial ke `UNDER_REVIEW` (siap direkonsiliasi kasir pool di Tahap 7).
  - *Revisi Kru Mid-Trip (`replaceCrew`)*: Mendukung pergantian supir sakit di kota transit, mengunci status kru lama menjadi `REPLACED` dengan alasan wajib, dan menugaskan kru baru dengan snapshot tarif yang berlaku (Skenario 1 Poin 7).
  - *Emergency Breakdown di Tol (`emergencyReplaceBus`)*: Realisasi Skenario 3 (insiden radiator bus SS-01 jebol di KM 214 Tol Cipali), menutup operasional bus mogok, menerbitkan SPJ pengganti bus SS-03 terhubung `parent_spj_id`, memindahkan manifes 24 penumpang tanpa duplikasi pendapatan tiket, dan melanjutkan penugasan kru estafet.
- **REST API Endpoints Lengkap**:
  - `GET/POST/PUT/DELETE` `/api/v1/trip-schedules`, `/api/v1/trip-schedules/calendar`, `/api/v1/trip-schedules/check-conflict`, `/api/v1/trip-schedules/:id/confirm`, `/api/v1/trip-schedules/:id/cancel`, `/api/v1/trip-schedules/:id/generate-spj`
  - `GET/POST` `/api/v1/spjs`, `/api/v1/spjs/:id/issue`, `/api/v1/spjs/:id/start`, `/api/v1/spjs/:id/complete`, `/api/v1/spjs/:id/replace-crew`, `/api/v1/spjs/:id/emergency-replace-bus`, `/api/v1/spjs/legs/:legId`
  - Terproteksi RBAC `@RequirePermissions('TripSchedules:...')` dan `@RequirePermissions('SPJ:...')`.
- **Frontend Interaktif & Lengkap (2 Halaman Baru + 6 Komponen Modal)**:
  - Halaman **Jadwal & Plotting Armada (`/schedules`)**:
    - Tab **Kalender Timeline Armada (Gantt Chart)**: Visualisasi per baris untuk 10 armada bus `SS-01` s.d. `SS-10`, balok warna status dinas (AKAP ungu, Wisata kuning, Shuttle hijau), navigasi rentang tanggal, tooltip detail rute, supir, jam, dan tombol terbitkan SPJ.
    - Tab **Daftar Jadwal (Tabel View)**: Filter layanan, filter status, filter rentang tanggal dengan preset cepat (Hari Ini, Bulan Ini, Reset), live search, dan tombol-tombol aksi cepat.
    - Modal **Booking Jadwal Baru (`ScheduleModal`)**: Layout lega, autocomplete CRM pelanggan wisata, selector armada & 3 kru, serta tombol live `[⚡ Cek Bentrok & Buffer Rest]` dengan kotak peringatan visual.
    - Modal **Review & Terbitkan SPJ (`ReviewPublishSpjModal`)**: Tampilan pratinjau dokumen fisik SPJ resmi, nomor urut preview, editor armada & supir menit terakhir, catatan instruksi perjalanan, dan toast sukses ber-link langsung ke halaman SPJ.
  - Halaman **Operasional SPJ Dispatcher (`/spjs`)**:
    - Kartu metrik ringkasan (Aktif di Rute, Siap Berangkat, Menunggu Kasir, Finansial Selesai).
    - Tabel monitoring SPJ dengan badge status ganda independen (Layanan, Operasional, dan Finansial PENDING SETTLEMENT / UNDER_REVIEW / SETTLED).
    - Modal **Detail SPJ (`SpjDetailModal`)**: Rincian legs, kupon makan RM mitra, kartu snapshot tarif hak kru (Makan, Premi, Bonus Full Seat), serta tombol kontrol operasional (`Jalan`, `Selesai`).
    - Modal **Pergantian Kru Mid-Trip (`ReplaceCrewModal`)**: Form revisi supir sakit di jalan.
    - Modal **Emergency Breakdown di Tol (`EmergencyReplaceBusModal`)**: Form Skenario 3 pemindahan 24 penumpang ke bus pengganti.
  - Komponen **Dialog Konfirmasi Reusable (`ConfirmDialog`)**: Menggantikan seluruh `window.confirm` dan `window.prompt` bawaan browser dengan modal dialog UI bertema harmonis (danger, warning, info, prompt input alasan pembatalan).
- **Verifikasi Kualitas Penuh**:
  - 108 unit tests backend (14 test suites) lulus 100%, termasuk pengujian overlap conflict, buffer time, issue driver validation, dan emergency replacement.
  - Frontend TypeScript `yarn build` sukses 100% tanpa warning/error.

### 2026-10-18: Stage 4 Completed — Accounting Core Engine & Jurnal Umum (BE + FE)
- **Model & Database Migration Jurnal (`journal_entries`, `journal_lines`, `accounting_events`)**:
  - Model `journal_entries` dengan penomoran unik `journal_no` (`JV/YYMM/XXXX`), tanggal jurnal, `source_type` (`MANUAL`, `SPJ`, `AR_INVOICE`, `AP_INVOICE`, `CASH_TRANSACTION`, `BANK_TRANSACTION`, `SETTLEMENT`, `PERIOD_CLOSING`, `DEPRECIATION`), relasi periode fiskal `period_id`, `status` (`POSTED`, `REVERSED`), total debit & kredit numeric(20,2), audit trail posting (`posted_by`, `posted_at`), dan self-referencing reversal `reversal_of_id`.
  - Model `journal_lines` multi-dimensi per baris transaksi: `account_id`, debit, kredit, keterangan, dan dimensi analitik opsional (`business_unit_id`, `cost_center_id`, `profit_center_id`, `trip_id`, `trip_leg_id`, `vehicle_id`, `counterparty_type`, `counterparty_id`).
  - Model `accounting_events` dengan constraint unik `idempotency_key` untuk proteksi mutlak anti-duplikasi posting.
  - Migrasi `1781500000000-create-journals-and-accounting-events.ts` sukses dieksekusi di database PostgreSQL.
- **Posting Satu Pintu Atomik (`AccountingPostingService`)**:
  - Implementasi single entry point transaksi akuntansi dengan `DataSource.transaction()` atau penerimaan `EntityManager` eksternal dari modul operasional (SPJ/Kasir).
  - Validasi ketat invariant akuntansi:
    1. Validasi idempotensi (`idempotency_key`).
    2. Validasi periode terbuka (`FiscalPeriodsService.findOpenPeriodForDate`), otomatis menolak posting ke periode berstatus `CLOSED`.
    3. Validasi minimal 2 baris transaksi, nilai non-negatif, larangan debit dan kredit terisi sekaligus dalam 1 baris, dan larangan baris bernilai nol.
    4. Validasi akun COA: wajib aktif (`isActive = true`) dan wajib berstatus detail (`isPostable = true`), menolak tegas posting ke akun induk/header.
    5. Validasi keseimbangan ganda: Total Debit == Total Kredit via `MoneyHelper.isBalanced()`.
    6. Penomoran dokumen concurrency-safe atomik via `DocumentSequenceService` dengan kode `JOURNAL_ENTRY` format `JV/YYMM/XXXX`.
    7. Perekaman otomatis `accounting_events` untuk auditabilitas.
    8. Dukungan kueri fleksibel: pencarian teks, rentang tanggal (default bulan berjalan), filter unit bisnis (`businessUnitId`), filter armada bus, filter SPJ, serta pengurutan dinamis (`journalDate` / `createdAt` ASC/DESC).
- **Mekanisme Reversal Abadi & Proteksi Anti-Desinkronisasi (`JournalReversalService`)**:
  - Prinsip akuntansi anti-edit/anti-hapus: Jurnal berstatus `POSTED` tidak dapat diedit atau dihapus secara langsung.
  - Reversal otomatis: Memvalidasi jurnal asal, memastikan status `POSTED`, memastikan belum pernah di-reverse, memvalidasi periode terbuka pada tanggal reversal, menukar seluruh baris transaksi (Debit $\to$ Kredit, Kredit $\to$ Debit), menautkan `reversal_of_id`, menandai status jurnal asal menjadi `REVERSED`, menerbitkan jurnal pembalik baru, dan mencatat accounting event `REVERSED`.
  - **Proteksi Jurnal Operasional**: Backend menolak tegas pembatalan manual langsung atas jurnal bersumber operasional (`SPJ`, `AR_INVOICE`, `AP_INVOICE`, `CASH`, `BANK`) jika tanpa flag operasional, mewajibkan koreksi diproses dari menu dokumen asalnya agar data lapangan tetap sinkron.
- **REST API Controller Lengkap (`JournalsController`)**:
  - `GET /api/v1/journals`: Kueri daftar jurnal dengan paginasi, limit selector, dan filter kaya (tanggal, status, sumber, akun, armada bus, unit bisnis, SPJ, live search, sort by date/createdAt).
  - `GET /api/v1/journals/:id`: Detail komprehensif jurnal beserta seluruh baris dan relasi akun/dimensi.
  - `POST /api/v1/journals/manual`: Pembuatan dan posting jurnal memorial seimbang.
  - `POST /api/v1/journals/:id/reverse`: Aksi reversal jurnal terposting dengan alasan wajib.
  - Terproteksi RBAC `@RequirePermissions('Journals:read')`, `'Journals:create'`, `'Journals:update'`.
- **Frontend Interaktif & Lengkap (Halaman `/journals`)**:
  - Halaman **Daftar Jurnal Umum (`/journals`)**:
    - **Filter Default Bulan & Tahun Berjalan**: Otomatis menyaring transaksi tanggal 1 s.d. akhir bulan berjalan dengan badge indikator periode dan tombol aksi cepat `Reset (Bulan Ini)` serta `Semua Periode`.
    - **Pemisahan Unit Bisnis Mandiri**: Kolom khusus **Unit Bisnis** di tabel utama (Badge ungu `AKAP`, badge biru `WISATA`, badge hijau `SHUTTLE`, dan netral `Kantor Pusat`), serta dropdown filter unit bisnis terdedikasi bagi PIC Keuangan AKAP dan PIC Keuangan Wisata.
    - **Pengurutan Ganda Fleksibel**: Header tabel `Tanggal Jurnal` dan `Waktu Input` interaktif dapat diklik langsung untuk beralih ASC/DESC, serta pemilih urutan terkelompok di toolbar.
    - **Pemilih Limit Halaman**: Pilihan 10, 15, 25, 50, dan 100 baris per halaman pada bar paginasi.
    - **SOP & Panduan Edukasi**: Banner interaktif di atas tabel yang menjelaskan bahwa 95% jurnal dibuat otomatis oleh sistem dan dilarang menginput transaksi perjalanan bus secara manual.
    - **Proteksi Tombol Reversal + Tooltip Pemandu**: Untuk jurnal operasional (`SPJ`, `AR_INVOICE`, dsb.), tombol reverse tetap terlihat namun berstatus *disabled* dengan tooltip instruksi menuju menu dokumen asal.
  - Modal **Detail Jurnal (`JournalDetailModal`)**: Rincian baris jurnal debet-kredit, informasi akun COA, badge dimensi terikat (Unit Bisnis, armada bus, cost center, SPJ), banner status reversal, dan proteksi tombol reversal yang konsisten.
  - Modal **Entri Jurnal Memorial (`CreateJournalModal`)**:
    - Desain Spacious Card Layout yang lega (bukan tabel padat).
    - 11 template transaksi operasional cepat dengan mekanisme auto-reset input.
    - Dropdown COA terkelompok (Grouped Select) berdasarkan 6 kategori utama (Aset, Liabilitas, Ekuitas, Pendapatan, Beban, Non-Ops).
    - Dropdown dimensi Unit Bisnis (`AKAP` / `WISATA` / `Kantor Pusat`) di tiap baris.
    - Tombol cerdas **"Setimbang"** (Auto-balance) untuk menghitung selisih otomatis.
    - Real-time Balance Checker Widget interaktif.
    - Kotak peringatan anti-salah penggunaan di bagian atas form.
  - Modal **Pembalik Jurnal (`ReverseJournalModal`)**: Dialog konfirmasi pembalikan jurnal dengan input alasan wajib dan tanggal reversal.
  - Service client `journal.service.ts` terstandarisasi tanpa leading slash sesuai aturan CORS.
- **Verifikasi Kualitas Penuh**:
  - 91 unit tests backend (12 test suites) lulus 100%, termasuk pengujian penolakan reversal non-manual.
  - 12 E2E tests (3 test suites) lulus 100% dengan mekanisme self-cleaning teardown di `afterAll`.
  - Frontend TypeScript `yarn build` sukses 100% tanpa warning/error.

### 2026-10-17: Stage 3 Completed — Master Aturan Bisnis & Tarif Lapangan (BE + FE)
- **Kalender Musim & Matriks Tarif Tiket Dinamis (`fare_seasons` & `fare_matrix`)**:
  - Model & tabel `fare_seasons` (Reguler, Tuslah Lebaran 1447H, Peak Season Liburan Sekolah) dan `fare_matrix` berversi multi-dimensi per rute, kelas kursi bus (`seat_classes`), dan tanggal perjalanan.
  - Implementasi `FaresService.calculateFare`: Dynamic pricing calculation engine: `Harga Tiket = f(Rute, Musim/Tuslah, Kelas Kursi)` dengan fallback otomatis ke musim REGULER jika tidak ada tuslah khusus (Addendum v1.6 & v1.17).
- **Mitra Agen Penjualan & Aturan Komisi (`agents` & `agent_commission_rules`)**:
  - Model & tabel `agents` (Agen Fisik Loket vs Online OTA) dan `agent_commission_rules` berjenjang per kelas kursi (Flat Rp / tiket) maupun persentase (10% platform OTA).
  - Smart Filter Arah Rute Leg (`findAgentsByRoute`): Mencegah kru bus salah memilih agen kota tujuan di leg keberangkatan saat deklarasi manifest (Addendum v1.7).
  - Engine kalkulasi komisi otomatis: Menghitung hak potongan komisi agen dan net penerimaan disetor ke perusahaan.
- **Standar Kompensasi & Tarif Kru (`crew_rate_rules`)**:
  - Model & tabel `crew_rate_rules` untuk supir 1, supir 2, kondektur, dan pramugari bus.
  - Dua basis skema: AKAP PP Trayek (`PER_TRIP` - Uang Makan + Premi Ritase + Bonus Full Seat 100%) vs Sewa Wisata (`PER_DAY` - Uang Makan Harian + Premi Harian dikali durasi hari sewa tanpa bonus full seat).
  - Engine *Rate Snapshotting* SPJ: Menjamin hak kru di-snapshot saat SPJ terbit sehingga kebal terhadap fluktuasi master data tarif di kemudian hari (Addendum v1.8).
- **Restoran Mitra & Fee Koordinator Lapangan (`restaurants` & `coordinator_fee_rules`)**:
  - Model & tabel `restaurants` mitra servis makan AKAP (RM Taman Selera Subang, RM Raos Eco Gringsing, RM Kendil Mas Batang) dengan tarif kupon Rp 25.000/pax dan pemisahan mekanisme pembayaran (Invoice AP Bulanan vs Tunai Kasir/UJ Kru).
  - Model & tabel `coordinator_fee_rules` membedakan Zone WEST (Jabodetabek) dan Zone EAST (Jateng & DIY) dengan fee standar Rp 10.000/pax (Addendum v1.9).
- **Seeder & Database Migration**:
  - Migrasi `1781400000000-create-pricing-and-rules.ts` mengeksekusi 8 enum & 7 tabel TypeORM.
  - Seeder `1888888888892-SeedPricingAndMasterRules.ts` mengisi seluruh data real-world: 3 musim tarif, 48 matriks tarif rute Tangerang/Jakarta <-> Yogya untuk 4 kelas kursi, 4 agen terminal fisik + 2 OTA, aturan komisi flat & 10%, 8 master rate kru AKAP & Wisata, 3 RM mitra, dan aturan korlap 2 zona.
- **Frontend Interaktif & Lengkap (4 Halaman Baru)**:
  - Halaman **Matriks Tarif & Musim Tiket (`/fares`)**: Matriks harga tiket, kalender musim, dan widget **Kalkulator Dinamis Simulator**.
  - Halaman **Mitra Agen & Aturan Komisi (`/agents`)**: Manajemen agen loket vs OTA, modal aturan komisi, serta **Validasi Smart Filter Arah Rute Leg & Kalkulator Komisi**.
  - Halaman **Standar Kompensasi Kru (`/crew-rates`)**: Tabel tarif kompensasi kru dan widget **Simulasi Rate Snapshotting SPJ**.
  - Halaman **Restoran Mitra & Korlap (`/partners`)**: Manajemen rumah makan servis makan, fee korlap zona Barat/Timur, serta widget **Simulasi Servis Makan & Fee Korlap**.
  - 4 API service clients baru (`fare.service.ts`, `agent.service.ts`, `crew-rate.service.ts`, `partner.service.ts`).
- **Verifikasi Kualitas Penuh**:
  - 71 unit tests backend (10 test suites) lulus 100%.
  - Frontend TypeScript `yarn build` sukses 100% tanpa warning/error.

### 2026-10-16: Stage 2 Completed — Master Keuangan, Hierarki COA (Kelompok 1-8), Kas/Bank & Periode Fiskal (BE + FE)
- **Bagan Akun Akuntansi / COA (`accounts`)**:
  - Model & tabel `accounts` dengan hierarki parent-child, tipe (`ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`), saldo normal (`DEBIT`, `CREDIT`), dan indikator `is_postable`.
  - Migrasi `1781300000000-create-finance-master.ts` & seeder `1888888888891-SeedFinanceMaster.ts` mengonfigurasi seluruh 55+ akun standar industri bus (Kelompok 11101 s.d. 82101 sesuai Blueprint Bab 6.2), termasuk akun penampung selisih kasir `11999` dan piutang klaim kru `12901` (Skenario 4).
  - Backend `AccountsService` & `AccountsController`: Validasi kode unik, pencegahan circular relation antar-akun parent-child, kueri pohon hierarki dinamis, dan proteksi hapus jika memiliki sub-akun.
- **Manajemen Kas & Rekening Bank Korporat (`cash_accounts` & `bank_accounts`)**:
  - Rekening kas fisik (`cash_accounts`) terikat ke GL Account (`11101`, `11102`, `11103`), petugas kasir custodian, dan cost center (Pool Ciputat, Cabang Yogya, Kas Kecil Garasi).
  - Rekening bank korporat (`bank_accounts`) terikat ke akun GL `11104` dengan proteksi masking otomatis pada nomor rekening publik (`account_number_masked`, misal `•••• •••• 4370`) untuk keamanan audit & privasi.
- **Tahun & Periode Fiskal Bulanan (`fiscal_years` & `fiscal_periods`)**:
  - Model & tabel kalender akuntansi bulanan (Januari s.d. Desember 2026) dengan status `OPEN`, `CLOSING`, `CLOSED`, dan `REOPENED`.
  - Metode `findOpenPeriodForDate`: Memvalidasi tanggal transaksi jurnal secara ketat dan otomatis menolak posting transaksi pada periode yang berstatus `CLOSED`.
  - Otomasi pembuatan 12 periode bulanan saat pembuatan tahun fiskal baru.
- **Generator Nomor Transaksi Concurrency-Safe (`document_sequences`)**:
  - Mengimplementasikan `DocumentSequenceService` dengan *pessimistic write lock* (`pessimistic_write`) pada tabel `document_sequences` untuk generator nomor transaksi atomik tanpa risiko duplikasi atau race condition (misal `SPJ/AKP/2610/0001`, `BKM/2610/0001`, `JV/2610/0001`).
- **Frontend Interaktif & Lengkap (3 Halaman Baru)**:
  - Halaman **Bagan Akun / COA (`/accounts`)**: Toggle visual antara **Pohon Hierarki (Tree View)** dengan cabang expandable dan **Daftar Tabel (Flat View)**, kartu statistik akun per kelompok, filter tipe akun, dan modal tambah/edit akun.
  - Halaman **Kas & Rekening Bank (`/cash-bank`)**: Tab Kas Operasional Pool vs Tab Rekening Bank Korporat dengan tampilan kartu perbankan modern dan modal form CRUD lengkap.
  - Halaman **Periode Fiskal Akuntansi (`/fiscal-periods`)**: Dropdown pemilih tahun fiskal, tabel 12 periode bulanan, status badge warna-warni, serta modal ubah status periode (kunci/tutup periode dan buka kembali dengan alasan wajib).
  - Service clients (`account.service.ts`, `cash-bank.service.ts`, `fiscal-period.service.ts`) terstandarisasi tanpa leading slash sesuai aturan CORS.
- **Verifikasi Kualitas Penuh**:
  - 49 unit test backend (6 test suites) lulus 100% termasuk suite baru `accounts.service.spec.ts` dan `document-sequence.service.spec.ts`.
  - 6/6 E2E tests lulus 100%.
  - Frontend TypeScript `vite build` 100% sukses tanpa warning/error.

### 2026-10-16: Stage 1 Feature Expansion — Customer Detail Modal & Preparation for SPJ Order History
- **Modal Detail Pelanggan CRM (`CustomerDetailModal`)**:
  - Diterapkan pada halaman `/customers`: Mengklik baris tabel pelanggan atau tombol mata (*Eye*) membuka modal detail yang komprehensif.
  - Profil Klien & Penanggung Jawab (PIC): Menampilkan nama instansi, nama PIC panitia, nomor kontak WhatsApp (lengkap dengan tombol aksi langsung `Chat WA` via tautan `wa.me`), email penawaran, serta alamat lengkap titik kumpul penjemputan armada.
  - Metrik Loyalitas CRM: Kartu ringkasan total frekuensi sewa wisata (`totalTripsCount`), tanggal sewa terakhir (`lastTripDate`), dan asal sumber prospek (`leadSource`).
  - Preferensi Sewa Khusus: Menampilkan *special notes* (seperti bus langganan atau supir favorit).
  - Seksi Riwayat Kontrak SPJ Wisata (*History Order*): Disiapkan wadah integrasi untuk otomatis menampilkan manifes nomor SPJ, armada yang ditugaskan, dan invoice pelunasan sewa begitu modul operasional SPJ diaktifkan pada **Tahap 5**.
- **Verifikasi Kualitas Penuh**:
  - Kompilasi TypeScript frontend `yarn build` lulus 100% tanpa error.

### 2026-10-16: Stage 1 Feature Expansion — Galeri Foto Multi-Image Armada Bus (`vehicle_images`), Modal Detail Bus, & Blueprint Addendum v1.18 Locked
- **Galeri Foto Multi-Image Armada (`vehicle_images`)**:
  - Model & tabel `vehicle_images` terhubung *One-to-Many* (1:N) dengan `vehicles` (`onDelete: 'CASCADE'`).
  - Atribut lengkap: `imageUrl`, `caption`, `is_primary` (penanda foto cover utama), `sequence` (urutan carousel), dan `is_active`.
  - Migrasi `1781200000000-create-vehicle-images.ts` mengeksekusi skema dan men-seed foto eksterior modern (Jetbus 5) serta interior kabin mewah untuk seluruh 10 armada bus existing.
  - Endpoint REST API: `POST /api/v1/vehicles/:id/images`, `DELETE /api/v1/vehicles/:id/images/:imageId` dan penanganan multi-image di form create/update vehicle.
- **Kartu Armada Visual & Cover Showcase**:
  - Kartu bus di `/vehicles` kini menampilkan foto cover beresolusi tinggi dengan rasio sinematik, badge nomor lambung & nopol melayang, serta badge indikator jumlah foto galeri (`X Foto`).
  - Efek hover interaktif dan pointer mouse mengundang user untuk mengklik kartu.
- **Modal Detail Armada Bus (`VehicleDetailModal`)**:
  - Dialog modal mewah terbuka saat kartu bus diklik:
    - Banner foto bus berukuran besar dengan *Thumbnail Selector* untuk beralih foto dengan mulus.
    - Informasi spesifikasi fisik: Tipe bus, total kapasitas, tahun rakit, chasis mesin, karoseri bodi, dan status kepemilikan aset (Lunas / Leasing).
    - Kartu rincian zona kelas kursi (*Multi-Class*): Menampilkan rincian kuota kursi, layout denah, dan deskripsi fasilitas kabin (AVOD, bantal, selimut, legrest, dsb.) bersumber dari master `seat_classes`.
    - Badge penanda kesiapan katalog website (*Website Catalog Ready*).
    - Tombol cepat untuk langsung beralih ke form *Edit Data Bus* (jika memiliki hak akses).
- **Form Galeri Foto pada Tambah / Edit Bus (`VehicleModal`)**:
  - Seksi baru: *Galeri Foto Armada (Landing Page Catalog)* untuk menambah URL gambar, keterangan foto (caption), dan tombol *Set Cover* untuk memilih foto sampul utama.
- **Blueprint Addendum v1.18 Locked**:
  - Menambahkan bab **Addendum v1.18 — Galeri Foto Multi-Image Armada Bus (`vehicle_images`) untuk Kesiapan Landing Page Publik SS Traveling** di `.gemini/blueprint/blueprint-sistem-keuangan-perusahaan-bus-v1.3.md`.
- **Verifikasi Kualitas Penuh**:
  - 34 unit test backend (termasuk mock suite baru image repository) lulus 100%.
  - 6/6 E2E tests lulus 100%.
  - Frontend `vite build` lulus 100% tanpa warning/error.

### 2026-10-16: Stage 1 Refinement — Master Data Standar Kelas Kursi (`seat_classes`) & Blueprint Addendum v1.17 Locked
- **Master Data Kelas Kursi Mandiri (`seat_classes`)**:
  - Memisahkan master kelas kursi dari enum lokal menjadi entitas tersendiri (`seat_classes`) dengan atribut `id`, `company_id`, `code` (unik), `name`, `default_layout`, `description`, dan `is_active`.
  - Mengintegrasikan relasi Foreign Key pada `vehicle_seat_classes.seat_class_id` dengan `ON DELETE RESTRICT` untuk mencegah inkonsistensi data saat penetapan matriks tarif tiket dan komisi agen.
  - Seeder default 4 kelas kursi bawaan SS Traveling: `SLEEPER` (Sleeper Class, 1-1), `LUXURY_2_1` (Luxury Seat 2-1, 2-1), `EXECUTIVE` (Executive Class, 2-2), dan `STANDARD` (Standard Class, 2-2). Seluruh 10 armada otomatis terhubung ke master data baru.
- **REST API Endpoints Lengkap**:
  - `GET /api/v1/seat-classes`, `GET /api/v1/seat-classes/:id`, `POST /api/v1/seat-classes`, `PUT /api/v1/seat-classes/:id`, `DELETE /api/v1/seat-classes/:id` terproteksi RBAC dan Swagger documentation.
- **Frontend Interaktif & Dinamis**:
  - Form armada bus (`vehicle-modal.tsx`) kini menarik pilihan kelas kursi secara dinamis dari API master data (`VehicleService.getSeatClasses()`) dan mengisi otomatis format layout denah bawaan.
  - Komponen modal baru **`SeatClassMasterModal`** (`/vehicles`) untuk mengelola, menambah, mengedit, dan menghapus master kelas kursi secara visual di antarmuka admin.
- **Blueprint Addendum v1.17 Locked**:
  - Menambahkan bab **Addendum v1.17 — Standardisasi Master Data Kelas Kursi (`seat_classes`) & Integrasi Matriks Tarif Tiket** di `.gemini/blueprint/blueprint-sistem-keuangan-perusahaan-bus-v1.3.md`.
- **Verifikasi Kualitas Penuh**:
  - Seluruh 34 unit test backend (termasuk mock suite baru untuk master kelas kursi) lulus 100%.
  - 6/6 E2E tests lulus 100%.
  - Frontend `vite build` 100% sukses tanpa warning atau error kompilasi.

### 2026-10-16: Stage 1 Completed — Master Organisasi, Dimensi, Armada Bus (10 Unit), & Pelanggan / CRM Leads (BE + FE)
- **Struktur Organisasi & Dimensi Multi-Entitas**:
  - Model & tabel `companies` (PT SS Traveling Official, kode `SST`, currency `IDR`, timezone `Asia/Jakarta`).
  - Unit Bisnis operasional: `AKAP` (Reguler PP Tangerang-Yogya), `WISATA` (Pariwisata / Charter), dan `SHUTTLE` (Bandara CGK/YIA).
  - Cost Centers berhierarki: `CC-OPS-POOL` (Operasional Pool Ciputat), `CC-MNT-GARASI` (Bengkel Garasi & Pemeliharaan), dan `CC-ADM-HQ` (Administrasi Kantor Pusat).
  - Profit Centers: `PC-AKAP` dan `PC-WISATA` untuk analisis margin kontribusi bisnis.
- **10 Unit Armada Bus Existing & Konfigurasi Multi-Class Kursi (`vehicles` & `vehicle_seat_classes`)**:
  - Terdaftar dan ter-seed lengkap: 7 bus lunas (`SS-01` s.d. `SS-07`) dan 3 bus leasing (`SS-08` s.d. `SS-10`).
  - Fitur multi-class kursi terintegrasi (Sleeper 4 pax + Luxury 2-1 20 pax pada `SS-01`, `SS-08`, `SS-09`, Executive 28 pax pada `SS-03`, `SS-04`, `SS-10`, Suites 22 pax pada `SS-05`, dsb.).
  - Total kapasitas kursi terhitung otomatis dari konfigurasi kelas kursi sebagai batas fisik (*hard ceiling*) tiket dan manifes.
- **Database Pelanggan & CRM Leads Penyewa Wisata (`customers`)**:
  - Master prospek terstruktur: segmen `CORPORATE`, `SCHOOL`, `COMMUNITY`, `GOVERNMENT`, dan `INDIVIDUAL`.
  - Tiering komersial: `PLATINUM`, `GOLD`, `SILVER`, dan `BRONZE`.
  - Auto-generate kode `CUST-XXXX` dan endpoint pencarian cepat `GET /api/v1/customers/autocomplete` untuk persiapan integrasi booking jadwal bus.
- **Frontend UI Lengkap & Interaktif**:
  - Halaman **Manajemen Armada Bus (`/vehicles`)**: Grid Kartu visual & Tabel view, badge status kepemilikan (Lunas vs Leasing), rincian kelas kursi, dan modal form tambah/edit dengan kalkulator dinamis kapasitas kursi.
  - Halaman **Database Pelanggan & CRM Leads (`/customers`)**: Filter segmen, tiering, live search, kartu statistik, dan form tambah/edit.
  - Halaman **Pengaturan Struktur Organisasi (`/organization`)**: Tab Profil Perusahaan, Unit Bisnis, Cost Center, dan Profit Center.
  - Service clients (`vehicle.service.ts`, `customer.service.ts`, `organization.service.ts`) terstandarisasi tanpa leading slash sesuai aturan CORS.
- **Verifikasi Kualitas Penuh**:
  - 4 test suites unit test backend (32 tests) 100% lulus (termasuk `vehicles.service.spec.ts` dan `customers.service.spec.ts`).
  - E2E tests backend 100% lulus.
  - Build frontend Vite TypeScript 100% lulus bebas error.

### 2026-10-15: Stage 0 Completed — RBAC 11 Roles, 14 Test Users (Password Asd123), & Comprehensive Sidebar Menu Tree Seeded
- **11 Role Standar Resmi**: Mendaftarkan role lengkap mencakup `SUPER_ADMIN`, `DIRECTOR`, `FINANCE_MANAGER`, `ACCOUNTANT`, `FINANCE_AR_AP`, `POOL_CASHIER`, `OPS_ADMIN`, `FIELD_COORDINATOR`, `CREW_DRIVER`, `CREW_CONDUCTOR`, dan `CREW_STEWARDESS` (Pramugari Bus).
- **14 Akun Pengguna Testing Lapangan**: Menyiapkan akun siap uji dengan password seragam `Asd123` untuk Direktur (`director@`), Finance Manager (`finance.manager@`), Akuntan (`accountant@`), Kasir Pool (`cashier.ciputat@`), Dispatcher (`ops.admin@`), Korlap (`field.coordinator@`), 3 Pengemudi Driver (`driver.budi@`, `driver.joko@`, `driver.hendra@`), Kondektur (`conductor.anto@`), dan 2 Pramugari (`stewardess.siti@`, `stewardess.maya@`).
- **Pohon Navigasi Sidebar Komprehensif**: Mengonfigurasi pohon menu lengkap dengan ikon Lucide untuk Master Data & CRM (9 sub-menu), Jadwal & Operasional SPJ (2 sub-menu), Meja Kasir Pool (2 sub-menu), Keuangan & Akuntansi (6 sub-menu), dan Manajemen Sistem (3 sub-menu).
- **Otorisasi Role-Menus Terpetakan**: Seluruh izin akses baca, buat, ubah, dan hapus telah dikonfigurasi per peran kerja sesuai Separation of Duties (SoD).
- **Verifikasi E2E 100% Lolos**: Menjalankan pengujian integrasi E2E login multi-role dan penarikan pohon menu di `test/rbac-auth.e2e-spec.ts`.

### 2026-10-15: Backend & Frontend Configuration Alignment & Phase 3 Master Plan Locked
- **Master Plan 10 Tahap Terkunci**: Membakukan roadmap eksekusi 10 tahap Fase 3 di `.gemini/plan/Plan.md` yang terstruktur berbasis dependensi arsitektur modular.
- **Safe Decimal & MoneyHelper**: Menginstal `decimal.js` dan mengimplementasikan utilitas moneter terpusat `MoneyHelper` (`src/@common/helpers/money.helper.ts`) lengkap dengan 11 skenario unit test berstatus 100% lulus.
- **Standardisasi Timestamptz (UTC)**: Memperbarui `BaseEntity` dan `UsersEntity` agar menggunakan tipe data `timestamptz` untuk keakuratan audit trail dan tanggal operasional.
- **Global API Prefix `/api/v1`**: Membakukan prefix `/api/v1` dan Swagger `/api/v1/docs` di backend NestJS, serta menyelaraskan seluruh service frontend (`axiosClient`, `auth`, `menu`, `role`, `user`) tanpa leading slash sesuai aturan CORS.
- **Verifikasi Build & Test**: Memastikan kompilasi TypeScript backend dan frontend 100% bebas dari error.

## Phase 2: Fleet Management, Operations (SPJ) & Accounting (Design Completed & Locked)

### 2026-10-15: Blueprint Addendum v1.16 Locked — Perencanaan Jadwal Bus (trip_schedules) sebagai Entry Point SPJ & Modul Leads CRM Penyewa Wisata (customers)
- **Pemisahan Perencanaan vs Eksekusi**: Membakukan bahwa SPJ tidak dibuat mendadak dari nol, melainkan diterbitkan via aksi 1-klik dari dokumen jadwal dinas armada (`trip_schedules`).
- **Validasi Anti-Bentrok & Jeda Istirahat (*Buffer Rest Time*)**: Mengunci aturan penolakan jadwal tumpang-tindih (*overlap conflict*) per bus dan per kru, serta alert buffer waktu istirahat armada/kru minimal 3 jam sebelum jadwal berikutnya.
- **Database CRM Leads Penyewa Wisata (`customers`)**: Mengintegrasikan database penyewa bus pariwisata (Corporate, School, EO, Community) sebagai aset komersial jangka panjang (*Customer Lifetime Value*), dengan fitur auto-link dari form jadwal, pelacakan frekuensi sewa, dan filter retargeting sales musiman.

### 2026-10-15: Blueprint Addendum v1.15 Locked — Standardisasi Kompensasi Kru Standby/Langsir, Gaji Karyawan, Upah Lembur & Dinas Luar Kantor
- **Kompensasi Kru Non-SPJ di Pool Garasi**: Mengunci pemisahan beban uang makan standby driver di garasi (`53105 Beban Uang Makan Standby Kru (Non-SPJ Garasi)`) yang dikeluarkan via Kas Kecil Pool dan dilarang masuk SPJ agar tidak mendistorsi margin ritase bus.
- **Insentif Langsir & Dinas Teknis Kru (`53106`)**: Menetapkan akun `53106 Beban Insentif Langsir & Dinas Teknis Kru (Non-SPJ Bengkel/Karoseri)` untuk uang saku tugas driver mengantar bus kosong ke karoseri/bengkel/uji KIR, dengan kewajiban dimensi `vehicle_id` agar riwayat biaya perawatan unit terakumulasi utuh.
- **Pemisahan Penggajian (Payroll)**: Memisahkan akun gaji bulanan karyawan kantor/manajemen (`57105`) dengan teknisi bengkel pool (`57106 Beban Gaji Mekanik & Teknisi Bengkel Pool`) untuk menganalisis rasio in-house maintenance cost secara objektif.
- **Upah Lembur & Biaya Dinas Staf**: Mengunci akun `57107 Beban Upah Lembur Karyawan & Mekanik (Overtime)` saat lonjakan peak season atau perbaikan malam, `57108 Beban Uang Makan & Konsumsi Staf Kantor/Garasi`, serta `57109 Beban Perjalanan Dinas & Transport Staf Kantor` untuk mobilitas legal/kantor ke Dishub/Samsat/Bank.

### 2026-10-15: Blueprint Addendum v1.14 Locked — Tata Kelola Snack Penumpang & Fasilitas Onboard Bus (Metode Pembebanan Langsung Non-SPJ)
- **Metode Pembebanan Langsung (*Direct Expense Method*)**: Membakukan bahwa pengadaan snack penumpang kulakan grosir (kacang telur bal-balan, dus air mineral, roti) dan ameniti kabin bus berjalan (kopi/teh sachet, gula, baterai mic, parfum semprot, kuota internet modem Wi-Fi) diakui langsung sebagai beban operasional saat transaksi belanja terjadi, tanpa membebani kru dan kasir di lembar SPJ perjalanan.
- **Akun COA Khusus**: Menambahkan akun `52104 Beban Snack, Amenity, & Fasilitas Onboard Bus` (kelompok 52 - Fasilitas Perjalanan).
- **Pintu Input Transaksi**: Dibelanjakan melalui Kas Kecil Pool (`cash_transactions`) atau transfer bank operasional kantor, dengan verifikasi oleh Accountant saat rekap kas kecil pool (*Petty Cash Replenishment*).
- **Dimensi Fleksibel**: Belanja kolektif garasi dialokasikan ke Cost Center `Operasional Pool`; pengeluaran khusus unit bus (seperti paket data modem Wi-Fi armada tertentu) ditempelkan dimensi opsional `vehicle_id` untuk analisis performa aset.

### 2026-10-15: Blueprint Addendum v1.13 Locked — Tata Kelola Aset Tetap Armada, Saldo Awal Migrasi, Utang Leasing & Penyusutan
- **Saldo Awal Migrasi 10 Bus (*Opening Balance*)**: Membakukan pendaftaran 10 unit bus ke master armada (`vehicles` & `fixed_assets`), pemisahan perlakuan 7 bus lunas (murni aset bersih & ekuitas) vs 3 bus cicilan (aset fisik diimbangi utang pokok leasing `26101`).
- **Pemisahan Angsuran Leasing Bank**: Mengunci aturan pemisahan voucher cicilan bulanan: porsi pokok pinjaman mengurangi utang di Neraca (`26101`), porsi bunga diakui pemotong laba rugi (`59101 Beban Bunga Pinjaman Bank / Leasing Armada`).
- **Otomasi & Entry Point Penyusutan**: Mengunci fitur eksekusi depresiasi bulanan otomatis (*Run Depreciation* ke akun beban `56101` dan kontra-aset `16101`), serta menyediakan action endpoint di UI untuk perpanjangan umur aset (pasca-overhaul/turun mesin), penurunan nilai (impairment), dan pelepasan aset (disposal untung/rugi `81102`/`82101`).
- **Setoran Modal Non-Operasional & Non-Tunai**: Membakukan pencatatan penambahan modal via transfer bank (`11104` $\to$ `31101` / `27101`) dan inbreng fisik bus/sparepart via jurnal memorial (`15101`/`14101` $\to$ `31101`).

### 2026-10-15: Blueprint Addendum v1.12 Locked — Standardisasi Akun COA Pengeluaran Non-SPJ & Catatan Selisih Kupon Makan
- **Rincian COA Beban Non-SPJ (Kelompok 55, 56, 57, 58)**: Membakukan akun COA pengeluaran kantor, pool, dan perawatan armada (55101–55106 untuk servis/sparepart/oli/ban/AC/karoseri dengan dimensi wajib `vehicle_id`, 56101–56102 untuk penyusutan, 57101–57108 untuk legalitas armada/asuransi/listrik/gaji mekanik/ATK/konsumsi garasi, dan 58101 untuk selisih kasir pool dispensasi).
- **Audit Selisih Servis Makan Per Leg**: Menambahkan kolom `meal_pax_count` dan `meal_discrepancy_notes` pada tabel `spj_legs` untuk memvalidasi deviasi antara kupon makan riil rumah makan mitra vs manifes kursi penumpang secara transparan.

### 2026-10-14: Test Case Skenario 4 Locked — Rekonsiliasi Kasir Bermasalah, Musyawarah Kru & Resolusi Selisih Kas
- **Penerbitan Dokumen Test Case Skenario 4**: Menyusun dan mengunci dokumen pengujian komprehensif di `.gemini/blueprint/test-cases/skenario-4-rekonsiliasi-discrepancy-kasir.md`.
- **Budaya Lapangan vs Kontrol Sistem (2 Lapis Resolusi)**: Mengakomodasi resolusi operasional kekeluargaan (Lapis 1: musyawarah antar-kru dan talangan langsung di meja kasir untuk kekurangan kembalian tiket Rp 200rb $\to$ status penerimaan `MATCHED` tanpa jejak minus), serta jalur pencatatan resmi sistemik (Lapis 2: nota BBM hilang Rp 300rb $\to$ `financial_status = DISCREPANCY`).
- **Workflow Investigasi & Otorisasi Finance Manager**: Mengunci pemisahan wewenang (SoD) di mana kasir hanya mencatat temuan fisik di `crew_cash_discrepancies`, dan `FINANCE_MANAGER` memutuskan status akhir pasca-cek GPS/odometer (Opsi 1: Dispensasi Perusahaan `58101 Beban Selisih Kasir` vs Opsi 2: Klaim kelalaian `12901 Piutang Kru`).
- **Kemerdekaan Tutup Buku Bulanan (*Period Closing Unblocked*)**: Mengunci aturan proteksi akuntansi agar SPJ berselisih tidak memblokir penutupan periode fiskal bulanan melalui pemanfaatan akun neraca penampung sementara (`11999 Selisih Kas Operasional Sementara`) dan penyesuaian di periode berikutnya.
- **Verifikasi Invariant Akuntansi**: Mengonfirmasi keseimbangan jurnal debet-kredit atomik rekonsiliasi SPJ berselisih (Rp 11.860.000) dan penutupan saldo UJ kru menjadi Rp 0.

### 2026-10-14: Test Case Skenario 3 Locked — Anomali AKAP Breakdown, Penggantian Armada (parent_spj_id) & Estafet UJ
- **Penerbitan Dokumen Test Case Skenario 3**: Menyusun dan mengunci dokumen pengujian komprehensif di `.gemini/blueprint/test-cases/skenario-3-anomali-breakdown-penggantian-armada.md`.
- **Penguncian Relasi `parent_spj_id` & Anti-Double Revenue**: Mengunci alur penerbitan SPJ Pengganti (`SPJ-002` Bus `SS-03`) yang ditautkan ke SPJ Induk (`SPJ-001` Bus `SS-01`), mengalihkan manifes 24 penumpang dengan jaminan pendapatan tiket (Rp 6jt) dan kargo (Rp 350rb) hanya diakui 1 kali secara sah.
- **Mekanisme UJ Rollover / Handover Antar-SPJ**: Mengunci alur mutasi serah-terima sisa fisik UJ (Rp 2.000.000) dari SPJ lama ke SPJ baru, menutup saldo UJ SPJ-001 menjadi seimbang (`BALANCED` Rp 0), dan memulai dinas SPJ-002 dengan modal UJ lanjutan tanpa beban kasir pool.
- **Pemisahan Dimensi Biaya Kerusakan Darurat**: Memisahkan secara tegas biaya derek tol resmi (Rp 1.500.000) dan perbaikan radiator bengkel (Rp 2.500.000) ke akun `55101 Beban Perawatan Armada` dengan dimensi `vehicle_id = SS-01`, mencegah distorsi biaya operasional pada bus pengganti `SS-03`.
- **Laporan Laba Rugi Multi-Dimensi (Per Bus vs Journey Group)**: Mengonfirmasi kemampuan sistem menyajikan laporan ganda: isolasi performa aset individual (Defisit SS-01: -Rp 5.5jt vs Margin SS-03: +Rp 4.215jt) serta performa ekonomi perjalanan gabungan (Margin Operasional: +Rp 2.715jt / ~42.75% sebelum beban insidental).
- **Verifikasi Invariant Akuntansi**: Mengonfirmasi keseimbangan jurnal debet-kredit atomik SPJ-001 (Rp 3.500.000) dan SPJ-002 (Rp 9.335.000), serta pelunasan sisa UJ fisik di kasir pool pool menjadi Rp 0.

### 2026-10-13: Test Case Skenario 2 Locked — Operasional Sewa Bus Pariwisata / Charter Multi-Day & Siklus Finansial Penuh
- **Penerbitan Dokumen Test Case Skenario 2**: Menyusun dan mengunci dokumen pengujian komprehensif di `.gemini/blueprint/test-cases/skenario-2-operasional-wisata-charter.md`.
- **Penguncian Alur Kontrak Charter & Accrual Revenue**: Mengunci alur penerimaan Uang Muka DP sewa 30% (`24101 Pendapatan Diterima di Muka`), pelunasan 70% via AR Invoice & Bank BCA, serta pengakuan pendapatan sewa 100% (`42101`) pasca-perjalanan tuntas (`operational_status = COMPLETED`).
- **Master Rate Kru Harian (`PER_DAY`)**: Mengunci formula perhitungan otomatis hak uang makan dan premi kru berdasarkan durasi hari penugasan (5 Hari Tour).
- **Workflow Pencairan Sebagian Premi di Jalan (*Mid-Trip Early Payout*)**: Mengunci tombol aksi dan pencairan dana via transfer bank operasional ke rekening kru di tengah tour, pembaruan status `partially_paid`, serta proteksi anti-dobel bayar otomatis di kasir pool saat kepulangan armada.
- **Biaya Khusus Wisata**: Mengakomodasi beban parkir kawasan wisata (`PARKING_TOURISM`) dan sewa homestay kru (`CREW_LODGING`) sebagai beban sah dari UJ dengan verifikasi nota kasir.
- **Komisi / Cashback Rekanan B2B Wisata**: Mengunci perlakuan akuntansi komisi/cashback travel agent rekanan (sewa wisata/shuttle bandara) sebagai **Beban SPJ Kantor Non-UJ** (`54103`) yang dibayar via transfer bank (`11104`), berbasis omzet bruto utuh, dan terserap ke margin kontribusi trip.
- **Verifikasi Invariant Akuntansi**: Mengonfirmasi keseimbangan jurnal debet-kredit atomik (Rp 27.075.000), penyelesaian saldo UJ kru menjadi Rp 0, penutupan saldo DP menjadi Rp 0, dan perhitungan kontribusi laba bersih trip wisata (+Rp 8.525.000 / ~48.71%).

### 2026-10-07: Test Case Skenario 1 Locked — Operasional Normal AKAP PP, Tagihan Servis Makan AP Berkala & Komisi Dinamis Kargo Kru
- **Penerbitan Dokumen Test Case Skenario 1**: Menyusun dan mengunci dokumen pengujian komprehensif di `.gemini/blueprint/test-cases/skenario-1-operasional-normal-akap.md`.
- **Penguncian Alur Tagihan Restoran Berkala**: Mengunci spesifikasi penagihan servis makan mitra (2x seminggu via AP Vendor) dengan fitur form khusus tarik SPJ belum ditagih, bebas beban kas/UJ kru, toleransi under-capacity, serta peringatan over-capacity.
- **Skema Komisi Dinamis Kargo Kru (`53104`)**: Mengunci aturan persentase fleksibel (preset kantor 15%, 20%, 25% + custom percentage) pada `spj_revenue_declarations`, setoran tunai 100% bruto ke kasir pool, serta pencairan hak komisi tunai via BKK kasir saat settlement.
- **Multi-Line Disbursement & Tambahan UJ**: Mengunci pola Header–Lines pada pencairan UJ (`spj_uj_disbursements`), dukungan multi-amplop UJ per SPJ ($1:N$), serta penanganan talangan darurat kru (nombok) via BKK kasir pool.
- **Penjualan Tiket Bruto & Komisi Agen Berjenjang**: Mengunci SOP setoran bruto 100% oleh agen offline terminal, aturan komisi berjenjang per kelas armada (`agent_commission_rules`: Sleeper Rp 30.000 vs Luxury Rp 20.000), serta pembayaran komisi berkala via transfer bank (`22101 Utang Komisi Agen`).
- **Fleksibilitas Kru Dinamis & Revisi Per-Leg**: Mengunci dukungan 2–4+ kru per SPJ, validasi minimal 1 Driver, penugasan kru independen per-leg rute, serta mekanisme revisi pembatalan/pergantian kru sakit di tengah jalan dengan audit trail lengkap.
- **Pencairan Bertahap / Di Muka Premi Kru**: Mengunci mekanisme pencairan premi sebagian di tengah perjalanan multi-hari (Wisata) via transfer bank dengan pelacakan sisa bersih otomatis saat final settlement di pool.
- **Verifikasi Invariant Akuntansi**: Mengonfirmasi keseimbangan jurnal debet-kredit atomik (Rp 16.680.000), penyelesaian sisa saldo UJ menjadi Rp 0, dan kalkulasi kontribusi laba bersih trip multi-dimensi secara akurat.

### 2026-10-05: Blueprint Addendum v1.11 — Standardisasi RBAC, Multi-Role, SoD & Pengeluaran Non-SPJ
- **Konfirmasi Backend Multi-Role**: Mengonfirmasi bahwa backend NestJS (`ss-travel-backend`) telah 100% mendukung multi-role via `user_roles` dengan agregasi izin berbasis *Union* di `MenusService.getPermissionsByRoles()`. Pengguna dengan peran ganda tidak memerlukan role gabungan baru, melainkan diberikan multi-role modular.
- **Matriks 10 Role Standar**: Memetakan struktur peran baku: `SUPER_ADMIN`, `DIRECTOR`, `FINANCE_MANAGER`, `ACCOUNTANT`, `FINANCE_AR_AP`, `POOL_CASHIER`, `OPS_ADMIN`, `FIELD_COORDINATOR`, `CREW_DRIVER`, dan `CREW_CONDUCTOR`.
- **Aturan Separation of Duties (SoD)**: Menetapkan kombinasi aman (misal: `OPS_ADMIN` + `FIELD_COORDINATOR`, `FINANCE_AR_AP` + `ACCOUNTANT`) dan kombinasi terlarang anti-fraud (❌ `OPS_ADMIN` + `POOL_CASHIER`, ❌ `CREW_DRIVER` + `POOL_CASHIER`, serta larangan *self-approval*).
- **Klasifikasi 3 Pintu Pengeluaran Non-SPJ**:
  1. *Kas Kecil Pool (Petty Cash)*: Biaya harian garasi/perlengkapan diinput oleh `POOL_CASHIER` (`cash_transactions`).
  2. *Tagihan Vendor Tempo (AP Invoices)*: Pembelian sparepart, ban, servis karoseri, dan oli diinput oleh `FINANCE_AR_AP` (`ap_invoices`) teralokasi ke `vehicle_id`.
  3. *Legalitas Armada & Biaya Kantor (Bank Transaksi)*: Pajak, KIR, asuransi, dan utilitas diinput oleh `FINANCE_AR_AP` / `ACCOUNTANT` dengan approval wajib `FINANCE_MANAGER`.
  3. *Legalitas Armada & Biaya Kantor (Bank Transaksi)*: Pajak, KIR, asuransi, dan utilitas diinput oleh `FINANCE_AR_AP` / `ACCOUNTANT` dengan approval wajib `FINANCE_MANAGER`.

### 2026-10-05: Harmonisasi Menyeluruh Blueprint v1.3 & Addendum v1.10
- **Status Ganda SPJ Tunggal**: Menetapkan secara definitif pemisahan independen antara `operational_status` (`DRAFT`, `ISSUED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) dan `financial_status` (`PENDING_SETTLEMENT`, `UNDER_REVIEW`, `DISCREPANCY`, `SETTLED`). Menggantikan dan menyelaraskan seluruh draft status sebelumnya di Bab 8.2 dan Addendum v1.1.
- **Standarisasi Akun Beban COA**: Memisahkan secara tegas COA akun Beban Layanan Makan Restoran Penumpang (`51102`), Beban Tol/Fasilitas (`521xx`), Beban Hak/Kompensasi Kru Bus (`531xx`: Uang Makan `53101`, Premi `53102`, Bonus Full Seat `53103`), serta Beban Keagenan & Jasa Koordinator (`541xx`: Komisi Agen `54101`, Uang Jasa Koordinator `54102`).
- **Penyelesaian Kas Yogyakarta**: Menetapkan 2 SOP resmi untuk pergantian kru di Yogyakarta (Mekanisme A: Settlement cabang via BKM vs Mekanisme B: Handover estafet sisa UJ antar-kru dengan verifikasi akhir di pool Jakarta).
- **Zonasi Koordinator & Bonus Full Seat Per-Leg**: Mengotomasi penentuan koordinator wilayah Barat (Berangkat) vs Timur (Pulang) dan evaluasi bonus okupansi 100% per-leg perjalanan.
- **Integritas Setoran Kargo Bruto**: Penegasan kewajiban penyetoran 100% penerimaan kargo manual tanpa pemotongan pribadi oleh kru.

### 2026-10-05: Blueprint Addendum v1.9 — Service Makan Restoran, Bonus Full Seat, Uang Koordinator & Klasifikasi Kargo
- **Master Restoran Mitra (`restaurants`)**: Master data rumah makan rekanan untuk fasilitas service makan penumpang AKAP (tarif per pax, lokasi kota, dan metode penyelesaian: tunai via UJ kru vs tagihan bulanan kantor via AP vendor).
- **Bonus Kru Full Seat (Okupansi 100%)**: Pemicu otomatis di SPJ saat seluruh kursi terisi penuh, menambahkan nominal bonus performa ke hak kompensasi kru (`crew_meal_payments`) yang bersumber dari kolom `full_seat_bonus` pada `crew_rate_rules`.
- **Fee Koordinator Wilayah (`coordinator_fee_rules`)**: Aturan fee jasa koordinator lapangan Barat (Jabodetabek) dan Timur (Jogja/Jateng-DIY) berbasis jumlah penumpang (default Rp10.000/pax, dinamis dapat diubah di master) yang dicatat ke biaya SPJ `COORDINATOR_FEE`.
- **Klasifikasi Kargo Manual (`spj_revenue_declarations`)**: Pemisahan tegas penerimaan paket bagasi bus ke dalam `CARGO_MOTORCYCLE` (sepeda motor) dan `CARGO_BOX` (kardus/titipan barang) dengan tarif yang diinput secara manual per resi/surat jalan.

### 2026-10-05: Blueprint Addendum v1.8 — Standardisasi Kompensasi & Master Tarif Kru
- **Master Rate Kru (`crew_rate_rules`)**: Menetapkan standar nominal Uang Makan (`meal_allowance`) dan Premi Ritase (`trip_incentive`) berjenjang berdasarkan peran (`DRIVER`, `CO_DRIVER`, `CONDUCTOR`) dan jenis penugasan (AKAP `PER_TRIP` vs Pariwisata `PER_DAY`).
- **Otomasi Snapshot ke SPJ**: Saat kru ditugaskan pada `spj_crew_assignments`, sistem otomatis menarik dan menyalin permanen (*snapshot*) rate hak kru ke transaksi `crew_meal_payments` dengan dukungan *manual override* berizin supervisor.
- **Pemisahan Finansial**: Hak kru dipisahkan secara tegas dari UJ operasional bus dan dibukukan ke akun beban akuntansi masing-masing (`Beban Uang Makan Kru` dan `Beban Premi Kru`).

### 2026-10-05: Blueprint Addendum v1.7 — Pengelolaan Agen (Online vs Offline), Rute Asal/Zonasi & Komisi Penjualan
- **Klasifikasi Agen (`agents`)**: Membedakan `OFFLINE` (loket terminal fisik) dan `ONLINE_OTA` (RedBus, Traveloka), atribut kota (`city`: `JAKARTA`, `YOGYAKARTA`, `ALL`), serta cara penyelesaian kas (`settlement_type`).
- **Smart Filter Arah Rute**: Sistem otomatis memfilter pilihan agen sesuai arah leg SPJ (Jkt $\to$ Jogja hanya menampilkan agen Jakarta + OTA; Jogja $\to$ Jkt hanya agen Jogja + OTA) untuk mencegah kesalahan input manifest.
- **Matriks Komisi Fleksibel (`agent_commission_rules`)**: Mendukung komisi flat per tiket maupun persentase potongan fee platform per kelas kursi.
- **Pemisahan Finansial OTA vs Kru**: Kru bus terbebas dari beban setoran uang tiket OTA; tiket OTA dialokasikan langsung ke piutang AR OTA, sedangkan kru hanya menyetorkan penerimaan fisik tiket offline.

### 2026-10-05: Blueprint Addendum v1.6 — Multi-Class Kursi, Dynamic Pricing & Integritas Keuangan
- **Multi-Class Kursi per Bus (`vehicle_seat_classes`)**: Memfasilitasi konfigurasi kabin majemuk dalam 1 armada (misal: gabungan 4 kabin Sleeper + 20 kursi Luxury Seat 2-1) sekaligus bertindak sebagai *hard ceiling* kuota penumpang saat manifes/SPJ.
- **Dynamic Seasonal Pricing (`fare_seasons` & `fare_matrix`)**: Memfasilitasi kalender tarif musiman (reguler, tuslah Lebaran, peak season liburan/weekend) dengan rentang tanggal berlaku dinamis.
- **Price Snapshotting & Immutable Journals**: Menjamin 100% catatan keuangan masa lalu tetap abadi menggunakan harga saat transaksi dibuat, terlepas dari adanya perubahan harga master di masa depan.

## Phase 1: Infrastructure & Auth (Completed)

### 2026-10-01: Dual-Strategy Auth (HttpOnly Cookie + Bearer), Machine-Readable Errors & Security Hardening
- **Hybrid Token Extraction**: Refactored `JwtAuthGuard` to support dual token extraction: Authorization Header (`Bearer <token>`) for Mobile Apps and API clients, with seamless fallback to `HttpOnly` Cookie (`token`) for Web Browsers to provide complete immunity against XSS.
- **Cookie-Parser & CORS Hardening**: Integrated `cookie-parser` with CommonJS-compliant module import (`import * as cookieParser`) and configured CORS with `credentials: true` and dynamic origin reflection.
- **Machine-Readable Error Codes**: Standardized all 401 Unauthorized responses with structured error codes: `TOKEN_EXPIRED` (the sole trigger for client-side refresh), `MISSING_DEVICE_ID`, `UNAUTHORIZED`, `INVALID_DEVICE_CONTEXT` (anti-hijacking anomaly), `INVALID_TOKEN`, `INVALID_SESSION`, and `REFRESH_TOKEN_EXPIRED`.
- **Session Revocation & Logout API**: Implemented `POST /api/auth/logout` that invalidates active sessions (`sessionToken = null`, `refreshToken = null`) in the database and clears the browser cookie.
- **Automated Verification**: Added comprehensive unit test suite in `src/auth/guards/jwt-auth.guard.spec.ts` covering 6 critical security scenarios with 100% pass rate.
- **Developer Documentation & FE Guide**: Published complete blueprint and implementation guide with copy-paste Axios client interceptors in `.gemini/plan/AUTH_SPECIFICATION_AND_FE_GUIDE.md`.

### 2026-06-04: Session Binding Stability & Security Anomaly Resolution
- **Device ID Standardization**: Resolved an issue where users were unexpectedly logged out due to "Security Anomaly" errors. The root cause was storing the `deviceId` in encrypted storage, which could trigger a re-generation if decryption failed. Moved `deviceId` to plain `localStorage` for absolute fingerprint stability across sessions and browser restarts.
- **Enhanced Security Logging**: Added granular server-side logging in `AuthService.refreshToken` to track token, origin, and fingerprint matches, enabling rapid diagnosis of session binding issues.
- **Robust Error Interceptor**: Refined the frontend Axios interceptor with detailed error reporting to distinguish between missing tokens, failed refresh calls, and retry failures.

### 2026-06-03: Security Hardening & Session Integrity (Triple-Lock Auth)
- **Token Rotation Architecture**: Implemented a robust Access/Refresh token system. Access Token (1h, stateless) for performance, Refresh Token (7d, stateful) for session continuity.
- **Single Device Login (SDL)**: Introduced `sessionToken` validation in the backend. New logins automatically invalidate previous sessions on other devices.
- **Stateless Fingerprint Validation**: Integrated device fingerprinting (hash of `deviceId` + `User-Agent`) into the JWT payload. Requests are validated statelessly in `JwtAuthGuard` against client headers (`x-device-id`).
- **Encrypted LocalStorage**: Integrated `secure-ls` with AES encryption and LZ compression to safeguard tokens and user data in the browser. Developed a centralized `storage` utility for consistent encryption/decryption.
- **Environment Variable Standardization**: Centralized all configurable strings (API URL, Storage Secret, App Name, Theme Keys) into `.env` and `.env.example`. Removed all hardcoded fallbacks from the source code to ensure strict configuration management.
- **Robust Auto-Refresh Interceptor**: Optimized the Axios interceptor to handle concurrent requests, implement a 3-second delay for stability, and ensure seamless retry with refreshed credentials.
- **Background Sync Stabilization**: Fixed a critical bug where background synchronization (`/auth/me`) was inadvertently clearing session tokens from storage.
- **Entity & DTO Synchronization**: Refactored `UsersEntity` and Auth DTOs to support new security columns (`session_token`, `refresh_token`, `last_origin`) with strict data exclusion (`select: false`).

### 2026-05-26: Distributed Authorization & Local-First Stability
- **Architecture Pivot**: Adopted a "Distributed but Independent" authorization strategy. Logic is implemented locally in each service to avoid monorepo dependency complexities while maintaining a unified security standard.
- **Enriched JWT Payload**: Refactored AuthService and MenusService to include granular permission strings (format aclName:action) directly in the JWT payload.
- **Granular PermissionsGuard**: Implemented a local PermissionsGuard and @RequirePermissions decorator that provides detailed feedback on missing permissions during 403 Forbidden errors.
- **Full Controller Integration**: Standardized Users, Menus, and Roles controllers with the new authorization SOP (Dual-layer: Roles + Permissions).
- **Frontend Error Interceptor**: Updated axiosClient.ts to display specific missing permissions in toast notifications, improving admin UX and transparency.

### 2026-05-25: Menu Management UX & Global State Robustness
- **Interactive Icon Picker**: Developed a high-performance, searchable icon gallery with 1,400+ Lucide icons.
- **Contextual Menu Creation**: Refactored Menu Management UI to support smart parent assignments.
- **Folder-like Group Menus**: Implemented non-redirecting "Group" menus using the title field.
- **Global Auth State (Context)**: Migrated local state to a unified AuthContext for real-time UI reactions.

### 2026-05-22: Auth System Perfection & Hybrid Permissions
- **Hierarchical Menu Management**: Implemented recursive tree fetching and UI.
- **Hybrid Action-based Permissions**: Added support for dynamic JSONB permissions (approve, export, etc.).
- **Dynamic Permission Sync**: Implemented background synchronization via /auth/me.
