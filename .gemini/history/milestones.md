# Project Milestones: SS Traveling

## Phase 3: Core Implementation (In Progress)

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
