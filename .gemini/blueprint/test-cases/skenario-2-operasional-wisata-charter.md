# Test Case Skenario 2: Operasional Sewa Bus Pariwisata / Charter Multi-Day & Siklus Finansial Penuh

**Versi:** 1.0  
**Tanggal Penguncian:** 13 Oktober 2026  
**Status:** Terverifikasi & Dikunci (Locked Specification)  
**Referensi:** Blueprint v1.3 & Addendum v1.1 – v1.11  

---

## 1. Profil Simulasi Pengujian
* **Jenis Layanan:** Pariwisata / Sewa Kontrak Charter (*Multi-Day Tour*)
* **Durasi Penugasan:** 5 Hari 4 Malam (5-Day Tour)
* **Armada:** Bus `SS-02` (Nopol: `B 7234 SS`)
  * **Tipe Armada:** Big Bus Pariwisata
  * **Konfigurasi Kursi:** *Luxury Seat 2-1* (30 Kursi Penumpang)
* **Rute Perjalanan Wisata:**
  * Pool Ciputat / Tangerang $\to$ Wisata DIY & Jawa Tengah (Candi Borobudur, Malioboro, Candi Prambanan, Tebing Breksi, Solo) $\to$ Kembali ke Pool Ciputat
* **Personel Kru Terlibat:**
  * Driver 1: Pak Hendra (`users.id` / `CREW_DRIVER`)
  * Driver 2: Pak Agus (`users.id` / `CREW_DRIVER`)
  * Kondektur / Helper: Mas Doni (`users.id` / `CREW_CONDUCTOR`)
* **Penyewa / Pelanggan (*Customer*):**
  * Nama Instansi: PT Mitra Sejahtera Abadi (`customers.id` / B2B Corporate Client)
  * Nilai Kontrak Sewa Paket (5 Hari): **Rp 17.500.000** (Rp 3.500.000 / hari)
  * Ketentuan Pembayaran: Uang Muka (DP) 30% saat booking, Pelunasan 70% ditransfer sebelum kepulangan armada.

---

## 2. Alur Transaksi & Tahapan Operasional

### Tahap 1: Booking Charter, Uang Muka (DP) & Penerbitan SPJ Wisata
* **Aktor:** `FINANCE_AR_AP` dan `OPS_ADMIN` (Dispatcher)
* **Penerimaan DP Sewa 30% (H-7 Keberangkatan):**
  * Klien mentransfer dana DP sebesar $30\% \times \text{Rp } 17.500.000 = \textbf{Rp 5.250.000}$ ke rekening korporat PT SS Traveling (`11104 Bank BCA Operasional`).
  * **Jurnal Akuntansi #1 (Penerimaan DP Sewa Wisata):**
    | No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
    | :--- | :--- | :---: | :---: | :--- |
    | **11104** | Bank Operasional Perusahaan (BCA) | **Debit** | 5.250.000 | Mutasi Bank Masuk DP PT Mitra Sejahtera |
    | **24101** | Pendapatan Diterima di Muka (DP Sewa Wisata) | **Kredit** | 5.250.000 | Liabilitas Kontrak Charter SS-02 |
* **Penerbitan Dokumen SPJ Wisata (H-1 Keberangkatan):**
  * Nomor Dokumen SPJ: `SPJ/WIS/2610/0001`
  * Status Awal: `operational_status`: **`ISSUED`**, `financial_status`: **`PENDING_SETTLEMENT`**.
* **Otomasi *Rate Snapshotting* Harian Kru (`crew_rate_rules` $\to$ `crew_meal_payments`):**
  * Menggunakan aturan master tarif penugasan pariwisata berbasis harian (`rate_type = PER_DAY`, 5 Hari):
    * **Uang Makan Kru (5 Hari):**
      * Driver 1: 5 hari $\times$ Rp 100.000 = Rp 500.000
      * Driver 2: 5 hari $\times$ Rp 100.000 = Rp 500.000
      * Kondektur: 5 hari $\times$ Rp 75.000 = Rp 375.000
      * **Total Hak Uang Makan Kru:** **Rp 1.375.000**
    * **Premi Ritase Wisata Kru (5 Hari):**
      * Driver 1: 5 hari $\times$ Rp 150.000 = Rp 750.000
      * Driver 2: 5 hari $\times$ Rp 150.000 = Rp 750.000
      * Kondektur: 5 hari $\times$ Rp 100.000 = Rp 500.000
      * **Total Hak Premi Wisata Kru:** **Rp 2.000.000**

---

### Tahap 2: Pencairan Uang Jalan (UJ) Awal
* **Aktor:** `POOL_CASHIER` (Kasir Pool Ciputat)
* **Pencairan Tunai Awal (Baris 1 `INITIAL`):** Kasir pool menyerahkan uang tunai Rp 6.000.000 kepada Driver 1 (`spj_uj_disbursements`).
* **Status UJ:** `spj_uj` berubah menjadi **`DISBURSED`**.
* **Jurnal Akuntansi #2 (Pencairan UJ Awal Wisata):**
  | No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
  | :--- | :--- | :---: | :---: | :--- |
  | **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Debit** | 6.000.000 | `SPJ/WIS/2610/0001`, Driver 1 |
  | **11101** | Kas Operasional Pool (Ciputat) | **Kredit** | 6.000.000 | Kasir Pool Ciputat |

---

### Tahap 3: Operasional Tour Lapangan (Hari 1 s.d. Hari 5)
Status operasional: `operational_status`: **`IN_PROGRESS`**.

#### A. Pengeluaran Riil Operasional dari Uang Jalan Kru (`spj_expenses`)
Selama tour 5 hari mengelilingi destinasi wisata Jawa Tengah & Yogyakarta, kru membayar biaya operasional jalan secara tertib:
1. BBM Solar Bus (Pertamina Dex/Bio Solar Industri): **Rp 3.200.000** *(disertai foto struk SPBU & odometer)*.
2. Top-up E-Toll Trans Jawa (PP Jakarta–Semarang–Solo–Yogya): **Rp 1.500.000**.
3. Retribusi Parkir Khusus Kawasan Wisata (Borobudur, Prambanan, Malioboro, Breksi): **Rp 450.000**.
4. Biaya Cuci Bus & Fasilitas Armada (2x pencucian selama tour): **Rp 150.000**.
5. Biaya Homestay / Penginapan Kru (Malam ke-2 & ke-3 karena panitia tidak sediakan kamar kru): **Rp 300.000**.
> **Total Pengeluaran Riil Terverifikasi dari UJ:** **Rp 5.600.000**

#### B. Penambahan UJ Darurat di Perjalanan (Hari ke-3)
* **Kondisi:** Pada Hari ke-3 di Yogyakarta, rute bertambah atas permintaan rombongan sehingga perkiraan sisa UJ menipis.
* **Proses Tambahan UJ (Baris 2 `ADDITIONAL`):** Driver 1 mengajukan penambahan UJ Rp 1.000.000 via WhatsApp kepada Dispatcher. Dispatcher menyetujui, dan Finance mencairkan dana via transfer bank (`11104 Bank BCA Operasional`) langsung ke rekening Driver 1.
* **Total Plafon UJ yang Dipegang Kru:** $\text{Rp } 6.000.000 + \text{Rp } 1.000.000 = \textbf{Rp 7.000.000}$.
* **Jurnal Akuntansi #3 (Pencairan Tambahan UJ via Bank):**
  | No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
  | :--- | :--- | :---: | :---: | :--- |
  | **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Debit** | 1.000.000 | `SPJ/WIS/2610/0001`, Driver 1 |
  | **11104** | Bank Operasional Perusahaan (BCA) | **Kredit** | 1.000.000 | Transfer Bank ke Driver 1 |

> **Posisi Fisik UJ di Tangan Kru Saat Tour Berakhir:**  
> Total Plafon UJ (Rp 7.000.000) - Total Pengeluaran Riil (Rp 5.600.000) = **Rp 1.400.000** *(Sisa fisik wajib dikembalikan)*.

#### C. Fitur Khusus Wisata: Pencairan Sebagian Premi Kru di Tengah Jalan (*Mid-Trip Early Payout*)
* **Kebutuhan Lapangan (Addendum v1.8 Poin 4):** Pada Hari ke-3, Driver 1 dan Driver 2 mengajukan pencairan sebagian premi ritase masing-masing sebesar Rp 400.000 untuk dikirimkan kepada keluarga di rumah.
* **Eksekusi Kasir/Finance:** Finance mentransfer total Rp 800.000 dari Bank BCA Operasional dan mencatatnya sebagai pencairan di muka atas baris `crew_meal_payments`:
  * Driver 1: Menerima transfer Rp 400.000 (dari total hak premi Rp 750.000).
  * Driver 2: Menerima transfer Rp 400.000 (dari total hak premi Rp 750.000).
* **Jurnal Akuntansi #4 (Pencairan Sebagian Premi Kru di Jalan):**
  | No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
  | :--- | :--- | :---: | :---: | :--- |
  | **53102** | Beban Premi / Insentif Kru Bus | **Debit** | 800.000 | `SPJ/WIS/2610/0001`, Driver 1 & 2 |
  | **11104** | Bank Operasional Perusahaan (BCA) | **Kredit** | 800.000 | Transfer Bank hak kru di jalan |
* **Proteksi Sistem Anti-Dobel Bayar:**  
  Sistem otomatis memperbarui status baris premi kru menjadi `PARTIALLY_PAID` dan menghitung sisa plafon premi yang belum dibayarkan:
  $$\text{Sisa Hak Premi Kru} = \text{Rp } 2.000.000 - \text{Rp } 800.000 = \mathbf{Rp\ 1.200.000}$$

#### D. Pelunasan Kontrak Sewa oleh Klien (Hari ke-4 / H-1 Kepulangan)
* **Penerbitan Invoice AR Pelunasan:** Finance AR menerbitkan invoice pelunasan `INV/WIS/2610/0001` sebesar 70% sisa kontrak = **Rp 12.250.000**.
* **Penerimaan Transfer Bank Pelunasan:** Klien PT Mitra Sejahtera Abadi melunasi transfer ke Bank BCA Operasional (`11104`).
* **Jurnal Akuntansi #5 (Pelunasan Piutang Sewa Charter Wisata):**
  | No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
  | :--- | :--- | :---: | :---: | :--- |
  | **11104** | Bank Operasional Perusahaan (BCA) | **Debit** | 12.250.000 | Pelunasan Invoice PT Mitra Sejahtera |
  | **12101** | Piutang Sewa Charter Bus Wisata | **Kredit** | 12.250.000 | Tutup Saldo Invoice Pelunasan |

---

### Tahap 4: Kedatangan di Garasi & Rekonsiliasi Kas Kasir (Hari ke-5)
* **Aktor:** `CREW_DRIVER` dan `POOL_CASHIER`
* Bus tiba kembali di Pool Ciputat dengan selamat $\to$ `operational_status`: **`COMPLETED`**, `financial_status`: **`UNDER_REVIEW`**.
* **Penyelesaian Dua Kantong Saldo Terpisah (Anti-Netting):**
  1. **Kantong 1: Pertanggungjawaban UJ Kru**
     * Menyerahkan nota pengeluaran operasional sah: Rp 5.600.000.
     * Mengembalikan fisik sisa UJ ke laci kasir pool (`spj_uj_returns`): **Rp 1.400.000**.
     * *Rumus Rekonsiliasi UJ:*
       $$\text{Saldo UJ} = \text{Rp } 7.000.000 - \text{Rp } 5.600.000 - \text{Rp } 1.400.000 = \mathbf{0}$$
       Status UJ: **`BALANCED`** ✅.
  2. **Kantong 2: Penerimaan Bruto Perusahaan yang Dipegang Kru**
     * Pada perjalanan sewa pariwisata, seluruh pembayaran sewa dilakukan 100% transfer non-tunai langsung ke rekening bank kantor oleh penyewa. Kru bus tidak memegang setoran uang sewa maupun tiket tunai sama sekali.
     * Penerimaan fisik kru: Rp 0, Target setoran kru: Rp 0 $\to$ Status Penerimaan: **`MATCHED`** ✅.
* **Penyelesaian Pembayaran Hak Kru via Kasir Pool:**
  * **Bukti Kas Masuk (BKM):** Kasir menerima pengembalian sisa UJ tunai: **Rp 1.400.000** fisik masuk ke laci kasir pool.
  * **Bukti Kas Keluar (BKK):** Pembayaran hak kru di pool:
    * **Uang Makan Kru (5 Hari):** Dibayarkan tunai 100% = **Rp 1.375.000** kepada 3 kru.
    * **Sisa Premi Ritase Kru:** Sisa bersih yang belum dibayarkan = **Rp 1.200.000** (dialokasikan ke rekap payroll `23101 Utang Kompensasi Kru` atau dibayar tunai via kasir pool).

---

### Tahap 5: Verifikasi Akuntansi & Posting Jurnal SPJ Wisata
* **Aktor:** `ACCOUNTANT`
* Akuntan memvalidasi kelengkapan berkas SPJ wisata $\to$ `financial_status`: **`SETTLED`**.
* **Prinsip Akrual Pengakuan Pendapatan:**  
  Karena seluruh perjalanan tour 5 hari telah selesai tuntas (`operational_status = COMPLETED`), liabilitas **Pendapatan Diterima di Muka (DP)** sebesar Rp 5.250.000 dan piutang sewa diakui secara definitif sebagai **Pendapatan Sewa Bus Pariwisata / Charter** sebesar Rp 17.500.000.
* **Jurnal Rekonsiliasi Akhir SPJ Wisata (Diposting Otomatis via `AccountingPostingService`):**
  | No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
  | :--- | :--- | :---: | :---: | :--- |
  | **11101** | Kas Operasional Pool | **Debit** | 1.400.000 | Fisik sisa UJ diterima kasir pool |
  | **24101** | Pendapatan Diterima di Muka (DP Sewa Wisata) | **Debit** | 5.250.000 | Pembebasan DP menjadi pendapatan |
  | **12101** | Piutang Sewa Charter Bus Wisata | **Debit** | 12.250.000 | Pengakuan hak piutang kontrak sewa |
  | **51101** | Beban Bahan Bakar Minyak (Solar Bus) | **Debit** | 3.200.000 | Dimensi: `SPJ-WIS-001`, `Bus SS-02` |
  | **52101** | Beban Tol / Top-up E-Toll Perjalanan | **Debit** | 1.500.000 | Dimensi: `SPJ-WIS-001`, `Bus SS-02` |
  | **52102** | Beban Parkir Objek Wisata & Penginapan Kru | **Debit** | 750.000 | Parkir 450rb + Homestay 300rb |
  | **52103** | Beban Cuci Bus & Perlengkapan Armada | **Debit** | 150.000 | Dimensi: `SPJ-WIS-001`, `Bus SS-02` |
  | **53101** | Beban Uang Makan Kru Bus | **Debit** | 1.375.000 | Dimensi: `SPJ-WIS-001` (5 Hari x 3 Kru) |
  | **53102** | Beban Premi / Insentif Kru Bus | **Debit** | 1.200.000 | Dimensi: `SPJ-WIS-001` (Sisa hak bersih) |
  | | | | | |
  | **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Kredit** | 7.000.000 | **Saldo UJ tuntas/lunas menjadi Rp 0** |
  | **42101** | Pendapatan Sewa Bus Pariwisata / Charter | **Kredit** | 17.500.000 | Pengakuan 100% pendapatan sewa 5 hari |
  | **11101** | Kas Operasional Pool (Bayar Uang Makan) | **Kredit** | 1.375.000 | BKK kasir pool bayar makan tunai |
  | **23101** | Utang Kompensasi Kru | **Kredit** | 1.200.000 | Sisa hak premi kru (ke rekap payroll) |

* **Invariant Check Jurnal Akhir SPJ Wisata:**
  * **Total Debit:**  
    $$1.400.000 + 5.250.000 + 12.250.000 + 3.200.000 + 1.500.000 + 750.000 + 150.000 + 1.375.000 + 1.200.000 = \mathbf{Rp\ 27.075.000}$$
  * **Total Kredit:**  
    $$7.000.000 + 17.500.000 + 1.375.000 + 1.200.000 = \mathbf{Rp\ 27.075.000}$$
  * **Status Jurnal:** **SEIMBANG (BALANCED)** ✅
  * **Saldo Akun UJ (`13101`):** Saldo Debit sebelumnya Rp 7.000.000 (Awal 6jt + Tambahan 1jt) dikredit Rp 7.000.000 $\to$ **Saldo Akhir Menjadi Rp 0** ✅.
  * **Saldo Akun DP (`24101`):** Saldo Kredit awal Rp 5.250.000 didebit Rp 5.250.000 $\to$ **Saldo DP Menjadi Rp 0** ✅.

---

## 3. Analisis Profitabilitas SPJ Pariwisata (*Trip Contribution Margin*)

Dengan terserapnya seluruh biaya langsung perjalanan ke dimensi `trip_id = SPJ/WIS/2610/0001` dan `vehicle_id = SS-02`:

* **Pendapatan Bruto Sewa Wisata:** **Rp 17.500.000**
* **Beban Langsung Operasional Trip:**
  * Beban BBM Solar Wisata: (Rp 3.200.000)
  * Beban Tol Trans Jawa: (Rp 1.500.000)
  * Beban Parkir Objek Wisata & Penginapan: (Rp 750.000)
  * Beban Cuci & Perlengkapan Armada: (Rp 150.000)
  * Beban Kompensasi Kru (Uang Makan 1.375.000 + Premi Total 2.000.000): **(Rp 3.375.000)**
* **Total Beban Langsung Trip Wisata:** **Rp 8.975.000**
* **Kontribusi Laba Bersih Trip (*Trip Contribution Margin*):**  
  $$\text{Margin} = \text{Rp } 17.500.000 - \text{Rp } 8.975.000 = \mathbf{+\text{Rp } 8.525.000} \quad (\approx 48.71\%)$$

---

## 4. Spesifikasi Terkunci: Perlakuan Uang Muka Sewa (DP) & Siklus AR Kontrak

1. **Prinsip Pengakuan Pendapatan Accrual-Basis:**
   * Uang yang disetor pelanggan saat booking **dilarang langsung diakui sebagai Pendapatan (`42101`)**.
   * Penerimaan awal wajib dibukukan ke akun liabilitas **`24101 - Pendapatan Diterima di Muka (DP Sewa Wisata)`**.
   * Pendapatan baru diakui secara sah saat armada telah menyelesaikan tugasnya dan SPJ berstatus `operational_status = COMPLETED`.
2. **Koneksi Invoice Pelunasan ke SPJ (`source_type = SPJ`):**
   * Invoice penagihan pelunasan sewa diterbitkan dengan tautan eksplisit ke `spj_id`.
   * Saat pelunasan dibayar via bank sebelum trip selesai, uang masuk ke rekening korporat dan menutup piutang AR. Jurnal penutupan DP dan pengakuan pendapatan baru tereksekusi saat settlement akhir SPJ.

---

## 5. Spesifikasi Terkunci: Master Rate Kru Harian (`PER_DAY`) & Pencairan Sebagian di Jalan

1. **Skema Rate Harian Wisata (`crew_rate_rules`):**
   * Untuk unit usaha `WISATA`, kolom `rate_type` wajib bernilai **`PER_DAY`**.
   * Nilai uang makan dan premi dikalikan langsung dengan durasi hari operasional SPJ ($\text{durasi} = \text{arrival\_date} - \text{departure\_date} + 1$).
2. **Workflow Pencairan Sebagian Premi (*Mid-Trip Early Payout*):**
   * Di form detail SPJ, kasir/finance memiliki tombol aksi: **`[+ Cairkan Sebagian Hak Kru]`**.
   * Input DTO:
     * `crew_meal_payment_id`: Baris hak kru yang dicairkan.
     * `amount`: Nominal pencairan (divalidasi tidak boleh melebihi sisa plafon hak kru).
     * `payment_method`: `BANK_TRANSFER`.
     * `bank_account_id`: Rekening bank operasional perusahaan (`11104`).
     * `notes`: Catatan transfer (misal: titip nafkah keluarga).
   * **Pencegahan Fraud / Double-Payment:**
     * Sistem membukukan beban premi sebesar nominal yang ditransfer di muka.
     * Saat settlement akhir di kasir pool, kasir **hanya menampilkan dan membayarkan sisa bersih** yang belum dicairkan.

---

## 6. Spesifikasi Terkunci: Beban Parkir Objek Wisata & Penginapan Kru

1. **Fleksibilitas Kategori Biaya Lapangan (`spj_expenses`):**
   * Pada perjalanan pariwisata, biaya parkir objek wisata dan homestay kru merupakan biaya riil yang sah dari UJ.
   * Kategori pengeluaran mencakup:
     * `PARKING_TOURISM`: Parkir khusus bus di tempat rekreasi/wisata.
     * `CREW_LODGING`: Biaya sewa kamar penginapan sopir/kru jika pihak panitia rombongan tidak menyediakan fasilitas tidur kru.
2. **Audit Nota Fisik:**
   * Kasir pool wajib memverifikasi karcis retribusi resmi atau kuitansi penginapan sebelum menyetujui biaya UJ menjadi `BALANCED`.

---

## 7. Spesifikasi Terkunci: Komisi / Cashback Agen Rekanan Wisata (B2B Travel Partner & Shuttle Bandara)

1. **Karakteristik Kerjasama Rekanan B2B:**
   * SS Traveling kerap menjalin kerjasama sewa bus dengan biro travel mitra (misalnya: *Travel Umroh & Haji*, *Event Organizer*, atau *Agen Wisata Rekanan*) untuk layanan carter wisata maupun antar-jemput shuttle bandara (CGK/YIA).
   * Tarif sewa ditetapkan dengan harga kontrak resmi/tetap (misal: Sewa Shuttle Bandara Rp 3.000.000 atau Paket Wisata Rp 17.500.000).
   * Setelah kontrak sewa dibayar lunas oleh pihak rekanan, SS Traveling memiliki kewajiban membayarkan uang komisi / *cashback* (misal: Rp 300.000 per bus shuttle, atau persentase tertentu) kepada biro travel tersebut sebagai *reward* kemitraan.
2. **Pemisahan Tegas dari Uang Jalan (Beban Kantor / Non-UJ):**
   * Uang komisi / cashback rekanan **TIDAK BOLEH dibayarkan dari dana Uang Jalan (UJ) kru di jalan** dan **kru bus dilarang dilibatkan dalam transaksi cashback ini**.
   * Beban cashback dicatat sebagai **Beban SPJ Kantor (`payment_source = 'OFFICE_BANK'`)** yang terikat langsung ke `spj_id`.
   * Eksekusi pencairan dilakukan resmi oleh **Finance Kantor via Transfer Bank Operasional (`11104 Bank BCA`)** langsung ke rekening biro travel rekanan setelah status invoice sewa dinyatakan `PAID` (Lunas).
3. **Prinsip Akuntansi Bruto (*Gross Basis Principle* & Anti-Netting):**
   * Pendapatan sewa diakui utuh 100% bruto di akun **`42101 — Pendapatan Sewa Bus Pariwisata / Charter`** sesuai nilai tagihan resmi.
   * Komisi / cashback dibukukan tersendiri sebagai pengurang laba di akun beban:
     * Akun Debet: **`54103 — Beban Komisi / Cashback Agen Rekanan Wisata`** (Dimensi: `spj_id`, `partner_agent_id`).
     * Akun Kredit: **`22103 — Utang Komisi / Cashback Rekanan Wisata`** (saat pengakuan) $\to$ ditutup saat transfer bank (`11104`).
4. **Dampak ke Laporan Profitabilitas SPJ (*Trip Contribution Margin*):**
   * Karena beban cashback mencantumkan dimensi `spj_id`, laporan profitabilitas trip secara otomatis memperhitungkan komisi rekanan sebagai beban langsung perjalanan kantor:
     $$\text{Kontribusi Laba Bersih Trip} = \text{Pendapatan Bruto Sewa} - \text{Beban Riil Armada} - \text{Hak Kru} - \mathbf{Beban\ Cashback\ Rekanan}$$
   * Manajemen memperoleh transparansi penuh mengenai omzet kotor per rekanan travel sekaligus profitabilitas riil bersih perusahaan.

