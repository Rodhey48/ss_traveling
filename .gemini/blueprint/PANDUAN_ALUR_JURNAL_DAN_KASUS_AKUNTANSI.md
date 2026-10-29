# Panduan Praktis Alur Jurnal Akuntansi & Kasus Riil SS Traveling ERP

> **Dokumen Panduan Teknis & Bisnis Lengkap**  
> **Target Pengguna:** Developer, Akuntan, Staff Finance, Kasir Pool, dan Auditor Operasional  
> **Lingkup Sistem:** PT SS Traveling Official (Layanan Bus AKAP & Pariwisata)

---

## DAFTAR ISI
1. [Prinsip Dasar: Mengapa Harus Ada COA dan Mengapa Harus Berimbang?](#1-prinsip-dasar-mengapa-harus-ada-coa-dan-mengapa-harus-berimbang)
2. [Mental Model 3 Detik: Menentukan Debet dan Kredit Tanpa Bingung](#2-mental-model-3-detik-menentukan-debet-dan-kredit-tanpa-bingung)
3. [Konsep "Jembatan Waktu": Transaksi Tunai Langsung vs Transaksi Tempo (Kredit/Akrual)](#3-konsep-jembatan-waktu-transaksi-tunai-langsung-vs-transaksi-tempo-kreditakrual)
4. [Katalog Kasus Riil Operasional Bus SS Traveling](#4-katalog-kasus-riil-operasional-bus-ss-traveling)
   - [Kategori 1: Operasional AKAP Reguler (Bus SS-01 PP)](#kategori-1-operasional-akap-reguler-bus-ss-01-pp)
   - [Kategori 2: Sewa Bus Pariwisata / Charter (Bus SS-02 PT Mitra Sejahtera)](#kategori-2-sewa-bus-pariwisata--charter-bus-ss-02-pt-mitra-sejahtera)
   - [Kategori 3: Treasury & Manajemen Kas Perbankan](#kategori-3-treasury--manajemen-kas-perbankan)
   - [Kategori 4: Kas Kecil Pool & Garasi (Petty Cash BKK)](#kategori-4-kas-kecil-pool--garasi-petty-cash-bkk)
   - [Kategori 5: Utang Usaha Vendor (AP Invoices: Tunai vs Tempo)](#kategori-5-utang-usaha-vendor-ap-invoices-tunai-vs-tempo)
   - [Kategori 6: Anomali Breakdown Tol & Penggantian Armada (Skenario 3)](#kategori-6-anomali-breakdown-tol--penggantian-armada-skenario-3)
   - [Kategori 7: Rekonsiliasi Discrepancy Kasir & Akun Antara 11999 (Skenario 4)](#kategori-7-rekonsiliasi-discrepancy-kasir--akun-antara-11999-skenario-4)
   - [Kategori 8: Penyesuaian Akhir Bulan & Reversal (Tutup Buku)](#kategori-8-penyesuaian-akhir-bulan--reversal-tutup-buku)
5. [Tabel Cheat Sheet: Komparasi Transaksi Tunai Langsung vs Tempo](#5-tabel-cheat-sheet-komparasi-transaksi-tunai-langsung-vs-tempo)

---

## 1. Prinsip Dasar: Mengapa Harus Ada COA dan Mengapa Harus Berimbang?

### A. Apa itu COA (Chart of Accounts)?
COA adalah **kamus kode label resmi** yang disepakati bersama agar seluruh transaksi keuangan dapat dikelompokkan secara konsisten oleh komputer.

Tanpa COA:
- Kasir menulis *"Beli solar di Cipali"*.
- Supir menulis *"Minyak solar tol"*.
- Admin menulis *"BBM Pertamina"*.
Komputer tidak akan mengerti bahwa ketiganya adalah jenis pengeluaran yang sama. Dengan COA, semua transaksi tersebut diberi satu label baku: **Akun `51101` (Beban Bahan Bakar Minyak / Solar Bus)**.

### B. Mengapa Debet dan Kredit Harus Selalu Seimbang ($\sum \text{Debet} = \sum \text{Kredit}$)?
Uang dalam bisnis tidak pernah tercipta atau lenyap secara gaib. **Setiap ada uang/manfaat yang masuk di satu tempat (Tujuan), pasti ada sumber yang mengeluarkannya (Asal).**

* **DEBET** mencatat: **Ke mana** uang/manfaat itu pergi atau dinikmati.
* **KREDIT** mencatat: **Dari mana** asal uang atau kewajiban tersebut timbul.

Karena nominal yang keluar dari sumbernya **pasti sama persis** dengan nominal yang masuk ke tujuannya, maka:
$$\text{Total Debet} - \text{Total Kredit} = 0 \quad (\text{Balanced})$$

Jika sistem mengizinkan jurnal yang tidak seimbang, artinya ada uang yang hilang atau muncul tanpa asal-usul (kebocoran pembukuan). Oleh karena itu, backend NestJS (`AccountingPostingService`) selalu memverifikasi keseimbangan sebelum menyimpan jurnal ke database.

---

## 2. Mental Model 3 Detik: Menentukan Debet dan Kredit Tanpa Bingung

Jangan menghafal rumus teks yang berbelit-belit. Gunakan **Aturan 2 Kubu**:

```
           KUBU KIRI                                     KUBU KANAN
  (Harta / Aset & Beban / Biaya)            (Utang, Modal, & Pendapatan)
       Kepala 1 & Kepala 5                       Kepala 2, 3, & Kepala 4
---------------------------------          ---------------------------------
  Kalau BERTAMBAH  --> DEBET                 Kalau BERTAMBAH  --> KREDIT
  Kalau BERKURANG  --> KREDIT                Kalau BERKURANG  --> DEBET
```

### Langkah Mudah Menentukan Posisi:
1. **Langkah 1 (Tanya Tujuan / Manfaat):** Apa yang bertambah bagi perusahaan?
   - Apakah uang kas/bank bertambah? Atau biaya/solar dinikmati mesin bus? $\to$ Tulis akun tersebut di sisi **DEBET**.
2. **Langkah 2 (Tanya Sumber / Asal):** Dari mana uang itu keluar, atau kewajiban/penjualan apa yang bertambah?
   - Apakah saldo brankas/bank berkurang? Atau kita punya utang baru? Atau ada jasa tiket yang terjual? $\to$ Tulis akun tersebut di sisi **KREDIT**.
3. **Langkah 3 (Cek Nominal):** Pastikan total nilai nominal di sisi Debet sama dengan sisi Kredit.

---

## 3. Konsep "Jembatan Waktu": Transaksi Tunai Langsung vs Transaksi Tempo (Kredit/Akrual)

Ini adalah kunci pemahaman terpenting yang membedakan akuntansi toko kelontong sederhana dengan akuntansi sistem ERP korporat:

```
A. TRANSAKSI TUNAI LANGSUNG (1 Langkah - Tanpa Jembatan)
   [Barang/Jasa Diterima] ==========================> [Uang Kas/Bank Keluar Detik Itu Juga]
   (Contoh: Beli ban langsung transfer Mandiri -> Debet Beban Ban, Kredit Bank Mandiri)

B. TRANSAKSI TEMPO / BON / BERTAHAP (2 Babak - Melewati Jembatan Waktu)
   [Hari ke-1: Barang Diterima] ===> [JEMBATAN WAKTU: UTANG] ===> [Hari ke-30: Uang Bank Keluar]
   Babak 1: Debet Beban Ban, Kredit Utang Toko Ban           Babak 2: Debet Utang Toko Ban, Kredit Bank Mandiri
```

### 5 Jenis "Jembatan Waktu" di SS Traveling:
1. **Jembatan Utang Dagang (AP - Akun `21xxx`):** Barang/servis dinikmati hari ini, uang baru keluar bulan depan (contoh: servis makan RM mitra, tagihan ban tempo).
2. **Jembatan Piutang Usaha (AR - Akun `12xxx`):** Tiket/sewa bus dinikmati penumpang/penyewa hari ini, pembayaran baru ditransfer beberapa hari kemudian (contoh: sewa korporat, tiket OTA online).
3. **Jembatan Uang Muka Kru (UJ - Akun `13101`):** Kasir mencairkan uang tunai di garasi hari ini, supir baru membelanjakan solar/tol dan mengembalikan sisa nota 2 hari kemudian saat pulang.
4. **Jembatan Pendapatan Diterima di Muka (DP Wisata - Akun `24101`):** Uang DP diterima di bank hari ini, tetapi bus baru berangkat dan melayani perjalanan bulan depan.
5. **Jembatan Penampung Selisih Kasir (Suspense - Akun `11999`):** Kasir menemukan nota BBM hilang hari ini, ditampung di neraca agar tutup buku tidak macet, baru diselesaikan bulan depan setelah investigasi FM tuntas.

---

## 4. Katalog Kasus Riil Operasional Bus SS Traveling

Berikut adalah katalog lengkap seluruh peristiwa bisnis di PT SS Traveling beserta perbandingan **Tunai Langsung** vs **Sistem Tempo/Jembatan Waktu**.

---

### KATEGORI 1: Operasional AKAP Reguler (Bus SS-01 PP)

#### Kasus 1.1: Kasir Pool Mencairkan Uang Jalan (UJ) Awal
* **Peristiwa:** Kasir Pool Ciputat menyerahkan uang tunai Rp 3.500.000 kepada Pak Budi (Driver 1) sebelum Bus SS-01 berangkat ke Yogyakarta.
* **Mengapa lewat Akun `13101` (UJ)?** Karena kasir belum tahu berapa rupiah solar yang akan dibeli supir. Uang ini **belum menjadi beban**, melainkan titipan modal operasional di tangan supir (Jembatan UJ).
* **Jurnal (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `13101` | Uang Jalan (UJ) Kru Perjalanan Bus | Rp 3.500.000 | Titipan uang muka operasional kru bertambah di tangan supir |
| **KREDIT**| `11101` | Kas Pool Ciputat (Kas Operasional) | Rp 3.500.000 | Fisik uang kertas keluar dari laci brankas kasir |

---

#### Kasus 1.2: Pengeluaran BBM Solar & E-Toll di Perjalanan (Pertanggungjawaban UJ)
* **Peristiwa:** Selama perjalanan PP, supir membeli Solar di Rest Area KM 102 sebesar Rp 1.800.000 dan tap E-Toll Trans Jawa sebesar Rp 800.000 menggunakan uang jalan.
* **Logika:** Beban diakui sah karena solar masuk ke tangki dan tol dilintasi bus. Uang jalan supir berkurang sesuai nilai struk.
* **Jurnal (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `51101` | Beban Bahan Bakar Minyak (Solar Bus) | Rp 1.800.000 | Beban solar dinikmati mesin Bus SS-01 |
| **DEBET** | `52101` | Beban Tol / Top-up E-Toll Perjalanan | Rp 800.000 | Beban tarif tol Trans Jawa PP diakui |
| **KREDIT**| `13101` | Uang Jalan (UJ) Kru Perjalanan Bus | Rp 2.600.000 | Tanggung jawab UJ supir berkurang sesuai bukti struk sah |

*Alternatif (Jika Kasir Pool Mengisi Solar di Garasi Langsung dari Tangki Pool / Bayar Tunai Langsung Kasir):*
* *Debet `51101` (Beban Solar) $\to$ Kredit `11101` (Kas Pool) tanpa melewati akun UJ `13101`.*

---

#### Kasus 1.3: Servis Kupon Makan Penumpang di RM Taman Selera Subang
Setiap tiket resmi bus SS Traveling sudah termasuk 1x makan prasmanan di Restoran Mitra.

##### Kasus 1.3A: Sistem Bon / Tempo Bulanan (Standar Operasional AKAP)
* **Peristiwa:** Penumpang menukarkan 22 kupon makan @ Rp 45.000 = Rp 990.000 (2 kru gratis). Supir hanya menandatangani formulir bon kupon makan. Kasir pool **belum membayar uang cash hari itu**.
* **Logika (Babak 1 Pengakuan Beban & Utang):**
  - Manfaat makanan sudah dinikmati penumpang (Beban Servis Makan terjadi).
  - Kas/Bank belum keluar, melainkan perusahaan berutang kepada RM Taman Selera (Utang Vendor bertambah).
* **Jurnal Saat Kupon Ditukar (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `51102` | Beban Service Makan Penumpang (RM Mitra) | Rp 990.000 | Beban makan penumpang resmi diakui pada trip ini |
| **KREDIT**| `21101` | Utang Vendor Restoran Mitra | Rp 990.000 | **Utang dagang ke RM tercatat (Belum ada uang keluar)** |

##### Kasus 1.3B: Jika Supir Membayar Tunai Langsung di RM Pakai Uang Jalan (Tanpa Utang)
* **Peristiwa:** Jika bus singgah di rumah makan non-mitra (misal bus terjebak macet jalur arteri Pantura) dan supir membayar tunai langsung kasir RM Rp 990.000 dari amplop UJ.
* **Jurnal (JV 1 Langkah):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `51102` | Beban Service Makan Penumpang | Rp 990.000 | Beban makan penumpang terjadi |
| **KREDIT**| `13101` | Uang Jalan (UJ) Kru Perjalanan Bus | Rp 990.000 | **Uang kas keluar langsung dari amplop supir (Tanpa Utang RM)** |

---

#### Kasus 1.4: Penjualan Tiket & Paket Kargo Bagasi di Meja Kasir

##### Kasus 1.4A: Penjualan Tiket Tunai Langsung di Pool (1 Langkah)
* **Peristiwa:** Penumpang beli tiket di meja kasir pool seharga Rp 450.000 tunai.
* **Jurnal (JV):**
  - **(DEBET)** `11101` Kas Pool Ciputat: Rp 450.000
  - **(KREDIT)** `41101` Pendapatan Tiket AKAP: Rp 450.000

##### Kasus 1.4B: Penjualan Tiket via Agen Loket Terminal / Online OTA (Sistem Tempo AR)
* **Peristiwa:** Agen Terminal Giwangan menjual 10 tiket senilai Rp 4.500.000 dengan komisi agen 10% (Rp 450.000). Uang penjualan disetor agen setiap hari Selasa (tempo).
* **Jurnal (JV Saat Tiket Terjual via Agen):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `12103` | Piutang Agen Penjualan Tiket (Offline) | Rp 4.050.000 | Tagihan bersih yang wajib disetor agen ke SS Traveling |
| **DEBET** | `54101` | Beban Komisi Agen Penjualan Tiket | Rp 450.000 | Biaya komisi hak agen 10% diakui sebagai beban |
| **KREDIT**| `41101` | Pendapatan Tiket AKAP Reguler | Rp 4.500.000 | Omzet kotor 10 kursi bus diakui penuh |

*Nanti saat Agen mentransfer uang setoran: Debet Bank BCA Ops `11121`, Kredit Piutang Agen `12103`.*

##### Kasus 1.4C: Pengiriman Kargo Motor dengan Komisi Kru 20%
* **Peristiwa:** Supir menyetor ongkos kirim kargo motor Rp 350.000 tunai ke kasir. Sesuai aturan perusahaan, kru berhak atas komisi 20% (Rp 70.000) yang dicatat ke akun komisi kru.
* **Jurnal (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `11101` | Kas Pool Ciputat | Rp 350.000 | Kasir menerima uang fisik penuh dari pengirim paket |
| **DEBET** | `53104` | Beban Komisi / Insentif Kargo Kru | Rp 70.000 | Hak komisi kru 20% diakui sebagai biaya perusahaan |
| **KREDIT**| `43101` | Pendapatan Kargo & Paket Bagasi Bus | Rp 350.000 | Pendapatan kargo motor diakui bruto |
| **KREDIT**| `23101` | Utang Uang Makan & Premi Ritase Kru | Rp 70.000 | Hak kru ditampung di utang komisi siap dicairkan |

---

#### Kasus 1.5: Rekonsiliasi Kasir Pool & Pengembalian Sisa UJ (Kantong UJ Balanced)
* **Peristiwa:** Supir mempertanggungjawabkan UJ: Plafon Rp 3.500.000, nota sah Rp 2.600.000 (BBM Rp 1.8jt + Tol Rp 800rb), sisa fisik Rp 900.000 diserahkan kembali ke kasir pool.
* **Logika:** Uang masuk kembali ke brankas kasir pool (Debet Kas). Saldo uang jalan supir lunas menjadi Rp 0 (Kredit UJ).
* **Jurnal (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `11101` | Kas Pool Ciputat | Rp 900.000 | Uang kertas fisik sisa perjalanan kembali ke kasir |
| **KREDIT**| `13101` | Uang Jalan (UJ) Kru Perjalanan Bus | Rp 900.000 | Tanggung jawab UJ supir di SPJ ini ditutup menjadi Rp 0 |

---

#### Kasus 1.6: Pengakuan Kompensasi Kru Operasional (Uang Makan & Premi Ritase)
* **Peristiwa:** Rute PP selesai, hak 3 kru dihitung total Rp 1.200.000 (Makan Rp 400.000, Premi Ritase Rp 800.000).
* **Jurnal (JV Saat Settlement SPJ):**
  - **(DEBET)** `53101` Beban Uang Makan Kru: Rp 400.000
  - **(DEBET)** `53102` Beban Premi Ritase Kru: Rp 800.000
  - **(KREDIT)** `23101` Utang Kompensasi Kru: Rp 1.200.000 *(Dicairkan saat payroll bulanan atau ditransfer kasir)*.

---

### KATEGORI 2: Sewa Bus Pariwisata / Charter (Bus SS-02 PT Mitra Sejahtera)

Bisnis pariwisata memiliki siklus unik: kontrak disepakati jauh hari sebelum tanggal keberangkatan, sehingga menggunakan mekanisme **Uang Muka (DP)** dan **Piutang Pelunasan (AR)**.

#### Kasus 2.1: Penerimaan Uang Muka (DP 30%) Sewa Bus via Bank BCA Induk
* **Peristiwa:** PT Mitra Sejahtera menyewa bus 5D4N (total nilai kontrak Rp 17.500.000). Panitia mentransfer DP 30% sebesar Rp 5.250.000 ke rekening BCA Induk. Bus baru akan berangkat 2 minggu lagi.
* **Mengapa belum diakui Pendapatan Sewa (`42101`)?** Karena bus **belum mengantar penumpang 1 meter pun**! Secara hukum dan akuntansi (*accrual principle*), uang ini adalah titipan/kewajiban melayani jasa bus di masa depan (Jembatan DP `24101`).
* **Jurnal Penerimaan DP (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `11111` | Bank BCA Induk (Penerimaan) | Rp 5.250.000 | Saldo kas rekening bank korporat bertambah nyata |
| **KREDIT**| `24101` | Pendapatan Diterima di Muka (DP Wisata) | Rp 5.250.000 | **Kewajiban melayani sewa di masa depan (Bukan Laba Hari Ini)** |

---

#### Kasus 2.2: Kontras: Bagaimana Jika Pelanggan Bayar LUNAS 100% di Depan?
* **Peristiwa:** Pelanggan mentransfer langsung lunas Rp 17.500.000 saat booking.
* **Jurnal (JV):**
  - **(DEBET)** `11111` Bank BCA Induk: Rp 17.500.000
  - **(KREDIT)** `24101` Pendapatan Diterima di Muka: Rp 17.500.000 *(Tetap belum boleh diakui pendapatan sampai trip selesai!)*

---

#### Kasus 2.3: Pencairan UJ Wisata Bertahap & Tambahan UJ Bank di Jalan
* **Peristiwa:** Kasir pool mencairkan UJ awal Rp 6.000.000 tunai di pool. Di hari ke-3 di Bali, rute bertambah sehingga Finance mentransfer tambahan UJ Rp 1.000.000 dari Bank BCA Operasional Wisata ke rekening supir.
* **Jurnal Gabungan Pencairan UJ Wisata (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `13101` | Uang Jalan (UJ) Kru Perjalanan Bus | Rp 7.000.000 | Total dana belanja dipegang supir selama 5 hari trip |
| **KREDIT**| `11101` | Kas Pool Ciputat | Rp 6.000.000 | Uang tunai awal diserahkan di garasi |
| **KREDIT**| `11122` | Bank BCA Operasional Wisata | Rp 1.000.000 | Tambahan darurat ditransfer via mobile banking |

---

#### Kasus 2.4: Pelunasan Sisa Piutang (AR 70%) oleh Penyewa Bus
* **Peristiwa:** H-1 sebelum bus kembali, PT Mitra Sejahtera mentransfer sisa tagihan 70% sebesar Rp 12.250.000 ke rekening Bank BCA Induk.
* **Logika:** Saldo bank bertambah, faktur piutang pelanggan lunas.
* **Jurnal Pelunasan AR (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `11111` | Bank BCA Induk (Penerimaan) | Rp 12.250.000 | Saldo bank korporat bertambah dari pelunasan penyewa |
| **KREDIT**| `12101` | Piutang Sewa Charter Bus Wisata | Rp 12.250.000 | Tagihan invoice piutang resmi ditutup (Lunas) |

---

#### Kasus 2.5: Pengakuan Pendapatan Sewa Pariwisata (Accrual Realization Saat Trip Selesai)
* **Peristiwa:** Bus SS-02 tiba kembali di pool garasi dengan selamat. Rangkaian wisata 5D4N tuntas dilaksanakan.
* **Logika:** Jembatan DP (`24101`) dihapus, jembatan piutang (`12101`) ditutup, dan perusahaan secara sah mengakui omzet sewa Rp 17.500.000.
* **Jurnal Pengakuan Omzet Pariwisata (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `24101` | Pendapatan Diterima di Muka (DP Wisata) | Rp 5.250.000 | Kewajiban DP dihapus karena bus telah selesai melayani |
| **DEBET** | `12101` | Piutang Sewa Charter Bus Wisata | Rp 12.250.000 | Piutang ditautkan dengan invoice pelunasan |
| **KREDIT**| `42101` | Pendapatan Sewa Bus Pariwisata | Rp 17.500.000 | **Seluruh nilai kontrak Rp 17.5jt sah menjadi omzet perusahaan** |

---

#### Kasus 2.6: Pembayaran Komisi / Cashback B2B ke Rekanan Travel Wisata
* **Peristiwa:** Perusahaan mentransfer cashback fee Rp 300.000 kepada Biro Travel Rekanan melalui Bank BCA Operasional Wisata.
* **Jurnal (JV):**
  - **(DEBET)** `54103` Beban Komisi / Cashback Rekanan Wisata: Rp 300.000
  - **(KREDIT)** `11122` Bank BCA Operasional Wisata: Rp 300.000

---

### KATEGORI 3: Treasury & Manajemen Kas Perbankan

Arsitektur SS Traveling memisahkan rekening menjadi:
- **2 Rekening Induk:** BCA Induk (`11111`) & Mandiri Induk (`11112`) khusus menampung uang masuk dari pelanggan.
- **4 Rekening Operasional:** BCA Ops AKAP (`11121`), BCA Ops Wisata (`11122`), Mandiri Ops AKAP (`11123`), Mandiri Ops Wisata (`11124`) khusus belanja solar, tol, dan tagihan vendor.

#### Kasus 3.1: Dropping Dana Rekening Induk BCA ke Rekening Operasional AKAP
* **Peristiwa:** Finance Manager menyetujui dropping plafon belanja Rp 50.000.000 dari BCA Induk ke BCA Ops AKAP.
* **Logika:** Mutasi internal antar-rekening perusahaan. Tidak ada uang keluar dari korporat.
* **Jurnal (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `11121` | Bank BCA Operasional AKAP | Rp 50.000.000 | Rekening belanja operasional bertambah |
| **KREDIT**| `11111` | Bank BCA Induk (Penerimaan) | Rp 50.000.000 | Rekening penerimaan berkurang |

---

#### Kasus 3.2: Tarik Tunai Bank Operasional untuk Pengisian Kas Fisik Brankas Pool
* **Peristiwa:** Kasir pool mencairkan cek tunai Rp 15.000.000 dari Bank Mandiri Ops AKAP untuk modal kasir pool.
* **Jurnal (JV):**
  - **(DEBET)** `11101` Kas Pool Ciputat: Rp 15.000.000 *(Uang fisik brankas bertambah)*
  - **(KREDIT)** `11123` Bank Mandiri Operasional AKAP: Rp 15.000.000 *(Saldo rekening bank berkurang)*

---

#### Kasus 3.3: Penyetoran Fisik Uang Kasir Pool ke Rekening Bank Operasional
* **Peristiwa:** Kasir pool menyetorkan uang tunai hasil setoran tiket kru Rp 25.000.000 ke rekening BCA Ops AKAP via setor tunai CDM bank.
* **Jurnal (JV):**
  - **(DEBET)** `11121` Bank BCA Operasional AKAP: Rp 25.000.000 *(Saldo bank bertambah)*
  - **(KREDIT)** `11101` Kas Pool Ciputat: Rp 25.000.000 *(Uang tunai brankas berkurang)*

---

#### Kasus 3.4: Beban Administrasi Bank & Penerimaan Jasa Giro Bulanan
* **Peristiwa:** Rekening koran bulanan Bank BCA mencatat biaya admin Rp 25.000 dan bunga jasa giro Rp 150.000.
* **Jurnal Biaya Admin:**
  - **(DEBET)** `59102` Beban Administrasi Bank: Rp 25.000
  - **(KREDIT)** `11111` Bank BCA Induk: Rp 25.000
* **Jurnal Jasa Giro:**
  - **(DEBET)** `11111` Bank BCA Induk: Rp 150.000
  - **(KREDIT)** `81101` Pendapatan Bunga Bank & Jasa Giro: Rp 150.000

---

### KATEGORI 4: Kas Kecil Pool & Garasi (Petty Cash BKK)

Kas kecil digunakan khusus untuk pengeluaran darurat bernilai kecil (di bawah Rp 1.000.000) di area garasi/pool menggunakan sistem imprest.

#### Kasus 4.1: Pengeluaran Bon Kas Kecil Darurat di Garasi
* **Peristiwa:** Mandor pool membeli sabun cuci bus Rp 150.000 dan kertas nota form SPJ Rp 100.000 dengan Bukti Kas Keluar (BKK).
* **Jurnal (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `52103` | Beban Cuci Bus & Perlengkapan Armada | Rp 150.000 | Biaya sabun cuci armada garasi diakui |
| **DEBET** | `57110` | Beban ATK, Kertas, & Percetakan Dokumen | Rp 100.000 | Biaya kertas nota administrasi pool diakui |
| **KREDIT**| `11101` | Kas Pool Ciputat (Kas Kecil) | Rp 250.000 | Fisik uang kas kecil berkurang di tangan kasir |

---

### KATEGORI 5: Utang Usaha Vendor (AP Invoices: Tunai vs Tempo)

Di sinilah letak perbedaan mendasar antara **Pembelian Tunai Langsung** dengan **Pembelian Tempo (Kredit)**:

```
SKENARIO A: Beli Ban Bus Bayar Tunai Langsung di Tempat
[Beli Ban & Pasang ke Bus] --------------> [Bayar Tunai / Transfer Mandiri Hari Itu Juga]
HANYA 1 LANGKAH:
(D) Beban Ban (55104)        Rp 14.000.000
   (K) Bank Mandiri (11123)     Rp 14.000.000
(TIDAK PERLU LEWAT AKUN UTANG 21102 KARENA TIDAK ADA UTANG!)

========================================================================================

SKENARIO B: Beli Ban Bus Sistem Tempo 30 Hari (Standar Korporat)
[Hari ke-1: Ban Datang & Dipasang]         [Hari ke-30: Jatuh Tempo Pembayaran]
BABAK 1 (Tagihan Masuk)                    BABAK 2 (Pelunasan via Bank)
(D) Beban Ban (55104)        Rp 14.000.000 (D) Utang Bengkel (21102)    Rp 14.000.000
   (K) Utang Bengkel (21102)    Rp 14.000.000    (K) Bank Mandiri (11123)  Rp 14.000.000
(BELUM ADA UANG KELUAR DARI BANK!)         (UANG RESMI KELUAR DARI REKENING BANK!)
```

---

#### Kasus 5.1A: Rekap Tagihan Bulanan RM Taman Selera (Babak 1: Tagihan Masuk)
* **Konteks:** Selama 1 bulan, seluruh bus AKAP singgah makan dengan kupon bon senilai total Rp 15.000.000.
* **Jurnal Akumulasi Tagihan RM:**
  - **(DEBET)** `51102` Beban Service Makan Penumpang: Rp 15.000.000
  - **(KREDIT)** `21101` Utang Vendor Restoran Mitra: Rp 15.000.000 *(Belum ada uang keluar)*

#### Kasus 5.1B: Pelunasan Tagihan RM Taman Selera via Transfer Bank BCA (Babak 2: Uang Keluar)
* **Peristiwa:** Tanggal 25 akhir bulan, bagian Finance mentransfer Rp 15.000.000 dari Bank BCA Operasional AKAP ke rekening RM Taman Selera.
* **Jurnal Pelunasan AP (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `21101` | Utang Vendor Restoran Mitra | Rp 15.000.000 | Utang usaha kepada rumah makan dinyatakan lunas |
| **KREDIT**| `11121` | Bank BCA Operasional AKAP | Rp 15.000.000 | **Saldo bank resmi berkurang untuk melunasi vendor** |

---

#### Kasus 5.2A: Pembelian Ban Bus Tempo 30 Hari (Babak 1: Tagihan Masuk, Belum Bayar)
* **Peristiwa:** Toko Ban Sejahtera memasang 4 ban baru untuk Bus SS-04 senilai Rp 14.000.000 dengan jatuh tempo 30 hari.
* **Jurnal Saat Ban Dipasang (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `55104` | Beban Ban Bus (Baru & Vulkanisir) | Rp 14.000.000 | Beban fisik ban dinikmati oleh Bus SS-04 |
| **KREDIT**| `21102` | Utang Vendor Suku Cadang & Bengkel | Rp 14.000.000 | **Utang baru tercatat (Belum ada uang keluar dari kas/bank)** |

#### Kasus 5.2B: Pelunasan Tagihan Ban 30 Hari Kemudian via Bank Mandiri (Babak 2: Uang Keluar)
* **Peristiwa:** 30 hari kemudian, Finance mentransfer Rp 14.000.000 dari Bank Mandiri Operasional AKAP ke Toko Ban Sejahtera.
* **Jurnal Saat Pelunasan Transfer (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `21102` | Utang Vendor Suku Cadang & Bengkel | Rp 14.000.000 | Utang toko ban yang menggantung dinyatakan lunas |
| **KREDIT**| `11123` | Bank Mandiri Operasional AKAP | Rp 14.000.000 | **Saldo kas bank keluar untuk transfer pelunasan** |

#### Kasus 5.2C: Jika Pembelian Ban Dibayar TUNAI / TRANSFER LANGSUNG Hari Itu Juga (Tanpa Utang)
* **Peristiwa:** Jika toko ban mewajibkan bayar di tempat tanpa tempo. Finance mentransfer langsung detik itu juga.
* **Jurnal (JV 1 Langkah Tanpa Lewat Akun Utang 21102):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `55104` | Beban Ban Bus (Baru & Vulkanisir) | Rp 14.000.000 | Beban ban langsung diakui pada armada Bus SS-04 |
| **KREDIT**| `11123` | Bank Mandiri Operasional AKAP | Rp 14.000.000 | **Saldo bank langsung keluar saat itu juga** |

---

### KATEGORI 6: Anomali Breakdown Tol & Penggantian Armada (Skenario 3)

#### Kasus 6.1: Operasional Darurat Breakdown Radiator Bus SS-01 & Estafet UJ (Rollover)
* **Peristiwa:** Bus SS-01 mogok di KM 214 Tol Cipali. Bus pengganti SS-03 dikirim dari pool untuk melansir penumpang. Sisa uang jalan di tangan supir SS-01 sebesar Rp 2.000.000 diestafetkan langsung kepada supir bus pengganti SS-03.
* **Logika Pemisahan Biaya:**
  - Derek tol dan perbaikan bengkel darurat di Cirebon dibebankan ke armada yang rusak (`SS-01`).
  - Uang jalan Rp 2.000.000 berpindah tanggung jawab SPJ (dari `SPJ/AKP/2610/0001` ke `SPJ/AKP/2610/0002`).
  - Laporan laba rugi trip di `/reports/trip-profitability` memisahkan kedua bus secara transparan: Bus SS-01 mengalami defisit perbaikan, sedangkan Bus SS-03 menghasilkan laba operasional sisa perjalanan.
* **Jurnal Estafet UJ & Biaya Darurat:**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Catatan Dimensi |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `55101` | Beban Servis & Derek Darurat Armada | Rp 1.500.000 | Terikat ke Armada **SS-01** (Mogok) |
| **DEBET** | `13101` | Uang Jalan (UJ) Kru Perjalanan Bus | Rp 2.000.000 | Terikat ke SPJ Pengganti **SS-03** |
| **KREDIT**| `13101` | Uang Jalan (UJ) Kru Perjalanan Bus | Rp 3.500.000 | Menutup tanggung jawab SPJ Awal **SS-01** |

---

### KATEGORI 7: Rekonsiliasi Discrepancy Kasir & Akun Antara 11999 (Skenario 4)

#### Kasus 7.1: SPJ Tiba dengan Struk BBM Hilang Rp 300.000 (Posting ke Akun Antara)
* **Peristiwa:** Driver Budi menyerahkan UJ Rp 3.500.000: Struk BBM sah Rp 3.000.000, sisa kas kembali Rp 200.000. Namun ada selisih Rp 300.000 karena supir mengaku struk SPBU hilang tercecer di rest area.
* **Dilema Akuntansi:**
  - Kasir **dilarang** mengakui sebagai beban BBM (karena tidak ada bukti struk fisik sah).
  - Kasir juga **dilarang** menahan pembukuan SPJ sehingga tutup buku akhir bulan terblokir.
* **Solusi ERP SS Traveling:** Gunakan **Akun Antara `11999` (Selisih Kas Operasional Sementara)** di neraca.
* **Jurnal (JV Saat SPJ Disubmit Kasir):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `51101` | Beban Bahan Bakar Minyak (Solar Bus) | Rp 3.000.000 | Biaya solar sah sesuai bukti fisik struk terlampir |
| **DEBET** | `11101` | Kas Pool Ciputat | Rp 200.000 | Sisa uang fisik diterima kembali oleh kasir |
| **DEBET** | `11999` | Selisih Kas Operasional Sementara | Rp 300.000 | **Ditampung di neraca agar tutup buku tidak terblokir** |
| **KREDIT**| `13101` | Uang Jalan (UJ) Kru Perjalanan Bus | Rp 3.500.000 | Tanggung jawab UJ supir di SPJ ini dinyatakan selesai |

---

#### Kasus 7.2 (Resolusi Opsi A): Investigasi GPS Valid, Finance Manager Memberikan Dispensasi
* **Peristiwa:** FM memeriksa riwayat GPS: bus memang singgah di SPBU tersebut dan grafik jarum solar naik sesuai pembelian Rp 300.000. FM mengesahkan surat dispensasi resmi perusahaan.
* **Jurnal Penyelesaian Dispensasi (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `58101` | Beban Selisih Kasir Pool (Dispensasi) | Rp 300.000 | Disahkan sebagai beban resmi perusahaan pasca investigasi |
| **KREDIT**| `11999` | Selisih Kas Operasional Sementara | Rp 300.000 | **Akun penampung ditutup kembali menjadi Rp 0** |

---

#### Kasus 7.3 (Resolusi Opsi B): Kelalaian Kru Terbukti, Pembebanan ke Piutang Potong Gaji
* **Peristiwa:** Sebaliknya, jika supir terbukti lalai/menghilangkan uang. FM memutuskan uang Rp 300.000 wajib diganti melalui potong gaji bulan depan.
* **Jurnal Pembebanan Potong Gaji (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `12901` | Piutang Klaim Selisih Kas Kru | Rp 300.000 | Menjadi tagihan pemotong slip gaji supir bulan depan |
| **KREDIT**| `11999` | Selisih Kas Operasional Sementara | Rp 300.000 | **Akun penampung ditutup kembali menjadi Rp 0** |

---

#### Kasus 7.4 (Resolusi Opsi C): Musyawarah Meja Kasir (Kru Urunan Langsung di Tempat)
* **Peristiwa:** Kasir menemukan setoran tiket kurang Rp 200.000. Di meja kasir, Driver 1 dan Driver 2 sepakat patungan uang pribadi masing-masing Rp 100.000 tunai untuk melengkapi setoran kas saat itu juga.
* **Hasil:** Status kasir langsung **MATCHED** seketika tanpa perlu mencatat selisih di akun `11999`.

---

### KATEGORI 8: Penyesuaian Akhir Bulan & Reversal (Tutup Buku)

#### Kasus 8.1: Penyusutan Aset Armada Bus Bulanan (Depreciation Expense)
* **Peristiwa:** Nilai perolehan 10 unit bus disusutkan menggunakan metode garis lurus setiap akhir bulan (total depresiasi armada bulan ini = Rp 25.000.000).
* **Jurnal (JV):**

| Posisi | Kode Akun | Nama Akun COA | Nominal | Alasan Logis |
| :--- | :---: | :--- | :---: | :--- |
| **DEBET** | `56101` | Beban Penyusutan Armada Bus | Rp 25.000.000 | Beban keausan fisik armada diakui setiap bulan |
| **KREDIT**| `16101` | Akumulasi Penyusutan Armada Bus | Rp 25.000.000 | Akun kontra-aset neraca pengurang nilai buku bus |

---

#### Kasus 8.2: Koreksi Transaksi Salah Catat Menggunakan Jurnal Pembalik (Reversal)
* **Peristiwa:** Akuntan salah mencatat nilai transfer antar-bank atau salah memilih akun lawan.
* **Aturan Baku Audit:** Data jurnal yang sudah `POSTED` **tidak boleh di-UPDATE atau di-DELETE** dari database.
* **Solusi Sistem SS Traveling:** Eksekusi fitur **Reversal Otomatis**. Sistem otomatis menerbitkan jurnal baru yang membalik posisi akun (Debet jadi Kredit, Kredit jadi Debet) dengan referensi dokumen asal (`reversed_from_id`), sehingga saldo buku besar kembali netral (0) dengan jejak audit trail yang sempurna.

---

## 5. Tabel Cheat Sheet: Komparasi Transaksi Tunai Langsung vs Tempo

| Aktivitas Bisnis | Alur Jurnal Jika BAYAR TUNAI LANGSUNG (1 Langkah) | Alur Jurnal Jika BAYAR TEMPO / KREDIT (2 Babak) |
| :--- | :--- | :--- |
| **Beli Sparepart / Ban Bus** | **(D)** `55104` Beban Ban<br>**(K)** `11123` Bank Mandiri Ops | **Babak 1 (Tagihan Masuk):**<br>**(D)** `55104` Beban Ban<br>**(K)** `21102` Utang Bengkel<br><br>**Babak 2 (Saat Bayar):**<br>**(D)** `21102` Utang Bengkel<br>**(K)** `11123` Bank Mandiri Ops |
| **Servis Makan RM Penumpang** | **(D)** `51102` Beban Makan<br>**(K)** `13101` UJ Kru (Cash RM) | **Babak 1 (Kupon Bon Ditukar):**<br>**(D)** `51102` Beban Makan<br>**(K)** `21101` Utang Restoran Mitra<br><br>**Babak 2 (Transfer Akhir Bulan):**<br>**(D)** `21101` Utang Restoran Mitra<br>**(K)** `11121` Bank BCA Ops AKAP |
| **Penjualan Tiket Bus** | **(D)** `11101` Kas Pool Ciputat<br>**(K)** `41101` Pendapatan Tiket | **Babak 1 (Terjual via Agen Terminal):**<br>**(D)** `12103` Piutang Agen & `54101` Komisi<br>**(K)** `41101` Pendapatan Tiket<br><br>**Babak 2 (Agen Setor Mingguan):**<br>**(D)** `11121` Bank BCA Ops<br>**(K)** `12103` Piutang Agen |
| **Sewa Bus Pariwisata** | *(Jarang ada sewa wisata tanpa DP/kontrak)* | **Babak 1 (Penyewa Bayar DP 30%):**<br>**(D)** `11111` Bank BCA Induk<br>**(K)** `24101` DP Diterima di Muka<br><br>**Babak 2 (Pelunasan 70% & Trip Selesai):**<br>**(D)** `11111` Bank BCA Induk (70%)<br>**(D)** `24101` DP Diterima di Muka (30%)<br>**(K)** `42101` Pendapatan Wisata (100%) |
| **Beli Sabun Cuci / ATK Garasi** | **(D)** `52103` / `57110` Beban Ops<br>**(K)** `11101` Kas Pool (BKK) | *(Kas kecil pool selalu dibayar tunai langsung)* |
| **Selisih Kasir Meja Rekonsiliasi** | **(D)** `11101` Kas Pool (Kru urunan langsung)<br>**(K)** `41101` Pendapatan Tiket *(Status Matched)* | **Babak 1 (Struk Hilang Ditampung):**<br>**(D)** `11999` Selisih Operasional<br>**(K)** `13101` Uang Jalan Kru<br><br>**Babak 2 (Dispensasi Resmi FM):**<br>**(D)** `58101` Beban Selisih Kasir<br>**(K)** `11999` Selisih Operasional |

---
*Dokumen ini merupakan bagian terintegrasi dari modul akuntansi `ss-travel-backend` dan antarmuka `/journals`, `/cashier`, `/ar-invoices`, `/ap-invoices`, dan `/treasury` di `ss-travel-frontend`.*
