# 🏗️ Arsitektur & Fitur Inti: SS Traveling ERP

Dokumen ini merangkum detail teknis, model data, dan alur kerja dari fitur-fitur yang telah diimplementasikan dalam Fase 1.

## 1. Sistem Otentikasi & Keamanan (Hybrid Strategy & Triple-Lock Auth)

Sistem ini dirancang untuk memberikan keamanan maksimal (kebal XSS & anti pembajakan sesi) namun tetap transparan bagi pengguna serta fleksibel untuk Web dan Mobile (Android/iOS).

### A. Alur Token (Access & Refresh)
*   **Access Token (JWT)**:
    *   **Masa Aktif**: 1 Jam.
    *   **Payload**: `id`, `name`, `roles`, `permissions`, `sid` (Session ID), dan `fingerprint`.
    *   **Sifat**: Stateless (Tanpa cek database di setiap request) untuk performa tinggi.
    *   **Penyimpanan**:
        *   **Web**: Disimpan di **`HttpOnly` Cookie** (JavaScript browser tidak dapat membaca token, kebal terhadap serangan XSS).
        *   **Mobile (Android/iOS)**: Disimpan di Secure Storage / KeyStore OS dan dikirimkan via Header `Authorization: Bearer <token>`.
*   **Refresh Token**:
    *   **Masa Aktif**: 7 Hari.
    *   **Payload**: `sid` dan `fingerprint`.
    *   **Sifat**: Stateful (Divalidasi ke database saat proses refresh).
    *   **Penyimpanan**: Disimpan di client storage untuk keperluan rotasi sesi.
*   **Rotasi Token**: Setiap kali refresh token digunakan, sistem akan menghasilkan pasangan token baru (Access & Refresh) dan membuang yang lama.

### B. Mekanisme Keamanan Utama
1.  **Single Device Login (SDL)**:
    *   Menggunakan kolom `session_token` di tabel `users`.
    *   Setiap login baru akan menghasilkan UUID baru yang disimpan di DB dan JWT.
    *   Jika user login di perangkat lain, `session_token` di DB berubah, sehingga sesi di perangkat lama otomatis ditolak saat mencoba refresh.
2.  **Stateless Fingerprinting**:
    *   Menggabungkan `deviceId` (dari header `x-device-id`) dan `User-Agent` menjadi sebuah Hash unik:
        $$\text{fingerprint} = \text{SHA256}(\text{deviceId} + \text{User-Agent})$$
    *   Hash ini disimpan di payload JWT.
    *   `JwtAuthGuard` akan memverifikasi hash ini di setiap request. Jika token dicuri dan dipakai di browser/perangkat berbeda, akses akan ditolak **tanpa perlu kueri database** dengan kode `INVALID_DEVICE_CONTEXT`.
3.  **Machine-Readable Error Codes**:
    *   Seluruh error 401 distandarisasi menggunakan property `errorCode` yang terprediksi:
        *   `TOKEN_EXPIRED`: Khusus token kadaluarsa (satu-satunya trigger untuk memicu refresh di Frontend).
        *   `MISSING_DEVICE_ID`: Header `x-device-id` tidak ditemukan.
        *   `UNAUTHORIZED`: Token tidak ditemukan.
        *   `INVALID_DEVICE_CONTEXT`: Anomali perangkat/fingerprint (force logout).
        *   `INVALID_TOKEN`: Token korup.
        *   `INVALID_SESSION`: Sesi DB dibatalkan (misal login di tempat lain).
4.  **Logout & Session Revocation**:
    *   Endpoint `POST /api/auth/logout` mereset `sessionToken` dan `refreshToken` di DB ke `null`, serta menghapus HttpOnly cookie `token` di browser.

> **Panduan Integrasi FE Lengkap**: Lihat [`AUTH_SPECIFICATION_AND_FE_GUIDE.md`](../plan/AUTH_SPECIFICATION_AND_FE_GUIDE.md) untuk blueprint DTO, Response, dan kode siap pakai Axios interceptor.

## 2. Model Data Utama (Backend)

### A. Users (`UsersEntity`)
*   **Fungsi**: Menyimpan identitas pengguna dan data sesi aktif.
*   **Kolom Penting**:
    *   `email` & `nip`: Identifier unik untuk login.
    *   `password`: Hash password (Bcrypt).
    *   `session_token`: UUID sesi aktif saat ini (untuk SDL).
    *   `refresh_token`: Hash refresh token aktif (untuk rotasi).
    *   `last_origin`: Hash fingerprint perangkat terakhir.
    *   `type`: Enum (`admin`, `employee`, `user`).

### B. Roles & Permissions (RBAC)
*   **Roles (`RolesEntity`)**: Menggunakan pola *Nested Set* (`nsleft`, `nsright`) untuk mendukung hirarki jabatan yang dalam dan performan.
*   **Menus (`MenusEntity`)**:
    *   Hirarki *Adjacency List* (Parent-Child).
    *   `availableActions`: Kolom JSONB yang mendefinisikan aksi kustom (misal: `approve`, `export`) selain CRUD standar.
*   **Role-Menus (`RoleMenusEntity`)**:
    *   Tabel pivot yang menghubungkan Role dengan Menu.
    *   `actions`: Kolom JSONB yang menyimpan status aktif/tidaknya suatu aksi kustom untuk role tersebut.

## 3. Komunikasi & Infrastruktur

### A. API Gateway / Monolith Core
*   **Teknologi**: NestJS + TypeORM + PostgreSQL.
*   **CORS**: Mengaktifkan `credentials: true` dengan dynamic origin reflection untuk mendukung pengiriman cookie yang aman.
*   **Cookie Parser**: Middleware `cookie-parser` terpasang di `src/main.ts`.

### B. Distributed Authorization
*   **Konsep**: "Pusat Otoritas, Eksekusi Lokal".
*   **Cara Kerja**: Auth Service menyuntikkan semua string permission user (format `aclName:action`) ke dalam payload JWT.
*   **Manfaat**: Service lain bisa memvalidasi izin user secara lokal menggunakan `PermissionsGuard` tanpa perlu melakukan panggilan jaringan ke Auth Service.

## 4. Fitur Frontend Terpilih

*   **Smart Refresh Queue Interceptor**: Interceptor Axios yang cerdas. Hanya memicu refresh jika `errorCode === 'TOKEN_EXPIRED'`, mengantri request lain yang datang bersamaan, dan langsung logout bersih jika terdeteksi anomali.
*   **Background Sync**: `SyncProvider` yang secara periodik (5 menit) memperbarui data user dan menu dari endpoint `/me` tanpa perlu refresh halaman.
*   **Icon Picker**: UI khusus untuk memilih dari 1.400+ ikon Lucide dengan pencarian cepat.

## 5. Tata Kelola Aset Tetap, Utang Pembiayaan, & Saldo Awal Migrasi

### A. Saldo Awal Migrasi (10 Bus Existing)
*   **Pemisahan Status**: 7 Bus Lunas (murni aset tetap di `15101` dan ekuitas di `31101`/`32101`) vs 3 Bus Angsuran (aset fisik `15101` diimbangi sisa pokok pinjaman di `26101 Utang Bank / Leasing Armada Bus`).
*   **Kemandirian Data**: Migrasi tidak menarik data historis bertahun-tahun, melainkan menetapkan saldo awal per tanggal *cut-off*.

### B. Pemisahan Angsuran Bank/Leasing
*   Setiap pembayaran cicilan bulanan wajib memisahkan **Pokok Pinjaman** (mengurangi utang `26101` di Neraca) dan **Bunga Pinjaman** (diakui sebagai beban pemotong laba di akun `59101 Beban Bunga Pinjaman Bank / Leasing Armada`).

# Core Features Architecture & Implementation Notes

Dokumen ini mencatat keputusan arsitektural penting, alur kerja fitur-fitur inti, dan catatan implementasi teknis untuk sistem SS Traveling (Backend & Frontend).

---

## 1. Keamanan & Autentikasi

### A. Triple-Lock Auth System
Sistem autentikasi menggunakan tiga lapis pengamanan:
1.  **Dual Token (Access & Refresh Token)**:
    *   **Access Token**: Berumur pendek (1 jam), bersifat *stateless* untuk efisiensi performa API.
    *   **Refresh Token**: Berumur panjang (7 hari), disimpan di database (`UsersEntity.refreshToken`) untuk menjaga kontinuitas sesi.
2.  **Single Device Login (SDL)**:
    *   Setiap kali login baru berhasil, dibuat sebuah `sessionToken` acak dan disimpan di database.
    *   `sessionToken` ini disertakan dalam payload token. Jika user login di perangkat/browser lain, `sessionToken` lama akan digantikan sehingga sesi di perangkat sebelumnya otomatis menjadi tidak valid (ditendang).
3.  **Stateless Fingerprint Validation (Anti-Hijacking)**:
    *   Di frontend, sebuah `deviceId` persisten dibuat dan disimpan di `localStorage` (tanpa enkripsi untuk memastikan konsistensi).
    *   Frontend mengirimkan header `x-device-id` di setiap request.
    *   Backend membuat hash fingerprint (`deviceId` + `User-Agent`) dan menyimpannya di payload token.
    *   `JwtAuthGuard` memverifikasi hash tersebut tanpa perlu query ke database. Jika request datang dari perangkat lain atau user-agent yang berbeda, request akan ditolak dengan error `INVALID_DEVICE_CONTEXT`.

### B. Dual-Strategy Token Extraction (HttpOnly Cookie + Bearer Header)
*   **Web Browser**: Token diekstrak dari cookie `HttpOnly` (`token` dan `refreshToken`) untuk perlindungan maksimal terhadap serangan XSS.
*   **Mobile App & API Client**: Token diekstrak dari header HTTP `Authorization: Bearer <token>`.
*   Guard `JwtAuthGuard` secara otomatis mendeteksi sumber token yang tersedia (memprioritaskan Header, lalu fallback ke Cookie).

### C. Standardisasi Error Code Autentikasi (401 Unauthorized)
Response error autentikasi menggunakan struktur terstandar:
```json
{
  "statusCode": 401,
  "errorCode": "TOKEN_EXPIRED",
  "message": "Token expired, please refresh token."
}
```
*   `TOKEN_EXPIRED`: Satu-satunya error yang menjadi pemicu frontend melakukan *silent refresh token*.
*   `MISSING_DEVICE_ID`: Header `x-device-id` tidak ditemukan.
*   `INVALID_DEVICE_CONTEXT`: Indikasi pembajakan token dari perangkat lain (anomali keamanan, langsung logout).
*   `INVALID_TOKEN`, `INVALID_SESSION`, `REFRESH_TOKEN_EXPIRED`: Error fatal yang mengharuskan user login ulang.

---

## 2. Struktur Data & Relasi Modul

### A. RBAC & Dynamic Menus
*   **Users (`UsersEntity`)**: Memiliki relasi *Many-to-Many* dengan `RolesEntity` melalui tabel pivot `user_roles`.
*   **Roles (`RolesEntity`)**: Menggunakan pola *Nested Set* (`nsleft`, `nsright`) untuk mendukung hirarki jabatan yang dalam dan performan.
*   **Menus (`MenusEntity`)**:
    *   Hirarki *Adjacency List* (Parent-Child).
    *   `availableActions`: Kolom JSONB yang mendefinisikan aksi kustom (misal: `approve`, `export`) selain CRUD standar.
*   **Role-Menus (`RoleMenusEntity`)**:
    *   Tabel pivot yang menghubungkan Role dengan Menu.
    *   `actions`: Kolom JSONB yang menyimpan status aktif/tidaknya suatu aksi kustom untuk role tersebut.

## 3. Komunikasi & Infrastruktur

### A. API Gateway / Monolith Core
*   **Teknologi**: NestJS + TypeORM + PostgreSQL.
*   **CORS**: Mengaktifkan `credentials: true` dengan dynamic origin reflection untuk mendukung pengiriman cookie yang aman.
*   **Cookie Parser**: Middleware `cookie-parser` terpasang di `src/main.ts`.

### B. Distributed Authorization
*   **Konsep**: "Pusat Otoritas, Eksekusi Lokal".
*   **Cara Kerja**: Auth Service menyuntikkan semua string permission user (format `aclName:action`) ke dalam payload JWT.
*   **Manfaat**: Service lain bisa memvalidasi izin user secara lokal menggunakan `PermissionsGuard` tanpa perlu melakukan panggilan jaringan ke Auth Service.

## 4. Fitur Frontend Terpilih

*   **Smart Refresh Queue Interceptor**: Interceptor Axios yang cerdas. Hanya memicu refresh jika `errorCode === 'TOKEN_EXPIRED'`, mengantri request lain yang datang bersamaan, dan langsung logout bersih jika terdeteksi anomali.
*   **Background Sync**: `SyncProvider` yang secara periodik (5 menit) memperbarui data user dan menu dari endpoint `/me` tanpa perlu refresh halaman.
*   **Icon Picker**: UI khusus untuk memilih dari 1.400+ ikon Lucide dengan pencarian cepat.

## 5. Tata Kelola Aset Tetap, Utang Pembiayaan, & Saldo Awal Migrasi

### A. Saldo Awal Migrasi (10 Bus Existing)
*   **Pemisahan Status**: 7 Bus Lunas (murni aset tetap di `15101` dan ekuitas di `31101`/`32101`) vs 3 Bus Angsuran (aset fisik `15101` diimbangi sisa pokok pinjaman di `26101 Utang Bank / Leasing Armada Bus`).
*   **Kemandirian Data**: Migrasi tidak menarik data historis bertahun-tahun, melainkan menetapkan saldo awal per tanggal *cut-off*.

### B. Pemisahan Angsuran Bank/Leasing
*   Setiap pembayaran cicilan bulanan wajib memisahkan **Pokok Pinjaman** (mengurangi utang `26101` di Neraca) dan **Bunga Pinjaman** (diakui sebagai beban pemotong laba di akun `59101 Beban Bunga Pinjaman Bank / Leasing Armada`).

### C. Mekanisme & Entry Point Penyusutan
*   **Otomatis Bulanan**: Tombol aksi *Run Depreciation* di menu Aset Tetap atau saat *Period Close*, mendebit beban depresiasi `56101` dan mengkredit akumulasi depresiasi `16101` berbasis metode garis lurus.
*   **Action Endpoints Penyesuaian**: Form update masa manfaat pasca-overhaul (perpanjangan umur aset), impairment (penurunan nilai pasca-insiden berat), dan disposal (pelepasan/penjualan bus dengan laba/rugi di `81102`/`82101`).

## 6. Tata Kelola Snack Penumpang & Fasilitas Onboard Bus (Non-SPJ)

### A. Metode Pembebanan Langsung (*Direct Expense Method*)
*   **Non-SPJ & Tanpa BOM Manufaktur**: Pengadaan makanan ringan (kacang telur bal-balan, dus air mineral, roti) dan ameniti berjalan di atas bus (kopi/teh sachet, gula, baterai mic, parfum semprot kabin, paket kuota internet modem Wi-Fi) diakui langsung sebagai beban operasional saat transaksi belanja terjadi, tanpa membebani lembar SPJ perjalanan kru.
*   **Pintu Masuk Transaksi**: Dikeluarkan dari Kas Kecil Pool (`cash_transactions`) atau Bank Transfer kantor pusat, diverifikasi oleh Accountant saat rekap kas kecil pool (*Petty Cash Replenishment*).
*   **Akun COA**: Didebitkan ke `52104 Beban Snack, Amenity, & Fasilitas Onboard Bus` (kelompok beban fasilitas perjalanan) berpasangan dengan Kas Kecil `11103` atau Bank `11104`.
*   **Dimensi Biaya**: Belanja kolektif garasi dialokasikan ke Cost Center `Operasional Pool`; belanja khusus satu armada (misal: kuota Wi-Fi modem bus `SS-01`) ditempelkan dimensi opsional `vehicle_id`.

## 7. Tata Kelola HR & Kompensasi Non-SPJ (Standby Driver, Langsir Teknis, Gaji, Lembur, & Dinas Staf)

### A. Uang Makan Standby Driver/Kru di Pool Garasi
*   **Non-SPJ**: Driver cadangan/kru yang bertugas piket standby di pool (tidak sedang membawa bus penumpang komersial) mendapatkan uang makan harian.
*   **Pintu Input & Akun**: Dikeluarkan dari Kas Kecil Pool (`cash_transactions`), didebitkan ke akun `53105 Beban Uang Makan Standby Kru (Non-SPJ Garasi)` dan dilarang masuk ke lembar SPJ mana pun agar tidak mendistorsi margin kontribusi perjalanan bus.

### B. Insentif Langsir & Dinas Teknis Kru
*   **Dinas Tanpa Penumpang (*Deadhead*)**: Penugasan driver membawa bus kosong ke karoseri (perbaikan bodi/chasis baru), bengkel rekanan eksternal, atau uji berkala KIR ke Dishub.
*   **Akun & Dimensi Wajib**: Didebitkan ke akun `53106 Beban Insentif Langsir & Dinas Teknis Kru (Non-SPJ Bengkel/Karoseri)` dan **WAJIB** menyertakan dimensi armada `vehicle_id` terkait agar seluruh biaya perawatan armada terakumulasi utuh di kartu riwayat bus.

### C. Pemisahan Struktur Penggajian (Payroll)
*   **Gaji Kantor/Manajemen**: Staf administrasi, kasir, ops, finance AR/AP, korlap, dan direksi didebitkan ke akun `57105 Beban Gaji Karyawan Kantor & Manajemen`.
*   **Gaji Mekanik Bengkel Pool**: Kepala mekanik, montir mesin, tukang las, dan teknisi AC didebitkan ke akun `57106 Beban Gaji Mekanik & Teknisi Bengkel Pool` untuk transparansi analisis *in-house maintenance cost*.

### D. Upah Lembur & Dinas Luar Staf
*   **Overtime Lembur**: Teknisi perbaikan malam atau staf peak season dicatat di `57107 Beban Upah Lembur Karyawan & Mekanik (Overtime)`.
*   **Konsumsi Staf Garasi/Kantor**: Makan siang staf dan konsumsi piket di akun `57108 Beban Uang Makan & Konsumsi Staf Kantor/Garasi`.
*   **Transport Dinas Kantor**: Uang saku/bensin dinas staf kantor ke Dishub/Samsat/Bank di akun `57109 Beban Perjalanan Dinas & Transport Staf Kantor`.

## 8. Master Aturan Bisnis & Tarif Lapangan (Tahap 3 — Fares, Agents, Crew Rates, Partners)

### A. Kalender Musim Tarif & Matriks Tiket Dinamis (`fare_seasons`, `fare_matrix`)
*   **Dynamic Pricing Core Engine**: Formula harga tiket: `Harga = f(Rute, Musim/Tuslah, Kelas Kursi)`.
*   **Fallback Graceful**: Prioritas pertama adalah musim musiman aktif pada tanggal perjalanan (misal: `LEBARAN_2026`). Jika tanggal berada di luar musim khusus atau rute belum dikonfigurasi di musim tersebut, sistem otomatis melakukan fallback ke tarif musim `REGULER`.
*   **Price Snapshotting**: Saat transaksi manifest/tiket diterbitkan di SPJ, tarif disalin permanen ke transaksi agar catatan akuntansi masa lalu tidak berubah meskipun matriks master diupdate.

### B. Mitra Agen & Smart Route Filter (`agents`, `agent_commission_rules`)
*   **Smart Route Filtering (Anti-Human Error, Addendum v1.7)**: Mencegah kru salah memilih agen kota tujuan di leg keberangkatan:
    *   Leg Berangkat (Jakarta/Tangerang $\to$ Yogya): Hanya agen domisili `JAKARTA`, `TANGERANG`, `ALL` (OTA).
    *   Leg Pulang (Yogya $\to$ Jakarta/Tangerang): Hanya agen domisili `YOGYAKARTA`, `ALL` (OTA).
*   **Kalkulasi Komisi Fleksibel**: Mendukung skema Flat per tiket (untuk agen fisik terminal: Sleeper 30k, Luxury 20k, Exec 20k, Std 15k) dan Persentase (10% untuk OTA seperti RedBus/Traveloka) serta perhitungan otomatis net setoran kas ke perusahaan.

### C. Standar Kompensasi & Rate Snapshotting Kru (`crew_rate_rules`)
*   **Dua Skema Operasional**:
    *   `AKAP` (`PER_TRIP`): Uang Makan Standar + Premi Ritase PP + Bonus Full Seat (100% okupansi) per rit PP.
    *   `TOURISM` (`PER_DAY`): Uang Makan Harian + Premi Harian dikalikan durasi hari sewa bus, tanpa bonus full seat.
*   **Rate Snapshotting SPJ**: Hak uang makan dan premi disalin permanen saat SPJ diterbitkan, menjamin kepastian hak kru dan kebal terhadap revisi master tarif di masa depan.

### D. Restoran Mitra & Koordinator Lapangan (`restaurants`, `coordinator_fee_rules`)
*   **Restoran Servis Makan AKAP**: Standar tarif kupon makan Rp 25.000/pax. Terpisah antara `INVOICED_MONTHLY_AP` (tagihan bulanan AP vendor tanpa melibatkan UJ kru) dan `PAID_BY_CREW_UJ` (tunai kru UJ).
*   **Zonasi Fee Korlap**: Otomatisasi zonasi tarif fee Rp 10.000/pax berdasarkan arah leg: Leg Berangkat $\to$ Zona `WEST` (Jabodetabek) dan Leg Pulang $\to$ Zona `EAST` (Jateng & DIY).

## 9. Accounting Core Engine & Jurnal Umum (Tahap 4 — Journals, Lines, Idempotency, Posting Atomik, & Reversal)

### A. Model Jurnal & Accounting Events (`journal_entries`, `journal_lines`, `accounting_events`)
*   **Journal Entries (`journal_entries`)**:
    *   `journal_no`: Kode unik atomik format `JV/YYMM/XXXX` dihasilkan secara concurrency-safe via `DocumentSequenceService`.
    *   `journal_date`: Tanggal transaksi akuntansi divalidasi ke kalender periode fiskal (`FiscalPeriodsService.findOpenPeriodForDate`).
    *   `source_type`: Enum jenis transaksi (`MANUAL`, `SPJ`, `AR_INVOICE`, `AP_INVOICE`, `CASH_TRANSACTION`, `BANK_TRANSACTION`, `SETTLEMENT`, `PERIOD_CLOSING`, `DEPRECIATION`).
    *   `status`: Enum status akuntansi (`POSTED`, `REVERSED`).
    *   `reversal_of_id`: Foreign Key self-referencing menautkan jurnal pembalik dengan jurnal asalnya.
    *   `total_debit` & `total_credit`: Nominal `numeric(20,2)` tersimpan seimbang secara abadi.
*   **Journal Lines (`journal_lines`)**:
    *   Rincian baris berurutan (`line_no`) yang memisahkan debit dan kredit per akun detail (`isPostable = true`).
    *   Dimensi analitik terintegrasi: `business_unit_id`, `cost_center_id`, `profit_center_id`, `trip_id`, `trip_leg_id`, `vehicle_id`, `counterparty_type`, dan `counterparty_id`.
*   **Accounting Events (`accounting_events`)**:
    *   Kunci idempotensi (`idempotency_key`) unik untuk mencegah resiko *double posting* dari panggilan API atau re-trigger jaringan.

### B. Single Entry Point Posting (`AccountingPostingService`)
*   **Atomic Database Transaction**: Seluruh proses posting (pengecekan periode, validasi akun postable, generator nomor urut, pembuatan header/lines, dan event logging) dieksekusi dalam satu transaksi atomik `DataSource.transaction()` atau menerima `EntityManager` eksternal dari modul operasional.
*   **Validasi Invariant Akuntansi**:
    *   Wajib minimal 2 baris transaksi.
    *   Nominal non-negatif dan dilarang terisi debit dan kredit sekaligus dalam 1 baris.
    *   Akun COA wajib aktif dan berstatus detail/postable (menolak posting ke akun induk/header).
    *   Keseimbangan debet = kredit dijamin 100% menggunakan `MoneyHelper.isBalanced()`.

### C. Mekanisme Jurnal Pembalik Abadi (`JournalReversalService`)
*   **Prinsip Audit Trail (Anti-Edit / Anti-Hapus)**: Jurnal yang sudah berstatus `POSTED` tidak dapat diedit atau dihapus.
*   **Reversal Otomatis**: Memvalidasi jurnal asal, menukar seluruh posisi (Debit $\to$ Kredit dan Kredit $\to$ Debit), menautkan `reversal_of_id`, menandai status jurnal asal menjadi `REVERSED`, menerbitkan nomor jurnal pembalik baru, dan mencatat event `REVERSED`.

### D. Frontend Antarmuka Jurnal (`/journals`)
*   **Tabel Jurnal & Filter Multidimensi**: Tabel jurnal umum dengan filter rentang tanggal, status (`POSTED`/`REVERSED`), tipe sumber dokumen, dan pencarian instan.
*   **Modal Entri Jurnal Memorial (`CreateJournalModal`)**: Form input baris transaksi dinamis dilengkapi dengan widget **Realtime Balance Checker** (Total Debit, Total Kredit, Selisih, dan Status Badge Siap Posting vs Belum Seimbang).
*   **Modal Detail Jurnal (`JournalDetailModal`)**: Rincian baris debet-kredit, kode & nama akun, dimensi armada/cost center, serta banner riwayat reversal.
*   **Modal Pembalikan Jurnal (`ReverseJournalModal`)**: Dialog konfirmasi alasan pembatalan dan tanggal jurnal pembalik.

## 10. Perencanaan Jadwal Bus & Eksekusi SPJ (Tahap 5 — Schedules, SPJ, Legs, Crew Assignments, Conflict/Buffer Engine, Emergency Breakdown)

### A. Perencanaan Jadwal Dinas Bus (`trip_schedules`) & Conflict Engine
*   **Pemisahan Perencanaan vs Eksekusi (Addendum v1.16)**: Dokumen SPJ diterbitkan via aksi 1-klik dari dokumen jadwal dinas yang telah dikonfirmasi (`TripScheduleEntity`).
*   **Overlap Conflict Check**: Formula overlap `(startA <= endB) AND (endA >= startB)` mendeteksi dan menolak jadwal bertabrakan pada rentang waktu yang sama baik untuk bus yang sama maupun kru yang sama.
*   **Alert Buffer Waktu Istirahat (Minimal 3 Jam)**: Menghitung selisih waktu antara kepulangan jadwal sebelumnya dengan keberangkatan jadwal baru (< 180 menit) dan menampilkan peringatan transparan di form untuk mencegah kelelahan pengemudi.
*   **Integrasi CRM Leads Wisata**: Otomatis memperbarui metrik frekuensi sewa (`totalTripsCount`) dan tanggal sewa terakhir (`lastTripDate`) pada master pelanggan saat jadwal sewa dikonfirmasi.

### B. Surat Perintah Jalan (`spjs`) & Status Ganda Independen
*   **Status Ganda Independen (Blueprint Bab 8.2 & Addendum v1.5)**:
    *   `operational_status`: `DRAFT` ➔ `ISSUED` ➔ `IN_PROGRESS` ➔ `COMPLETED` (atau `CANCELLED`).
    *   `financial_status`: `PENDING_SETTLEMENT` ➔ `UNDER_REVIEW` ➔ `SETTLED` (atau `DISCREPANCY`).
    *   Bus yang telah kembali di garasi (`COMPLETED`) otomatis beralih ke `UNDER_REVIEW` untuk diperiksa kasirnya di Tahap 7, dan dilarang langsung dianggap lunas (`SETTLED`).
*   **Validasi Penerbitan SPJ (`issue`)**: Wajib memiliki minimal 1 personel berstatus `DRIVER`.
*   **Rate Snapshotting Hak Kru**: Hak kompensasi kru disalin permanen dari `crew_rate_rules` ke `spj_crew_assignments` saat penugasan, kebal terhadap perubahan master tarif di masa depan.
*   **Revisi Kru Berjalan / Sakit di Jalan (`replaceCrew`, Skenario 1 Poin 7)**: Kru lama diubah statusnya menjadi `REPLACED` dengan alasan wajib, dan kru baru ditugaskan dengan snapshot tarif yang berlaku.
*   **Emergency Breakdown Armada di Tol (`emergencyReplaceBus`, Skenario 3)**:
    *   Menutup operasional bus yang mogok (`operational_status = COMPLETED` dengan catatan breakdown di lokasi X).
    *   Menerbitkan SPJ Pengganti yang ditautkan ke `parent_spj_id`.
    *   Memindahkan manifes 24 penumpang dan kru ke bus pengganti dengan jaminan omzet tiket tidak diakui ganda di akuntansi (*Anti-Double Revenue*).

### C. Frontend Antarmuka Jadwal & SPJ (`/schedules` & `/spjs`)
*   **Gantt Chart Kalender Timeline (`/schedules`)**: Visualisasi timeline per baris untuk 10 armada bus `SS-01` s.d. `SS-10`, balok warna status layanan (AKAP, Wisata, Shuttle), dan tombol cepat terbitkan SPJ.
*   **Modal Form Booking Jadwal (`ScheduleModal`)**: Form lega dengan live conflict checker dan feedback peringatan buffer time 3 jam.
*   **Monitoring Operasional SPJ (`/spjs`)**: Kartu metrik ringkasan, tabel pemantauan armada aktif di jalan, modal detail rute leg & kupon makan RM mitra (`SpjDetailModal`), modal pergantian kru (`ReplaceCrewModal`), dan modal penanganan breakdown di tol (`EmergencyReplaceBusModal`).

## 11. Uang Jalan (UJ), Biaya Operasional SPJ & Deklarasi Kas Kru (Tahap 6 — Amplop UJ, Multi-Line Disbursements, Expenses Odometer/BBM, Anti-Netting Kas Kru, Dynamic Cargo Commission, & Early Payout)

### A. Model Data Finansial SPJ (`spj_uj`, `spj_expenses`, `spj_revenue_declarations`, `crew_meal_payments`)
*   **Amplop Uang Jalan (`spj_uj`, `spj_uj_disbursements`, `spj_uj_expenses`, `spj_uj_returns`, `spj_uj_additional_requests`)**:
    *   `spj_uj`: Rekening penampung modal UJ per supir pemegang kas (`crew_id`), status (`DRAFT`, `DISBURSED`, `BALANCED`, `DISCREPANCY`), akumulasi saldo via `MoneyHelper` (`total_disbursed - total_spent - total_returned = balance`).
    *   `spj_uj_disbursements`: Pencairan bertahap multi-line (`INITIAL` di pool garasi, `ADDITIONAL` via bank di jalan, `ROLLOVER_IN`), referensi BKK kas keluar, metode pembayaran (`CASH`, `BANK_TRANSFER`, `ROLLOVER`), dan akun sumber.
    *   `spj_uj_expenses`: Relasi pemotongan otomatis saldo amplop UJ saat nota lapangan menggunakan sumber UJ.
    *   `spj_uj_returns`: Pengembalian fisik sisa kas UJ di meja kasir pool kepulangan (BKM, status otomatis `BALANCED` saat saldo habis).
    *   `spj_uj_additional_requests`: Form pengajuan tambahan dana UJ di jalan oleh kru dengan alur persetujuan dispatcher/kasir.
    *   *Estafet UJ Rollover (Skenario 3)*: Mutasi sisa saldo UJ fisik dari bus mogok ke SPJ bus pengganti via `rollover_from_spj_id` & `rollover_to_spj_id`.
*   **Beban Operasional Lapangan (`spj_expenses`)**:
    *   Kategori beban riil: `FUEL` (BBM solar, liter, odometer KM, SPBU lokasi), `TOLL`, `PARKING`, `RETRIBUTION`, `RESTAURANT_MEAL_SERVICE`, `COORDINATOR_FEE`, `CREW_LODGING`, `EMERGENCY_REPAIR`, `TOWING`.
    *   Sumber pendanaan: `UJ` (memotong saldo amplop), `OFFICE_CASH`, `OFFICE_BANK`, `CREW_POCKET` (talangan kru), `OFFICE_AP`.
    *   Verifikasi akuntansi: Status `PENDING`, `APPROVED`, `REJECTED` dengan verifier audit.
*   **Deklarasi Penerimaan Kas Kru & Anti-Netting (`spj_revenue_declarations`)**:
    *   Penerapan tegas prinsip **Anti-Netting Kas Kru** (Addendum v1.9 & Skenario 1): Penerimaan kas tiket fisik loket pool (`TICKET_CASH`), titipan agen offline (`AGENT_DEPOSIT`), kargo motor (`CARGO_MOTORCYCLE`), kargo kardus (`CARGO_BOX`), dan sewa wisata (`CHARTER_CASH`) wajib disetor bruto penuh tanpa pemotongan pribadi oleh kru di jalan.
    *   *Dynamic Crew Cargo Commission*: Perhitungan otomatis hak komisi kru kargo (preset 15%, 20%, 25% atau custom) yang langsung mendaftarkan hak rupiah kru ke tabel kompensasi kru kategori `CARGO_COMMISSION`.
*   **Kompensasi Kru & Early Payout (`crew_meal_payments`)**:
    *   Rincian hak kru: `MEAL_ALLOWANCE`, `TRIP_INCENTIVE`, `FULL_SEAT_BONUS`, `CARGO_COMMISSION`.
    *   Jadwal pencairan: `AT_SETTLEMENT` (di kasir pool saat kepulangan) vs `EARLY_DISBURSEMENT` (pencairan di muka / transfer bank uang dapur keluarga saat wisata, Skenario 2).

### B. Domain Services & Solusi Cascade
*   `SpjUjService`: Mengelola pencairan, pengembalian sisa UJ, approval tambahan UJ, dan rollover UJ.
*   `SpjExpensesService`: Validasi nota fisik & odometer solar, pemotongan saldo UJ, dan verifikasi kasir.
*   `SpjRevenueService`: Pencatatan kas bruto tiket/kargo dan perhitungan komisi dinamis kru 20%.
*   `CrewMealPaymentsService`: Snapshotting kompensasi kru dari penugasan dan transfer early payout mid-trip.
*   *TypeORM Safe Update Pattern*: Seluruh pembaruan saldo amplop menggunakan `ujRepo.update(uj.id, ...)` atomik dan relasi `@OneToMany` bebas dari `cascade: true` untuk mengeliminasi resiko nullification foreign key `spj_uj_id`.

### C. Frontend Antarmuka Keuangan SPJ (`SpjFinanceModal`)
*   Modal terpadu dengan 4 sub-tab:
    1. *Uang Jalan (UJ)*: 4 kartu metrik saldo amplop, tabel multi-line disbursement, riwayat return fisik, dialog pencairan kasir, dan tombol rollover estafet breakdown.
    2. *Biaya Operasional SPJ*: Rincian nota BBM solar (liter + odometer KM + SPBU), tol, parkir, servis makan, serta tombol verifikasi kasir.
    3. *Deklarasi Penerimaan Kas Kru*: Form tiket langsung & kargo dengan live slider persentase komisi kru (15%, 20%, 25%) dan kalkulator instan net setoran ke kantor.
    4. *Hak Kompensasi Kru*: Daftar hak kompensasi per supir/kondektur, tombol sinkronisasi penugasan, dan modal transfer nafkah keluarga kru di jalan (*Early Payout*).
*   *Live Thousand Separator*: Seluruh input nilai rupiah otomatis menerapkan format pemisah ribuan titik saat diketik (`formatNumberWithDots`), dengan pembersihan otomatis sebelum dikirim ke server (`cleanDots`).
*   Akses cepat tombol `[💰 Keuangan & UJ]` pada tabel utama `/spjs` dan footer modal detail SPJ.

## 12. Meja Kasir Pool, Settlement Kas Kru & Resolusi Selisih Kasir (Tahap 7 — Dua Kantong Kas Kru, Anti-Netting, BKM/BKK, Musyawarah Lapis 1 vs Sistemik Lapis 2, Dispensasi FM Akun 58101, Klaim Kru Akun 12901, & Unblock Tutup Buku Akun 11999)

### A. Model Data Rekonsiliasi Kasir (`crew_cash_settlements`, `crew_cash_remittances`, `crew_cash_remittance_allocations`, `crew_cash_discrepancies`)
*   **Header Dokumen Settlement (`crew_cash_settlements`)**:
    *   `settlement_no`: Nomor unik `SETTLE/YYMM/XXXX`.
    *   Status independen Dua Kantong Kas Kru: `uj_status` (`PENDING`, `BALANCED`, `DISCREPANCY`) dan `revenue_status` (`PENDING`, `MATCHED`, `DISCREPANCY_RECORDED`).
    *   Akumulasi finansial live: `total_uj_disbursed`, `total_uj_spent`, `total_uj_returned`, `uj_balance` vs `total_revenue_expected`, `total_revenue_remitted`, `revenue_balance`.
    *   Laci fisik kasir pool: `total_cash_received` (sisa UJ + setoran kru) vs `total_cash_paid` (pembayaran tunai hak kru di pool via BKK).
    *   Voucher kasir: `bkm_no` (`BKM/YYMM/XXXX`), `bkk_no` (`BKK/YYMM/XXXX`), dan relasi foreign key ke jurnal rekonsiliasi yang terbentuk (`journal_entry_id`).
*   **Setoran Kas Aktual Kru (`crew_cash_remittances` & `crew_cash_remittance_allocations`)**:
    *   Pencatatan setoran uang fisik aktual bruto tiket & kargo dari supir/kondektur ke kasir pool.
    *   Alokasi fleksibel m:n dari 1 setoran ke beberapa deklarasi tiket/kargo resi.
*   **Temuan Selisih Kas Sistemik (`crew_cash_discrepancies`)**:
    *   Register temuan investigasi kasir (Lapis 2): Kategori `source_type` (`UJ_EXPENSE_UNVERIFIED`, `REVENUE_SHORTAGE`, `REVENUE_OVERAGE`, `OTHER`), nominal selisih `difference_amount`, alasan kru, dan catatan telematika GPS.
    *   Keputusan resmi Finance Manager: `COMPANY_WAIVER` (dialihkan ke `58101 Beban Selisih Kasir Pool`), `CHARGE_TO_CREW` (dialihkan ke `12901 Piutang Klaim Selisih Kas Kru`), atau `ALLOCATION_CORRECTION`.

### B. Domain Services & Alur Akuntansi Meja Kasir
*   `CashierSettlementService`:
    *   *Kalkulator Dua Kantong Kas Kru*: Menghitung live Kantong 1 UJ (Plafon vs Nota vs Sisa Fisik Kembali) dan Kantong 2 Setoran (Target Manifes vs Uang Fisik Diserahkan).
    *   *Gerbang Verifikasi*: Settlement hanya berstatus `VERIFIED` bila `uj_status === 'BALANCED'` dan `revenue_status === 'MATCHED' | 'DISCREPANCY_RECORDED'`.
    *   *Posting Jurnal Rekonsiliasi Atomik*: Otomatis menerbitkan jurnal rekonsiliasi SPJ seimbang (menutup saldo UJ `13101` ke Rp 0, mendebit `11101` Kas Pool untuk kas fisik bersih, mendebit beban-beban operasional perjalanan sah, dan mengkredit pendapatan tiket `41101` & kargo `43101`).
    *   *Kemerdekaan Tutup Buku Bulanan (Period Closing Unblocked)*: Pengalihan selisih kas yang masih dalam investigasi ke akun neraca penampung sementara `11999 Selisih Kas Operasional Sementara`, menjamin tutup buku bulanan tidak terblokir oleh perselisihan kas di jalan.
*   `CashierDiscrepancyService`:
    *   Mencatat temuan selisih kas kasir secara transparan dan mengalihkan status SPJ ke `DISCREPANCY`.
    *   Mengeksekusi otorisasi putusan Finance Manager:
        *   Dispensasi Perusahaan (`COMPANY_WAIVER`): Membebankan selisih ke perusahaan (akun `58101`), menyeimbangkan UJ ke `BALANCED`, dan memposting jurnal rekonsiliasi SPJ lengkap.
        *   Klaim Piutang Kru (`CHARGE_TO_CREW`): Mengakui piutang klaim kru (akun `12901`), menyeimbangkan UJ ke `BALANCED`, dan memposting jurnal rekonsiliasi SPJ lengkap.

### C. Frontend Antarmuka Meja Kasir Pool (`/cashier`)
*   **Halaman Utama Meja Kasir Pool (`/cashier`)**:
    *   4 kartu metrik live: SPJ Siap Settle, Menunggu Investigasi FM, Total Settlement Tuntas, dan Kas Fisik Diterima Hari Ini (BKM).
    *   3 Tab navigasi: SPJ Siap Rekonsiliasi, Riwayat Dokumen Settlement, dan Pusat Investigasi Selisih (Finance Manager Hub).
*   **Modal Rekonsiliasi Kasir Pool (`CashierSettlementModal`)**:
    *   Visualisasi Dua Kantong Kas Kru (Anti-Netting) dengan kartu perbandingan, badge warna-warni, dan peringatan selisih nota.
    *   Mode **Musyawarah Kru di Meja Kasir (Lapis 1)**: Kalkulator patungan/talangan tunai kru di meja kasir untuk menggenapkan kekurangan kembalian kecil di tempat.
    *   Form input uang fisik setoran baru kru dengan alokasi otomatis ke tiket/kargo.
    *   Ringkasan laci kasir: BKM kas masuk, BKK kas bayar hak kru di tempat, dan net kas pool.
*   **Modal Otorisasi Putusan Manajer Keuangan (`DiscrepancyResolutionModal`)**:
    *   Layar khusus Finance Manager untuk memeriksa kronologi kasir, alasan kru, dan telematika GPS.
    *   Pilihan radio putusan (Dispensasi Perusahaan `58101` vs Klaim Piutang Kru `12901`) dan tombol eksekusi posting jurnal SPJ seimbang.
*   **Modal Voucher Resmi Cetak BKM / BKK (`CashReceiptVoucherModal`)**:
    *   Format cetak resmi voucher tanda terima kas PT SS Traveling Indonesia lengkap dengan tanda tangan kru penyetor dan kasir pool penerima (`window.print()`).

## 13. Modul Utang Usaha (AP) & Piutang Usaha (AR) (Tahap 8 — Servis Makan RM, Bengkel Rekanan, DP Wisata, & Pelunasan Piutang)

### A. Model Entitas Database (`ap_invoices`, `ap_invoice_lines`, `ap_payments`, `ap_allocations`, `ar_invoices`, `ar_invoice_lines`, `ar_receipts`, `ar_allocations`)
*   **Tagihan Rekanan Vendor (`ap_invoices`, `ap_invoice_lines`)**:
    *   `bill_no`: Nomor tagihan format `BILL/YYMM/XXXX` dihasilkan via sequence generator.
    *   `vendor_invoice_no`: Nomor faktur/nota fisik vendor rekanan (misal `INV-RMTS-2026/10/012` atau `NOTA-CDM-8821`).
    *   `vendor_type`: `RESTAURANT`, `WORKSHOP`, `AGENT`, `OTHER`.
    *   `ap_account_id`: Akun utang usaha (`21101` Utang RM, `21102` Utang Bengkel, `22101` Utang Agen).
    *   `lines`: Rincian biaya per baris terikat akun beban (`51102` Servis Makan, `55101` Bengkel/Derek Tol, `54101` Komisi Agen) dengan dimensi SPJ (`trip_id`), bus (`vehicle_id`), kupon makan riil, manifes penumpang, dan catatan selisih.
*   **Pembayaran Tagihan AP (`ap_payments`, `ap_allocations`)**:
    *   Pencatatan realisasi bayar utang via Bank BCA (`11104`) atau Kas Pool (`11101`) dengan alokasi ke satu atau beberapa faktur, serta pembaruan otomatis saldo terbayar dan status faktur (`PAID` / `PARTIALLY_PAID`).
*   **Invoice Piutang Pelanggan (`ar_invoices`, `ar_invoice_lines`)**:
    *   `invoice_no`: Format nomor unik `INV/WIS/YYMM/XXXX` atau `INV/YYMM/XXXX`.
    *   Tautan pelanggan `customer_id` dan kontrak sewa bus wisata `trip_id` (Skenario 2).
    *   `ar_account_id`: Akun piutang usaha `12101 Piutang Sewa Charter Bus Wisata`.
*   **Penerimaan Kas/Bank & DP Wisata (`ar_receipts`, `ar_allocations`)**:
    *   Pencatatan penerimaan mutasi bank/kas dengan alokasi pelunasan invoice piutang.
    *   Dukungan khusus **Uang Muka (DP) 30% Sewa Wisata** (`is_down_payment = true`): Membukukan penerimaan kas/bank di debit dan mengkredit liabilitas `24101 Pendapatan Diterima di Muka (DP Sewa Wisata)`.

### B. Aturan Bisnis & Posting Jurnal Satu Pintu
*   **Tagihan Servis Makan RM Mitra (Skenario 1)**:
    *   Fitur `findUnbilledSpjsForRestaurant`: Menarik seluruh SPJ AKAP yang belum pernah ditagihkan oleh restoran mitra tersebut.
    *   Proteksi ketat **Anti-Double Billing**: SPJ yang sudah tercantum di baris tagihan aktif milik restoran tersebut otomatis ditolak oleh sistem.
    *   Audit Kupon Riil vs Manifes: Validasi jumlah kupon makan riil yang ditukarkan penumpang, dengan peringatan (*over-capacity warning*) jika kupon melebihi manifes fisik bus.
    *   Persetujuan Tagihan AP: Posting jurnal utang otomatis:
        *   **Debit**: `51102 Beban Service Makan Penumpang Restoran Mitra` (per baris SPJ & bus).
        *   **Kredit**: `21101 Utang Vendor Restoran Mitra` (total tagihan).
*   **Tagihan Vendor Bengkel & Derek Tol Bus Rusak (Skenario 3)**:
    *   Pencatatan tagihan bengkel rekanan (misal Cirebon Diesel Motor) atas perbaikan radiator bus `SS-01` di Tol Cipali KM 214.
    *   **Debit**: `55101 Beban Perawatan, Perbaikan, & Derek Armada` (dimensi bus rusak `SS-01`).
    *   **Kredit**: `21102 Utang Vendor Suku Cadang & Bengkel Rekanan`.
*   **Siklus Kontrak Sewa Wisata (Skenario 2)**:
    *   1. *Penerimaan DP 30%* (Rp 5.250.000): Debit Bank BCA `11104`, Kredit `24101 Pendapatan Diterima di Muka`.
    *   2. *Penerbitan Invoice Pelunasan 70%* (Rp 12.250.000): Menerbitkan invoice `INV/WIS` ke akun `12101 Piutang Sewa Charter Bus Wisata`.
    *   3. *Penerimaan Pelunasan 70%*: Debit Bank BCA `11104`, Kredit `12101 Piutang Sewa Charter Bus Wisata` (menutup invoice piutang).
    *   4. *Pengakuan Pendapatan Accrual 100%*: Saat SPJ Wisata tuntas (`COMPLETED`) dan diselesaikan di meja kasir: Debit `24101` (Rp 5.25jt), Debit Kas/Piutang (Rp 12.25jt), Kredit `42101 Pendapatan Sewa Bus Pariwisata` (Rp 17.5jt).

### C. Frontend Antarmuka AP & AR (`/ap-invoices` & `/ar-invoices`)
*   **Halaman Tagihan Vendor / AP Invoices (`/ap-invoices`)**:
    *   4 kartu metrik: Total Tagihan Belum Dibayar, Utang Servis Makan RM (21101), Utang Bengkel & Suku Cadang (21102), Total Terbayar Bulan Ini.
    *   Tab Daftar Tagihan AP vs Tab Riwayat Pembayaran.
    *   Modal **`[+ Tagihan Servis Makan Restoran]`** dengan dialog cerdas **`[+ Tarik SPJ Belum Ditagih]`**, kupon riil, badge warning > manifes, dan subtotal otomatis.
    *   Modal **`[+ Tagihan Vendor & Beban Operasional]`** dengan **1-Click Template Presets** (Gaji Staf/Mekanik, Listrik/WiFi, Bengkel & Sparepart, Pajak STNK/KIR, Asuransi Jasa Raharja, Perlengkapan Pool, Komisi Agen, dan Tagihan Kustom).
    *   Modal **`[Bayar Faktur AP]`** via Transfer Bank / Kas Pool dengan alokasi otomatis, pemisah ribuan titik (`.`), dan tombol pintas *"Bayar Lunas"*.
    *   Modal **Detail Faktur AP** dengan rincian baris, jurnal terposting, dan riwayat pembayaran.
*   **Halaman Piutang Usaha / AR Invoices (`/ar-invoices`)**:
    *   4 kartu metrik: Total Piutang Belum Tertagih, Titipan DP Sewa Wisata (24101), Piutang Tertagih Bulan Ini, Total Faktur Terbit.
    *   Tab Daftar Faktur Piutang AR vs Tab Riwayat Penerimaan / DP.
    *   Modal **`[+ Terima DP Sewa Wisata (30%)]`** (Skenario 2 akun `24101`).
    *   Modal **`[+ Invoice Pelunasan Wisata (70%)]`** (Skenario 2 akun `12101`).
    *   Modal **`[+ Invoice Piutang Umum (AR)]`** dengan template rekomendasi (Sewa Wisata Non-SPJ, Piutang Tiket Agen, Piutang Kargo, Sewa Kios & Iklan Bodi).
    *   Modal **`[Pelunasan Piutang]`** bank/kas dengan alokasi invoice, format angka ribuan, dan shortcut *"Bayar Lunas"*.
    *   Modal **Detail Invoice AR** dengan rincian baris dan status pelunasan.
*   **Standar Ergonomi UI/UX Modal & Pemilihan Akun COA**:
    *   *Pelebaran Modal Transaksi*: Form faktur AP & AR diperlebar ke `max-w-5xl` (`1024px+`) dengan padding lega (`p-6 sm:p-7`), dan modal pembayaran/penerimaan diperlebar ke `max-w-2xl` (`672px`).
    *   *Pemisahan Kategori COA Terstruktur (`<optgroup>`)*: Dropdown akun COA dikelompokkan berdasarkan fungsi akuntansi PO bus (Beban Operasional `51`, Tol `52`, Kru `53`, Keagenan `54`, Bengkel `55`, Kantor `57`, Utang Vendor `211`, Utang Gaji `212`, Piutang `121`, Pendapatan `41/42/43/81`) lengkap dengan badge penanda rekomendasi template.
    *   *Kartu Berjenjang (Two-Tier Card)*: Baris rincian dipisahkan menjadi baris atas (deskripsi & armada) dan baris bawah (akun COA, Qty, Harga Satuan, tombol hapus, subtotal) sehingga tidak ada teks yang terpotong.
    *   *Format Mata Uang Dinamis*: Input nominal menggunakan `toLocaleString('id-ID')` dengan `inputMode="numeric"`.

---
*Gunakan dokumen ini sebagai referensi saat melakukan pengembangan fitur baru atau debugging sistem otorisasi.*


