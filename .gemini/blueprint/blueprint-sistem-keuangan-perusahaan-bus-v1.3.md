# Blueprint Sistem Keuangan dan Akuntansi Perusahaan Bus

**Versi:** 1.0\
**Tanggal:** 2 Oktober 2026\
**Status:** Blueprint teknis untuk dasar implementasi\
**Stack acuan:** NestJS 10, TypeORM 0.3.x, PostgreSQL, React +
TypeScript + Vite

------------------------------------------------------------------------

## 1. Tujuan dan ruang lingkup

Dokumen ini menjadi acuan implementasi aplikasi keuangan dan akuntansi
untuk perusahaan bus skala menengah. Sistem harus menangani operasi
AKAP/reguler, pariwisata/charter, shuttle/komuter, dan penyewaan lain
dalam satu perusahaan dan satu kantor pusat. Perkiraan armada 20--100
bus.

Sistem dirancang agar: - transaksi operasional mudah dicatat satu kali,
kemudian digunakan oleh keuangan dan akuntansi; - setiap transaksi dapat
ditelusuri sampai trip, bus, agen, pelanggan, vendor, kas/bank, dan
jurnal yang terkait; - laporan bersumber dari jurnal yang sudah
diposting; - transaksi belum lunas tetap terlihat dan tidak menghilang
dari laporan; - alur persetujuan dapat dikonfigurasi karena struktur
organisasi belum final; - integrasi API dapat ditambahkan di masa depan
tanpa mengubah inti akuntansi.

### 1.1 Di luar cakupan tahap awal

Sistem tiket publik/e-commerce, GPS/telematika, payroll penuh,
perpajakan otomatis untuk semua skenario, dan integrasi langsung ke
bank/SAP tidak menjadi prasyarat MVP. Sediakan titik integrasi dan
referensi eksternal bila kelak dibutuhkan.

### 1.2 Prinsip desain utama

1.  **Modular monolith**: satu aplikasi backend dengan modul domain
    terpisah. Jangan mulai dari microservices.
2.  **Journal-first accounting**: jurnal terposting adalah sumber
    kebenaran saldo akuntansi.
3.  **Single source of entry**: data yang sudah dicatat operasional
    tidak diketik ulang untuk akuntansi.
4.  **Immutable posted records**: jurnal terposting tidak diedit atau
    dihapus; koreksi memakai reversal dan jurnal pengganti.
5.  **Atomic posting**: perubahan status transaksi dan pembuatan jurnal
    berada dalam satu database transaction.
6.  **Dimensi analitik**: cost center, profit center, trip, bus, dan
    pihak terkait menjadi dimensi, bukan pengganti akun COA.
7.  **Accrual basis**: biaya dan kewajiban dicatat pada periode
    terjadinya; pembayaran dapat terjadi kemudian.
8.  **Auditability**: siapa melakukan apa, kapan, dari mana, dan alasan
    perubahan harus dapat ditelusuri.
9.  **No silent balance carry-over for agents**: penyelesaian agen
    dilakukan per trip; saldo satu trip tidak otomatis digabung ke trip
    berikutnya.
10. **Company-funded trip costs**: biaya trip menggunakan dana
    perusahaan. Uang muka kepada kru boleh dicatat sebagai kas
    perusahaan yang dipegang kru, lalu dipertanggungjawabkan.

> Kebijakan akuntansi final, perlakuan pajak, dan bentuk laporan resmi
> perlu ditinjau akuntan perusahaan sesuai standar dan regulasi yang
> berlaku. Blueprint ini adalah rancangan sistem, bukan opini audit atau
> nasihat pajak.

------------------------------------------------------------------------

## 2. Keputusan bisnis yang menjadi asumsi

  -----------------------------------------------------------------------
  Area                                Keputusan / asumsi implementasi
  ----------------------------------- -----------------------------------
  Perusahaan                          Satu entitas perusahaan, satu
                                      kantor pusat

  Unit usaha                          AKAP, pariwisata, shuttle/komuter,
                                      rental lain

  Armada                              Sekitar 20--100 bus

  Input                               Manual pada tahap awal; API-ready

  Pengakuan pendapatan                Setelah perjalanan selesai

  Komisi agen                         Dicatat sebagai beban/utang
                                      terpisah, tetap terhubung ke trip

  Biaya trip                          Dibayar dengan kas/bank perusahaan;
                                      uang muka kru didukung

  Saldo agen                          Settlement independen per trip,
                                      tidak carry-forward

  Persetujuan                         Role dan workflow dapat
                                      dikonfigurasi

  Tutup buku                          Piutang/utang terbuka ditampilkan;
                                      umumnya tidak menghalangi tutup
                                      periode

  Biaya bersama                       Awalnya dilaporkan sebagai biaya
                                      kantor pusat/bersama, tidak
                                      dialokasikan otomatis

  Teknologi                           NestJS + TypeORM + PostgreSQL;
                                      React TypeScript
  -----------------------------------------------------------------------

### 2.1 Keputusan yang harus dikonfirmasi sebelum go-live

-   Apakah pendapatan trip pulang-pergi diakui saat seluruh perjalanan
    selesai atau per-leg saat masing-masing leg selesai?
-   Bagaimana kebijakan untuk pembatalan, refund, penumpang no-show,
    perubahan jadwal, dan tiket yang belum digunakan?
-   Kapan komisi agen menjadi kewajiban: saat tiket terjual, saat trip
    selesai, atau setelah settlement?
-   Apakah perusahaan menggunakan PPN/pajak lain, dan bagaimana
    perlakuan per jenis transaksi?
-   Apakah uang muka kru diselesaikan per trip, per periode, atau
    keduanya?
-   Apakah satu trip dapat menggunakan lebih dari satu bus/kru, dan
    bagaimana alokasi biayanya?
-   Siapa yang boleh membuka kembali periode yang sudah ditutup?

Jangan menyembunyikan keputusan yang belum disepakati di dalam kode.
Simpan sebagai konfigurasi atau tandai sebagai kebijakan yang perlu
diputuskan.

------------------------------------------------------------------------

## 3. Gambaran arsitektur

### 3.1 Backend modular monolith

Satu deployment NestJS, satu database PostgreSQL, tetapi modul
dipisahkan berdasarkan domain:

``` text
src/
  main.ts
  app.module.ts
  common/
    database/
    auth/
    decorators/
    guards/
    interceptors/
    filters/
    pipes/
    pagination/
    money/
    errors/
  modules/
    identity/
    organization/
    master-data/
    trips/
    ticketing/
    trip-finance/
    cash-management/
    receivables/
    payables/
    expenses/
    accounting/
    approvals/
    bank-reconciliation/
    fixed-assets/
    budgeting/
    fiscal-periods/
    reporting/
    audit/
    integrations/
```

**Aturan dependensi:** modul operasional boleh meminta modul Accounting
membuat posting melalui service publiknya. Modul operasional tidak boleh
menulis `journal_entries` atau `journal_lines` secara langsung.
Reporting membaca jurnal dan view/reporting service, bukan menghitung
saldo dari tabel transaksi mentah.

### 3.2 Frontend

``` text
src/
  app/
    routes/
    providers/
    layouts/
  features/
    dashboard/
    trips/
    ticket-sales/
    trip-settlement/
    cash/
    receivables/
    payables/
    expenses/
    journals/
    general-ledger/
    bank-reconciliation/
    fixed-assets/
    budgets/
    period-closing/
    reports/
    approvals/
    users/
    settings/
  components/
    data-table/
    form/
    money-input/
    date-picker/
    status-badge/
    audit-timeline/
```

Gunakan route dan menu berbasis permission. Sembunyikan menu tanpa izin
di frontend, tetapi **selalu validasi izin di backend**.

### 3.3 Lingkungan

-   `development`, `test`, `staging`, `production` dipisahkan.
-   Migration dijalankan terkontrol, bukan otomatis saat aplikasi start
    di production.
-   Gunakan `.env`/secret manager; jangan commit secret.
-   Backup PostgreSQL terjadwal dan uji restore.
-   Log aplikasi terstruktur dengan request ID.
-   Waktu disimpan sebagai `timestamptz`/UTC; tanggal akuntansi disimpan
    sebagai `date` dan ditafsirkan menurut zona waktu perusahaan
    (misalnya `Asia/Jakarta`).

------------------------------------------------------------------------

## 4. Batas domain dan modul

  -----------------------------------------------------------------------
  Modul                   Tanggung jawab          Tidak boleh
  ----------------------- ----------------------- -----------------------
  Identity                user, role, permission, menentukan saldo
                          sesi/token              akuntansi

  Organization            unit usaha, cost/profit membuat jurnal sendiri
                          center, konfigurasi     
                          perusahaan              

  Master Data             bus, agen, pelanggan,   mengubah jurnal
                          vendor, akun bank, COA  terposting

  Trips                   trip, leg, status       menyimpulkan pembayaran
                          operasional             lunas

  Ticketing               penjualan tiket, agen,  langsung mengubah saldo
                          tarif, refund           GL

  Trip Finance            biaya trip, uang muka,  menghapus transaksi
                          settlement agen/kru     terposting

  Cash Management         kas, penerimaan,        mencatat pendapatan
                          pembayaran, transfer    tanpa sumber transaksi

  AR                      invoice/piutang,        menganggap invoice
                          receipt, allocation     lunas hanya karena
                                                  receipt ada

  AP                      tagihan/utang, payment, mengakui ulang biaya
                          allocation              saat pembayaran jika
                                                  sudah diakru

  Expenses                beban non-trip, klaim,  melewati approval yang
                          dokumen                 diwajibkan

  Accounting              jurnal, posting,        menerima jurnal tidak
                          reversal, GL, trial     seimbang
                          balance                 

  Approvals               workflow, tugas         mengubah data sumber
                          persetujuan, delegasi   diam-diam

  Bank Reconciliation     cocokkan transaksi      memaksa saldo buku
                          internal dengan         mengikuti bank
                          rekening koran          

  Fixed Assets            aset, depresiasi        mengubah historis
                                                  jurnal depresiasi
                                                  terposting

  Budgeting               anggaran dan realisasi  menjadi sumber saldo GL

  Fiscal Periods          kalender, close/reopen  menutup periode dengan
                                                  posting tertunda tanpa
                                                  kontrol

  Reporting               laporan keuangan dan    mengambil saldo dari
                          operasional             angka yang diketik
                                                  manual

  Audit                   jejak perubahan dan     menyimpan
                          aktivitas               password/token rahasia

  Integrations            API, webhook,           melewati validasi
                          import/export           domain
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 5. Model organisasi dan dimensi

### 5.1 Entitas organisasi

-   `companies`: entitas hukum/perusahaan.
-   `business_units`: jenis/unit usaha seperti AKAP, pariwisata,
    shuttle, rental.
-   `cost_centers`: tempat biaya terjadi, misalnya operasional, bengkel,
    administrasi kantor pusat.
-   `profit_centers`: unit yang hasil pendapatannya ingin dianalisis.
-   `vehicles`: bus/armada.
-   `locations`: pool, kantor, terminal, bengkel (opsional pada MVP).

Satu transaksi dapat memiliki `business_unit_id`, `cost_center_id`,
`profit_center_id`, `trip_id`, `trip_leg_id`, dan `vehicle_id` jika
relevan. Semua dimensi tidak wajib pada setiap transaksi.

### 5.2 Aturan dimensi

-   COA menjawab **jenis** aset/kewajiban/pendapatan/beban.
-   Cost center menjawab **di mana/oleh siapa biaya terjadi**.
-   Profit center menjawab **unit bisnis mana yang dianalisis**.
-   Trip/leg menjawab **perjalanan mana**.
-   Bus menjawab **kendaraan mana**.
-   Counterparty menjawab **dengan siapa transaksi terjadi**.

Validasi dimensi dibuat berdasarkan konfigurasi akun/transaksi. Contoh:
biaya solar trip harus punya trip dan bus; biaya administrasi kantor
pusat tidak harus punya trip atau bus.

Biaya bersama kantor pusat dilaporkan terpisah pada tahap awal. Jangan
mengalokasikan biaya bersama otomatis tanpa dasar dan persetujuan. Jika
kelak ditambahkan, simpan metode, dasar alokasi, periode, dan hasil
alokasi agar dapat diaudit.

------------------------------------------------------------------------

## 6. Chart of Accounts (COA)

### 6.1 Struktur

Tabel `accounts` mendukung hierarki: - kode akun unik per perusahaan; -
nama akun; - tipe: `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`,
`EXPENSE`; - parent account; - `is_postable`; - status aktif; - saldo
normal (debit/kredit); - kontrol akun (mis. bank, AR, AP, uang muka).

Akun header tidak boleh menerima jurnal. Hanya akun detail
`is_postable=true` yang dapat diposting.

### 6.2 Contoh kelompok akun (Struktur Standar Operasional Bus)

``` text
1 ASET
  11 Kas dan Bank
    11101 Kas Operasional Pool (Ciputat/Jakarta)
    11102 Kas Operasional Cabang (Yogyakarta)
    11103 Kas Kecil (Petty Cash)
    11104 Bank Operasional Perusahaan (BCA/Mandiri)
    11105 Kas Kartu Uang Elektronik (Pool E-Toll)
  12 Piutang Usaha (AR)
    12101 Piutang Sewa Charter Bus Wisata
    12102 Piutang Agen Penjualan Online (AR OTA - RedBus/Traveloka)
  13 Uang Muka Operasional Kru
    13101 Uang Jalan (UJ) Kru Perjalanan Bus
  14 Persediaan & Suku Cadang Bengkel
  15 Aset Tetap
    15101 Kendaraan / Armada Bus
    15102 Peralatan Bengkel & Pool
  16 Akumulasi Penyusutan Aset Tetap
    16101 Akumulasi Penyusutan Armada Bus
    16102 Akumulasi Penyusutan Peralatan Bengkel & Pool
2 LIABILITAS
  21 Utang Usaha (AP)
    21101 Utang Vendor Restoran Mitra (Servis Makan Penumpang)
    21102 Utang Vendor Suku Cadang & Bengkel Rekanan
    21103 Utang Vendor Karoseri / Chasis
  22 Utang Pihak Ketiga & Keagenan
    22101 Utang Komisi Agen Penjualan Tiket
    22102 Utang Jasa Koordinator Lapangan (Barat & Timur)
    22103 Utang Komisi / Cashback Rekanan Wisata
  23 Utang Kompensasi Kru Operasional
    23101 Utang Uang Makan & Premi Ritase Kru
  24 Pendapatan Diterima di Muka (DP Sewa Wisata / Tiket Prabayar)
  25 Utang Pajak
  26 Utang Jangka Panjang & Pembiayaan Armada
    26101 Utang Bank / Leasing Armada Bus
  27 Utang Pihak Berelasi / Pemegang Saham
    27101 Utang Pemegang Saham / Talangan Modal Owner
3 EKUITAS
  31 Modal Disetor
    31101 Modal Disetor Pemilik / Investor
  32 Saldo Laba Ditahan
    32101 Saldo Laba Ditahan Tahun Lalu
  33 Laba/Rugi Tahun Berjalan
    33101 Laba / Rugi Periode Berjalan
4 PENDAPATAN
  41 Pendapatan Tiket AKAP Reguler
  42 Pendapatan Sewa Bus Pariwisata / Charter
  43 Pendapatan Kargo & Paket Bagasi Bus (Motor & Kardus)
  44 Pendapatan Layanan Shuttle & Rental Lain
5 BEBAN
  51 Beban Langsung Armada & Layanan Penumpang
    51101 Beban Bahan Bakar Minyak (Solar Bus)
    51102 Beban Service Makan Penumpang Restoran Mitra (Partner RM)
  52 Beban Tol, Parkir, & Fasilitas Perjalanan
    52101 Beban Tol / Top-up E-Toll Perjalanan
    52102 Beban Parkir, TPR, & Penyeberangan Ferry
    52103 Beban Cuci Bus & Perlengkapan Armada
    52104 Beban Snack, Amenity, & Fasilitas Onboard Bus (Kopi, Teh, Wi-Fi, Baterai, Parfum)
  53 Beban Kompensasi & Hak Kru Operasional
    53101 Beban Uang Makan Kru Bus (SPJ)
    53102 Beban Premi / Insentif Ritase Kru (SPJ)
    53103 Beban Bonus Full Seat Kru (Okupansi 100%)
    53104 Beban Komisi / Insentif Kargo Kru
    53105 Beban Uang Makan Standby Kru (Non-SPJ Garasi)
    53106 Beban Insentif Langsir & Dinas Teknis Kru (Non-SPJ Bengkel/Karoseri)
  54 Beban Keagenan & Koordinator Lapangan
    54101 Beban Komisi Agen Penjualan Tiket
    54102 Beban Uang Jasa Koordinator Lapangan (Barat & Timur)
    54103 Beban Komisi / Cashback Agen Rekanan Wisata
  55 Beban Perawatan, Perbaikan, & Bengkel Armada
    55101 Beban Servis & Perawatan Rutin Armada
    55102 Beban Penggantian Suku Cadang (Sparepart)
    55103 Beban Oli & Pelumas Mesin Bus
    55104 Beban Ban Bus (Baru & Vulkanisir)
    55105 Beban Perbaikan AC & Kelistrikan Bus
    55106 Beban Karoseri, Bodi, & Pengecatan
  56 Beban Penyusutan Armada & Peralatan
    56101 Beban Penyusutan Armada Bus
    56102 Beban Penyusutan Peralatan Bengkel & Pool
  57 Beban Umum, Administrasi, & Pool
    57101 Beban Legalitas, Pajak STNK, & KIR Armada
    57102 Beban Asuransi Kendaraan & Jasa Raharja
    57103 Beban Perlengkapan & Kebersihan Pool
    57104 Beban Listrik, Air, & Internet Pool/Kantor
    57105 Beban Gaji Karyawan Kantor & Manajemen
    57106 Beban Gaji Mekanik & Teknisi Bengkel Pool
    57107 Beban Upah Lembur Karyawan & Mekanik (Overtime)
    57108 Beban Uang Makan & Konsumsi Staf Kantor/Garasi
    57109 Beban Perjalanan Dinas & Transport Staf Kantor
    57110 Beban ATK, Kertas, & Percetakan Dokumen
    57111 Beban Retribusi Lingkungan & Keamanan Pool
  58 Beban Selisih Kas Operasional (Pasca Investigasi Kasir)
    58101 Beban Selisih Kasir Pool (Dispensasi Perusahaan)
  59 Beban Bunga & Biaya Keuangan
    59101 Beban Bunga Pinjaman Bank / Leasing Armada
    59102 Beban Administrasi Bank
8 PENDAPATAN & BEBAN LAIN-LAIN (NON-OPERASIONAL)
  81 Pendapatan Non-Operasional
    81101 Pendapatan Bunga Bank & Jasa Giro
    81102 Keuntungan Penjualan Aset Bus / Scrap Besi Tua
  82 Beban Non-Operasional
    82101 Kerugian Pelepasan / Penjualan Aset Bus
```

Akun harus dikonfigurasi sesuai praktik akuntansi perusahaan. Hindari
menanamkan kode akun sebagai konstanta tersebar di banyak service.
Gunakan konfigurasi pemetaan akun per jenis transaksi.

### 6.3 Saldo normal

-   Aset dan beban umumnya bersaldo normal debit.
-   Liabilitas, ekuitas, dan pendapatan umumnya bersaldo normal kredit.
-   Saldo laporan dihitung dari total debit/kredit jurnal terposting,
    bukan disimpan sebagai angka yang dapat diedit.

------------------------------------------------------------------------

## 7. Skema database inti

Gunakan UUID sebagai primary key (atau UUIDv7 jika standar proyek
mendukung). Semua tabel transaksi sebaiknya memiliki: `id`,
`company_id`, `created_at`, `created_by`, `updated_at`, `updated_by`,
dan bila relevan `deleted_at`. Untuk transaksi finansial, utamakan
pembatalan/status dan reversal daripada soft-delete.

Gunakan `numeric(20,2)` atau presisi yang disepakati untuk uang; jangan
gunakan `float`/`double`. Simpan mata uang dengan `char(3)` (mis. IDR).
Untuk IDR, aturan pembulatan harus konsisten. Kuantitas/harga unit dapat
memakai presisi lebih tinggi bila diperlukan.

### 7.1 Master

  --------------------------------------------------------------------------
  Tabel                   Kolom penting              Catatan
  ----------------------- -------------------------- -----------------------
  `companies`             `id`, `code`, `name`,      satu perusahaan saat
                          `currency`, `timezone`     ini; tetap sediakan
                                                     company scope

  `business_units`        `id`, `code`, `name`,      jenis usaha
                          `is_active`                

  `cost_centers`          `id`, `code`, `name`,      hierarki opsional
                          `parent_id`, `is_active`   

  `profit_centers`        `id`, `code`, `name`,      unit pelaporan
                          `business_unit_id`,        
                          `is_active`                

  `accounts`              `id`, `code`, `name`,      COA
                          `type`, `normal_balance`,  
                          `parent_id`,               
                          `is_postable`, `is_active` 

  `vehicles`              `id`, `code`, `nickname`,  bus (kode lambung misal
                          `plate_number`,            SS-01, julukan/nickname,
                          `vehicle_type`, `capacity`, nopol, kelas armada)
                          `is_active`                

  `vehicle_seat_classes`  `id`, `vehicle_id`,        rincian kelas kursi armada
                          `class_name`,              (Sleeper, Luxury 2-1, dsb.)
                          `seat_capacity`,           sebagai hard-limit manifest
                          `is_active`                

  `fare_seasons`          `id`, `code`, `name`,      kalender musim tarif
                          `start_date`, `end_date`,  (Reguler, Tuslah, Liburan)
                          `is_active`                

  `fare_matrix`           `id`, `origin`,            matriks tarif dinamis berversi
                          `destination`,             (snapshot ke transaksi)
                          `seat_class`,              
                          `fare_season_id`,          
                          `amount`, `effective_from`,
                          `effective_until`,         
                          `is_active`                

  `agents`                `id`, `code`, `name`,      agen tiket offline & online
                          `phone`, `agent_type`,     (OFFLINE, ONLINE_OTA), kota
                          `city`, `settlement_type`, (JAKARTA, YOGYA, ALL), dan
                          `is_active`                cara penyelesaian kas

  `agent_commission_rules` `id`, `agent_id`,         aturan komisi per agen/kelas
                          `seat_class`, `rule_type`, (flat per pax / persentase %)
                          `commission_value`,        
                          `is_active`                

  `crew_rate_rules`       `id`, `role`,              standar rate uang makan & premi
                          `service_type`,            kru (DRIVER, CO_DRIVER, CONDUCTOR)
                          `origin`, `destination`,   berbasis rute (AKAP: per trip)
                          `rate_type`,               atau durasi hari (Wisata: per day)
                          `meal_allowance`,          beserta bonus full seat,
                          `trip_incentive`,          dengan masa berlaku berversi
                          `full_seat_bonus`,         
                          `effective_from`,          
                          `effective_until`,         
                          `is_active`                

  `restaurants`           `id`, `code`, `name`,      master restoran mitra servis makan
                          `city`, `rate_per_pax`,    penumpang (bayar tunai via UJ atau
                          `settlement_type`,         invoiced bulanan via AP vendor)
                          `is_active`                

  `coordinator_fee_rules` `id`, `zone`,              aturan fee koordinator wilayah
                          `coordinator_user_id`,     (WEST/Barat & EAST/Timur) berbasis
                          `fee_per_pax`,             jumlah pax (default Rp10.000/pax)
                          `effective_from`,          
                          `effective_until`,         
                          `is_active`                

  `customers`             `id`, `code`, `name`,      pelanggan
                          `tax_id`, `is_active`      

  `vendors`               `id`, `code`, `name`,      pemasok
                          `tax_id`, `is_active`      

  `bank_accounts`         `id`, `name`, `bank_name`, nomor rekening sensitif
                          `account_number_masked`,   dibatasi
                          `gl_account_id`,           
                          `is_active`                

  `payment_methods`       `id`, `code`, `name`,      kas, transfer, gateway
                          `type`, `is_active`        

  `document_sequences`    `id`, `document_type`,     nomor dokumen
                          `period_key`,              concurrency-safe
                          `last_number`              
  --------------------------------------------------------------------------

Jangan menggunakan nomor rekening penuh di log atau API response umum.

### 7.2 SPJ, perjalanan, dan transaksi terkait

Untuk MVP, entitas perjalanan operasional yang menjadi jangkar penugasan
armada menggunakan nama `spjs` (bukan `trips`). Gunakan `spj_legs` untuk
segmen perjalanan dan `spj_crew_assignments` untuk penugasan kru per leg
atau sesi. Jangan membuat dua entitas utama yang sama-sama merepresentasikan
perjalanan operasional.

Modul penjualan tiket/kargo penuh ditunda. Tabel `ticket_sales`,
`ticket_sale_lines`, `ticket_refunds`, dan `trip_agent_settlements` di bawah
ini merupakan cakupan lanjutan, bukan prasyarat MVP. Saat kelak diaktifkan,
relasinya menggunakan `spj_id`/`spj_leg_id` sesuai kebutuhan.

| Tabel | Kolom penting | Catatan |
|---|---|---|
| `spjs` | `id`, `spj_no`, `service_type`, `parent_spj_id`, `business_unit_id`, `profit_center_id`, `operational_status`, `financial_status`, `issued_at`, `operationally_completed_at`, `closed_at` | Surat Perintah Jalan; `spj_no` terformat cerdas (`SPJ/AKP/YYMM/XXXX` atau `SPJ/WIS/YYMM/XXXX`) berbasis `document_sequences`; `parent_spj_id` menautkan SPJ pengganti |
| `spj_legs` | `id`, `spj_id`, `sequence_no`, `direction`, `origin`, `destination`, `departure_at`, `arrival_at`, `status` | Segmen perjalanan; `direction` dapat bernilai `DEPARTURE`/`RETURN` bila relevan |
| `spj_crew_assignments` | `id`, `spj_id`, `spj_leg_id`, `crew_id`, `role`, `assigned_from`, `assigned_until`, `status` | Mendukung pergantian kru antar-leg/sesi |
| `spj_expenses` | `id`, `spj_id`, `spj_leg_id`, `vehicle_id`, `expense_type`, `amount`, `expense_date`, `payment_source`, `status` | Semua biaya perjalanan dicatat di SPJ |
| `spj_uj` | `id`, `spj_id`, `crew_id`, `status` | Kelompok pertanggungjawaban UJ per SPJ/penerima |
| `spj_uj_disbursements` | `id`, `spj_uj_id`, `crew_assignment_id`, `amount`, `disbursement_type`, `issued_at`, `cash_account_id` | Pencairan awal/tambahan; tautkan ke sesi penugasan bila diketahui |
| `spj_uj_expenses` | `id`, `spj_uj_id`, `crew_assignment_id`, `expense_id`, `amount`, `receipt_ref` | Biaya yang dipertanggungjawabkan dari UJ |
| `spj_uj_returns` | `id`, `spj_uj_id`, `crew_assignment_id`, `amount`, `returned_at`, `cash_account_id` | Pengembalian sisa UJ |
| `spj_uj_additional_requests` | `id`, `spj_id`, `crew_assignment_id`, `requested_by`, `amount`, `reason`, `status`, `processed_by`, `processed_at` | Permintaan dipisah dari pencairan aktual |
| `crew_cash_settlements` | `id`, `spj_id`, `status`, `submitted_at`, `reviewed_by`, `reviewed_at` | Header rekonsiliasi kas SPJ |
| `crew_cash_assignments` | `id`, `spj_id`, `crew_id`, `assignment_type`, `valid_from`, `valid_until` | Penugasan penerima/penyetor |
| `crew_cash_remittances` | `id`, `spj_id`, `depositor_crew_id`, `amount`, `cash_account_id`, `remitted_at`, `status` | Setoran aktual |
| `crew_cash_remittance_allocations` | `id`, `remittance_id`, `source_type`, `source_id`, `amount` | Alokasi setoran ke deklarasi/penerimaan |
| `crew_cash_discrepancies` | `id`, `settlement_id`, `source_type`, `expected_amount`, `actual_amount`, `difference_amount`, `resolution_status`, `resolution_notes` | Temuan pemeriksaan; tidak otomatis menjadi piutang kru |
| `spj_revenue_declarations` | `id`, `spj_id`, `spj_leg_id`, `declaration_type`, `amount`, `declared_by`, `declared_at`, `source_reference`, `status` | Rekap penerimaan operasional sementara selama modul ticketing/kargo belum tersedia |
| `crew_meal_payments` | `id`, `spj_id`, `crew_assignment_id`, `crew_id`, `amount`, `paid_at`, `payment_source`, `status` | Input manual; terpisah dari UJ |

Untuk BBM, `spj_expenses` juga menyimpan `fuel_liters` dan
`odometer_reading` (serta lokasi pengisian bila tersedia). Kolom khusus
dapat dipindahkan ke tabel detail BBM bila kelak dibutuhkan.

**Catatan:** tabel lanjutan ticketing/kargo tidak perlu dibuat untuk MVP.

### 7.3 Piutang (AR)

  -----------------------------------------------------------------------
  Tabel                   Kolom penting           Catatan
  ----------------------- ----------------------- -----------------------
  `ar_invoices`           `id`, `invoice_no`,     tagihan
                          `customer_id`,          
                          `invoice_date`,         
                          `due_date`, `status`,   
                          `currency`, `subtotal`, 
                          `tax_amount`,           
                          `total_amount`,         
                          `source_type`,          
                          `source_id`             

  `ar_invoice_lines`      `id`, `invoice_id`,     detail dan dimensi
                          `description`,          
                          `account_id`, `qty`,    
                          `unit_price`, `amount`, 
                          `trip_id`,              
                          `profit_center_id`      

  `ar_receipts`           `id`, `receipt_no`,     penerimaan
                          `customer_id`,          
                          `received_at`,          
                          `payment_method_id`,    
                          `cash_account_id`,      
                          `amount`, `status`,     
                          `reference`             

  `ar_allocations`        `id`, `receipt_id`,     aplikasi receipt ke
                          `invoice_id`, `amount`  invoice
  -----------------------------------------------------------------------

Satu receipt dapat dialokasikan ke beberapa invoice dan satu invoice
dapat dibayar beberapa kali. Validasi total alokasi tidak melebihi
receipt dan saldo invoice (kecuali ada skenario unapplied credit yang
secara eksplisit didukung).

### 7.4 Utang (AP)

  -----------------------------------------------------------------------
  Tabel                   Kolom penting           Catatan
  ----------------------- ----------------------- -----------------------
  `ap_invoices`           `id`, `bill_no`,        tagihan vendor
                          `vendor_id`,            
                          `invoice_date`,         
                          `due_date`, `status`,   
                          `currency`, `subtotal`, 
                          `tax_amount`,           
                          `total_amount`,         
                          `source_type`,          
                          `source_id`             

  `ap_invoice_lines`      `id`, `invoice_id`,     detail biaya
                          `description`,          
                          `account_id`, `qty`,    
                          `unit_price`, `amount`, 
                          `trip_id`,              
                          `vehicle_id`,           
                          `cost_center_id`        

  `ap_payments`           `id`, `payment_no`,     pembayaran
                          `vendor_id`, `paid_at`, 
                          `payment_method_id`,    
                          `cash_account_id`,      
                          `amount`, `status`,     
                          `reference`             

  `ap_allocations`        `id`, `payment_id`,     aplikasi pembayaran
                          `invoice_id`, `amount`  
  -----------------------------------------------------------------------

### 7.5 Akuntansi umum

  -----------------------------------------------------------------------
  Tabel                   Kolom penting           Catatan
  ----------------------- ----------------------- -----------------------
  `journal_entries`       `id`, `journal_no`,     header jurnal
                          `journal_date`,         
                          `period_id`,            
                          `source_type`,          
                          `source_id`,            
                          `description`,          
                          `status`, `posted_at`,  
                          `posted_by`,            
                          `reversal_of_id`        

  `journal_lines`         `id`,                   baris jurnal
                          `journal_entry_id`,     
                          `line_no`,              
                          `account_id`, `debit`,  
                          `credit`,               
                          `description`,          
                          `business_unit_id`,     
                          `cost_center_id`,       
                          `profit_center_id`,     
                          `trip_id`,              
                          `trip_leg_id`,          
                          `vehicle_id`,           
                          `counterparty_type`,    
                          `counterparty_id`       

  `posting_rules`         `id`, `source_type`,    pemetaan akun; dapat
                          `event_type`,           berkembang
                          `debit_account_id`,     
                          `credit_account_id`,    
                          `is_active`             

  `journal_attachments`   `id`,                   bukti
                          `journal_entry_id`,     
                          `file_id`,              
                          `description`           

  `accounting_events`     `id`, `source_type`,    cegah posting ganda
                          `source_id`,            
                          `event_type`,           
                          `idempotency_key`,      
                          `journal_entry_id`,     
                          `created_at`            
  -----------------------------------------------------------------------

Jangan menjadikan `accounting_events` sebagai pengganti jurnal. Ia
adalah catatan penghubung/idempotensi.

### 7.6 Kas dan bank

  -------------------------------------------------------------------------------------
  Tabel                         Kolom penting                  Catatan
  ----------------------------- ------------------------------ ------------------------
  `cash_accounts`               `id`, `name`, `gl_account_id`, kas kecil/kas
                                `custodian_user_id`,           operasional
                                `is_active`                    

  `cash_transactions`           `id`, `transaction_no`,        penerimaan/pengeluaran
                                `type`, `transaction_date`,    kas
                                `cash_account_id`, `amount`,   
                                `source_type`, `source_id`,    
                                `status`                       

  `bank_transactions`           `id`, `bank_account_id`,       transaksi buku bank
                                `transaction_date`,            
                                `value_date`, `description`,   
                                `reference`, `debit`,          
                                `credit`, `source_type`,       
                                `source_id`, `status`          

  `bank_statement_lines`        `id`, `bank_account_id`,       baris rekening koran
                                `statement_date`,              
                                `description`, `reference`,    
                                `debit`, `credit`,             
                                `import_batch_id`              

  `bank_reconciliations`        `id`, `bank_account_id`,       rekonsiliasi
                                `period_start`, `period_end`,  
                                `statement_closing_balance`,   
                                `status`, `completed_by`,      
                                `completed_at`                 

  `bank_reconciliation_items`   `id`, `reconciliation_id`,     pasangan pencocokan
                                `statement_line_id`,           
                                `bank_transaction_id`,         
                                `match_status`, `difference`   

  `cash_transfers`              `id`, `from_cash_account_id`,  transfer antar kas/bank
                                `to_cash_account_id`,          
                                `amount`, `transfer_date`,     
                                `status`                       
  -------------------------------------------------------------------------------------

Transfer antar rekening/kas adalah perpindahan aset, bukan pendapatan
atau beban. Biaya bank dicatat sebagai beban terpisah.

### 7.7 Persetujuan, periode, audit, aset, anggaran

  ----------------------------------------------------------------------------
  Tabel                   Kolom penting                Catatan
  ----------------------- ---------------------------- -----------------------
  `approval_workflows`    `id`, `name`,                definisi workflow
                          `document_type`, `is_active` 

  `approval_steps`        `id`, `workflow_id`,         aturan persetujuan
                          `step_no`,                   
                          `approver_role_id`,          
                          `min_amount`, `max_amount`   

  `approval_requests`     `id`, `document_type`,       instance approval
                          `document_id`,               
                          `workflow_id`, `status`,     
                          `submitted_by`,              
                          `submitted_at`               

  `approval_actions`      `id`, `request_id`,          riwayat
                          `step_id`, `actor_id`,       
                          `action`, `comment`,         
                          `acted_at`                   

  `fiscal_years`          `id`, `year`, `start_date`,  tahun fiskal
                          `end_date`, `status`         

  `fiscal_periods`        `id`, `fiscal_year_id`,      periode
                          `period_no`, `start_date`,   
                          `end_date`, `status`,        
                          `closed_at`, `closed_by`     

  `period_close_checks`   `id`, `period_id`,           checklist tutup buku
                          `check_code`, `status`,      
                          `details`, `checked_at`      

  `audit_logs`            `id`, `actor_id`, `action`,  audit; redaksi data
                          `entity_type`, `entity_id`,  rahasia
                          `before_data`, `after_data`, 
                          `reason`, `request_id`,      
                          `created_at`                 

  `fixed_assets`          `id`, `asset_code`, `name`,  aset tetap
                          `acquisition_date`, `cost`,  
                          `useful_life_months`,        
                          `residual_value`,            
                          `asset_account_id`,          
                          `accum_depr_account_id`,     
                          `depr_expense_account_id`,   
                          `status`                     

  `asset_depreciations`   `id`, `asset_id`,            depresiasi per periode
                          `period_id`, `amount`,       
                          `journal_entry_id`, `status` 

  `budgets`               `id`, `name`,                anggaran
                          `fiscal_year_id`, `status`,  
                          `version`                    

  `budget_lines`          `id`, `budget_id`,           detail anggaran
                          `account_id`, `period_id`,   
                          `business_unit_id`,          
                          `cost_center_id`,            
                          `profit_center_id`, `amount` 
  ----------------------------------------------------------------------------

### 7.8 Relasi utama (ringkas)

``` text
Company
 ├─ BusinessUnit ─ ProfitCenter
 ├─ CostCenter
 ├─ Account (parent-child)
 ├─ Vehicle ─ VehicleSeatClass
 ├─ FareSeason ─ FareMatrix
 ├─ Agent ─ AgentCommissionRule
 ├─ CrewRateRule
 ├─ Restaurant
 ├─ CoordinatorFeeRule
 ├─ Customer
 ├─ Vendor
 ├─ BankAccount
 ├─ CashAccount
 ├─ SPJ
 │   ├─ SPJLeg
 │   │   └─ SPJCrewAssignment
 │   ├─ SPJUJ ─ SPJUJDisbursement
 │   │         ├─ SPJUJExpense
 │   │         └─ SPJUJReturn
 │   ├─ SPJExpense
 │   ├─ SPJRevenueDeclaration
 │   ├─ CrewCashSettlement
 │   │   ├─ CrewCashRemittance ─ CrewCashRemittanceAllocation
 │   │   └─ CrewCashDiscrepancy
 │   └─ CrewMealPayment
 ├─ ARInvoice ─ ARInvoiceLine ─ ARAllocation ─ ARReceipt
 ├─ APInvoice ─ APInvoiceLine ─ APAllocation ─ APPayment
 ├─ JournalEntry ─ JournalLine
 └─ FiscalYear ─ FiscalPeriod
```

Semua FK harus memakai constraint database. Tentukan
`ON DELETE RESTRICT` untuk data finansial/master yang sudah digunakan.
Penghapusan master yang telah dipakai sebaiknya berupa
`is_active=false`.

------------------------------------------------------------------------

## 8. Status dan state machine

Status harus eksplisit dan transisi divalidasi oleh backend. Jangan
menerima status bebas dari frontend.

### 8.1 Dokumen transaksi umum

Contoh: `DRAFT → SUBMITTED → APPROVED → POSTED` Alternatif:
`SUBMITTED → REJECTED → DRAFT` `POSTED → REVERSED` (melalui jurnal
reversal, bukan edit jurnal).

Tidak semua dokumen memerlukan semua status. Definisikan state machine
per domain.

### 8.2 SPJ (Status Ganda Independen — Definitif)

Sistem membakukan pemisahan status operasional dan status finansial SPJ secara independen (merujuk kesepakatan final Addendum v1.5):

1. **Status Operasional (`operational_status`)**:
   `DRAFT → ISSUED → IN_PROGRESS → COMPLETED` (atau `CANCELLED`)
   - `DRAFT`: SPJ sedang disusun oleh petugas operasional (armada & kru belum berangkat).
   - `ISSUED`: SPJ telah diterbitkan resmi dan disahkan operasional; bus siap diberangkatkan.
   - `IN_PROGRESS`: Bus sedang menempuh perjalanan aktif di rute (leg perjalanan berjalan).
   - `COMPLETED`: Bus telah menyelesaikan seluruh leg perjalanan dan armada telah kembali ke pool/garasi.
   - `CANCELLED`: Pembatalan penugasan perjalanan sebelum beroperasi.

2. **Status Finansial (`financial_status`)**:
   `PENDING_SETTLEMENT → UNDER_REVIEW → SETTLED` (atau `DISCREPANCY`)
   - `PENDING_SETTLEMENT`: Dokumen SPJ baru terbit atau perjalanan selesai tetapi kru belum menyerahkan laporan UJ dan setoran kas ke kasir.
   - `UNDER_REVIEW`: Kasir/Finance sedang memverifikasi nota pengeluaran UJ, kupon/bukti servis makan, dan setoran penerimaan tiket/kargo.
   - `DISCREPANCY`: Terdapat selisih kas yang dicatat secara transparan dan memerlukan investigasi/keputusan tindak lanjut manajemen.
   - `SETTLED`: Pertanggungjawaban kas telah selesai diverifikasi penuh (`uj_status = BALANCED` dan `revenue_status = MATCHED` atau `DISCREPANCY_RECORDED`).

Status perjalanan `COMPLETED` secara operasional tidak otomatis menjadikannya `SETTLED` secara finansial. Keduanya dikelola oleh state machine terpisah di backend.

### 8.3 AR/AP

Invoice: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `POSTED`,
`PARTIALLY_PAID`, `PAID`, `VOIDED`, `REVERSED`. Receipt/payment:
`DRAFT`, `APPROVED` (jika perlu), `POSTED`, `VOIDED`, `REVERSED`. Status
paid dihitung dari saldo setelah alokasi, bukan dipilih manual.

### 8.4 Periode

`OPEN → CLOSING → CLOSED`; `CLOSED → REOPENED` hanya melalui kewenangan
khusus dan alasan wajib. Kebijakan bisa memilih koreksi di periode
berikutnya tanpa membuka periode lama.

------------------------------------------------------------------------

## 9. Alur bisnis utama

### 9.1 Siklus trip

1.  Buat trip, pilih unit usaha, bus, rute, jadwal, dan leg.
2.  Catat penjualan tiket per agen/kanal dan leg.
3.  Catat biaya trip beserta tanggal, kategori, vendor/penerima, bus,
    leg, metode pembayaran, dan bukti.
4.  Jika memberi uang muka kepada kru, catat pengeluaran kas/bank ke
    akun uang muka kru.
5.  Kru menyerahkan bukti; biaya yang sah dialokasikan ke uang muka.
    Sisa dikembalikan ke kas perusahaan. Kekurangan tidak otomatis
    dibayar dari uang pribadi; buat proses pembayaran perusahaan sesuai
    kebijakan.
6.  Saat leg/trip selesai sesuai kebijakan, sistem menyiapkan pengakuan
    pendapatan.
7.  Hitung komisi dan bonus dari aturan aktif, tampilkan perhitungan,
    lalu minta persetujuan.
8.  Buat settlement agen per trip/leg/agen. Cocokkan penjualan, uang
    yang disetor, komisi, dan jumlah yang harus dibayar/diterima.
9.  Finance meninjau selisih dan bukti; setelah disetujui, posting
    jurnal terkait.
10. Laporan kontribusi trip menampilkan pendapatan, biaya langsung,
    komisi/bonus, dan selisih; biaya kantor pusat tetap terpisah.

### 9.2 Pengakuan pendapatan

Sesuai kebijakan yang dinyatakan, pendapatan diakui setelah perjalanan
selesai. Namun implementasi wajib memastikan kebijakan final untuk trip
multi-leg: pengakuan per leg atau setelah seluruh trip pulang-pergi
selesai.

Contoh konseptual: - Tiket dijual dan uang diterima sebelum perjalanan:
penerimaan tidak otomatis menjadi pendapatan; dapat menjadi pendapatan
diterima di muka sesuai kebijakan. - Trip selesai dan pendapatan
memenuhi kriteria pengakuan: debit akun penampung/pendapatan diterima di
muka atau piutang yang sesuai; kredit pendapatan. - Jika agen
mengumpulkan uang, catat piutang kepada agen hanya untuk jumlah yang
memang wajib disetor ke perusahaan. - Komisi agen dicatat terpisah
sebagai beban dan utang saat kewajiban timbul menurut kebijakan, lalu
dibayar melalui transaksi pembayaran.

### 9.3 Biaya trip dan uang muka kru

**Pengeluaran langsung perusahaan** - Saat biaya terjadi dan langsung
dibayar: debit akun beban yang sesuai; kredit kas/bank. - Jika tagihan
belum dibayar: debit beban; kredit AP. - Saat AP dibayar: debit AP;
kredit kas/bank.

**Uang muka kru** - Saat uang diberikan: debit Uang Muka Kru; kredit
Kas/Bank. - Saat bukti biaya disetujui: debit Beban terkait; kredit Uang
Muka Kru. - Saat sisa uang dikembalikan: debit Kas; kredit Uang Muka
Kru. - Uang muka yang belum dipertanggungjawabkan tetap menjadi
aset/uang perusahaan yang dipegang kru.

### 9.4 AR

1.  Buat invoice dari sumber yang sah (mis. charter atau pelanggan
    korporat).
2.  Validasi tanggal, jatuh tempo, customer, baris, akun, pajak, dan
    dimensi.
3.  Approval bila diperlukan.
4.  Posting invoice; saldo piutang terbentuk.
5.  Catat receipt saat uang diterima.
6.  Alokasikan receipt ke satu atau lebih invoice.
7.  Sisa yang belum dialokasikan ditampilkan jelas sebagai unapplied
    receipt bila fitur ini diaktifkan.
8.  Laporan aging menghitung umur dari tanggal/jatuh tempo sesuai basis
    yang dipilih.

### 9.5 AP

1.  Buat tagihan vendor dari biaya trip, perawatan, atau biaya lain.
2.  Hindari pencatatan biaya ganda: sumber operasional dan invoice
    vendor harus memiliki aturan konversi yang jelas.
3.  Approval, posting, lalu pembayaran.
4.  Pembayaran mengurangi AP melalui allocation; tidak mendebit beban
    lagi bila beban sudah diakui saat invoice diposting.

### 9.6 Tutup buku bulanan

Tutup buku tidak harus menunggu semua AR/AP lunas. Piutang/utang terbuka
adalah saldo yang tetap disajikan. Checklist harus menunjukkan jumlah
dan detailnya, serta overdue sebagai peringatan. Perusahaan dapat
mengonfigurasi item tertentu sebagai blocker.

Checklist minimum: - transaksi periode sudah diinput dan ditinjau; -
tidak ada dokumen approved yang belum diposting tanpa alasan; - seluruh
jurnal balance; - kas dihitung/direkonsiliasi; - rekening bank
direkonsiliasi atau selisih dijelaskan; - AR/AP dan unapplied payment
ditinjau; - uang muka kru outstanding ditinjau; - biaya akrual dan
depresiasi diproses bila relevan; - trial balance seimbang; - laporan
keuangan ditinjau; - persetujuan penutupan diperoleh.

Setelah close, blok posting ke periode tersebut. Simpan siapa menutup,
kapan, hasil checklist, dan catatan. Reopen harus terbatas dan diaudit.

------------------------------------------------------------------------

## 10. Jurnal standar (contoh konseptual)

Angka dan akun berikut ilustratif; konfigurasi COA menentukan akun
sebenarnya.

  -----------------------------------------------------------------------
  Peristiwa               Debit                   Kredit
  ----------------------- ----------------------- -----------------------
  Uang muka kru diberikan Uang Muka Kru           Kas/Bank

  Bukti BBM disetujui     Beban BBM               Uang Muka Kru
  dari uang muka                                  

  Sisa uang muka          Kas                     Uang Muka Kru
  dikembalikan                                    

  Biaya bengkel belum     Beban Perawatan         Utang Usaha
  dibayar                                         

  Pembayaran tagihan      Utang Usaha             Bank
  bengkel                                         

  Piutang charter         Piutang Usaha           Pendapatan/akun sesuai
  ditagihkan                                      kebijakan

  Pelanggan membayar      Bank                    Piutang Usaha
  invoice                                         

  Tiket dibayar sebelum   Bank/Kas                Pendapatan Diterima di
  trip selesai                                    Muka

  Trip selesai dan        Pendapatan Diterima di  Pendapatan
  pendapatan diakui       Muka / Piutang          

  Komisi agen menjadi     Beban Komisi            Utang Komisi Agen
  kewajiban                                       

  Komisi dibayar          Utang Komisi Agen       Kas/Bank

  Transfer bank ke kas    Kas Kecil               Bank
  kecil                                           

  Biaya administrasi bank Beban Administrasi Bank Bank

  Depresiasi bulanan      Beban Penyusutan        Akumulasi Penyusutan
  -----------------------------------------------------------------------

Jurnal harus seimbang: total debit = total kredit. Untuk transaksi
multi-line, simpan satu header dengan banyak baris.

------------------------------------------------------------------------

## 11. Kontrak teknis posting akuntansi

### 11.1 Satu pintu posting

Buat `AccountingPostingService` sebagai satu-satunya service yang boleh
membuat dan mem-posting jurnal. Contoh tanggung jawab: - validasi akun
aktif dan postable; - validasi periode terbuka; - validasi jumlah
debit/kredit positif dan seimbang; - validasi dimensi wajib; - validasi
sumber dan idempotency key; - simpan journal header/lines; - ubah status
sumber; - tulis accounting event; - commit semua dalam satu transaksi.

Gunakan `DataSource.transaction()` dan `EntityManager` transaksi yang
sama untuk seluruh operasi. Jangan memakai repository default di dalam
transaksi jika dapat keluar dari transaction manager.

### 11.2 Pola posting (pseudocode)

``` ts
await dataSource.transaction(async (manager) => {
  const source = await sourceRepo(manager).findOneOrFail({
    where: { id: sourceId },
    lock: { mode: 'pessimistic_write' },
  });

  assertCanPost(source);
  assertIdempotencyNotUsed(manager, idempotencyKey);

  const period = await periodRepo(manager).findOpenForDate(journalDate);
  const lines = buildJournalLines(source, postingConfig);

  validateAccounts(lines);
  validateDimensions(lines);
  validateBalanced(lines);

  const journal = manager.create(JournalEntry, {
    journalDate,
    periodId: period.id,
    sourceType,
    sourceId,
    status: 'POSTED',
    postedAt: new Date(),
    postedBy: actorId,
    lines,
  });

  await manager.save(journal);
  source.status = 'POSTED';
  await manager.save(source);
  await manager.insert(AccountingEvent, {
    sourceType, sourceId, eventType: 'POSTED',
    idempotencyKey, journalEntryId: journal.id,
  });
});
```

Pseudocode ini menunjukkan urutan, bukan implementasi siap salin.
Implementasi harus menangani unique violation, retry, nomor dokumen, dan
lock dengan benar.

### 11.3 Idempotensi dan konkurensi

-   Sediakan `idempotency_key` unik untuk operasi yang dapat diulang
    dari UI/API.
-   Tambahkan unique constraint yang sesuai, misalnya sumber + event +
    versi, agar satu sumber tidak terposting dua kali.
-   Gunakan row lock pada dokumen sumber ketika posting/settlement.
-   Nomor dokumen dibuat secara aman dalam transaksi dengan row lock
    pada `document_sequences`; jangan memakai `MAX(number)+1`.
-   Tangani deadlock dengan retry terbatas dan logging.
-   Jangan menjadikan request timeout sebagai alasan mengulang transaksi
    tanpa idempotency.

### 11.4 Reversal dan koreksi

Jurnal `POSTED` tidak boleh diubah/dihapus. Untuk koreksi: 1. buat
jurnal reversal yang menunjuk `reversal_of_id`; 2. posting reversal di
periode terbuka sesuai kebijakan; 3. buat dokumen/jurnal koreksi; 4.
simpan alasan dan referensi dokumen asal. Jangan mengubah jurnal lama
agar laporan historis tetap dapat diaudit.

------------------------------------------------------------------------

## 12. Entity dan aturan TypeORM

-   Gunakan `numeric` PostgreSQL untuk uang. Di TypeORM, nilai `numeric`
    sering diterima sebagai string; konversi dengan library decimal atau
    operasi string aman, bukan `Number` untuk kalkulasi finansial.
-   Tentukan precision/scale eksplisit.
-   Gunakan enum atau lookup table untuk status; pilih satu pola
    konsisten.
-   Index FK, tanggal transaksi, status, nomor dokumen, dan kombinasi
    pencarian yang umum.
-   Tambahkan unique constraints untuk kode master per perusahaan, nomor
    dokumen per tipe/periode, dan relasi yang harus unik.
-   Gunakan migration untuk seluruh perubahan schema.
-   Hindari `synchronize: true` di staging/production.
-   Entity tidak boleh berisi logika bisnis berat; gunakan domain
    service/use case.
-   Gunakan `@VersionColumn` untuk optimistic concurrency pada dokumen
    draft yang rawan diedit bersamaan, jika sesuai.
-   Soft delete hanya untuk master atau draft yang aman; dokumen
    finansial posted tidak dihapus.
-   Jangan membuat cascade delete dari invoice/jurnal ke baris historis
    yang harus dipertahankan.

### 12.1 Contoh tipe kolom uang

``` ts
@Column({ type: 'numeric', precision: 20, scale: 2 })
amount: string;
```

### 12.2 Validasi

Gunakan DTO + `class-validator` untuk bentuk input, lalu validasi domain
di service. DTO bukan pengganti validasi bisnis. Validasi ulang seluruh
hal penting di backend meskipun frontend sudah memvalidasi.

------------------------------------------------------------------------

## 13. API REST yang disarankan

Prefix `/api/v1`. Gunakan pagination, filter, sorting allowlist, DTO
response, dan Swagger. Hindari mengembalikan entity mentah.

### 13.1 Master data

``` text
GET/POST       /business-units
GET/PATCH      /business-units/:id
GET/POST       /cost-centers
GET/POST       /profit-centers
GET/POST       /accounts
GET/PATCH      /accounts/:id
GET/POST       /vehicles
GET/POST       /agents
GET/POST       /customers
GET/POST       /vendors
GET/POST       /bank-accounts
```

### 13.2 SPJ dan deklarasi penerimaan

``` text
GET/POST       /spjs
GET/PATCH      /spjs/:id
POST           /spjs/:id/legs
POST           /spjs/:id/start
POST           /spjs/:id/complete
POST           /spjs/:id/cancel
GET            /spjs/:id/financial-summary

POST           /spjs/:id/revenue-declarations
GET            /spjs/:id/revenue-declarations
```

Endpoint penjualan tiket/kargo penuh ditunda hingga modul sumber transaksi
tersebut masuk ruang lingkup. Deklarasi penerimaan pada MVP adalah data
rekonsiliasi operasional dan tidak otomatis menjadi pengakuan pendapatan.

### 13.3 Biaya, UJ, dan settlement kas

``` text
POST/GET       /spjs/:id/expenses
POST           /spjs/:id/uj/disburse
POST           /spjs/:id/uj/expenses
POST           /spjs/:id/uj/returns
POST           /spjs/:id/uj/additional-requests
POST           /spjs/:id/cash-settlement
GET            /spjs/:id/cash-settlement
POST           /spjs/:id/cash-settlement/verify
```

Verifikasi settlement kas SPJ hanya dapat dilakukan jika pertanggungjawaban
UJ berstatus `BALANCED` dan status penerimaan berada pada
`MATCHED` atau `DISCREPANCY_RECORDED`. Status discrepancy tercatat tidak
berarti selisih telah diselesaikan; penutupan finansial tetap mengikuti
hasil pemeriksaan dan kebijakan perusahaan.

### 13.4 AR/AP

``` text
GET/POST       /ar/invoices
GET/PATCH      /ar/invoices/:id
POST           /ar/invoices/:id/submit
POST           /ar/invoices/:id/post
POST           /ar/receipts
POST           /ar/receipts/:id/allocate

GET/POST       /ap/invoices
GET/PATCH      /ap/invoices/:id
POST           /ap/invoices/:id/submit
POST           /ap/invoices/:id/post
POST           /ap/payments
POST           /ap/payments/:id/allocate
```

### 13.5 Accounting dan close

``` text
GET/POST       /journals
GET             /journals/:id
POST            /journals/:id/post
POST            /journals/:id/reverse
GET             /general-ledger
GET             /trial-balance
GET             /financial-statements
GET             /fiscal-periods
POST            /fiscal-periods/:id/start-close
POST            /fiscal-periods/:id/close
POST            /fiscal-periods/:id/reopen
```

### 13.6 Approval, bank, laporan

``` text
GET/POST       /approvals/workflows
GET             /approvals/inbox
POST            /approvals/requests/:id/approve
POST            /approvals/requests/:id/reject

POST            /bank-statements/import
POST            /bank-reconciliations
POST            /bank-reconciliations/:id/match
POST            /bank-reconciliations/:id/complete

GET             /reports/trip-profitability
GET             /reports/revenue
GET             /reports/expenses
GET             /reports/ar-aging
GET             /reports/ap-aging
GET             /reports/cash-flow
GET             /reports/period-close
```

Gunakan action endpoint (`/post`, `/approve`, `/reverse`) untuk operasi
domain yang memiliki aturan transisi, bukan PATCH status bebas.

### 13.7 Bentuk response

Standarkan:

``` json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-10-02T00:00:00Z"
  }
}
```

Untuk list:

``` json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

Error gunakan kode stabil seperti `PERIOD_CLOSED`,
`JOURNAL_NOT_BALANCED`, `APPROVAL_REQUIRED`, `ALREADY_POSTED`,
`INSUFFICIENT_UNALLOCATED_AMOUNT`. Jangan bergantung pada teks pesan
untuk logika frontend.

------------------------------------------------------------------------

## 14. Authentication, authorization, dan approval

### 14.1 RBAC

Entitas: - `users` - `roles` - `permissions` - `user_roles` -
`role_permissions`

Permission berbentuk resource-action, misalnya: `trip.read`,
`trip.create`, `trip.complete`, `trip.settlement.approve`,
`journal.post`, `period.close`, `period.reopen`,
`report.financial.read`.

Sertakan scope bila perlu, misalnya seluruh perusahaan atau unit usaha
tertentu. Jangan mengandalkan nama role yang ditanam di kode.

### 14.2 Approval workflow

Workflow dapat berdasarkan: - tipe dokumen; - nominal; - unit usaha/cost
center; - langkah berurutan; - role approver; - aturan pemisahan pembuat
dan penyetuju.

Simpan snapshot workflow pada approval request agar perubahan
konfigurasi tidak mengubah proses lama. Catat approve/reject, actor,
waktu, komentar, dan versi dokumen yang disetujui.

### 14.3 Separation of duties

Konfigurasikan aturan bahwa pembuat tidak boleh menyetujui dokumen
sendiri untuk transaksi tertentu. Persetujuan tidak sama dengan posting;
posting dapat dilakukan oleh role terpisah atau otomatis setelah
approval sesuai kebijakan.

------------------------------------------------------------------------

## 15. Frontend dan pengalaman pengguna

### 15.1 Navigasi berbasis tugas

Menu utama yang disarankan: - Dashboard - Operasional: Trip, Penjualan
Tiket, Biaya Trip, Settlement - Kas & Bank: Penerimaan, Pembayaran,
Transfer, Rekonsiliasi - Piutang - Utang - Beban - Akuntansi: Jurnal,
Buku Besar, Neraca Saldo - Aset Tetap - Anggaran - Tutup Buku -
Laporan - Persetujuan - Master Data dan Pengaturan

### 15.2 Role-based workspace

  Peran kerja         Halaman utama
  ------------------- --------------------------------------
  Admin operasional   Trip, tiket, biaya, settlement
  Kasir               Penerimaan, pembayaran, transfer
  Admin finance       AR/AP, biaya, dokumen pending
  Akuntan             Jurnal, GL, rekonsiliasi, tutup buku
  Manajer finance     Approval, laporan, anggaran
  Direksi             Dashboard dan laporan ringkas
  System admin        User, role, permission, konfigurasi

Role tersebut contoh pekerjaan, bukan struktur organisasi final.

### 15.3 Pola UI

-   Form bertahap hanya bila mengurangi beban; gunakan default dan
    autofill yang aman.
-   Tampilkan nomor dokumen, status, tanggal, pihak, nominal, dan sumber
    secara konsisten.
-   Gunakan draft dan autosave hanya jika mekanisme konflik jelas.
-   Tampilkan peringatan sebelum posting, termasuk periode, akun, total
    debit/kredit, dan dimensi.
-   Setelah posting, tampilkan tautan ke jurnal yang terbentuk.
-   Detail transaksi memiliki tab: Ringkasan, Baris, Pembayaran/Alokasi,
    Approval, Jurnal, Lampiran, Audit.
-   Tabel mendukung filter, pencarian, sort allowlist, pagination,
    ekspor sesuai permission.
-   Gunakan format rupiah di UI, tetapi kirim angka desimal sebagai
    string ke API.
-   Jangan mengandalkan warna saja untuk status; sertakan label.
-   Tampilkan saldo belum dialokasikan dan outstanding secara eksplisit.
-   Simpan filter penting hanya jika kebutuhan dan privasi sudah
    ditinjau.

### 15.4 Dashboard

Dashboard per role, misalnya: - trip selesai tetapi settlement belum
selesai; - tiket/pendapatan menunggu pengakuan; - biaya tanpa bukti; -
uang muka kru belum dipertanggungjawabkan; - AR/AP jatuh tempo dan
overdue; - dokumen menunggu approval; - kas/bank dan transaksi belum
direkonsiliasi; - status kesiapan tutup buku.

Dashboard bukan pengganti laporan resmi; setiap angka harus bisa dibuka
ke daftar transaksi sumber.

------------------------------------------------------------------------

## 16. Laporan dan definisi metrik

### 16.1 Laporan akuntansi

-   Jurnal umum
-   Buku besar per akun dan periode
-   Neraca saldo
-   Laba rugi
-   Neraca
-   Arus kas (metode dan klasifikasi ditetapkan bersama akuntan)
-   Daftar piutang dan aging
-   Daftar utang dan aging
-   Rekonsiliasi bank
-   Mutasi aset tetap dan depresiasi

Semua laporan akuntansi mengambil jurnal berstatus `POSTED`, dengan
aturan tanggal/periode yang konsisten.

### 16.2 Laporan operasional

-   Pendapatan per unit usaha, rute, trip, leg, bus, agen
-   Biaya langsung per trip/leg/bus
-   Settlement agen per trip
-   Uang muka kru outstanding
-   Kontribusi trip

**Kontribusi trip** adalah metrik manajemen yang perlu definisi
tertulis. Contoh:
`Pendapatan trip - biaya langsung trip - komisi - bonus` Tidak otomatis
sama dengan laba bersih karena dapat belum memasukkan depresiasi,
overhead, pajak, atau biaya bersama.

### 16.3 Biaya bersama

Tampilkan sebagai baris/kelompok terpisah, misalnya
`Head Office / Shared Costs`. Jangan mengalokasikan ke unit usaha secara
diam-diam. Bila fitur alokasi ditambahkan, laporan harus menunjukkan
angka sebelum dan sesudah alokasi serta aturan yang digunakan.

### 16.4 Konsistensi laporan

-   Tentukan apakah laporan menggunakan tanggal transaksi, tanggal
    jurnal, atau tanggal penyelesaian; beri label dengan jelas.
-   Sediakan drill-down dari angka laporan ke jurnal dan dokumen sumber.
-   Untuk periode tertutup, laporan harus stabil; perubahan hanya
    melalui prosedur koreksi/reopen.
-   Hindari menghitung saldo dari `status=PAID` saja; gunakan jumlah
    posting dan alokasi.

------------------------------------------------------------------------

## 17. Validasi bisnis penting

### 17.1 Umum

-   Nominal tidak negatif kecuali jenis transaksi memang mendukung
    kredit/refund.
-   Tanggal transaksi harus berada dalam periode yang valid.
-   Akun harus aktif dan postable.
-   Total debit sama dengan total kredit.
-   Dokumen posted tidak dapat diedit.
-   Referensi sumber unik sesuai aturan.
-   Mata uang dan pembulatan konsisten.
-   Semua perubahan penting memiliki actor dan timestamp.

### 17.2 Trip

-   Trip memiliki nomor unik.
-   Leg memiliki urutan unik dalam trip.
-   Tidak dapat menyelesaikan trip tanpa memenuhi prasyarat operasional
    yang dikonfigurasi.
-   Pendapatan tidak boleh diakui dua kali.
-   Settlement agen tidak boleh mencampur trip berbeda.
-   Biaya trip harus memiliki trip dan kategori; bus/leg diwajibkan
    sesuai jenis biaya.
-   Biaya yang dibayar langsung tidak boleh sekaligus
    dipertanggungjawabkan dari uang muka.

### 17.3 AR/AP

-   Alokasi tidak melebihi saldo receipt/payment atau invoice/bill.
-   Invoice yang sudah posted tidak diedit; koreksi via credit
    note/reversal.
-   Receipt/payment yang sudah posted tidak dihapus.
-   Partial payment didukung.
-   Pembayaran invoice tidak membuat beban baru jika beban sudah dicatat
    saat invoice.

### 17.4 Close

-   Periode closed menolak posting baru.
-   Semua pengecualian dicatat dan ditampilkan.
-   Reopen membutuhkan permission dan alasan.
-   Checklist menyimpan hasil saat close, bukan hanya status terkini.

------------------------------------------------------------------------

## 18. Keamanan dan audit

-   Gunakan HTTPS di seluruh lingkungan non-local.
-   Password di-hash dengan algoritma modern (Argon2id/bcrypt dengan
    parameter sesuai).
-   JWT access token berumur pendek; refresh token dikelola aman dan
    dapat dicabut.
-   Terapkan rate limit untuk autentikasi dan endpoint sensitif.
-   Validasi input, batasi ukuran upload, periksa tipe file, dan simpan
    file di object storage dengan akses terkontrol.
-   Jangan mencatat password, token, nomor rekening penuh, atau data
    pribadi yang tidak diperlukan ke log.
-   Audit log untuk
    create/update/submit/approve/reject/post/reverse/close/reopen/export.
-   Catat nilai sebelum/sesudah secara selektif; redaksi data sensitif.
-   Gunakan permission backend untuk semua endpoint dan object-level
    authorization untuk mencegah akses dokumen milik unit yang tidak
    berwenang.
-   Terapkan backup terenkripsi dan uji pemulihan.

------------------------------------------------------------------------

## 19. File bukti dan lampiran

Lampiran dapat berupa nota BBM, tol, parkir, invoice vendor, bukti
transfer, rekening koran, atau dokumen approval.

Metadata file minimal: - `id`, `storage_key`, `original_name`,
`mime_type`, `size_bytes`, `checksum`, `uploaded_by`, `uploaded_at`; -
relasi ke dokumen sumber; - status scan/validasi bila ada.

Jangan menyimpan file besar sebagai bytea di tabel transaksi tanpa
alasan. Simpan di object storage/private storage dan akses melalui URL
bertanda tangan yang berumur pendek. Validasi MIME berdasarkan isi file
bila memungkinkan.

------------------------------------------------------------------------

## 20. Import, export, dan integrasi masa depan

Tahap awal dapat menggunakan input manual dan CSV/XLSX import terbatas.
Untuk import: 1. unggah file; 2. validasi format dan mapping; 3.
tampilkan preview dan error per baris; 4. minta konfirmasi; 5. proses
dengan batch ID dan idempotency; 6. sediakan hasil sukses/gagal yang
dapat diunduh.

Untuk API masa depan: - versi API; - external reference ID; -
idempotency key; - webhook signature; - retry dengan backoff; -
dead-letter/error queue bila diperlukan; - audit sumber integrasi; -
jangan pernah membiarkan integrasi membuat jurnal tanpa melalui aturan
posting.

------------------------------------------------------------------------

## 21. Testing strategy

### 21.1 Unit test

-   kalkulasi komisi/bonus;
-   aturan pengakuan pendapatan;
-   validasi settlement;
-   perhitungan outstanding AR/AP;
-   validasi jurnal balance;
-   aturan periode dan approval.

### 21.2 Integration test

-   posting invoice menghasilkan jurnal yang benar;
-   receipt mengurangi AR sesuai alokasi;
-   payment mengurangi AP tanpa mendebit beban ulang;
-   uang muka kru direkonsiliasi;
-   transaksi posting bersifat atomic;
-   idempotency mencegah jurnal ganda;
-   periode closed menolak posting;
-   reversal menjaga jejak jurnal asli.

Gunakan PostgreSQL test database; jangan mengandalkan SQLite jika
perilaku SQL/locking berbeda.

### 21.3 E2E

Skenario utama: 1. Buat trip → input tiket → trip selesai → pengakuan
pendapatan → settlement. 2. Buat biaya langsung → posting → laporan
trip. 3. Uang muka kru → bukti biaya → pengembalian sisa → saldo uang
muka nol. 4. Invoice AR → receipt parsial → receipt berikutnya → lunas.
5. Invoice AP → pembayaran parsial → pembayaran akhir. 6. Rekonsiliasi
bank dengan satu transaksi unmatched dan satu biaya bank. 7. Tutup
periode dengan AR/AP terbuka. 8. Reopen periode oleh user berizin dan
catat alasan.

### 21.4 Invariant yang wajib dites

-   total debit = total kredit untuk setiap jurnal;
-   saldo GL = agregasi journal lines posted;
-   total alokasi tidak melebihi nilai yang dapat dialokasikan;
-   satu sumber tidak terposting dua kali untuk event yang sama;
-   jurnal posted tidak berubah;
-   periode closed tidak menerima posting;
-   saldo agen per trip tidak bercampur antar-trip.

------------------------------------------------------------------------

## 22. Urutan implementasi yang disarankan

### Fase 0 --- Klarifikasi dan fondasi

-   finalisasi kebijakan pengakuan pendapatan (per trip atau per leg);
-   definisikan contoh COA bersama akuntan;
-   definisikan jenis transaksi, approval, dan dokumen wajib;
-   siapkan repo, lint, format, env, CI, PostgreSQL, migration.

**Kriteria selesai:** keputusan yang memengaruhi jurnal tertulis dan
disetujui.

### Fase 1 --- Fondasi aplikasi

-   auth, users, roles, permissions;
-   company settings, business units, cost/profit centers;
-   COA, master bus/agen/vendor/customer;
-   fiscal year/period;
-   audit log dasar.

**Kriteria selesai:** user dapat login, permission berjalan, master
dapat dikelola dan diaudit.

### Fase 2 --- Accounting core

-   journal entry dan lines;
-   posting service;
-   nomor dokumen;
-   period validation;
-   reversal;
-   GL dan trial balance.

**Kriteria selesai:** jurnal manual seimbang dapat diposting, dibaca di
GL, dan direversal dengan jejak.

### Fase 3 --- Cash & bank

-   cash accounts dan transactions;
-   bank accounts dan transactions;
-   transfer;
-   receipt/payment dasar;
-   import rekening koran dan rekonsiliasi.

**Kriteria selesai:** saldo kas/bank berasal dari jurnal dan dapat
direkonsiliasi.

### Fase 4 --- Trip dan biaya

-   trip/legs;
-   ticket sales;
-   trip expenses;
-   crew advances;
-   bonus dan komisi;
-   settlement per trip/agen.

**Kriteria selesai:** satu trip lengkap dapat diproses tanpa input ganda
dan laporan kontribusi dapat ditelusuri.

### Fase 5 --- AR/AP

-   invoice dan lines;
-   receipts/payments;
-   allocations;
-   aging dan status parsial/lunas;
-   koneksi dengan trip/charter/vendor.

**Kriteria selesai:** invoice dapat dibayar sebagian/seluruhnya dan
jurnal benar.

### Fase 6 --- Approval dan closing

-   workflow configurable;
-   inbox persetujuan;
-   checklist tutup buku;
-   close/reopen;
-   dashboard outstanding.

**Kriteria selesai:** transaksi berapproval dan penutupan periode
berjalan sesuai kewenangan.

### Fase 7 --- Aset, anggaran, laporan lanjutan

-   aset tetap dan depresiasi;
-   budget vs actual;
-   laporan manajemen dan laporan keuangan;
-   export dan integrasi.

**Kriteria selesai:** laporan memiliki drill-down dan definisi metrik
terdokumentasi.

Bangun vertical slice end-to-end lebih awal: satu transaksi dari input
sampai jurnal dan laporan. Hindari menyelesaikan semua CRUD sebelum
menguji alur nyata.

------------------------------------------------------------------------

## 23. Struktur folder backend yang lebih rinci

``` text
modules/accounting/
  accounting.module.ts
  domain/
    entities/
    value-objects/
    policies/
  application/
    commands/
    queries/
    services/
    dto/
  infrastructure/
    typeorm/
    repositories/
  presentation/
    accounting.controller.ts
    journal.controller.ts
```

Pola ini dapat disederhanakan; yang penting pemisahan tanggung jawab
konsisten. Untuk tiap modul: - `*.module.ts` - `entities/` - `dto/` -
`controllers/` - `services/` - `repositories/` bila query kompleks -
`policies/` atau `validators/` untuk aturan domain

Jangan membuat abstraksi generik berlebihan sebelum ada kebutuhan nyata.
Gunakan service domain yang eksplisit.

------------------------------------------------------------------------

## 24. Contoh kontrak domain untuk jurnal

### Create journal draft

Input:

``` json
{
  "journalDate": "2026-10-02",
  "description": "Biaya tol trip TR-001",
  "sourceType": "TRIP_EXPENSE",
  "sourceId": "uuid",
  "lines": [
    {
      "accountId": "uuid",
      "debit": "250000",
      "credit": "0",
      "description": "Tol",
      "tripId": "uuid",
      "vehicleId": "uuid"
    },
    {
      "accountId": "uuid",
      "debit": "0",
      "credit": "250000",
      "description": "Pembayaran kas"
    }
  ]
}
```

Aturan: - `debit` dan `credit` dikirim sebagai string desimal; - satu
baris tidak boleh debit dan kredit sekaligus; - minimal dua baris; -
tidak menerima account header/non-postable; - dimensi harus valid; -
draft boleh diedit sesuai permission; - posting hanya melalui action
khusus dan validasi ulang.

### Posting result

Response minimal memuat: - journal ID dan nomor; - status; -
tanggal/periode; - total debit dan kredit; - source type/id; - waktu dan
user posting.

------------------------------------------------------------------------

## 25. Keputusan desain yang perlu dihindari

-   Menyimpan saldo akun sebagai angka yang diubah setiap transaksi
    tanpa ledger yang dapat direkonstruksi.
-   Mengedit atau menghapus jurnal posted.
-   Membuat jurnal dari frontend.
-   Mengizinkan status `POSTED` dikirim lewat PATCH umum.
-   Menganggap invoice lunas hanya karena ada pembayaran yang belum
    dialokasikan.
-   Mendebit beban lagi saat AP dibayar jika sudah diakui sebelumnya.
-   Mencampur settlement agen antar-trip.
-   Menunda tutup buku hanya karena piutang/utang belum dibayar, tanpa
    alasan akuntansi khusus.
-   Mengalokasikan overhead secara otomatis tanpa aturan transparan.
-   Menggunakan `float` untuk uang.
-   Menggunakan `MAX(id)+1` atau `MAX(number)+1` untuk nomor dokumen.
-   Menjalankan TypeORM `synchronize` di production.
-   Menyimpan semua aturan bisnis hanya di UI.
-   Membuat microservices sebelum batas domain dan beban operasional
    membutuhkannya.

------------------------------------------------------------------------

## 26. Checklist sebelum mulai coding

### Kebijakan

-   [ ] Pengakuan pendapatan per trip atau per leg diputuskan.
-   [ ] Perlakuan tiket prabayar dan refund disepakati.
-   [ ] Waktu timbulnya komisi agen disepakati.
-   [ ] Aturan uang muka kru disepakati.
-   [ ] COA ditinjau akuntan.
-   [ ] Pajak dan dokumen wajib ditentukan.
-   [ ] Role approver dan batas nominal awal ditentukan.

### Teknis

-   [ ] PostgreSQL dan migration pipeline siap.
-   [ ] Format uang dan zona waktu ditetapkan.
-   [ ] Standar ID, nomor dokumen, dan idempotency ditetapkan.
-   [ ] Audit log dan request ID tersedia.
-   [ ] Permission backend diterapkan.
-   [ ] Backup dan restore diuji.
-   [ ] Test database PostgreSQL tersedia.
-   [ ] Error code API distandarkan.

### MVP

-   [ ] Master COA dan dimensi
-   [ ] Jurnal dan posting service
-   [ ] Kas/bank
-   [ ] Trip, tiket, biaya, settlement
-   [ ] AR/AP dan alokasi
-   [ ] Approval dasar
-   [ ] Tutup buku
-   [ ] GL, trial balance, laporan trip
-   [ ] Audit dan lampiran

------------------------------------------------------------------------

## 27. Rekomendasi langkah pertama

Mulai dari **Accounting Core + satu vertical slice biaya trip**: 1. buat
schema company, accounts, fiscal periods, journal entries, journal
lines; 2. implementasikan `AccountingPostingService` dan test invariant;
3. buat input satu biaya trip yang dibayar tunai; 4. posting biaya
menjadi jurnal; 5. tampilkan transaksi pada buku besar dan laporan trip;
6. uji reversal dan periode closed.

Setelah alur ini benar, tambahkan penerimaan tiket, settlement agen,
uang muka kru, AR/AP, dan workflow. Ini memastikan fondasi akuntansi
teruji sebelum aplikasi berkembang menjadi banyak modul.

------------------------------------------------------------------------

## Lampiran A --- Glossary

  -----------------------------------------------------------------------
  Istilah                             Arti
  ----------------------------------- -----------------------------------
  COA                                 Chart of Accounts, daftar akun buku
                                      besar

  GL                                  General Ledger / buku besar

  AR                                  Accounts Receivable / piutang usaha

  AP                                  Accounts Payable / utang usaha

  Posting                             Pengesahan transaksi menjadi
                                      catatan akuntansi

  Reversal                            Jurnal pembalik untuk mengoreksi
                                      transaksi posted

  Allocation                          Pengaitan pembayaran/penerimaan ke
                                      invoice

  Cost center                         Dimensi tempat/penanggung biaya

  Profit center                       Dimensi unit yang dianalisis
                                      pendapatannya/hasilnya

  Accrual                             Pengakuan pendapatan/beban saat
                                      hak/kewajiban timbul, bukan semata
                                      saat kas bergerak

  Unapplied receipt                   Uang diterima yang belum
                                      dialokasikan ke invoice

  Period close                        Penguncian periode akuntansi
                                      setelah pemeriksaan

  Idempotency                         Perlindungan agar pengulangan
                                      request tidak menggandakan
                                      transaksi
  -----------------------------------------------------------------------

## Lampiran B --- Catatan final

Blueprint ini sengaja cukup lengkap untuk menjadi peta implementasi,
tetapi bukan berarti seluruh modul harus dibuat sekaligus. Bangun
bertahap, jaga agar setiap tahap dapat diuji end-to-end, dan
dokumentasikan keputusan akuntansi yang memengaruhi jurnal. Perubahan
kebijakan setelah sistem berjalan harus dilakukan melalui migration,
konfigurasi berversi, atau jurnal koreksi---bukan perubahan diam-diam
pada histori.


---

# Addendum v1.1 — Konfirmasi Proses Bisnis
Tanggal pembaruan: 2 Oktober 2026

Addendum ini melengkapi blueprint v1.0. Bagian lain dari blueprint tetap berlaku. Aturan yang belum dikonfirmasi dicatat sebagai hal terbuka dan tidak boleh diasumsikan sebagai kebijakan perusahaan.

## 1. SPJ dan perjalanan
- SPJ berlaku untuk perjalanan AKAP maupun pariwisata.
- SPJ dibuat sebelum bus berangkat.
- Untuk AKAP, SPJ mencakup perjalanan pergi-pulang; kru dapat berubah antara pergi dan pulang.
- Untuk pariwisata, SPJ mencakup satu penugasan sampai bus kembali ke garasi.
- Jika bus diganti karena keadaan darurat, SPJ lama ditutup secara operasional dan dibuat SPJ baru yang ditautkan ke SPJ sebelumnya.
- Penumpang dipindahkan/dicatat pada SPJ pengganti tanpa menggandakan pendapatan tiket.
- SPJ pengganti memiliki UJ tersendiri.
- Tidak perlu persetujuan supervisor sebelum keberangkatan; penerbitan operasional sudah cukup.
- Penyelesaian operasional berbeda dari verifikasi dan penutupan keuangan.

## 2. UJ dan penyelesaian kas kru
- UJ opsional per SPJ, merupakan uang muka yang wajib dipertanggungjawabkan, bukan pembayaran borongan/premi.
- UJ dapat dicairkan sekaligus atau bertahap kepada satu atau beberapa kru.
- Nominal ditentukan per perjalanan, bukan tarif tetap per rute/layanan.
- Bukti pengeluaran mengikuti ketentuan jenis biaya.
- Seluruh sisa UJ wajib dikembalikan.
- Jika UJ kurang, kru meminta tambahan kepada operasional. Operasional memproses/memperbarui permintaan; persetujuan keuangan terpisah tidak diwajibkan berdasarkan proses yang dikonfirmasi.
- Permintaan tambahan dan pencairan aktual adalah dua transaksi berbeda. Permintaan yang diproses belum berarti dana telah dicairkan.
- Uang makan kru terpisah dari UJ dan untuk tahap awal dicatat dengan input nominal manual.

### Pemisahan saldo
Kas kru harus menampilkan dua kelompok saldo secara terpisah dan tidak dinetokan otomatis:

1. **Dana operasional/UJ:** pencairan UJ awal dan tambahan, biaya yang disetujui, serta pengembalian sisa UJ.
2. **Penerimaan perusahaan:** uang tiket/kargo yang diterima kru dan setoran ke kas/bank perusahaan.

Rumus rekonsiliasi:
- `Saldo UJ = total pencairan UJ - biaya disetujui - pengembalian UJ`
- `Saldo penerimaan belum disetor = total penerimaan - alokasi setoran terverifikasi`

Kru yang menerima uang dan kru yang ditugaskan menyetor dapat berbeda. Penugasan penyetor perlu memiliki riwayat, dan setoran harus dapat dialokasikan ke beberapa penerimaan. Satu penerimaan juga dapat diselesaikan melalui beberapa setoran.

### Penanganan selisih
- Selisih wajib diperiksa sebelum SPJ ditutup.
- Tindak lanjut bergantung pada hasil pemeriksaan dan jenis selisih.
- Selisih tidak otomatis menjadi utang/piutang kru.
- Catat jenis/sumber selisih, nilai yang diharapkan dan aktual, nominal selisih, alasan, pemeriksa, hasil, dan status penyelesaian.
- Jika ditemukan kewajiban kru, pencatatannya dilakukan setelah hasil pemeriksaan ditetapkan dan mengikuti proses akuntansi.
- Transaksi yang sudah diverifikasi tidak boleh diubah diam-diam; koreksi harus memiliki jejak audit.

Tabel yang direkomendasikan untuk melengkapi model:
- `crew_cash_settlements`: header laporan/rekonsiliasi kas per SPJ.
- `crew_cash_assignments`: penugasan penerima/penyetor.
- `crew_cash_remittances`: transaksi setoran aktual.
- `crew_cash_remittance_allocations`: alokasi setoran terhadap transaksi tiket/kargo sumber.
- `crew_cash_discrepancies`: temuan dan hasil pemeriksaan selisih.
- `spj_uj`, `spj_uj_disbursements`, `spj_uj_additional_requests`, `spj_uj_expenses`, `spj_uj_returns`, `spj_uj_verifications`: rincian UJ dan pertanggungjawabannya.

Jangan menduplikasi nilai pendapatan tiket/kargo di modul kas; gunakan referensi ke transaksi sumber.

## 3. Status dan penutupan SPJ
Sistem membakukan pemisahan status operasional SPJ dari status penyelesaian kas (dibakukan secara definitif pada Addendum v1.5 dan Bab 8.2):

- **Status Operasional (`operational_status`)**:
  `DRAFT → ISSUED → IN_PROGRESS → COMPLETED` (atau `CANCELLED`)
- **Status Finansial (`financial_status`)**:
  `PENDING_SETTLEMENT → UNDER_REVIEW → SETTLED` (atau `DISCREPANCY`)

Transisi status ditegakkan secara ketat di backend dan dicatat dalam audit trail. SPJ tidak boleh ditutup secara finansial (`SETTLED`) hanya karena perjalanan selesai secara operasional (`COMPLETED`).

Syarat penutupan finansial (`SETTLED`):
- laporan SPJ telah diserahkan lengkap oleh kru ke kasir;
- pengeluaran perjalanan dan pencairan UJ telah diperiksa dan berstatus `BALANCED`;
- sisa UJ telah dikembalikan atau penyelesaiannya dicatat berdasarkan hasil pemeriksaan;
- penerimaan tiket/kargo telah dicocokkan dengan setoran aktual dan berstatus `MATCHED` atau `DISCREPANCY_RECORDED`;
- semua selisih telah diperiksa dan memiliki hasil serta status penyelesaian;
- tidak ada temuan gantung yang belum terselesaikan.

## 4. Biaya perjalanan dan BBM
Semua biaya perjalanan dicatat di SPJ, termasuk yang dibayar dari UJ, dana terpisah, atau langsung oleh kantor. Setiap biaya memiliki SPJ, bus, kategori/akun biaya, nominal, tanggal, sumber dana/metode pembayaran, keterangan, dan bukti sesuai kebijakan jenis biaya.

Transaksi BBM juga mencatat:
- jumlah liter;
- odometer saat pengisian;
- bus dan SPJ;
- lokasi/SPBU atau keterangan tempat jika tersedia.

Untuk tahap awal, tidak diasumsikan penggunaan voucher atau kredit SPBU. Uang penerimaan tiket/kargo yang dipegang kru tidak boleh digunakan untuk membayar biaya perjalanan.

## 5. Uang makan kru
Uang makan merupakan transaksi terpisah dari UJ. Pada tahap awal nominal diinput manual, dengan penerima kru, SPJ, tanggal, keterangan, dan referensi pembayaran. Tidak ada perhitungan otomatis berdasarkan hari/rute sebelum kebijakan ditetapkan.

## 6. Pengeluaran umum dan Cost Center
Pengeluaran di luar perjalanan dicatat melalui modul pengeluaran umum, terpisah dari biaya SPJ.
- Tidak memerlukan workflow persetujuan aplikasi.
- Untuk tahap awal hanya mendukung pembayaran langsung melalui kas/bank.
- Modul utang vendor belum termasuk.
- Satu rincian biaya hanya menggunakan satu Cost Center.
- Jika satu tagihan dialokasikan ke beberapa Cost Center, buat rincian/transaksi terpisah untuk masing-masing Cost Center.
- Transaksi yang sudah diposting tidak diedit langsung; koreksi dilakukan melalui pembatalan atau penyesuaian dengan audit trail.

Struktur kas dan bank tetap mengikuti blueprint v1.0.

## 7. Cakupan yang ditunda dan hal terbuka
- Modul penjualan tiket dan kargo ditunda; aplikasi keuangan nantinya menerima referensi transaksi sumber agar pendapatan tidak tercatat ganda.
- Belum ada tenggat resmi setoran tiket/kargo yang ditetapkan; praktik saat ini adalah pelaporan ketika bus kembali dan SPJ dilaporkan.
- Matriks otorisasi operasional untuk tambahan UJ belum dirinci.
- Prosedur final untuk setiap kategori selisih kas masih perlu ditetapkan.
- Aturan nominal/perhitungan uang makan belum ditetapkan.
- Modul utang vendor dan voucher/kredit SPBU belum termasuk tahap awal.

### Catatan operasional e-toll / uang elektronik

Untuk MVP, apabila kru membeli isi ulang saldo e-toll di perjalanan menggunakan
uang UJ, catat nilai top-up berdasarkan bukti transaksi sebagai pengeluaran UJ
kategori **Beban Tol** dan tautkan ke SPJ serta penanggung jawab/sesi kru bila
diketahui. Bukti top-up menjadi dokumen pendukung; jangan mencatat nominal
top-up sekaligus sebagai beban tol kedua kalinya saat transaksi tap tol
direkap.

Jika perusahaan mengisi saldo kartu dari pool, perlakuan akuntansinya berbeda:
top-up merupakan pemindahan kas ke saldo kartu/e-money (akun aset yang
ditetapkan dalam COA), sedangkan beban tol diakui berdasarkan penggunaan
saldo untuk perjalanan dan bukti transaksi yang tersedia. Nomor akun seperti
`11105` hanya contoh dan harus disahkan dalam COA. Model MVP perlu membedakan
sumber pembayaran dan biaya tol aktual agar tidak terjadi pengakuan ganda.

## 8. Prinsip implementasi
Validasi aturan bisnis dilakukan di backend. Pisahkan status SPJ, penyelesaian UJ, penerimaan, dan setoran. Gunakan referensi transaksi sumber, audit trail, serta jurnal yang tidak dapat diubah langsung setelah diposting. Aturan yang belum dikonfirmasi tidak boleh dikunci sebagai asumsi implementasi.


---

# Addendum v1.2 — Harmonisasi Skema dan Penegasan Flow Akuntansi
Tanggal pembaruan: 2 Oktober 2026

Addendum ini menindaklanjuti review atas hubungan antara dokumen utama dan Addendum v1.1. Jika ada perbedaan nama tabel, Bab 7 yang telah diharmonisasi dan ketentuan berikut menjadi acuan implementasi MVP.

## 1. Satu entitas perjalanan operasional
Untuk MVP, gunakan `spjs` sebagai entitas utama perjalanan/penugasan operasional. `trips` tidak dibuat sebagai tabel kedua yang menduplikasi fungsi SPJ. Segmen perjalanan menggunakan `spj_legs`; penugasan kru menggunakan `spj_crew_assignments`. Tabel lama `crew_advances`, `crew_advance_lines`, `trip_expenses`, dan `trip_settlements` dianggap digantikan oleh keluarga tabel `spj_uj_*`, `spj_expenses`, dan `crew_cash_settlements` sesuai fungsi masing-masing.

Jika kelak diperlukan master jadwal/layanan rute yang berulang, entitas itu harus dimodelkan terpisah sebagai jadwal atau layanan, bukan memakai `trips` untuk menamai SPJ.

## 2. Sumber penerimaan pada MVP
Karena modul penjualan tiket dan kargo penuh ditunda, MVP memerlukan input rekap penerimaan yang dapat dibandingkan dengan uang yang diserahkan kru. Gunakan `spj_revenue_declarations` sebagai deklarasi/referensi penerimaan operasional, bukan sebagai pengganti modul ticketing/kargo.

Deklarasi dapat memuat kategori seperti:
- tiket tunai yang diterima di perjalanan;
- titipan setoran agen;
- penerimaan paket/kargo.

Simpan setidaknya SPJ/leg, kategori, nominal, waktu, petugas yang menginput, referensi dokumen fisik (misalnya nomor manifest), status pemeriksaan, dan catatan. Jika deklarasi dirinci per kategori atau dokumen, gunakan tabel header dan lines agar dapat diaudit.

Setoran aktual (`crew_cash_remittances`) dialokasikan ke deklarasi melalui `crew_cash_remittance_allocations`. Satu setoran dapat dialokasikan ke beberapa deklarasi dan satu deklarasi dapat dilunasi dengan beberapa setoran. Ketika modul penjualan/kargo kelak tersedia, deklarasi manual harus dapat ditautkan atau digantikan oleh transaksi sumber tanpa menggandakan pendapatan.

Penting: deklarasi adalah bukti/referensi operasional. Pengakuan pendapatan dan jurnalnya mengikuti kebijakan akuntansi yang berlaku; jangan otomatis mengakui pendapatan hanya karena deklarasi dibuat.

## 3. Selisih kas dan akun penampung
Sediakan akun COA penampung selisih kas sementara, misalnya `11999 — Selisih Kas Operasional Sementara`, hanya setelah kode akun dan penggunaannya disahkan dalam COA perusahaan. Akun ini adalah akun neraca sementara, bukan beban atau piutang kru secara otomatis.

Jurnal harus mengikuti substansi transaksi dan kebijakan pengakuan pendapatan. Untuk contoh apabila pendapatan Rp5.000.000 memang telah diakui, tetapi kas yang diterima baru Rp4.700.000 dan kekurangan Rp300.000 masih dalam investigasi, contoh jurnal penampung dapat berupa:

- Debit Kas Rp4.700.000
- Debit Selisih Kas Operasional Sementara Rp300.000
- Kredit akun pendapatan/penampung yang relevan Rp5.000.000

Jurnal ini hanya contoh untuk kondisi pengakuan pendapatan tersebut. Jika angka deklarasi belum memenuhi syarat pengakuan pendapatan, gunakan akun clearing/utang atau mekanisme pencatatan yang sesuai; jangan mengkredit pendapatan secara otomatis.

Setelah investigasi:
- Jika kekurangan terbukti menjadi piutang kru dan pengakuan piutang disetujui sesuai kebijakan: Debit Piutang Kru, Kredit Selisih Kas Sementara.
- Jika ditetapkan sebagai beban perusahaan: Debit Beban Selisih Kas, Kredit Selisih Kas Sementara.
- Jika terbukti sebagai kesalahan data atau alokasi, lakukan koreksi/reversal yang sesuai dan pertahankan audit trail.

Jangan melakukan pemotongan gaji secara otomatis. Pemotongan, persetujuan, dan dasar hukumnya merupakan kebijakan terpisah yang belum dikonfirmasi.

## 4. Pergantian kru antar-leg & Serah Terima UJ (Yogyakarta)
Untuk SPJ AKAP pergi-pulang, `spj_crew_assignments` harus dapat membedakan penugasan berdasarkan `spj_leg_id` atau sesi. `direction` seperti `DEPARTURE`/`RETURN` dapat disimpan pada leg; assignment merujuk ke leg dan memiliki waktu mulai/akhir.

Pencairan UJ, biaya yang dipertanggungjawabkan, dan pengembalian UJ harus dapat ditautkan ke `crew_assignment_id` (atau sesi/penanggung jawab yang setara), bukan hanya ke `spj_id`. Ini memungkinkan pemeriksaan per kru/per sesi saat pergantian kru di Yogyakarta dengan 2 mekanisme operasional yang didukung sistem:
- **Mekanisme A (Settlement Cabang Yogya):** Kru Leg 1 menyetorkan sisa kas UJ dan penerimaan tiket/kargo di loket kasir cabang Yogyakarta (BKM diterbitkan cabang). Kru Leg 2 yang melanjutkan perjalanan pulang menerima pencairan UJ baru dari kasir cabang Yogyakarta.
- **Mekanisme B (Handover Estafet):** Petugas cabang Yogya mencatat dokumen serah-terima fisik (*handover*) saldo sisa UJ antar-kru (`handover_from_assignment_id` $\to$ `handover_to_assignment_id`). Tanggung jawab kas beralih ke kru Leg 2, dan verifikasi akhir dituntaskan di kasir pool pusat (Ciputat/Jakarta) saat bus tiba kembali.

## 5. Tutup buku bulanan dan SPJ yang belum selesai
Penutupan periode akuntansi bulanan tidak boleh otomatis diblokir hanya karena ada SPJ yang masih `under_review` atau memiliki selisih yang sedang diperiksa.

Transaksi yang telah terjadi dan memenuhi kebijakan pengakuan harus diposting pada periode yang tepat, termasuk biaya perjalanan riil dan kas yang benar-benar diterima. Saldo selisih yang masih dalam investigasi dapat tetap berada pada akun penampung sementara sesuai kebijakan akuntansi.

SPJ yang belum selesai harus muncul sebagai warning/exception pada checklist tutup buku, dengan daftar SPJ, nilai terbuka, umur selisih, dan penanggung jawab. Penutupan periode tetap tunduk pada rekonsiliasi dan kontrol akuntansi lain; aturan ini hanya menyatakan bahwa status SPJ sendiri bukan pemblokir otomatis.

## 6. Analisis kontribusi perjalanan pengganti
Untuk pelaporan manajemen, sediakan pengelompokan perjalanan ekonomi yang menghubungkan SPJ utama dan SPJ pengganti melalui `parent_spj_id` atau kunci `journey_group_id` yang stabil. Laporan kontribusi perjalanan dapat mengagregasikan pendapatan dan biaya seluruh SPJ dalam satu kelompok perjalanan, sehingga biaya SPJ pengganti tidak terlihat sebagai perjalanan tanpa pendapatan secara terpisah dari konteksnya.

Tetap sediakan tampilan per SPJ dan per bus untuk analisis operasional. Biaya derek/perbaikan darurat dapat diatribusikan ke bus yang mengalami kerusakan dan/atau Cost Center armada sesuai kebijakan COA dan dimensi biaya. Jangan mengubah sumber pendapatan hanya untuk membuat margin per SPJ terlihat seimbang.

## 7. Uang makan kru dan margin perjalanan
Uang makan tetap diinput manual dan terpisah dari UJ. Untuk pelaporan margin kontribusi, klasifikasikan sebagai biaya langsung perjalanan apabila substansinya memang biaya kru untuk perjalanan tersebut. Gunakan akun COA beban uang makan kru yang disahkan perusahaan; nomor akun `53xxx` hanya contoh kategori, bukan kode final yang ditetapkan sistem.

Waktu pembayaran (sebelum berangkat, selama perjalanan, atau saat penyelesaian) belum ditentukan. Karena itu, model transaksi harus menyimpan tanggal aktual dan sumber pembayaran, tanpa memaksakan satu tahap pembayaran.

## 8. Keputusan dan hal yang masih perlu dikonfirmasi
Keputusan desain yang dapat diterapkan:
- `spjs` menjadi entitas utama MVP; tabel lama yang menduplikasi SPJ diganti.
- Deklarasi penerimaan manual menjadi sumber pembanding operasional MVP.
- Selisih dapat ditampung sementara; akun dan jurnal final mengikuti kebijakan COA/pengakuan.
- Assignment kru per leg/sesi menjadi dimensi untuk UJ dan biaya, mendukung settlement cabang maupun handover estafet di Yogyakarta.
- SPJ yang masih diperiksa menjadi peringatan pada tutup buku, bukan pemblokir otomatis.
- Pelaporan perjalanan pengganti mendukung agregasi satu kelompok perjalanan ekonomi.

Belum dikonfirmasi (kebijakan HR/legal lanjutan di luar MVP):
- kewenangan dan prosedur final untuk mengakui piutang kru atau melakukan pemotongan gaji via payroll resmi;
- kebijakan pengakuan pendapatan otomatis jika modul ticketing publik kelak diaktifkan.


---

# Addendum v1.3 — Konsistensi API, E-Toll, Settlement, dan Tautan AR

Tanggal pembaruan: 2 Oktober 2026

Addendum ini memperjelas implementasi MVP dan melengkapi ketentuan pada Bab
7.2, 7.3, 7.4, 7.8, 13.2, dan 13.3. Jika ada contoh lama yang masih memakai
`trip_id` pada baris invoice, istilah tersebut dianggap digantikan oleh
`spj_id` untuk dimensi perjalanan MVP.

## 1. Konsistensi istilah dan endpoint

Untuk MVP, `spjs` adalah entitas operasional tunggal. Diagram relasi Bab 7.8
dan endpoint Bab 13.2–13.3 telah diselaraskan dengan keluarga `spj_*` dan
`crew_cash_*`. Modul penjualan tiket/kargo penuh tetap di luar cakupan MVP;
gunakan `spj_revenue_declarations` sebagai deklarasi rekonsiliasi sampai
transaksi sumber tersedia.

Pada `ar_invoice_lines` dan `ap_invoice_lines`, gunakan kolom opsional
`spj_id` sebagai dimensi yang menghubungkan baris invoice dengan SPJ terkait.
Kolom ini tidak menggantikan `invoice_id` dan tidak mengubah pola header/lines
invoice. Untuk biaya vendor yang terkait perjalanan, `spj_id` dapat diisi
ketika relevan; jangan memaksakan tautan SPJ untuk transaksi umum.

## 2. Perlakuan e-toll pada MVP

Terdapat dua alur yang harus dibedakan:

- **Top-up oleh kru menggunakan UJ di perjalanan:** catat struk top-up sebagai
  pengeluaran UJ kategori Beban Tol, tautkan ke SPJ dan assignment kru bila
  diketahui. Untuk MVP, top-up menjadi dasar pencatatan biaya tol apabila
  perusahaan memang memperlakukan saldo yang dibeli kru sebagai biaya
  perjalanan. Jangan mencatat lagi transaksi tap yang sama sebagai beban
  kedua.
- **Top-up kartu dari pool/perusahaan:** catat sebagai perpindahan kas ke aset
  saldo kartu uang elektronik, bukan langsung sebagai beban tol. Beban tol
  diakui saat saldo digunakan untuk perjalanan berdasarkan bukti penggunaan
  yang tersedia. Akun seperti `11105 — Kas Kartu E-Toll` hanya contoh dan
  harus disahkan dalam COA perusahaan.

Dengan demikian, implementasi perlu menyimpan sumber pembayaran dan referensi
bukti, serta mencegah top-up dan pemakaian saldo yang sama dibukukan sebagai
beban ganda. Rincian kartu (nomor/kode kartu, bus pemegang, saldo awal/akhir)
dapat ditambahkan bila perusahaan memilih mengelola saldo kartu pool di MVP;
jangan mengasumsikan semua kartu bersifat khusus satu bus tanpa inventarisasi.

## 3. Gerbang verifikasi settlement kas

Pertanggungjawaban kas kru terdiri dari dua sub-proses independen yang tidak
boleh dinetokan:

1. Pertanggungjawaban UJ: pencairan dikurangi biaya UJ yang disetujui dan
   pengembalian sisa.
2. Penerimaan perusahaan: deklarasi penerimaan dibandingkan dengan setoran
   aktual yang telah diverifikasi.

`crew_cash_settlements.status = VERIFIED` hanya boleh dicapai apabila:
- status pertanggungjawaban UJ adalah `BALANCED`; dan
- status penerimaan adalah `MATCHED` atau `DISCREPANCY_RECORDED`.

`DISCREPANCY_RECORDED` berarti selisih sudah dicatat untuk ditindaklanjuti,
bukan berarti selisih telah diselesaikan atau otomatis dibebankan kepada kru.
Jika settlement disimpan sebagai satu header, simpan status kedua sub-proses
secara eksplisit (misalnya `uj_status` dan `revenue_status`) atau turunkan
secara deterministik dari detail yang tervalidasi. Perubahan status harus
dilakukan backend dalam transaksi database, dengan audit trail. BKM untuk
pengembalian UJ dan BKM untuk setoran penerimaan harus menjadi dua transaksi
kas terpisah dengan referensi sumber masing-masing.

## 4. Tautan SPJ pariwisata/charter dengan AR

Untuk perjalanan pariwisata/charter, pendapatan dapat berasal dari kontrak
sewa dan invoice AR yang dibuat kantor, tanpa deklarasi tiket/kargo di SPJ.
Karena itu, `spjs` dapat memiliki relasi opsional ke `ar_invoices` melalui
`spjs.ar_invoice_id` apabila aturan bisnis menetapkan satu invoice utama per
SPJ. Jika satu kontrak/invoice dapat mencakup beberapa SPJ, atau satu SPJ
dapat ditagihkan melalui beberapa invoice, gunakan tabel penghubung
(misalnya `ar_invoice_spjs` dengan `ar_invoice_id`, `spj_id`, dan alokasi
nominal) daripada memaksakan FK tunggal.

Laporan margin kontribusi harus mengambil pendapatan dari sumber yang sah
invoice/kontrak sesuai kebijakan pengakuan), lalu mengurangkannya dengan
biaya perjalanan aktual yang relevan. Nilai invoice tidak boleh otomatis
dianggap sebagai pendapatan periode SPJ hanya karena FK tersedia: perhatikan
status posting, tanggal pengakuan, pajak, diskon, pembatalan, dan kemungkinan
invoice mencakup beberapa perjalanan. Hindari menghitung pendapatan yang sama
dari invoice sekaligus deklarasi penerimaan.

---

# Addendum v1.4 — Keputusan Kru di Tabel User, Seeder Master Data, dan Urutan Eksekusi
Tanggal pembaruan: 5 Oktober 2026

Addendum ini meresmikan keputusan bisnis dan teknis yang disepakati bersama sebelum penulisan kode Fase 2 dimulai.

## 1. Entitas Kru / Driver Menggunakan Tabel `users`
- **Keputusan:** Tidak dibuat tabel master `crews` terpisah. Seluruh data kru (pengemudi/driver, pengemudi cadangan/co-driver, kondektur/crew) disimpan langsung di dalam tabel `users`.
- **Identifikasi Role:** Pengguna yang bertindak sebagai kru diidentifikasi melalui role RBAC (misalnya `DRIVER`, `CO_DRIVER`, `CONDUCTOR`) atau data profil user terkait.
- **Relasi Database:** Seluruh kolom referensi kru pada modul operasional dan finansial (`spj_crew_assignments.crew_id`, `spj_uj.crew_id`, `crew_cash_assignments.crew_id`, `crew_cash_remittances.depositor_crew_id`, dan `crew_meal_payments.crew_id`) merujuk langsung ke `users.id` (Foreign Key ke tabel `users`).
- **Keuntungan:** Memudahkan integrasi ketika kru/driver kelak diberikan akses login ke aplikasi web/mobile tanpa sinkronisasi atau duplikasi tabel.

## 2. Penyediaan Data Dummy & Database Seeder Komprehensif
- **Keputusan:** Seluruh master data awal dan dimensi sistem akan disiapkan dalam bentuk Database Seeder (data dummy siap pakai) sehingga aplikasi dapat langsung diuji secara end-to-end tanpa memerlukan entri manual dari nol.
- **Cakupan Seeder:**
  1. **Master Organisasi & Dimensi:** `companies` (SS Traveling), `business_units` (AKAP, Pariwisata), `cost_centers` (Operasional, Bengkel, Kantor Pusat), `profit_centers`.
  2. **Chart of Accounts (COA) Standar Perusahaan Bus:** Template hierarki akun siap pakai untuk Kas/Bank, Piutang, Uang Muka Kru, Aset Tetap, Utang Usaha, Pendapatan Tiket & Charter, serta Beban (BBM, Tol, Kru/Uang Makan, Perawatan, Depresiasi, dan Selisih Kas Sementara).
  3. **Periode Fiskal & Dokumen:** `fiscal_years`, `fiscal_periods` aktif, dan pola penomoran `document_sequences` (SPJ, BKM, BKK, JV).
  4. **Master Kas & Bank:** `cash_accounts` (Kas Operasional, Kas Kecil) dan `bank_accounts`.
  5. **Armada Bus (`vehicles`):** Data dummy unit bus dengan nomor polisi, tipe armada (Luxury Seat 2-1, Combi, Sleeper, Executive), dan status aktif.
  6. **Data Personil/Kru:** User dummy dengan role Admin, Finance, Kasir, dan Kru/Driver.

## 3. Tahapan Urutan Eksekusi Implementasi (Roadmap Teknis)
Pembangunan sistem disepakati mengikuti urutan dependensi logis berikut:
1. **Langkah 1: Master Organisasi, Dimensi, & Armada Bus**
   - Implementasi tabel & modul `companies`, `business_units`, `cost_centers`, `profit_centers`, `vehicles`.
   - Seeder master data awal dan penyesuaian role kru di modul `users`.
2. **Langkah 2: Accounting Core & Master Keuangan**
   - Implementasi tabel & modul `accounts` (COA hierarki), `fiscal_years`, `fiscal_periods`, `cash_accounts`, `bank_accounts`, dan `document_sequences`.
3. **Langkah 3: SPJ & Operasional Perjalanan (MVP Core)**
   - Implementasi `spjs`, `spj_legs`, `spj_crew_assignments`.
   - Implementasi Uang Jalan: `spj_uj` (disbursements, expenses, returns, additional requests).
   - Implementasi biaya operasional perjalanan: `spj_expenses` (termasuk BBM + liter + odometer, tol, uang makan).
   - Implementasi `spj_revenue_declarations` (rekap penerimaan tiket fisik/kargo sementara).
4. **Langkah 4: Kasir, Settlement Kru, & Verifikasi Keuangan**
   - Implementasi `crew_cash_settlements`, `crew_cash_remittances`, `crew_cash_remittance_allocations`, dan `crew_cash_discrepancies`.
   - Penerapan gerbang validasi settlement (`BALANCED` UJ + `MATCHED` / `DISCREPANCY_RECORDED` revenue).
5. **Langkah 5: Accounting Engine & Jurnal Otomatis**
   - Implementasi `AccountingPostingService` (posting atomic, idempotency, reversal).
   - Implementasi `journal_entries`, `journal_lines`, dan `accounting_events`.
   - Buku besar (General Ledger), neraca saldo, dan laporan profitabilitas/kontribusi SPJ.

---

# Addendum v1.5 — Standardisasi Teknis: Fleksibilitas Armada, Money Helper, Prefix API /api/v1, dan Status Ganda SPJ
Tanggal pembaruan: 5 Oktober 2026

Addendum ini meresmikan 4 poin kesepakatan teknis sebelum eksekusi coding:

1. **Fleksibilitas & Standar Penamaan Armada Bus (`vehicles`):**
   - **Identitas Armada Lengkap:** Tabel `vehicles` memiliki kolom:
     - `code`: Kode unit / nomor lambung resmi (contoh: `SS-01`, `SS-02`).
     - `nickname`: Nama julukan / panggilan armada (contoh: *The Luxury*, *Al-Fatih*, *Executive 01*).
     - `plate_number`: Nomor polisi kendaraan (contoh: `B 7788 SS`).
     - `vehicle_type`: Tipe kelas armada (`Luxury Seat 2-1`, `Combi`, `Sleeper`, `Executive`).
     - `capacity`: Kapasitas jumlah kursi penumpang.
   - **Fleksibilitas Penugasan:** Kolom `default_business_unit_id` pada tabel `vehicles` dibuat opsional (`nullable`). Penentu definitif unit bisnis perjalanan ditetapkan secara dinamis pada level SPJ (`spjs.business_unit_id`), memungkinkan bus pariwisata diperbantukan ke AKAP (atau sebaliknya) secara legal dan fleksibel tanpa kendala relasi database.

2. **Penanganan Nilai Uang (Safe Decimal & Money Helper):**
   - Kolom moneter PostgreSQL `numeric(20, 2)` di-map sebagai `string` di TypeORM untuk mencegah distorsi floating-point bawaan JavaScript.
   - Perhitungan, akumulasi, dan validasi keseimbangan debit-kredit jurnal wajib menggunakan utilitas terpusat (`MoneyHelper`).

3. **Standardisasi Global Prefix API:**
   - Seluruh endpoint backend NestJS dibakukan menggunakan global prefix `/api/v1` (termasuk modul Auth, Master Data, SPJ, dan Accounting).
   - Dokumentasi Swagger diakses melalui `/api/v1/docs`.

4. **Pemisahan Eksplisit Status Ganda SPJ:**
   - Tabel `spjs` menggunakan dua kolom status independen yang dikelola dengan state machine backend:
     - `operational_status`: `DRAFT`, `ISSUED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
     - `financial_status`: `PENDING_SETTLEMENT`, `UNDER_REVIEW`, `DISCREPANCY`, `SETTLED`.

5. **Smart Document Numbering & Tampilan SPJ:**
   - Pola format penomoran dokumen otomatis berbasis `document_sequences` per unit usaha:
     - AKAP: `SPJ/AKP/YYMM/XXXX` (contoh: `SPJ/AKP/2610/0001`).
     - Wisata: `SPJ/WIS/YYMM/XXXX` (contoh: `SPJ/WIS/2610/0001`).
   - Response DTO di backend menyajikan data kaya konteks (*hydrated context*): nomor dokumen, rute/tujuan (`title`), armada bus (`vehicle`), nama sopir/kru (`crew`), nama pelanggan sewa (`customerName` untuk Wisata), status operasional, dan status finansial.

---

# Addendum v1.6 — Multi-Class Kursi Bus, Matriks Tarif Dinamis Musiman, dan Integritas Snapshot Harga
Tanggal pembaruan: 5 Oktober 2026

Addendum ini meresmikan penanganan konfigurasi multi-kelas kursi pada satu unit armada, kalender tarif musiman (peak season/tuslah), serta jaminan integritas data historis keuangan.

## 1. Konfigurasi Multi-Class Kursi Armada (`vehicle_seat_classes`)
- **Realitas Armada Modern:** Satu bus fisik (misalnya tipe *Combi* atau *Suites Class*) dapat memiliki beberapa zona kelas kursi dengan tarif berbeda (misal: 4 Cabin Sleeper di depan + 20 Luxury Seat 2-1 di belakang).
- **Tabel Pendukung:** `vehicle_seat_classes`
  - Kolom penting: `id`, `vehicle_id`, `class_name` (Enum/String: `SLEEPER`, `LUXURY_2_1`, `EXECUTIVE`, `COMBI`), `seat_capacity` (integer), `is_active`.
  - Constraint: Total kapasitas kursi per bus adalah jumlahan dari seluruh `seat_capacity` kelas yang aktif pada bus tersebut.
- **Fungsi Kontrol:** Menjadi batas fisik (*hard ceiling*) saat pengisian manifest dan deklarasi tiket penumpang, mencegah kru atau agen mengisi penumpang melampaui jumlah kursi fisik yang tersedia per kelas.

## 2. Kalender Musim & Matriks Tarif Dinamis (`fare_seasons` & `fare_matrix`)
- **Tabel `fare_seasons` (Kalender Musim):**
  - Kolom penting: `id`, `code`, `name` (contoh: `REGULER`, `LEBARAN_H_MINUS_7`, `NATARU`, `LIBUR_SEKOLAH`), `start_date`, `end_date`, `is_active`.
- **Tabel `fare_matrix` (Matriks Tarif):**
  - Kolom penting: `id`, `origin`, `destination`, `seat_class`, `fare_season_id`, `amount`, `effective_from`, `effective_until`, `is_active`.
  - Berfungsi menentukan tarif dasar yang berlaku secara otomatis berdasarkan tanggal keberangkatan SPJ, segmen rute, dan kelas kursi yang dipilih.

## 3. Prinsip Snapshotting Harga (Jaminan Integritas Keuangan Masa Lalu)
- **Kemandirian Transaksi (*Price Snapshotting*):** Master tarif pada `fare_matrix` hanya bertindak sebagai referensi awal/katalog saat transaksi dibuat. Ketika SPJ dibuat atau tiket diterbitkan, nilai tarif disalin mati (*snapshot*) ke dalam baris transaksi operasional (`unit_price` dan `total_amount`).
- **Kekebalan Data Historis:** Perubahan master tarif di kemudian hari (misalnya kenaikan tarif dari Rp100.000 menjadi Rp120.000) hanya berlaku untuk transaksi baru. Transaksi operasional bulan lalu, laporan pertanggungjawaban kas kru, dan seluruh jurnal akuntansi (`journal_entries` & `journal_lines`) di periode lampau **tidak akan pernah terpengaruh atau berubah**.
- **Jurnal Akuntansi Abadi (*Immutable Posted Journals*):** Seluruh mutasi finansial yang telah berstatus `POSTED` terkunci secara permanen dan terlindungi di dalam periode akuntansi yang telah ditutup (*CLOSED fiscal periods*).

---

# Addendum v1.7 — Pengelolaan Agen (Online vs Offline), Rute Asal/Zonasi, dan Aturan Komisi Penjualan
Tanggal pembaruan: 5 Oktober 2026

Addendum ini meresmikan penanganan agen penjualan tiket (Offline loket fisik vs Online OTA seperti RedBus/Traveloka), pemfilteran zonasi rute (Jakarta vs Yogya), serta otomasi kalkulasi komisi dan integrasi finansialnya.

## 1. Klasifikasi Agen: Offline (Loket Fisik) vs Online (OTA Platform)
- **Tabel `agents` Diperkaya:**
  - `agent_type`:
    - `OFFLINE`: Agen loket fisik terminal/garasi (misal: Agen Terminal Pulo Gebang, Agen Ciputat, Agen Giwangan Yogya, Agen Jombor).
    - `ONLINE_OTA`: Agen platform digital / Online Travel Agent (misal: RedBus, Traveloka, Tiket.com).
  - `city`:
    - `JAKARTA` / `TANGERANG`: Agen offline wilayah Jabodetabek.
    - `YOGYAKARTA`: Agen offline wilayah D.I. Yogyakarta & sekitarnya.
    - `ALL`: Universal (khusus agen online/OTA yang dapat menjual tiket untuk kedua arah).
  - `settlement_type`:
    - `CASH_TO_CREW`: Uang fisik diserahkan tunai ke kru bus saat singgah di loket.
    - `CASH_TO_OFFICE`: Uang disetor langsung oleh agen loket ke kasir kantor cabang/pool.
    - `BANK_TRANSFER`: Pembayaran non-tunai via transfer rekening (standar untuk OTA RedBus/Traveloka).

## 2. Pemfilteran Agen Cerdas Berdasarkan Arah Rute SPJ (Anti-Human Error)
- **Logika Penugasan Leg Perjalanan:**
  - Saat penugasan/pengisian manifes SPJ untuk Leg **Keberangkatan (Jakarta/Tangerang $\to$ Yogyakarta)**:
    - Dropdown pilihan agen di UI sistem **hanya menampilkan Agen Kota Jakarta/Tangerang + Agen Online/OTA**.
    - Agen Kota Yogyakarta otomatis di-hide/dicegah agar kru atau petugas loket tidak salah memilih agen asal.
  - Saat pengisian manifes SPJ untuk Leg **Kepulangan (Yogyakarta $\to$ Jakarta/Tangerang)**:
    - Dropdown pilihan agen di UI **hanya menampilkan Agen Kota Yogyakarta + Agen Online/OTA**.

## 3. Matriks Aturan Komisi Agen Fleksibel (`agent_commission_rules`)
Setiap agen dapat memiliki skema insentif/potongan komisi tersendiri:
- **Tabel `agent_commission_rules`:**
  - `id`: Primary key UUID.
  - `agent_id`: FK ke `agents.id`.
  - `seat_class`: `SLEEPER`, `LUXURY_2_1`, `EXECUTIVE`, atau `ALL`. (Mendukung komisi berbeda per kelas kursi, misal: komisi jual Sleeper Rp30.000 vs Luxury Rp20.000).
  - `rule_type`:
    - `FLAT_PER_TICKET`: Nominal tetap per lembar tiket (umum pada Agen Offline, misal Rp20.000 / kursi).
    - `PERCENTAGE`: Persentase dari harga tiket (umum pada Online OTA, misal 10% fee platform).
  - `commission_value`: Nilai nominal (Rp) atau persentase (%).
  - `is_active`: Status keaktifan aturan komisi.

## 4. Pemisahan Kas Fisik Kru vs Piutang Agen Online (AR OTA)
- **Kru Tidak Dibebani Uang Penjualan OTA:**
  - Tiket yang terjual lewat RedBus/Traveloka dicatat pada manifest SPJ untuk keperluan kuota load factor dan pengakuan total omzet perjalanan.
  - Namun, **kru sama sekali TIDAK ditagih uang fisik atas tiket OTA tersebut** pada lembar pertanggungjawaban kas (`crew_cash_settlements`).
  - Nominal tiket OTA langsung dialokasikan ke **Piutang Usaha (AR Invoice / AR OTA)** yang nantinya diselesaikan via transfer bank korporat secara berkala.
- **Setoran Tunai Agen Offline:**
  - Untuk agen offline berstatus `CASH_TO_CREW`, uang fisik yang dititipkan agen ke kru bus menjadi bagian dari **Penerimaan Perusahaan yang Wajib Disetor Kru** pada saat verifikasi kas SPJ di kasir pool.
- **Pencatatan Komisi Otomatis:**
  - Nilai kotor penjualan tiket diakui utuh sebagai Pendapatan Tiket, sedangkan nilai komisi diakui sebagai **Beban Komisi Agen** berpasangan dengan **Utang Komisi Agen** (atau pemotong piutang bersih saat settlement), menjaga kepatuhan pencatatan bruto standar akuntansi.

---

# Addendum v1.8 — Standardisasi Kompensasi & Master Tarif Kru (`crew_rate_rules`)
Tanggal pembaruan: 5 Oktober 2026

Addendum ini meresmikan skema master tarif kompensasi kru operasional armada (Sopir 1, Sopir 2 / Batangan, dan Kondektur/Kernet), otomasi pengisian hak kru di SPJ, serta perlakuan akuntansinya.

## 1. Master Tarif Kompensasi Kru (`crew_rate_rules`)
Untuk menghilangkan ketergantungan pada input manual dan menjaga keadilan serta akurasi kompensasi kru, disediakan tabel aturan master:
- **Tabel `crew_rate_rules`:**
  - `id`: Primary key UUID.
  - `role`: Peran kru (`DRIVER`, `CO_DRIVER`, `CONDUCTOR`).
  - `service_type`: Jenis layanan (`AKAP` atau `TOURISM`).
  - `origin`: Kota asal (contoh: `JAKARTA`, `TANGERANG`, atau `ALL`).
  - `destination`: Kota tujuan (contoh: `YOGYAKARTA`, atau `ALL`).
  - `rate_type`:
    - `PER_TRIP`: Satuan per perjalanan/rit (standar untuk AKAP reguler).
    - `PER_DAY`: Satuan harian/durasi hari (standar untuk Pariwisata/Charter).
  - `meal_allowance`: Nominal uang makan standar (Rp).
  - `trip_incentive`: Nominal premi/insentif ritase standar (Rp).
  - `effective_from` & `effective_until`: Masa berlaku berversi (menjamin historis SPJ lama tidak berubah saat ada penyesuaian UMR/kebijakan rate baru).
  - `is_active`: Status keaktifan aturan rate.

## 2. Otomasi Pengisian Kompensasi di SPJ (`crew_meal_payments` / Hak Kru)
- **Snapshot Otomatis:** Ketika petugas operasional menugaskan kru ke dalam SPJ (`spj_crew_assignments`), sistem secara otomatis menarik standar tarif dari `crew_rate_rules` berdasarkan peran kru dan konteks perjalanan:
  - Untuk AKAP: Mengalikan rate `PER_TRIP` sesuai rute penugasan.
  - Untuk Pariwisata: Mengalikan rate `PER_DAY` dengan total durasi hari perjalanan wisata.
- **Nilai Tersalin Permanen (*Rate Snapshotting*):** Angka yang ditarik disalin langsung ke baris pencatatan pembayaran kompensasi kru SPJ (`crew_meal_payments`), sehingga perubahan tarif di master kemudian hari tidak akan memengaruhi laporan SPJ historis.
- **Fasilitas Override Terkendali:** Sistem tetap menyediakan opsi *manual override* dengan hak akses khusus (supervisor/manager) apabila terdapat kondisi darurat (misalnya: penugasan kru bantuan mendadak atau kompensasi lembur insidental). Setiap override wajib mencantumkan alasan tertulis di log audit.

## 3. Integrasi Alur Keuangan & Akuntansi
- **Pemisahan dari UJ:** Uang kompensasi kru (Uang Makan & Premi) tetap dicatat terpisah dari Uang Jalan (UJ), sehingga uang operasional bus (BBM, tol, ban) tidak bercampur dengan hak pribadi kru.
- **Pencatatan Beban Akuntansi:**
  - Uang Makan didebit ke akun **Beban Uang Makan Kru** (`53xxx`).
  - Premi ritase didebit ke akun **Beban Premi/Insentif Kru** (`53xxx`).
  - Dikreditkan ke akun **Kas/Bank** jika dibayar tunai langsung di pool, atau ke akun **Utang Kompensasi Kru** jika dicairkan terjadwal/bersamaan dengan rekap payroll.

---

# Addendum v1.9 — Service Makan Penumpang, Bonus Kru Full Seat, Fee Koordinator Wilayah, dan Klasifikasi Kargo
Tanggal pembaruan: 5 Oktober 2026

Addendum ini meresmikan spesifikasi 4 kebutuhan bisnis operasional lapangan yang telah diselaraskan dengan seluruh aturan akuntansi:
1. Master data restoran mitra dan pencatatan service makan penumpang per trip/leg.
2. Bonus insentif kru otomatis jika keterisian kursi mencapai kapasitas maksimal (*Full Seat* 100%) yang dinilai per leg perjalanan.
3. Uang jasa/fee koordinator lapangan wilayah Barat (Jakarta/Tangerang) dan Timur (Yogyakarta) berbasis jumlah penumpang dengan zonasi otomatis per arah rute.
4. Klasifikasi penerimaan kargo/paket bagasi bus (Paket Motor vs Paket Kardus) dengan input tarif manual dan setoran tunai bruto.

## 1. Master Restoran Mitra & Service Makan Penumpang (`restaurants`)
Setiap penumpang bus AKAP reguler mendapatkan fasilitas 1x servis makan di rumah makan mitra resmi di sepanjang rute perjalanan (misal: Subang / Cipali / Gringsing).
- **Tabel `restaurants` (Master Restoran Mitra):**
  - `id`: Primary key UUID.
  - `code`: Kode unik restoran (misal: `RM-01`, `RM-02`).
  - `name`: Nama rumah makan mitra (misal: *RM Taman Selera*, *RM Raos Eco*, *RM Kendil Mas*).
  - `city`: Lokasi kota / rest area (misal: `SUBANG`, `BATANG`, `GRINGSING`).
  - `rate_per_pax`: Tarif baku servis makan per penumpang (misal Rp25.000 / porsi / kupon).
  - `settlement_type`:
    - `PAID_BY_CREW_UJ`: Kru membayar tunai ke kasir restoran di tempat menggunakan dana Uang Jalan (UJ) perjalanan.
    - `INVOICED_MONTHLY_AP`: Restoran merekap kupon/manifes dan menagihkan total biaya ke kantor pusat via invoice bulanan (AP Invoice Vendor).
  - `is_active`: Status aktif mitra.
- **Pencatatan Biaya di SPJ (`spj_expenses`):**
  - Kategori pengeluaran: `RESTAURANT_MEAL_SERVICE`.
  - Nominal dihitung dari: $\text{Pax Hadir} \times \text{rate\_per\_pax}$ (atau jumlah kupon makan yang distempel pihak rumah makan).
  - **Pemetaan Akun Akuntansi:** Didebitkan ke akun COA **`51102 — Beban Service Makan Penumpang Restoran Mitra`** (berada di kelompok beban operasional armada & layanan tiket, terpisah total dari uang makan kru).
  - **Alur Kas:**
    - Jika dibayar kru dari UJ (`payment_source = 'UJ'`), transaksi ini mengurangi sisa saldo UJ kru saat rekonsiliasi SPJ.
    - Jika diinvoiskan bulanan kantor (`payment_source = 'OFFICE_AP'`), dicatat sebagai pengakuan beban dan utang usaha AP vendor (`21101 — Utang Vendor Restoran Mitra`) tanpa membebani kas kru.

## 2. Bonus Kru Full Seat (Okupansi 100% Per Leg Perjalanan)
- **Pemicu Otomatis Berbasis Leg (*Per-Leg Auto-Trigger*):**
  - Evaluasi okupansi dinilai **per leg perjalanan**, bukan digabung per SPJ PP.
  - Ketika total penumpang pada manifest keberangkatan leg SPJ mencapai 100% dari kapasitas fisik kursi aktif bus (`SUM(vehicle_seat_classes.seat_capacity)`), sistem secara otomatis mengaktifkan status **FULL_SEAT** untuk leg tersebut:
    - Jika hanya Leg 1 (Keberangkatan) yang full seat $\to$ kru berhak atas 1x nominal bonus.
    - Jika kedua leg (Pergi dan Pulang) sama-sama full seat 100% $\to$ kru berhak atas 2x nominal bonus.
- **Master Aturan Kompensasi (`crew_rate_rules`):**
  - Kolom `full_seat_bonus` menyimpan nominal rupiah bonus performa per peran kru (`DRIVER`, `CO_DRIVER`, `CONDUCTOR`).
- **Pencatatan di Hak Kru (`crew_meal_payments`):**
  - Nominal bonus full-seat otomatis ditambahkan ke rincian pembayaran hak kru pada SPJ terkait sebagai bentuk penghargaan atas pencapaian muatan penuh.
  - **Pemetaan Akun Akuntansi:** Didebitkan ke akun COA **`53103 — Beban Bonus Full Seat Kru`** (kelompok hak kru operasional).

## 3. Fee Koordinator Wilayah Lapangan (`coordinator_fee_rules`)
Perusahaan memiliki 2 koordinator lapangan di wilayah strategis:
- **Zonasi Koordinator:**
  - `WEST`: Koordinator Wilayah Barat (Jakarta, Tangerang, Bogor, Bekasi / Jabodetabek).
  - `EAST`: Koordinator Wilayah Timur (Yogyakarta, Klaten, Solo, Magelang / Jateng-DIY).
- **Tabel Aturan `coordinator_fee_rules`:**
  - `id`: Primary key UUID.
  - `zone`: Enum `WEST` / `EAST`.
  - `coordinator_user_id`: FK ke `users.id` (personel koordinator terdaftar).
  - `fee_per_pax`: Tarif jasa per penumpang (saat ini bernilai default **Rp10.000 per penumpang**, dan dapat disesuaikan di master data secara dinamis tanpa mengubah kode program).
  - `effective_from` & `effective_until`: Rentang masa berlaku tarif fee.
  - `is_active`: Status keaktifan aturan.
- **Otomasi Zonasi Per Arah Leg SPJ (Anti-Salah Hitung):**
  - Sistem mengaitkan kalkulasi fee secara otomatis dengan arah rute leg perjalanan:
    - **Leg Keberangkatan (Jakarta/Tangerang $\to$ Yogyakarta):** Sistem otomatis mengalokasikan fee kepada **Koordinator Wilayah Barat (`WEST`)** sebesar:
      $$\text{Fee Barat} = \text{Jumlah Penumpang Leg Berangkat} \times \text{fee\_per\_pax}$$
    - **Leg Kepulangan (Yogyakarta $\to$ Jakarta/Tangerang):** Sistem otomatis mengalokasikan fee kepada **Koordinator Wilayah Timur (`EAST`)** sebesar:
      $$\text{Fee Timur} = \text{Jumlah Penumpang Leg Pulang} \times \text{fee\_per\_pax}$$
  - Fee koordinator dicatat sebagai biaya SPJ kategori `COORDINATOR_FEE`.
  - **Pemetaan Akun Akuntansi:** Didebitkan ke akun COA **`54102 — Beban Uang Jasa Koordinator Lapangan`**.
  - Sumber pembayaran dapat diselesaikan tunai oleh kru dari UJ di lapangan atau dibayarkan periodik melalui kasir cabang/pool (`22102 — Utang Jasa Koordinator Lapangan`).

## 4. Klasifikasi Penerimaan Kargo/Paket Bagasi (Motor vs Kardus)
Penerimaan muatan non-tiket di bagasi bus dipisahkan menjadi 2 kategori jelas pada deklarasi penerimaan SPJ (`spj_revenue_declarations`):
- **Kategori Paket:**
  1. `CARGO_MOTORCYCLE`: Pengangkutan sepeda motor di bagasi (motor bebek, matic, sport).
  2. `CARGO_BOX`: Pengangkutan paket kardus, dus oleh-oleh, karung barang, atau paket titipan kilat.
- **Fleksibilitas Input Tarif Manual:**
  - Mengingat dimensi barang, berat, volume bagasi yang terpakai, dan negosiasi pengiriman di lapangan sangat bervariasi, **nominal tarif kargo diinput secara manual per transaksi resi/tanda terima**.
  - Petugas/kru wajib menginput: jenis paket (`CARGO_MOTORCYCLE` atau `CARGO_BOX`), nomor resi pengiriman, nama & telepon pengirim/penerima, dan nominal uang tunai yang diterima.
  - **Integritas Setoran Bruto:** Uang tunai yang diterima kru atas paket motor dan paket kardus masuk 100% ke dalam **Penerimaan Tunai Perusahaan yang Wajib Disetor Kru** saat penyelesaian kas SPJ (`crew_cash_settlements`) di kasir pool garasi. Kru dilarang memotong uang kargo secara sepihak untuk operasional tanpa pencatatan resmi.
  - **Pemetaan Akun Akuntansi:** Dikreditkan ke akun COA **`43101 — Pendapatan Kargo & Paket Bagasi Bus`**.

---

# Addendum v1.10 — Harmonisasi Komprehensif dan Resolusi Konsistensi
Tanggal pembaruan: 5 Oktober 2026

Addendum ini merangkum dan mengunci konsistensi menyeluruh antar-seluruh bab dalam Blueprint:
1. **Status Ganda SPJ Tunggal:** Menetapkan secara definitif bahwa status perjalanan hanya menggunakan dua kolom enum independen: `operational_status` (`DRAFT`, `ISSUED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) dan `financial_status` (`PENDING_SETTLEMENT`, `UNDER_REVIEW`, `DISCREPANCY`, `SETTLED`). Seluruh draft status sebelumnya di Bab 8.2 dan Addendum v1.1 telah diselaraskan.
2. **Hierarki Beban COA Jelas:** Akun servis makan restoran penumpang (`51102`), uang makan pribadi kru (`53101`), premi ritase (`53102`), bonus full seat (`53103`), dan jasa koordinator (`54102`) memiliki nomor akun dan pemisahan fungsi yang tegas, mencegah pencampuran biaya operasional dengan hak personalia.
3. **Penyelesaian Kas Yogyakarta:** Mendukung 2 opsi resmi saat pergantian kru di Yogyakarta (Settlement Cabang Yogya via BKM baru vs Handover Saldo Estafet antar-kru), memberikan kepastian SOP bagi tim operasional lapangan.
4. **Validasi Kuota Kursi Multi-Class:** Input manifest penumpang pada armada multi-class (Combi/Sleeper) wajib divalidasi tidak melebihi kapasitas fisik masing-masing kelas kursi (`vehicle_seat_classes`).

---

# Addendum v1.11 — Standardisasi RBAC, Multi-Role, Separation of Duties (SoD), dan Pintu Pengeluaran Non-SPJ
Tanggal pembaruan: 5 Oktober 2026

Addendum ini meresmikan struktur role pengguna, pemanfaatan multi-role, aturan pemisahan wewenang (Separation of Duties), dan penugasan tanggung jawab input pengeluaran non-SPJ:

## 1. Konfirmasi Kapabilitas Multi-Role di Backend
- **Arsitektur Multi-Role:** Backend NestJS (`ss-travel-backend`) telah mendukung 100% penugasan multi-role per user melalui tabel pivot `user_roles` (`UsersEntity` $\leftrightarrow$ `UserRolesEntity` $\leftrightarrow$ `RolesEntity`).
- **Agregasi Izin (Union Permissions):** `MenusService.getPermissionsByRoles()` menggabungkan seluruh izin peran yang dimiliki user menjadi satu himpunan (*Set*). Pada level navigasi menu, permission di-merger menggunakan logika `OR` (jika salah satu role mengizinkan `isCreate` atau custom action, user otomatis memperoleh hak tersebut).
- **Keputusan Desain:** Menhindari ledakan role baru (*role explosion*). Sistem menggunakan daftar role modular yang fokus pada fungsinya, dan pengguna dengan tanggung jawab ganda di lapangan cukup diberikan beberapa role sekaligus.

## 2. Matriks Definisi Role Standar SS Traveling
1. **`SUPER_ADMIN` (System Administrator):** Manajemen sistem global, user, role, permission, audit log.
2. **`DIRECTOR` (Direksi / Owner):** Read-only dashboard eksekutif, analitik keuangan, posisi kas/bank, dan profitabilitas rute/armada.
3. **`FINANCE_MANAGER` (Manajer Keuangan):** Otorisasi pengeluaran dan pembayaran besar, verifikasi sengketa selisih kas (`DISCREPANCY`), persetujuan tutup buku, dan pembukaan kembali periode fiskal (*Reopen Period*).
4. **`ACCOUNTANT` (Akuntan / Finance Accounting):** Verifikasi settlement kas SPJ (`UNDER_REVIEW` $\to$ `SETTLED`), pembuatan & posting jurnal (`AccountingPostingService`), penyesuaian memorial (JV), rekonsiliasi bank, depresiasi aset, dan penutupan buku periode.
5. **`FINANCE_AR_AP` (Staff Keuangan AR/AP):** Penerbitan invoice piutang charter/wisata & rekonsiliasi AR OTA; pencatatan tagihan vendor tempo (sparepart, karoseri, servis makan, BBM armada) dan penyiapan pembayaran AP.
6. **`POOL_CASHIER` (Kasir Pool / Cabang):** Pencairan fisik Uang Jalan (BKK), penerimaan fisik setoran sisa UJ & kas bruto tiket/kargo kru (BKM), pengelolaan petty cash pool, serta mutasi kartu E-Toll pool.
7. **`OPS_ADMIN` (Admin Operasional / Dispatcher):** Pembuatan draft & penerbitan SPJ (`ISSUED`), plotting unit armada & penugasan kru per leg, monitoring status perjalanan bus, dan pengajuan penambahan UJ darurat.
8. **`FIELD_COORDINATOR` (Koordinator Lapangan / Korlap):** Validasi manifes fisik penumpang di titik kumpul terminal/agen, pengawasan kupon servis makan, dan input tanda terima kargo resi manual.
9. **`CREW_DRIVER` (Pengemudi Bus / Driver):** Identitas kru di SPJ, penerima UJ jalan, pencatat nota BBM/Tol (via self-service), dan penyetor kas.
10. **`CREW_CONDUCTOR` (Kondektur / Co-Driver):** Identitas kru di SPJ, pembantu operasional & pengelola barang bagasi/kargo di perjalanan.

## 3. Aturan Pemisahan Wewenang (Separation of Duties - SoD)
- **Kombinasi Diizinkan (Umum di Lapangan):**
  - `OPS_ADMIN` + `FIELD_COORDINATOR` (Admin kantor yang merangkap pengawas keberangkatan terminal).
  - `FINANCE_AR_AP` + `ACCOUNTANT` (Staff finance yang mengurus tagihan sekaligus membantu pembukuan jurnal harian).
  - `CREW_DRIVER` + `FIELD_COORDINATOR` (Driver senior yang bertugas menjadi koordinator titik saat jadwal libur narik).
- **Kombinasi Terlarang (Hard Anti-Fraud Conflict):**
  - ❌ `OPS_ADMIN` + `POOL_CASHIER`: Pembuat SPJ dilarang merangkap kasir pencair uang jalan (mencegah SPJ fiktif dengan pencairan mandiri).
  - ❌ `CREW_DRIVER` + `POOL_CASHIER`: Penerima UJ / penyetor uang dilarang menjadi kasir pool yang memverifikasi uang fisik.
  - ❌ Pembuat transaksi dilarang menjadi *single approver* untuk pengajuan dokumennya sendiri di workflow approval.

## 4. Pintu dan Tanggung Jawab Penginputan Pengeluaran Non-SPJ
Biaya operasional yang tidak melekat pada satu nomor SPJ perjalanan bus dibagi ke dalam 3 pintu pencatatan:
1. **Kas Kecil Pool (Petty Cash):**
   - *Cakupan:* Sabun cuci bus, galon air, ATK pool, retribusi lingkungan, konsumsi piket, perbaikan kecil garasi.
   - *Pintu Input:* `POOL_CASHIER` (atau `OPS_ADMIN` di cabang tanpa kasir khusus) via menu **Kas & Bank $\to$ Kas Keluar (`cash_transactions`)**.
   - *Verifikasi:* Diverifikasi oleh `ACCOUNTANT` saat pengajuan penggantian dana kas kecil (*Petty Cash Replenishment*).
2. **Tagihan Vendor Tempo / Perawatan Bengkel (AP Invoices):**
   - *Cakupan:* Pembelian drum oli, ban bus, sparepart, servis karoseri, AC bus, atau tagihan bulanan rekanan.
   - *Pintu Input:* `FINANCE_AR_AP` via menu **Utang Usaha $\to$ Tagihan Vendor (`ap_invoices`)**, dapat dialokasikan langsung ke `vehicle_id` bus terkait.
   - *Persetujuan & Pembayaran:* Disetujui oleh `FINANCE_MANAGER` saat daftar jadwal bayar, dilunasi via transfer bank (`ap_payments`).
3. **Legalitas Armada & Biaya Rutin Kantor (Bank Kantor Pusat):**
   - *Cakupan:* Pajak tahunan STNK, uji KIR berkala, asuransi Jasa Raharja, perpanjangan izin trayek, sewa pool garasi, internet & listrik kantor.
   - *Pintu Input:* `FINANCE_AR_AP` atau `ACCOUNTANT` dengan persetujuan wajib `FINANCE_MANAGER`, dibukukan via **`bank_transactions`** atau **`ap_invoices`**.

---

# Addendum v1.12 — Standardisasi Akun COA Pengeluaran Non-SPJ & Catatan Selisih Kupon Makan Per Leg
Tanggal pembaruan: 14 Oktober 2026

Addendum ini meresmikan penambahan spesifikasi teknis dan akuntansi terkunci:

## 1. Rincian COA Beban Non-SPJ (Kelompok 55, 56, 57, dan 58)
Seluruh pengeluaran di luar SPJ wajib dijurnal menggunakan akun COA spesifik:
- **Kelompok 55 (Beban Perawatan & Bengkel Armada):**
  - `55101` Beban Servis & Perawatan Rutin Armada
  - `55102` Beban Penggantian Suku Cadang (Sparepart)
  - `55103` Beban Oli & Pelumas Mesin Bus
  - `55104` Beban Ban Bus (Baru & Vulkanisir)
  - `55105` Beban Perbaikan AC & Kelistrikan Bus
  - `55106` Beban Karoseri, Bodi, & Pengecatan
  - *Aturan Wajib:* Transaksi kelompok 55 wajib menempelkan dimensi `vehicle_id` agar terakumulasi di riwayat pemeliharaan aset bus.
- **Kelompok 56 (Beban Penyusutan Aset):**
  - `56101` Beban Penyusutan Armada Bus
  - `56102` Beban Penyusutan Peralatan Bengkel & Pool
- **Kelompok 57 (Beban Umum, Administrasi, & Pool):**
  - `57101` Beban Legalitas, Pajak STNK, & KIR Armada
  - `57102` Beban Asuransi Kendaraan & Jasa Raharja
  - `57103` Beban Perlengkapan & Kebersihan Pool
  - `57104` Beban Listrik, Air, & Internet Pool/Kantor
  - `57105` Beban Gaji Karyawan Tetap & Mekanik
  - `57106` Beban ATK, Kertas, & Percetakan Dokumen
  - `57107` Beban Konsumsi Staf & Lembur Garasi
  - `57108` Beban Retribusi Lingkungan & Keamanan Pool
- **Kelompok 58 (Beban Selisih Kasir):**
  - `58101` Beban Selisih Kasir Pool (Dispensasi Perusahaan Pasca-Investigasi)

## 2. Pencatatan Keterangan Selisih Kupon Makan per Leg SPJ
- Pada tabel `spj_legs`, ditambahkan kolom:
  - `meal_pax_count` (integer): Jumlah riil kupon/penumpang yang makan di rumah makan mitra.
  - `meal_discrepancy_notes` (text): Keterangan wajib jika `meal_pax_count` berbeda dengan manifes kursi (contoh: *"2 penumpang tidur/puasa"* atau *"1 porsi tambahan untuk kru bantuan"*).
- Catatan ini tersimpan permanen di SPJ dan otomatis ditampilkan di modul AP Invoices saat Finance AP memverifikasi invoice tagihan berkala dari restoran mitra.

---

# Addendum v1.13 — Tata Kelola Aset Tetap Armada, Saldo Awal Migrasi, Utang Leasing, dan Penyusutan
Tanggal pembaruan: 15 Oktober 2026

Addendum ini meresmikan tata kelola aset armada, penanganan saldo awal migrasi (10 bus), pembiayaan cicilan perbankan, dan otomasi penyusutan:

## 1. Tata Kelola Saldo Awal Migrasi (*Cut-Off Opening Balance*)
Pada saat *go-live* atau migrasi ke aplikasi, sistem tidak menarik riwayat masa lalu, melainkan menetapkan saldo awal (*Opening Balance*) per tanggal cut-off:
- **Pendaftaran Master Armada (`vehicles` & `fixed_assets`)**:
  - Seluruh 10 bus didaftarkan nomor lambung (`code`), plat nomor (`plate_number`), nama julukan (`nickname`), dan kelas kursi (`vehicle_seat_classes`).
  - Nilai perolehan historis dan sisa nilai buku per tanggal cut-off didaftarkan ke tabel `fixed_assets`.
- **Perlakuan 7 Unit Bus Lunas**:
  - Dicatat sebagai aset tetap bersih: Debit `15101 Kendaraan / Armada Bus`, Kredit `31101 Modal Disetor Pemilik` (atau `32101 Saldo Laba Ditahan`).
  - Tidak memiliki kewajiban utang perbankan. Beban bulanan di Laba Rugi murni berasal dari penyusutan rutin.
- **Perlakuan 3 Unit Bus dalam Angsuran Bank / Leasing**:
  - Dicatat nilai aset fisiknya: Debit `15101 Kendaraan / Armada Bus`.
  - Dicatat sisa pokok pinjaman ke leasing/bank: Kredit `26101 Utang Bank / Leasing Armada Bus`.
  - Porsi ekuitas yang telah terbentuk (uang muka DP lama & cicilan pokok yang sudah dibayar): Kredit `31101 Modal Disetor Pemilik`.

## 2. Pemisahan Komponen Angsuran Bulanan Leasing
Setiap pembayaran cicilan bulanan bus ke bank/leasing wajib dipisahkan menjadi 2 komponen dalam satu voucher pengeluaran bank (`bank_transactions` / `ap_payments`):
1. **Pokok Pinjaman**: Didebitkan ke `26101 Utang Bank / Leasing Armada Bus` (mengurangi kewajiban di Neraca, **bukan beban Laba Rugi**).
2. **Bunga Pinjaman**: Didebitkan ke `59101 Beban Bunga Pinjaman Bank / Leasing Armada` (diakui sebagai **beban pemotong Laba Rugi** periode berjalan).
3. **Total Kas Keluar**: Dikreditkan ke `11104 Bank Operasional Perusahaan (BCA/Mandiri)`.

## 3. Otomasi & Entry Point Pengelolaan Penyusutan Aset
1. **Eksekusi Otomatis Bulanan (*Run Depreciation*)**:
   - Tersedia di menu **Aset Tetap $\to$ Jalankan Penyusutan** atau terintegrasi pada checklist **Tutup Buku Bulanan**.
   - Sistem mengkalkulasi depresiasi seluruh aset aktif berbasis metode garis lurus:
     $$\text{Beban Depresiasi Bulanan} = \frac{\text{Nilai Perolehan} - \text{Nilai Residu}}{\text{Masa Manfaat (Bulan)}}$$
   - Posting otomatis jurnal atomik:
     - **Debit**: `56101 Beban Penyusutan Armada Bus`
     - **Kredit**: `16101 Akumulasi Penyusutan Armada Bus`
2. **Entry Point Penyesuaian & Update Aset (UI Action Endpoints)**:
   - **Perpanjangan Umur / Revaluasi Pasca-Overhaul**: Form pembaruan masa manfaat bus setelah turun mesin atau pembaruan bodi karoseri besar-besaran, mendistribusikan sisa nilai buku ke umur baru.
   - **Penurunan Nilai (*Impairment*)**: Penyesuaian nilai buku saat bus mengalami musibah/kerusakan berat permanen.
   - **Pelepasan / Penjualan Bus (*Disposal*)**: Tombol aksi pelepasan aset saat bus dijual atau dibesituakan (*scrap*). Sistem menghentikan penyusutan otomatis dan membukukan selisih harga jual terhadap nilai buku ke `81102 Keuntungan Penjualan Aset Bus` atau `82101 Kerugian Pelepasan Aset Bus`.

## 4. Penambahan Modal Pemilik (Tunai vs Non-Tunai / Inbreng)
- **Modal Masuk Tunai / Transfer Bank**: Masuk via menu Kas & Bank (`bank_transactions`), menambah kas/bank (`11104`) dan mengkredit `31101 Modal Disetor Pemilik` (atau `27101 Utang Pemegang Saham` jika pinjaman talangan sementara), tanpa memengaruhi omzet operasional SPJ.
- **Modal Masuk Non-Tunai (Inbreng Bus / Suku Cadang)**: Masuk via menu Akuntansi Jurnal Memorial (`journal_entries`), mendebit aset tetap (`15101`) atau persediaan bengkel (`14101`) berpasangan dengan modal disetor (`31101`).

---

# Addendum v1.14 — Tata Kelola Snack Penumpang & Fasilitas Onboard Bus (Metode Pembebanan Langsung Non-SPJ)
Tanggal pembaruan: 15 Oktober 2026

Addendum ini meresmikan tata kelola pengadaan makanan ringan (*snack*) penumpang dan perlengkapan fasilitas kabin bus:

## 1. Latar Belakang & Realitas Operasional Lapangan
- Pengadaan makanan ringan (kacang telur bal-balan 20kg, dus air mineral, cup minuman kemasan) dibeli secara grosir gelondongan oleh kantor/pool, lalu dibungkus ulang (*repacked*) oleh staf garasi secara taksiran perkiraan porsi ke dalam kotak snack.
- Fasilitas penunjang kenyamanan penumpang di dalam kabin bus (teh, kopi sachet, gula, baterai mic karaoke, parfum semprot bus, kuota modem Wi-Fi) bersifat perlengkapan habis pakai berjalan (*onboard supplies*) yang tidak habis persis dalam satu ritase SPJ dan sering menyisakan stok di atas bus.
- **Keputusan Desain:** Menolak konsep *Bill of Materials (BOM)* manufaktur dan menolak pembebanan sachet/gramatur di lembar SPJ perjalanan kru. Hal ini dilakukan untuk menjaga alur rekonsiliasi SPJ kasir tetap cepat, ringkas, dan fokus pada hal material (BBM, Tol, Servis Makan RM Mitra, Parkir/TPR, Setoran Kas Tiket/Kargo, dan Hak Kru).

## 2. Prinsip Akuntansi: Metode Pembebanan Langsung (*Direct Expense Method*)
- Seluruh pembelian barang konsumsi dan amenity kabin bus dicatat menggunakan **Metode Pembebanan Langsung** (*expensed upon purchase*), yaitu langsung diakui sebagai beban operasional saat transaksi belanja terjadi.
- **Pintu Masuk Transaksi**:
  - Dibelanjakan melalui **Kas Kecil Pool / Petty Cash (`cash_transactions`)** atau transfer bank operasional kantor.
  - Diverifikasi oleh Accountant saat rekap/penggantian kas kecil pool (*Petty Cash Replenishment*).

## 3. Pemetaan Akun Akuntansi & Dimensi Biaya
- **Pemetaan Akun Jurnal**:
  - **Debit**: `52104 Beban Snack, Amenity, & Fasilitas Onboard Bus` (masuk ke Laba Rugi periode belanja).
  - **Kredit**: `11103 Kas Kecil Pool` (atau `11104 Bank Operasional Perusahaan` / `21102 Utang Vendor Sembako`).
- **Penerapan Dimensi Analitik**:
  - **Belanja Kolektif / Umum Pool** (kacang bal-balan, kopi sachet, baterai mic, teh, tisu): Cukup menempelkan Cost Center `Operasional Pool` tanpa mewajibkan dimensi armada `vehicle_id`.
  - **Belanja Khusus Unit Tertentu** (misalnya paket data kuota modem Wi-Fi bus `SS-01` atau parfum khusus kabin Sleeper `SS-02`): Menempelkan Cost Center `Operasional Pool` beserta dimensi `vehicle_id` terkait agar riwayat biaya fasilitas per armada dapat ditinjau di laporan performa unit.

---

# Addendum v1.15 — Standardisasi Kompensasi Kru Standby/Langsir, Gaji Karyawan, Upah Lembur, & Dinas Luar Kantor
Tanggal pembaruan: 15 Oktober 2026

Addendum ini meresmikan tata kelola pengeluaran untuk kompensasi non-SPJ kru (standby dan langsir), pemisahan gaji karyawan kantor vs bengkel, upah lembur (*overtime*), serta perjalanan dinas staf kantor:

## 1. Kompensasi Kru Non-SPJ di Pool Garasi & Perjalanan Teknis
- **Uang Makan Standby Kru di Garasi (`53105`)**:
  - Pengemudi dan kru cadangan yang terjadwal piket/standby di pool garasi (tidak sedang jalan dinas komersial membawa penumpang) berhak atas uang makan harian.
  - **Prinsip Akuntansi:** Beban ini dikeluarkan melalui **Kas Kecil Pool (`cash_transactions`)** dan **DILARANG dimasukkan ke lembar SPJ mana pun**, menjaga margin kontribusi ritase bus tetap objektif.
  - **Akun Jurnal:** Debit `53105 Beban Uang Makan Standby Kru (Non-SPJ Garasi)`, Kredit `11103 Kas Kecil Pool`.
- **Insentif Langsir & Dinas Teknis Kru (`53106`)**:
  - Tugas driver membawa armada kosongan (*deadhead / non-revenue trip*) untuk keperluan teknis: mengantar unit ke karoseri (perbaikan bodi/chasis baru), langsir bus ke bengkel rekanan, atau membawa bus uji berkala (KIR) ke Dishub.
  - **Prinsip Akuntansi:** Diberikan uang saku/insentif tugas langsung dari Kas Kecil Pool atau transfer operasional kantor.
  - **Dimensi Biaya Wajib:** Transaksi ini wajib menempelkan dimensi armada `vehicle_id` unit yang diantar, agar seluruh biaya mobilisasi perawatan armada terakumulasi di kartu histori unit tersebut.
  - **Akun Jurnal:** Debit `53106 Beban Insentif Langsir & Dinas Teknis Kru (Non-SPJ Bengkel/Karoseri)` (dengan `vehicle_id`), Kredit `11103 Kas Kecil Pool` / `11104 Bank BCA Operasional`.

## 2. Struktur Penggajian (Payroll) & Pemisahan Beban Personil
- **Gaji Karyawan Kantor & Manajemen (`57105`)**:
  - Gaji bulanan tetap untuk staf administrasi, operasional, kasir, finance AR/AP, koordinator lapangan, dan direksi/manajemen.
  - Dicatat periodik tiap akhir bulan: Debit `57105 Beban Gaji Karyawan Kantor & Manajemen`, Kredit `11104 Bank Operasional Perusahaan` (atau `23xxx Utang Gaji Karyawan`).
- **Gaji Mekanik & Teknisi Bengkel Pool (`57106`)**:
  - Gaji bulanan tetap untuk kepala mekanik, montir mesin, tukang las, dan teknisi AC bus di garasi.
  - Pemisahan akun ini memudahkan manajemen menganalisis rasio biaya pemeliharaan internal (*in-house maintenance cost*) terhadap total pengeluaran perusahaan.
  - Akun Jurnal: Debit `57106 Beban Gaji Mekanik & Teknisi Bengkel Pool`, Kredit `11104 Bank Operasional Perusahaan`.

## 3. Upah Lembur (*Overtime*), Konsumsi Piket, & Perjalanan Dinas Staf
- **Upah Lembur Karyawan & Mekanik (`57107`)**:
  - Diberikan saat teknisi bengkel lembur menyelesaikan perbaikan darurat armada malam hari atau saat staf kantor lembur melayani lonjakan penumpang di peak season (Lebaran/Nataru).
  - Dihitung per jam atau flat harian berdasarkan form lembur yang disetujui Manajer/Kepala Bengkel.
  - Akun Jurnal: Debit `57107 Beban Upah Lembur Karyawan & Mekanik (Overtime)`, Kredit `11103 Kas Kecil Pool` / `11104 Bank Operasional`.
- **Uang Makan & Konsumsi Staf Garasi/Kantor (`57108`)**:
  - Konsumsi makan siang staf kantor, air minum galon galon garasi, atau kopi piket malam mekanik.
- **Perjalanan Dinas & Transport Staf Kantor (`57109`)**:
  - Uang bensin, tiket transport, atau uang saku staf kantor saat dinas luar non-armada (misal: staf legal mengurus izin trayek ke Dishub pusat/daerah, staff finance ke perbankan, atau staf operasional menghadiri rapat Dishub/Organda).
  - Akun Jurnal: Debit `57109 Beban Perjalanan Dinas & Transport Staf Kantor`, Kredit `11103 Kas Kecil Pool`.

---

# Addendum v1.16 — Perencanaan Jadwal Bus (trip_schedules) sebagai Entry Point SPJ & Modul Leads CRM Penyewa Wisata (customers)
Tanggal pembaruan: 15 Oktober 2026

Addendum ini membakukan pemisahan antara **Fase Perencanaan (*Planning & Dispatch Scheduling*)** dan **Fase Eksekusi Operasional (*SPJ Execution*)**, serta mengintegrasikan database penyewa bus wisata ke dalam sistem **Customer Relationship Management (CRM Leads)** untuk retargeting komersial jangka panjang SS Traveling.

## 1. Filosofi Bisnis: Pemisahan Perencanaan Jadwal vs Eksekusi SPJ
- **Jadwal Bus (*trip_schedules*) sebagai Cetak Biru Rencana**:
  - Untuk layanan AKAP Reguler, jadwal bus disusun mingguan (misal: jadwal dinas rolling armada Tangerang $\leftrightarrow$ Yogyakarta 1 minggu ke depan).
  - Untuk layanan Pariwisata / Charter, jadwal dibuat berdasarkan pesanan kontrak sewa (booking masuk dari kantor/sales).
- **Mencegah Armada & Kru Bentrok (*Overlap Conflict Prevention*)**:
  - Sistem secara ketat menolak atau memperingatkan jika ada unit bus atau personel kru yang di-plot pada rentang waktu yang sama atau memiliki jeda istirahat (*buffer time*) terlalu mepet (rekomendasi minimal jeda 3 jam pasca-perjalanan untuk cuci bus, cek oli/ban mekanik, dan tidur kru).
- **Penerbitan SPJ Menjadi "1-Klik" di Hari H Keberangkatan**:
  - Saat jadwal telah berstatus `CONFIRMED` dan armada telah siap di pool garasi, Admin Dispatcher cukup menekan tombol aksi **`[Terbitkan SPJ]`**.
  - Seluruh data perencanaan (armada bus, susunan kru, rute legs, titik jemput / drop, dan kontak panitia penyewa) otomatis disalin (*pre-populated*) ke lembar SPJ tanpa perlu konfirmasi manual berulang-ulang antar-divisi.

## 2. Spesifikasi Entitas Jadwal Bus (`trip_schedules`)
Tabel `trip_schedules` bertindak sebagai jangkar perencanaan sebelum SPJ lahir:

| Kolom | Tipe Data | Deskripsi & Aturan Bisnis |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary key unik dokumen jadwal |
| `schedule_no` | `varchar` | Nomor jadwal unik (`SCH/AKP/YYMM/XXXX` atau `SCH/WIS/YYMM/XXXX`) berbasis `document_sequences` |
| `service_type` | `enum` | Jenis layanan: `AKAP` atau `TOURISM` |
| `vehicle_id` | `uuid` (FK) | Relasi wajib ke armada `vehicles` |
| `planned_departure_at` | `timestamptz` | Rencana tanggal & jam berangkat |
| `planned_return_at` | `timestamptz` | Rencana tanggal & jam tiba kembali di pool garasi |
| `origin` | `varchar` | Kota/titik awal keberangkatan (misal: `Pool Ciputat Tangerang`) |
| `destination` | `varchar` | Kota/titik tujuan akhir (misal: `DIY Yogyakarta & Sekitarnya`) |
| `customer_id` | `uuid` (FK) | Relasi opsional/wajib wisata ke master pelanggan & leads `customers` |
| `pic_name` | `varchar` | Nama penanggung jawab / panitia rombongan di lapangan |
| `pic_phone` | `varchar` | Nomor HP/WhatsApp aktif penanggung jawab untuk koordinasi supir |
| `pickup_notes` | `text` | Catatan titik jemput (misal: *Jemput jam 06.00 di Lobby Gedung B, Bintaro*) |
| `itinerary_notes` | `text` | Catatan rute destinasi wisata (Candi Borobudur, Malioboro, Solo) |
| `planned_driver_1_id` | `uuid` (FK) | Rencana penugasan Supir 1 (`users`) |
| `planned_driver_2_id` | `uuid` (FK) | Rencana penugasan Supir 2 (`users`) |
| `planned_conductor_id` | `uuid` (FK) | Rencana penugasan Kondektur / Helper (`users`) |
| `status` | `enum` | Siklus: `DRAFT` $\to$ `CONFIRMED` $\to$ `SPJ_ISSUED` $\to$ `COMPLETED` (atau `CANCELLED`) |
| `spj_id` | `uuid` (FK) | Tautan ke dokumen `spjs` saat jadwal berhasil diterbitkan menjadi SPJ |

## 3. Spesifikasi Database Leads & CRM Penyewa Wisata (`customers`)
Di bisnis pariwisata, penyewa adalah aset komersial jangka panjang dengan potensi sewa tahunan berulang (*Customer Lifetime Value*). Tabel `customers` dirancang tidak hanya untuk data penagihan faktur, melainkan juga sebagai pusat data prospek (*Leads Database*):

| Kolom | Tipe Data | Deskripsi & Aturan Bisnis |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary key |
| `code` | `varchar` | Kode pelanggan unik (`CUST-0001`) |
| `customer_type` | `enum` | Segmentasi pasar: `CORPORATE` (Kantor/Pabrik), `SCHOOL` (Sekolah/Kampus), `TRAVEL_AGENT` (Biro Mitra/EO), `COMMUNITY` (Majelis/Keluarga), `INDIVIDUAL` |
| `institution_name` | `varchar` | Nama perusahaan, sekolah, atau instansi penyewa |
| `pic_name` | `varchar` | Nama ketua panitia / kontak person |
| `phone` | `varchar` | Nomor HP / WhatsApp utama untuk komunikasi sales & supir |
| `email` | `varchar` | Email penawaran / invoice tagihan (opsional) |
| `address` | `text` | Alamat instansi / domisili penjemputan |
| `city` | `varchar` | Kota domisili penyewa (Tangerang, Jakarta, Depok, dll.) |
| `lead_source` | `varchar` | Sumber prospek (WhatsApp Hotline, Instagram, Rekomendasi, Walk-in) |
| `customer_tier` | `enum` | Level pelanggan: `NEW_LEAD`, `REGULAR_CUSTOMER`, `VIP_CORPORATE` |
| `last_trip_date` | `date` | Tanggal terakhir kali menyewa armada SS Traveling (otomatis terupdate) |
| `total_trips_count` | `integer` | Akumulasi total frekuensi sewa (otomatis bertambah saat SPJ selesai) |
| `special_notes` | `text` | Preferensi khusus (contoh: *Selalu minta bus Luxury 2-1, supir Pak Hendra*) |
| `is_active` | `boolean` | Status keaktifan pelanggan |

## 4. Alur Integrasi Otomatis (Zero Extra Admin Effort)
1. **Auto-Complete & Pendaftaran Lead Instan**:
   - Saat staf operasional atau sales menginput booking wisata di form jadwal bus, staf mengetikkan nomor telepon/nama instansi.
   - Jika sudah ada di database `customers`, profil lengkap otomatis muncul dan titik penjemputan tersalin.
   - Jika pelanggan baru, sistem secara otomatis mendaftarkannya sebagai record baru di `customers` dengan status `NEW_LEAD`.
2. **Akumulasi Retargeting Marketing**:
   - Tim sales SS Traveling dapat memfilter database penyewa berdasarkan musim liburan (misal: menarik data seluruh sekolah yang pernah sewa di bulan Mei tahun lalu) untuk melakukan kampanye penawaran sewa *Study Tour* secara proaktif via WhatsApp.

---

# Addendum v1.17 — Standardisasi Master Data Kelas Kursi (`seat_classes`) & Integrasi Matriks Tarif Tiket
Tanggal pembaruan: 16 Oktober 2026

Addendum ini membakukan pemisahan Master Data Kelas Kursi (`seat_classes`) sebagai entitas tersendiri yang bertindak sebagai *single source of truth* bagi konfigurasi armada bus, kuota manifes, komisi agen, dan matriks harga tiket (`fare_matrix`).

## 1. Latar Belakang & Filosofi Arsitektur
Sebelumnya, nama kelas kursi (`class_name`) hanya disimpan sebagai string atau enum lokal di level plotting armada (`vehicle_seat_classes`). Hal ini memiliki kelemahan struktural:
1. **Risiko Diskrepansi Harga Tiket**: Tanpa referential integrity ke master data, penentuan tarif tiket dinamis (`fare_matrix`) rawan gagal mencocokkan harga tiket antar-armada akibat perbedaan format penulisan.
2. **Keterikatan Komisi Agen**: Aturan komisi agen (`agent_commission_rules`) memerlukan acuan ID kelas kursi yang sama dan terikat kuat (*referential integrity*).
3. **Fleksibilitas Bisnis (Zero Hardcoding)**: Penambahan kelas armada baru di masa depan (misal: *Suites Family*, *Royal Class*) dapat dilakukan langsung oleh admin tanpa perlu mengubah kode program.

## 2. Spesifikasi Tabel Master Kelas Kursi (`seat_classes`)

| Kolom | Tipe Data | Keterangan & Validasi |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Primary Key |
| `company_id` | `uuid` (FK) | Relasi ke `companies` (Company Scope) |
| `code` | `varchar(30)` | Kode unik baku sistem (`SLEEPER`, `LUXURY_2_1`, `EXECUTIVE`, `STANDARD`) |
| `name` | `varchar(100)` | Nama tampilan resmi (`Sleeper Class`, `Luxury Seat 2-1`, `Executive Class`, `Standard Class`) |
| `default_layout` | `varchar(50)` | Format denah standar bawaan (`1-1`, `2-1`, `2-2`) |
| `description` | `text` | Deskripsi fasilitas kabin (AVOD, bantal, selimut, legrest, USB charger) |
| `is_active` | `boolean` | Status keaktifan kelas kursi (default: `true`) |

## 3. Relasi ke Armada Bus (`vehicle_seat_classes`)
Tabel konfigurasi kursi armada bus (`vehicle_seat_classes`) kini memiliki relasi langsung:
* Kolom Foreign Key: **`seat_class_id`** $\to$ merujuk ke **`seat_classes(id)`** dengan `ON DELETE RESTRICT`.
* Proteksi Hapus: Master kelas kursi yang sedang digunakan oleh satu atau lebih armada bus dilarang dihapus dari sistem.
* Di Frontend: Dropdown pilihan kelas kursi pada form armada bus ditarik secara dinamis dari endpoint `GET /api/v1/seat-classes`, bukan hardcoded.

## 4. Integrasi ke Matriks Tarif Tiket (`fare_matrix` — Tahap 3)
Pada Tahap 3 nanti, penentuan harga tiket dihitung berdasarkan formula kombinasi multi-dimensi:
$$\text{Harga Tiket} = f(\text{Rute Asal-Tujuan}, \text{Musim Tarif / Tuslah}, \mathbf{seat\_class\_id})$$
Saat tiket AKAP diterbitkan untuk bus multi-class (seperti `SS-01` yang memiliki kabin Sleeper dan Luxury):
* Sistem mencocokkan `seat_class_id` kursi yang dipilih penumpang dengan `fare_matrix` aktif.
* Harga tiket otomatis terisi akurat tanpa risiko salah input oleh agen loket atau dispatcher.

---

# Addendum v1.18 — Galeri Foto Multi-Image Armada Bus (`vehicle_images`) untuk Kesiapan Landing Page Publik SS Traveling
Tanggal pembaruan: 16 Oktober 2026

Addendum ini membakukan tata kelola galeri foto armada bus berbasis relasi *One-to-Many* (`vehicle_images`) yang terintegrasi langsung antara data ERP operasional dengan etalase website publik/landing page SS Traveling.

## 1. Latar Belakang & Kebutuhan Komersial
- Calon penyewa bus pariwisata maupun penumpang AKAP online membutuhkan gambaran visual yang nyata mengenai armada yang akan dinaiki (tampilan eksterior karoseri Jetbus/Avante, interior kabin sleeper, kursi legrest, bagasi motor, dan toilet).
- Mengintegrasikan data foto bus langsung di ERP menjamin bahwa apa yang dipromosikan tim marketing di website publik selalu sinkron dengan kondisi armada riil di garasi pool.

## 2. Spesifikasi Tabel Galeri Foto Armada (`vehicle_images`)

| Kolom | Tipe Data | Keterangan & Validasi |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Primary Key unik foto |
| `vehicle_id` | `uuid` (FK) | Relasi wajib ke `vehicles(id)` dengan `ON DELETE CASCADE` |
| `image_url` | `text` | Tautan URL gambar beresolusi tinggi (HTTPS / CDN / Cloud Storage) |
| `caption` | `varchar(150)` | Keterangan foto (misal: *Tampak Depan Jetbus 5*, *Kabin Sleeper Pribadi*, *Interior Luxury 2-1*) |
| `is_primary` | `boolean` | Penanda foto sampul utama (*Cover Image*) untuk thumbnail kartu & landing page |
| `sequence` | `integer` | Urutan perputaran galeri / carousel foto (dimulai dari `0`) |
| `is_active` | `boolean` | Status keaktifan foto |

## 3. Aturan Bisnis & Integrasi Frontend
1. **Foto Sampul Utama (*Primary Cover*)**:
   - Setiap bus memiliki tepat 1 foto berstatus `is_primary = true`. Jika foto baru diset sebagai primary, sistem otomatis mereset status primary foto lama pada armada tersebut.
   - Foto primary ditampilkan sebagai cover utama kartu armada di dashboard internal dan banner utama katalog landing page publik.
2. **Modal Detail Bus Interaktif (`VehicleDetailModal`)**:
   - Di dashboard admin/operasional, mengklik kartu armada bus akan membuka modal detail yang menyajikan:
     - Banner foto beresolusi tinggi dengan thumbnail selector.
     - Rincian spesifikasi fisik (Chasis, Karoseri, Tipe Bus, Tahun Rakit, Kepemilikan Lunas/Leasing).
     - Rincian zona kelas kursi (*Multi-Class*) beserta fasilitas kabin yang bersumber dari master `seat_classes`.
     - Badge penanda *Website Catalog Ready*.

---

# Addendum v1.19 — Standardisasi Formula Kompensasi Kru Fleksibel: Satuan Hari/Leg (1 Hari = 1 Leg), Variabel Armada Bus, & Override Kesepakatan Dispatcher di SPJ
Tanggal pembaruan: 21 Oktober 2026

Addendum ini membakukan tata kelola penetapan hak kompensasi kru perjalanan (Uang Makan & Premi Ritase/Harian) untuk menjamin keadilan lapangan, fleksibilitas operasional pariwisata, dan integritas pencatatan keuangan:

## 1. Prinsip Kesetaraan Satuan Dasar: 1 Hari Operasi = 1 Leg Rute
- **Layanan AKAP Reguler (Trayek PP):**
  - Perjalanan pulang-pergi (PP) Jakarta/Tangerang $\leftrightarrow$ Yogyakarta memakan waktu 2 hari dinas, dihitung setara dengan **2 Leg** (Leg 1 Keberangkatan & Leg 2 Kepulangan).
  - Jika supir hanya menjalankan perjalanan satu arah (misal langsir/engkel/storing armada), dihitung setara dengan **1 Leg ($1 \text{ Hari}$)**.
- **Layanan Pariwisata / Charter Wisata:**
  - Dihitung murni berdasarkan **durasi hari kalender pemakaian bus** ($N \text{ Hari}$).
- **Formula Kesetaraan Rekomendasi Sistem:**
  $$\text{Rekomendasi Hak Kru} = \text{Durasi Satuan (Leg / Hari)} \times \text{Tarif Dasar Bus Tersebut}$$

## 2. Variabel Armada Bus (Unit-Aware Base Rates)
- Tanggung jawab dan kompleksitas pengemudi bus mewah (seperti armada `SS-01`, `SS-08`, `SS-09` berkabin Sleeper / Luxury Seat 2-1) berbeda secara signifikan dengan bus kelas standar.
- Sistem menggunakan tarif dasar rekomendasi (*Base Rate*) yang dapat bervariasi sesuai kelas unit armada bus yang ditugaskan, dengan pembedaan peran antara:
  1. **Pengemudi Utama & Cadangan (Driver 1 & Driver 2)**.
  2. **Pembantu Pengemudi (Kondektur / Pramugari)**.

## 3. Dinamika Pariwisata & Hak Override Penuh Dispatcher di SPJ (*In-SPJ Customizer*)
- Realita penugasan wisata charter memiliki banyak variabel dinamis di lapangan: jarak tempuh (misal tur keliling Bali vs city tour lokal), pengalaman supir, tipe armada, harga sewa kontrak, hingga karakter tamu kementerian/korporat.
- **Prinsip Solusi:** Sistem menghitungkan nilai rekomendasi dasar sebagai patokan awal, namun **Dispatcher diberikan hak penuh untuk menyesuaikan / mengubah (override) nominal Uang Makan dan Premi Kru secara langsung** pada modal **Review & Terbitkan SPJ**.
- Nominal yang disepakati dan dikonfirmasi dispatcher langsung terkunci permanen (*snapshot*) ke dalam dokumen SPJ resmi, menjadi dasar sah bagi kasir pool tanpa sengketa tawar-menawar di kemudian hari.

## 4. Opsi Waktu Pembayaran Premi Kru (Payment Timing)
Sistem mendukung 2 opsi pencairan premi kru yang dicatat pada penugasan SPJ:
1. **`AT_SETTLEMENT` (Bayar Nanti di Meja Kasir Pool — Standar):**
   - Premi dibayarkan penuh oleh kasir pool saat armada bus tiba kembali dan SPJ berstatus `COMPLETED`.
2. **`EARLY_DISBURSEMENT` (Bayar di Awal / Ditransfer Saat Berangkat):**
   - Diperuntukkan bagi supir dinas wisata jarak jauh yang membutuhkan uang saku di awal keberangkatan.
   - Dicairkan via kas pool atau transfer bank saat SPJ berstatus `ISSUED`/`IN_PROGRESS`, dan ditandai agar kasir pool tidak melakukan pembayaran dobel (*anti-double payout*) saat rekonsiliasi akhir.


