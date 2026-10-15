# Test Case Skenario 3: Anomali AKAP — Emergency Breakdown & Penggantian Armada di Tol (Siklus Keuangan & Operasional Penuh)

**Versi:** 1.0  
**Tanggal Penguncian:** 14 Oktober 2026  
**Status:** Terverifikasi & Dikunci (Locked Specification)  
**Referensi:** Blueprint v1.3 (Bab 7.2, Bab 9.1), Addendum v1.1 (Poin 1), Addendum v1.2 (Poin 6), Addendum v1.10  

---

## 1. Profil Simulasi Pengujian
* **Jenis Layanan:** AKAP Reguler Keberangkatan (Leg 1: Pool Ciputat $\to$ Terminal Giwangan Yogyakarta)
* **Kasus Darurat:** Armada awal Bus `SS-01` mengalami kerusakan teknis fatal (radiator pecah & overheat mesin) di KM 214 Tol Cipali saat mengangkut 24 penumpang.
* **Armada Terlibat:**
  1. **Armada Asal (Mogok):** Bus `SS-01` (Nopol: `B 7123 SS`, Tipe Combi 24 Pax)
  2. **Armada Pengganti (Storing):** Bus `SS-03` (Nopol: `B 7345 SS`, Tipe Executive 28 Pax)
* **Personel Kru Terlibat:**
  * Driver 1: Pak Budi (`users.id` / `CREW_DRIVER`)
  * Driver 2: Pak Joko (`users.id` / `CREW_DRIVER`)
  * Kondektur: Mas Anto (`users.id` / `CREW_CONDUCTOR`)
  * Mekanik / Driver Storing Kantor: Mas Eko (`users.id` / `CREW_DRIVER` / Mekanik Garasi)
* **Karakteristik Penumpang (Manifes 24 Pax — 100% Okupansi Awal):**
  * Tiket Online OTA (RedBus/Traveloka): 12 Pax = Rp 3.000.000 (Piutang AR OTA)
  * Tiket Agen Offline Terminal: 8 Pax = Rp 2.000.000 (Piutang Agen Offline)
  * Tiket Tunai Langsung Dipegang Kru: 4 Pax = Rp 1.000.000 (Kas tunai dipegang kru)
  * Kargo Bagasi Motor (`CARGO_MOTORCYCLE`): 1 Unit = Rp 350.000 (Kas tunai dipegang kru; komisi kru 20% = Rp 70.000)
  * **Total Omzet Bruto Muatan:** **Rp 6.350.000**
  * **Uang Tunai Perusahaan di Tangan Kru:** Rp 1.000.000 + Rp 350.000 = **Rp 1.350.000**

---

## 2. Alur Transaksi & Tahapan Operasional

### Tahap 1: Keberangkatan Awal & Penerbitan SPJ Utama (Bus SS-01)
* **Nomor Dokumen SPJ Utama:** `SPJ/AKP/2610/0001`
* **Status Awal:** `operational_status`: **`ISSUED`** $\to$ **`IN_PROGRESS`**, `financial_status`: **`PENDING_SETTLEMENT`**.
* **Pencairan Uang Jalan (UJ) Awal Bus SS-01:**
  * Kasir Pool Ciputat mencairkan uang tunai Rp 3.500.000 kepada Driver 1 Pak Budi (`spj_uj_disbursements`).
  * **Jurnal Akuntansi #1 (Pencairan UJ Awal Bus SS-01):**
    | No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
    | :--- | :--- | :---: | :---: | :--- |
    | **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Debit** | 3.500.000 | `SPJ/AKP/2610/0001`, `SS-01`, Driver 1 |
    | **11101** | Kas Operasional Pool (Ciputat) | **Kredit** | 3.500.000 | Kasir Pool Ciputat |

---

### Tahap 2: Perjalanan Normal s.d. Titik Insiden (Ciputat $\to$ Tol Cipali KM 214)
Sebelum insiden terjadi, kru telah membelanjakan sebagian UJ untuk kebutuhan jalan:
1. BBM Solar Bus awal (SPBU Tol Jakarta–Cikampek): **Rp 1.100.000** *(disertai foto struk SPBU & odometer)*.
2. Top-up E-Toll Tol Trans Jawa (Gerbang Cikarang Utama s.d. Palimanan): **Rp 400.000**.
> **Total Pengeluaran Riil Bus SS-01 Sebelum Mogok:** **Rp 1.500.000**  
> **Sisa UJ Fisik di Tangan Kru Saat Mogok:** Rp 3.500.000 - Rp 1.500.000 = **Rp 2.000.000**

---

### Tahap 3: Terjadinya Breakdown & Tindakan Darurat Lapangan
* **Insiden di KM 214 Tol Cipali:**
  * Mesin bus `SS-01` mengeluarkan asap tebal, temperatur *high*, radiator jebol.
  * Driver 1 menepikan bus ke bahu jalan tol secara aman, memasang segitiga pengaman, dan segera melapor ke Hotline Dispatcher Kantor Pusat.
* **Prosedur Darurat Dispatcher (`OPS_ADMIN`):**
  1. Dispatcher memverifikasi ketersediaan armada cadangan dan menugaskan Mas Eko (Mekanik Garasi) membawa bus cadangan `SS-03` meluncur ke lokasi tol.
  2. Dispatcher menghubungi Derek Resmi Patroli Jalan Tol (Jasamarga) untuk mengevakuasi unit `SS-01` keluar gerbang tol terdekat ke bengkel rekanan di Cirebon.

---

### Tahap 4: Langsir Penumpang & Penerbitan SPJ Pengganti (`parent_spj_id`)
* **Kedatangan Bus Pengganti `SS-03` di KM 214:**
  * 24 penumpang beserta seluruh barang bawaan dan 1 unit motor matic dipindahkan (*cross-load*) dengan aman ke kabin dan bagasi bus `SS-03`.
* **Prosedur Kru & Estafet Penugasan:**
  * **SOP SS Traveling (Kru Utama Lanjut):** Kru utama (Pak Budi, Pak Joko, Mas Anto) berpindah mengemudikan bus pengganti `SS-03` untuk mengantarkan penumpang sampai ke Terminal Giwangan Yogyakarta.
  * Mas Eko (Mekanik) tetap tinggal di lokasi untuk mengawal proses towing bus `SS-01` ke bengkel rekanan.
* **Penerbitan Dokumen SPJ Pengganti di Sistem:**
  * Nomor Dokumen: **`SPJ/AKP/2610/0002`** (Bus `SS-03`).
  * Field Penghubung Wajib: **`parent_spj_id = SPJ/AKP/2610/0001`** (otomatis membentuk ikatan `journey_group_id`).
  * **Pengalihan Manifes Tanpa Duplikasi Omzet (*Anti-Double Revenue*):**
    * Manifes 24 Pax ditandai sebagai `TRANSFERRED_FROM_PARENT`.
    * Sistem mengunci agar omzet tiket (Rp 6.000.000) dan kargo (Rp 350.000) **tidak diakui dua kali** di buku akuntansi.
* **Penutupan Operasional SPJ Lama (`SS-01`):**
  * `operational_status`: Diubah dari `IN_PROGRESS` menjadi **`COMPLETED`** (dengan catatan: *Armada digantikan di KM 214 Cipali*).
  * `financial_status`: Tetap **`UNDER_REVIEW`** (karena biaya jalan dan sisa UJ masih harus dipertanggungjawabkan).

---

### Tahap 5: Penanganan Finansial Estafet UJ & Biaya Derek Darurat

#### A. Penanganan Uang Jalan Lanjutan (Handover UJ Lapangan)
* Sisa fisik UJ bus lama Rp 2.000.000 dan uang setoran tunai Rp 1.350.000 **tetap dipegang oleh Kru Utama (Pak Budi)** yang berpindah ke bus `SS-03`.
* Di sistem, Dispatcher mencatat mutasi serah terima UJ (*UJ Rollover / Handover*):
  * Saldo sisa UJ Rp 2.000.000 dialihkan secara resmi dari `SPJ/AKP/2610/0001` ke `SPJ/AKP/2610/0002`.
  * SPJ lama (`SS-01`) mencatatkan pengeluaran sah Rp 1.500.000 + transfer keluar UJ Rp 2.000.000 = **Rp 3.500.000** $\to$ Saldo UJ SPJ-001 menjadi **`BALANCED` (Rp 0)** ✅.
  * SPJ baru (`SS-03`) menerima saldo awal UJ sebesar **Rp 2.000.000** (`disbursement_type = ROLLOVER_FROM_PARENT`).
* **Jurnal Akuntansi #2 (Handover Sisa UJ Antar-SPJ):**
  | No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
  | :--- | :--- | :---: | :---: | :--- |
  | **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Debit** | 2.000.000 | Dimensi: `SPJ-002`, `SS-03`, Driver 1 |
  | **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Kredit** | 2.000.000 | Dimensi: `SPJ-001`, `SS-01`, Driver 1 |

#### B. Biaya Derek Resmi Tol & Perbaikan Bengkel Rekanan Cirebon
1. **Biaya Derek Resmi Tol Jasamarga (Dibayar Tunai di Tempat):**
   * Derek tol dari KM 214 ke pintu tol Cirebon Barat: **Rp 1.500.000**.
   * Dibayar oleh Mas Eko menggunakan dana Kas Kecil Storing kantor (`cash_transactions`).
   * **Pemetaan Akun:** Didebitkan ke **`55101 Beban Perawatan, Perbaikan, & Derek Armada`** dengan dimensi **`vehicle_id = SS-01`** (bukan beban bus `SS-03`).
2. **Tagihan Servis Radiator Bengkel Rekanan Cirebon (Tempo / AP Vendor):**
   * Bengkel Rekanan "Cirebon Diesel Motor" menerbitkan nota perbaikan dan penggantian kisi radiator: **Rp 2.500.000**.
   * Diinput oleh Finance AR/AP ke modul tagihan vendor tempo (`ap_invoices`).
   * **Pemetaan Akun:**
     * Debit: **`55101 Beban Perawatan & Perbaikan Armada`** (Dimensi: `SS-01`, Cost Center: Bengkel).
     * Kredit: **`21102 Utang Vendor Suku Cadang & Bengkel Rekanan`** (Vendor: Cirebon Diesel Motor).

---

### Tahap 6: Penyelesaian Perjalanan Bus SS-03 di Yogyakarta
* Bus `SS-03` tiba di Terminal Giwangan Yogyakarta dengan selamat. Seluruh 24 penumpang dan motor tiba sesuai tujuan.
* **Pengeluaran Riil Tambahan Bus SS-03 di Perjalanan (dari UJ Rp 2.000.000):**
  1. Top-up E-Toll lanjutan (Cirebon s.d. Brebes Timur & Bawen): **Rp 500.000**.
  2. Tambahan Solar Bus di Tol Semarang: **Rp 600.000**.
  3. Parkir & Retribusi Terminal Giwangan: **Rp 50.000**.
  > **Total Pengeluaran Riil Bus SS-03:** **Rp 1.150.000**  
  > **Sisa Fisik UJ di Tangan Kru:** Rp 2.000.000 - Rp 1.150.000 = **Rp 850.000** *(Wajib dikembalikan ke kasir)*.

---

### Tahap 7: Kedatangan di Garasi & Rekonsiliasi Kasir Pool (Anti-Netting)
Saat kru kembali ke Pool Ciputat:
* **Rekonsiliasi SPJ Pengganti (`SPJ/AKP/2610/0002`):**
  1. **Kantong 1 (UJ Kru):**
     * Plafon UJ yang diterima: Rp 2.000.000.
     * Nota sah yang diserahkan: Rp 1.150.000.
     * Sisa fisik UJ diserahkan tunai ke kasir pool (`spj_uj_returns`): **Rp 850.000**.
     * *Rumus:* $2.000.000 - 1.150.000 - 850.000 = 0 \to$ Status UJ: **`BALANCED`** ✅.
  2. **Kantong 2 (Setoran Kas Bruto Perusahaan):**
     * Tiket tunai 4 Pax (Rp 1.000.000) + Kargo motor bruto (Rp 350.000) = **Rp 1.350.000** diserahkan utuh 100% ke laci kasir pool $\to$ Status Penerimaan: **`MATCHED`** ✅.
* **Pencetakan Bukti Kas Kasir:**
  * **Bukti Kas Masuk (BKM):** Terima sisa UJ (Rp 850.000) + Setoran Kas (Rp 1.350.000) = **Rp 2.200.000** tunai masuk ke laci kasir pool.
  * **Bukti Kas Keluar (BKK):** Pembayaran hak tunai kru:
    * Uang Makan Kru Leg 1: Rp 200.000 (Driver 1: 75rb, Driver 2: 75rb, Kondektur: 50rb).
    * Bonus Full Seat Kru Leg 1 (24 Pax): Rp 150.000.
    * Komisi Kargo Kru (20% x Rp 350.000): Rp 70.000.
    * Total BKK Tunai Dibayarkan ke Kru: **Rp 420.000**.

---

### Tahap 8: Verifikasi Akuntansi & Posting Jurnal Akhir Grup Perjalanan

Akuntan melakukan verifikasi atas seluruh dokumen grup perjalanan. Jurnal diposting secara atomik dan terikat dimensi:

#### A. Jurnal SPJ Lama (`SPJ/AKP/2610/0001` - Bus SS-01)
| No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
| :--- | :--- | :---: | :---: | :--- |
| **51101** | Beban Bahan Bakar Minyak (Solar Bus) | **Debit** | 1.100.000 | Dimensi: `SPJ-001`, `Bus SS-01` |
| **52101** | Beban Tol / Top-up E-Toll Perjalanan | **Debit** | 400.000 | Dimensi: `SPJ-001`, `Bus SS-01` |
| **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Debit** | 2.000.000 | Alokasi transfer saldo UJ ke SPJ-002 |
| **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Kredit** | 3.500.000 | Tutup saldo UJ awal `SPJ-001` |
*Status Invariant SPJ-001: Total Debit Rp 3.500.000 = Total Kredit Rp 3.500.000 (**BALANCED**) ✅.*

#### B. Jurnal SPJ Pengganti (`SPJ/AKP/2610/0002` - Bus SS-03)
| No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
| :--- | :--- | :---: | :---: | :--- |
| **11101** | Kas Operasional Pool (Terima Fisik Kasir) | **Debit** | 2.200.000 | Sisa UJ (850rb) + Setoran Kas (1.35jt) |
| **51101** | Beban Bahan Bakar Minyak (Solar Bus) | **Debit** | 600.000 | Dimensi: `SPJ-002`, `Bus SS-03` |
| **52101** | Beban Tol / Top-up E-Toll Perjalanan | **Debit** | 500.000 | Dimensi: `SPJ-002`, `Bus SS-03` |
| **52103** | Beban Parkir & Retribusi Terminal | **Debit** | 50.000 | Dimensi: `SPJ-002`, `Bus SS-03` |
| **53101** | Beban Uang Makan Kru Bus | **Debit** | 200.000 | Dimensi: `SPJ-002` |
| **53102** | Beban Premi / Insentif Ritase Kru | **Debit** | 325.000 | Hak Premi 1 Rit (ke payroll) |
| **53103** | Beban Bonus Full Seat Kru | **Debit** | 150.000 | Dimensi: `SPJ-002` (Okupansi 100%) |
| **53104** | Beban Komisi / Insentif Kargo Kru | **Debit** | 70.000 | Dimensi: `SPJ-002` (20% omzet kargo) |
| **54102** | Beban Uang Jasa Koordinator Lapangan | **Debit** | 240.000 | Korlap Barat: 24 pax x Rp 10.000 |
| **12102** | Piutang Agen Penjualan Online (AR OTA) | **Debit** | 3.000.000 | RedBus/Traveloka (12 Pax @ 250rb) |
| **12101** | Piutang Agen Penjualan Tiket Offline | **Debit** | 2.000.000 | Loket Agen (8 Pax @ 250rb) |
| | | | | |
| **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Kredit** | 2.000.000 | Tutup saldo UJ rollover SPJ-002 |
| **41101** | Pendapatan Tiket AKAP Reguler | **Kredit** | 6.000.000 | 100% omzet 24 Pax (Diakui 1x sah) |
| **43101** | Pendapatan Kargo & Paket Bagasi Bus | **Kredit** | 350.000 | Omzet bruto paket motor |
| **11101** | Kas Operasional Pool (Bayar Hak Tunai) | **Kredit** | 420.000 | Makan (200rb) + Bonus (150rb) + Kargo (70rb) |
| **23101** | Utang Kompensasi Kru | **Kredit** | 325.000 | Premi ritase kru (payroll) |
| **22102** | Utang Jasa Koordinator Lapangan | **Kredit** | 240.000 | Hak Korlap Barat (24 pax x 10rb) |

* **Invariant Check Jurnal SPJ-002:**
  * **Total Debit:**  
    $$2.200.000 + 600.000 + 500.000 + 50.000 + 200.000 + 325.000 + 150.000 + 70.000 + 240.000 + 3.000.000 + 2.000.000 = \mathbf{Rp\ 9.335.000}$$
  * **Total Kredit:**  
    $$2.000.000 + 6.000.000 + 350.000 + 420.000 + 325.000 + 240.000 = \mathbf{Rp\ 9.335.000}$$
  * **Status Invariant:** **SEIMBANG (BALANCED)** ✅
  * **Saldo Akhir UJ:** **Rp 0** (Tuntas).

---

## 3. Laporan Laba Rugi: Analisis Multi-Dimensi (Per Bus vs Per Journey Group)

Sistem membuktikan keunggulan arsitektur multi-dimensi dengan menyajikan 2 sudut pandang laporan tanpa distorsi:

### A. Sudut Pandang Per Armada Bus (`vehicle_id`)
* **Armada Bus `SS-01` (Bus Rusak):**
  * Pendapatan Operasional: Rp 0 (karena dialihkan ke bus penyelesai perjalanan).
  * Beban BBM Solar Tol Awal: (Rp 1.100.000)
  * Beban Tol Trans Jawa Awal: (Rp 400.000)
  * Beban Derek Resmi Tol: (Rp 1.500.000)
  * Beban Servis Radiator Bengkel Cirebon: (Rp 2.500.000)
  * **Total Defisit Finansial Bus SS-01:** **-Rp 5.500.000** *(Tercatat transparan pada buku riwayat aset SS-01!)*
* **Armada Bus `SS-03` (Bus Pengganti):**
  * Pendapatan Bruto (Tiket + Kargo): Rp 6.350.000
  * Beban Langsung (BBM Solar Lanjutan): (Rp 600.000)
  * Beban Tol Trans Jawa Lanjutan: (Rp 500.000)
  * Beban Retribusi Terminal: (Rp 50.000)
  * Beban Hak Kru (Makan + Premi + Bonus + Kargo): (Rp 745.000)
  * Beban Fee Koordinator Barat: (Rp 240.000)
  * **Kontribusi Margin Bus SS-03:** **+Rp 4.215.000**

### B. Sudut Pandang Grup Perjalanan Gabungan (`journey_group_id`)
Untuk Direksi dan Manajemen Operasional, sistem menyajikan rekap utuh 1 perjalanan ekonomi:
* **Total Pendapatan Perjalanan:** **Rp 6.350.000**
* **Total Beban Langsung Operasional (SS-01 + SS-03):**  
  $$\text{BBM (1.7jt)} + \text{Tol (900rb)} + \text{Parkir (50rb)} + \text{Hak Kru (745rb)} + \text{Korlap (240rb)} = \mathbf{Rp\ 3.635.000}$$
* **Laba Kontribusi Operasional Perjalanan (*Trip Operating Margin*):**  
  $$\text{Rp } 6.350.000 - \text{Rp } 3.635.000 = \mathbf{+\text{Rp } 2.715.000} \quad (\approx 42.75\%)$$
* **Beban Insidental Kerusakan Armada (Derek + Bengkel):** *(Rp 4.000.000)*
* **Hasil Bersih Akhir Pasca-Insiden:** $-\text{Rp } 1.285.000$ *(Tercatat jelas membedakan antara performa operasional perjalanan vs kerugian insidental kerusakan armada)*.

---

## 4. Spesifikasi Terkunci: Penanganan Teknis Kasus Breakdown

1. **Aturan Penautan `parent_spj_id`:**
   * Setiap kali bus pengganti diterbitkan di jalan, kolom `spjs.parent_spj_id` wajib diisi dengan ID SPJ armada awal.
   * Kueri laporan manajemen wajib mengelompokkan data berdasarkan `COALESCE(spjs.parent_spj_id, spjs.id)` sebagai identifier perjalanan ekonomi.
2. **Proteksi Anti-Double Revenue:**
   * Manifes penumpang yang disalin ke SPJ baru memiliki atribut `is_revenue_recognized = false` pada SPJ pengganti jika sudah diakui di SPJ induk, atau diakui utuh pada SPJ pengganti dengan menonaktifkan pengakuan di SPJ induk. Sistem mencegah pengakuan ganda secara ketat di backend.
3. **Pemisahan Dimensi Biaya Perbaikan:**
   * Biaya derek (`towing`) dan jasa bengkel darurat **wajib** menggunakan `vehicle_id` kendaraan yang rusak (`SS-01`) dan `cost_center` divisi pemeliharaan/bengkel. Biaya ini dilarang diatribusikan ke kendaraan pengganti (`SS-03`).
4. **Alur Estafet Saldo UJ (*UJ Rollover*):**
   * Pengalihan sisa fisik dana UJ dari SPJ lama ke SPJ baru dilakukan melalui transaksi resmi `UJ_ROLLOVER`.
   * Saldo UJ SPJ lama berkurang dan terkunci seimbang (`BALANCED`), sementara SPJ baru memulai dinas dengan saldo awal setara sisa dana yang dialihkan tanpa perlu transfer uang tunai baru dari kasir pool jika dana masih mencukupi.
