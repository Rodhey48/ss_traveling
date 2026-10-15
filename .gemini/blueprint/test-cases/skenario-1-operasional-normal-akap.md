# Test Case Skenario 1: Operasional Normal AKAP Pulang-Pergi (PP) & Siklus Keuangan Penuh

**Versi:** 1.1  
**Tanggal Penguncian:** 7 Oktober 2026  
**Status:** Terverifikasi & Dikunci (Locked Specification)  
**Referensi:** Blueprint v1.3 & Addendum v1.6 – v1.11  

---

## 1. Profil Simulasi Pengujian
* **Jenis Layanan:** AKAP Reguler Pulang-Pergi (PP)
* **Armada:** Bus `SS-01` (Nopol: `B 7123 SS`)
  * **Konfigurasi Kursi (*Multi-Class*):** Executive Combi
    * *Sleeper Class:* 4 Kursi
    * *Luxury Seat 2-1:* 20 Kursi
    * **Total Kapasitas Fisik Maksimal:** **24 Kursi**
* **Rute Perjalanan:**
  * **Leg 1 (DEPARTURE):** Pool Ciputat / Jakarta $\to$ Terminal Giwangan Yogyakarta
  * **Leg 2 (RETURN):** Terminal Giwangan Yogyakarta $\to$ Pool Ciputat / Jakarta
* **Personel Kru Terlibat:**
  * Driver 1: Pak Budi (`users.id` / `CREW_DRIVER`)
  * Driver 2: Pak Joko (`users.id` / `CREW_DRIVER`)
  * Kondektur: Mas Anto (`users.id` / `CREW_CONDUCTOR`)

---

## 2. Alur Transaksi & Tahapan Operasional

### Tahap 1: Penerbitan SPJ & Snapshot Hak Kompensasi Kru
* **Aktor:** `OPS_ADMIN` (Dispatcher)
* **Nomor Dokumen SPJ:** `SPJ/AKP/2610/0001`
* **Status Awal SPJ:**
  * `operational_status`: **`ISSUED`**
  * `financial_status`: **`PENDING_SETTLEMENT`**
* **Otomasi *Rate Snapshotting* (`crew_rate_rules` $\to$ `crew_meal_payments`):**
  * Hak kru disalin permanen ke transaksi SPJ saat penugasan, terpisah total dari Uang Jalan operasional bus:
    * **Uang Makan Kru (PP):** Driver 1 (Rp 150.000) + Driver 2 (Rp 150.000) + Kondektur (Rp 100.000) = **Rp 400.000**
    * **Premi Ritase Kru:** Driver 1 (Rp 250.000) + Driver 2 (Rp 250.000) + Kondektur (Rp 150.000) = **Rp 650.000**

---

### Tahap 2: Pencairan Uang Jalan (UJ) Awal
* **Aktor:** `POOL_CASHIER` (Kasir Pool Ciputat)
* **Transaksi Kas:** Kasir menyerahkan dana tunai Rp 3.500.000 kepada Driver 1 (`spj_uj_disbursements`).
* **Status UJ:** `spj_uj` berubah menjadi **`DISBURSED`**.
* **Jurnal Akuntansi #1 (Pencairan UJ Otomatis):**
  | No. Akun | Nama Akun | Debit (Rp) | Kredit (Rp) | Dimensi |
  | :--- | :--- | :---: | :---: | :--- |
  | **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **3.500.000** | - | `SPJ/AKP/2610/0001`, Driver 1 |
  | **11101** | Kas Operasional Pool (Ciputat) | - | **3.500.000** | Kasir Pool Ciputat |

---

### Tahap 3: Operasional Perjalanan (Leg 1 & Leg 2)
Status operasional: `operational_status`: **`IN_PROGRESS`**.

#### A. Penjualan Tiket & Kargo Bagasi
1. **Leg 1 (Ciputat $\to$ Yogyakarta): Muatan Penuh (24 Pax - 100% Okupansi / Full Seat)**
   * *Tiket Online OTA (RedBus/Traveloka):* 12 pax @ Rp 250.000 = Rp 3.000.000 *(Masuk Piutang AR OTA, kru tidak pegang uang)*.
   * *Tiket Agen Offline Loket Terminal:* 8 pax @ Rp 250.000 = Rp 2.000.000 *(Uang dipegang agen loket)*.
   * *Tiket Penumpang Langsung Naik Pool/Jalan:* 4 pax @ Rp 250.000 = **Rp 1.000.000** *(Uang tunai dipegang kru)*.
   * *Kargo Bagasi (`CARGO_MOTORCYCLE`):* 1 unit Motor Matic = **Rp 350.000** *(Uang tunai dipegang kru; komisi kru dipilih 20% = Rp 70.000)*.
2. **Leg 2 (Yogyakarta $\to$ Ciputat): Muatan 20 Pax (~83% Okupansi)**
   * *Tiket Online OTA:* 10 pax @ Rp 250.000 = Rp 2.500.000.
   * *Tiket Agen Offline Yogya:* 10 pax @ Rp 250.000 = Rp 2.500.000.
   * *Kargo Bagasi (`CARGO_BOX`):* 2 Kardus Oleh-oleh @ Rp 50.000 = **Rp 100.000** *(Uang tunai dipegang kru; komisi kru dipilih 20% = Rp 20.000)*.

> **Total Uang Tunai Perusahaan yang Dipegang Kru:**  
> Tiket Langsung (1.000.000) + Kargo Motor (350.000) + Kargo Kardus (100.000) = **Rp 1.450.000**

#### B. Pengeluaran Riil dari Uang Jalan Kru (`spj_expenses`)
Kru membayar pengeluaran jalan dan mengumpulkan bukti fisik struk/nota:
1. BBM Solar Tol SPBU Pertamina: **Rp 1.600.000** *(disertai foto odometer dan volume liter)*.
2. Top-up E-Toll Trans Jawa: **Rp 900.000**.
3. Cuci bus, parkir, dan retribusi terminal: **Rp 100.000**.
> **Total Pengeluaran Riil dari UJ:** **Rp 2.600.000**  
> **Sisa Fisik Uang Jalan di Tangan Kru:** Rp 3.500.000 - Rp 2.600.000 = **Rp 900.000**

#### C. Kalkulasi Otomatis Sistem
* **Bonus Full Seat (Per-Leg Evaluation):**
  * Leg 1 (100% Okupansi) $\to$ Berhak bonus: Driver 1 (Rp 50rb) + Driver 2 (Rp 50rb) + Kondektur (Rp 50rb) = **Rp 150.000**.
  * Leg 2 (83% Okupansi) $\to$ Tidak ada bonus.
* **Komisi Kargo Kru (Dinamis 20%):**
  * Motor (Rp 350.000 $\times$ 20%) = Rp 70.000
  * Kardus (Rp 100.000 $\times$ 20%) = Rp 20.000
  * **Total Komisi Kargo:** **Rp 90.000** (dibagi rata ke 3 kru = masing-masing Rp 30.000).
* **Fee Koordinator Wilayah Lapangan (`coordinator_fee_rules`):**
  * Arah Berangkat (Leg 1, 24 pax) $\to$ Alokasi Koordinator Wilayah Barat (`WEST`): $24 \times \text{Rp } 10.000 = \textbf{Rp 240.000}$.
  * Arah Pulang (Leg 2, 20 pax) $\to$ Alokasi Koordinator Wilayah Timur (`EAST`): $20 \times \text{Rp } 10.000 = \textbf{Rp 200.000}$.

---

### Tahap 4: Kedatangan di Garasi & Rekonsiliasi Kas Kasir
* **Aktor:** `CREW_DRIVER` dan `POOL_CASHIER`
* Bus tiba di Pool Ciputat $\to$ `operational_status`: **`COMPLETED`**, `financial_status`: **`UNDER_REVIEW`**.
* **Penyelesaian Dua Kantong Saldo Terpisah (Anti-Netting):**
  1. **Kantong 1: Pertanggungjawaban UJ Kru**
     * Menyerahkan nota pengeluaran operasional sah: Rp 2.600.000.
     * Mengembalikan sisa fisik UJ ke laci kasir (`spj_uj_returns`): Rp 900.000.
     * *Rumus:* $3.500.000 - 2.600.000 - 900.000 = 0$ $\to$ Status UJ: **`BALANCED`** ✅
  2. **Kantong 2: Setoran Bruto Penerimaan Perusahaan**
     * Menyerahkan uang tunai fisik tiket & kargo 100% bruto: Rp 1.450.000.
     * Kasir mencocokkan dengan resi & manifest $\to$ Status Penerimaan: **`MATCHED`** ✅
* **Pencetakan Bukti Kas Kasir:**
  * **Bukti Kas Masuk (BKM):** Sisa UJ (900rb) + Setoran Tiket/Kargo (1.45jt) = **Rp 2.350.000** fisik masuk ke laci kasir.
  * **Bukti Kas Keluar (BKK):** Pembayaran tunai hak kru diserahkan ke kru:
    $$\text{Uang Makan (400rb)} + \text{Bonus Full Seat (150rb)} + \text{Komisi Kargo (90rb)} = \mathbf{Rp\ 640.000}$$
    Premi ritase Rp 650.000 dialokasikan ke rekap payroll (`Utang Kompensasi Kru`).

---

### Tahap 5: Verifikasi Akuntansi & Posting Jurnal SPJ
* **Aktor:** `ACCOUNTANT`
* Akuntan memvalidasi penyelesaian SPJ $\to$ `financial_status`: **`SETTLED`**.
* **Jurnal Rekonsiliasi Akhir SPJ (Diposting Otomatis via `AccountingPostingService`):**
  | No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi |
  | :--- | :--- | :---: | :---: | :--- |
  | **11101** | Kas Operasional Pool | **Debit** | 2.350.000 | Fisik diterima kasir (900rb sisa UJ + 1.45jt setoran) |
  | **51101** | Beban Bahan Bakar Minyak (Solar) | **Debit** | 1.600.000 | Dimensi: `SPJ-001`, `Bus SS-01` |
  | **52101** | Beban Tol Perjalanan | **Debit** | 900.000 | Dimensi: `SPJ-001`, `Bus SS-01` |
  | **52103** | Beban Cuci & Perlengkapan Armada | **Debit** | 100.000 | Dimensi: `SPJ-001`, `Bus SS-01` |
  | **53101** | Beban Uang Makan Kru Bus | **Debit** | 400.000 | Dimensi: `SPJ-001` |
  | **53102** | Beban Premi / Insentif Kru Bus | **Debit** | 650.000 | Dimensi: `SPJ-001` |
  | **53103** | Beban Bonus Full Seat Kru | **Debit** | 150.000 | Dimensi: `SPJ-001` |
  | **53104** | Beban Komisi / Insentif Kargo Kru | **Debit** | 90.000 | Dimensi: `SPJ-001` (20% omzet kargo) |
  | **54102** | Beban Uang Jasa Koordinator Lapangan | **Debit** | 440.000 | 240rb Barat + 200rb Timur |
  | **12102** | Piutang Agen Penjualan Online (AR OTA) | **Debit** | 5.500.000 | RedBus/Traveloka (3jt Leg 1 + 2.5jt Leg 2) |
  | **12101** | Piutang Agen Penjualan Tiket Offline | **Debit** | 4.500.000 | Loket Agen (2jt Leg 1 + 2.5jt Leg 2) |
  | | | | | |
  | **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Kredit** | 3.500.000 | **Saldo UJ tuntas/lunas menjadi Rp 0** |
  | **41101** | Pendapatan Tiket AKAP Reguler | **Kredit** | 11.000.000 | Total 44 Pax tiket (Leg 1 & Leg 2) |
  | **43101** | Pendapatan Kargo & Paket Bagasi Bus | **Kredit** | 450.000 | Motor (350rb) + Kardus (100rb) Bruto |
  | **11101** | Kas Operasional Pool (Bayar Hak Kru) | **Kredit** | 640.000 | Bayar tunai Makan (400rb) + Full Seat (150rb) + Kargo (90rb) |
  | **23101** | Utang Kompensasi Kru | **Kredit** | 650.000 | Premi ritase kru (dibayar saat payroll) |
  | **22102** | Utang Jasa Koordinator Lapangan | **Kredit** | 440.000 | Hak Korlap Barat (240rb) & Timur (200rb) |

* **Invariant Check Jurnal SPJ:**
  * Total Debit: **Rp 16.680.000**
  * Total Kredit: **Rp 16.680.000**
  * Status: **SEIMBANG (BALANCED)** ✅

---

## 3. Spesifikasi Terkunci: Penagihan Servis Makan Restoran Mitra (AP Invoice Berkala)

### A. Kondisi Lapangan yang Disepakati
1. **Tidak Ada Slip Kupon Fisik Saat Kru Pulang:** Karena keterbatasan waktu di lapangan, kru tidak membawa slip kupon makan saat tiba di pool.
2. **Kupon Dihitung Berdasarkan Penukaran Riil:** Dari 24 penumpang di manifes, ada kemungkinan penumpang tidak mengambil servis makan (misal: tidur/puasa). Restoran hanya menagih kupon yang benar-benar ditukarkan.
3. **Penagihan Berkala 2x Seminggu:** Restoran mitra (misal: RM Taman Selera Subang) mengirimkan invoice tagihan gabungan 2x seminggu langsung ke kantor pusat (Finance AP).
4. **Nol Dampak ke UJ Kru:** Karena transaksi diselesaikan secara non-tunai via AP Vendor kantor, **Uang Jalan kru tidak dipotong dan penutupan SPJ kru tidak tertahan sama sekali.**

### B. Desain Fitur Form Tagihan Restoran (Modul AP Vendor)
* **Menu:** `Utang (AP) -> Tagihan Vendor (AP Invoices) -> Tambah Tagihan Servis Makan`
* **Bagian Header:**
  * Pilihan Restoran: `RM Taman Selera Subang` *(Akun beban otomatis terkunci ke `51102` dan tarif bawaan Rp 25.000/pax).*
  * Nomor Faktur Vendor: Diinput dari invoice fisik RM (contoh: `INV-RMTS-2026/10/012`).
  * Tanggal Invoice & Jatuh Tempo.
* **Bagian Rincian (Lines) Berbasis Aksi Pintar:**
  * Terdapat tombol: **`[+ Tarik SPJ Belum Ditagih]`**.
  * Modal dialog menampilkan daftar seluruh SPJ AKAP yang pernah melintasi rute restoran tersebut dan belum pernah ditagih oleh restoran yang bersangkutan.
  * Staff Finance AP mencentang nomor SPJ dan menginput jumlah kupon riil sesuai tagihan:
    * SPJ `SPJ/AKP/2610/0001` (Bus SS-01): Manifes 24 Pax $\to$ **Input Kupon Riil: 22 Kupon** $\times$ Rp 25.000 = **Rp 550.000**.
    * SPJ `SPJ/AKP/2610/0002` (Bus SS-02): Manifes 24 Pax $\to$ **Input Kupon Riil: 20 Kupon** $\times$ Rp 25.000 = **Rp 500.000**.
    * Total Invoice Vendor: **Rp 1.050.000**.

### C. Tiga Lapisan Validasi Bisnis (Anti-Fraud & Validasi Data)
1. **Proteksi Tagihan Ganda (*Anti-Double Billing*):**
   * Setiap relasi `(ap_invoice_lines.trip_id, vendor_id)` dikunci. SPJ yang sudah pernah ditagihkan oleh suatu restoran **tidak akan pernah muncul lagi** di opsi penarikan tagihan restoran tersebut.
2. **Peringatan Melebihi Manifes (*Over-Capacity Warning*):**
   * Jika jumlah kupon yang diinput melebihi total penumpang pada manifes SPJ terkait (misal input 26 kupon padahal manifes 24 pax), sistem mengeluarkan validasi *warning*:
     > ⚠️ *"Peringatan: Jumlah kupon (26) melebihi manifes fisik penumpang (24). Harap konfirmasi kasir rumah makan!"*
3. **Toleransi Kupon Kurang (*Valid Under-Capacity*):**
   * Jika jumlah kupon lebih kecil dari manifes (22 dari 24 pax), sistem menerima dengan valid, mencerminkan 2 penumpang yang tidak menukarkan kupon makan.
4. **Pencatatan Resmi Selisih Kupon Makan per Leg (`meal_pax_count` & `meal_discrepancy_notes`):**
   * Pada level leg perjalanan (`spj_legs`), sistem menyediakan atribut:
     * `meal_pax_count`: Jumlah riil kupon/penumpang yang makan di restoran mitra.
     * `meal_discrepancy_notes`: Keterangan khusus yang wajib diisi jika jumlah makan tidak sama dengan manifes kursi (contoh: *"2 penumpang tidur/puasa sehingga kupon tidak ditukarkan"* atau *"1 porsi tambahan untuk kru bantuan"*).
   * Catatan ini tersimpan permanen pada dokumen SPJ dan otomatis dimunculkan di layar Finance AP saat memverifikasi tagihan restoran mitra, sehingga proses pencocokan invoice berjalan transparan tanpa menimbulkan kecurigaan.

### D. Jurnal Akuntansi Tagihan Vendor (Diposting saat Invoice AP Disetujui)
| No. Akun | Nama Akun | Posisi | Nominal (Rp) | Dimensi Terikat |
| :--- | :--- | :---: | :---: | :--- |
| **51102** | Beban Servis Makan Penumpang Restoran | **Debit** | 550.000 | `SPJ/AKP/2610/0001`, `Bus SS-01` |
| **51102** | Beban Servis Makan Penumpang Restoran | **Debit** | 500.000 | `SPJ/AKP/2610/0002`, `Bus SS-02` |
| **21101** | Utang Usaha Vendor Restoran Mitra | **Kredit** | 1.050.000 | Vendor: `RM Taman Selera Subang` |

### E. Integrasi ke Laporan Profitabilitas SPJ (Multi-Dimensi)
Karena baris jurnal di atas mencantumkan dimensi `trip_id = SPJ/AKP/2610/0001`, maka saat laporan laba/rugi SPJ-001 dibuka:
* **Pendapatan Bruto Trip:** Rp 11.450.000 (Tiket Rp 11jt + Kargo Rp 450rb)
* **Beban Langsung Operasional Trip:**
  * Beban Solar BBM: (Rp 1.600.000)
  * Beban Tol Trans Jawa: (Rp 900.000)
  * Beban Cuci & Armada: (Rp 100.000)
  * Beban Hak Kru (Makan + Premi + Bonus Full Seat + Komisi Kargo): **(Rp 1.290.000)**
  * Beban Fee Koordinator Lapangan: (Rp 440.000)
  * Beban Servis Makan RM Taman Selera (dari AP): **(Rp 550.000)** *(Terserap otomatis!)*
* **Total Beban Langsung Trip:** **Rp 4.880.000**
* **Kontribusi Laba Bersih Trip (Trip Contribution Margin):**  
  $$\text{Rp } 11.450.000 - \text{Rp } 4.880.000 = \mathbf{+\text{Rp } 6.570.000} \quad (\approx 57.38\%)$$

---

## 4. Spesifikasi Terkunci: Persentase Dinamis Komisi Kargo Kru (Motor vs Kardus)
1. **Fleksibilitas Input per Resi Kargo:**
   * Di form deklarasi kargo (`spj_revenue_declarations`), selain tarif bruto dan jenis kargo, disediakan pilihan persentase komisi kru.
   * Preset Kantor: 15% (Jarak Dekat), 20% (AKAP Reguler), 25% (Muatan Khusus).
   * Input Bebas (*Custom*): User dapat mengetik angka persentase sendiri sesuai kesepakatan lapangan.
2. **Kalkulasi & Transparansi Hak Kru:**
   * Nilai rupiah komisi dihitung otomatis dan tersimpan permanen di `crew_commission_amount`.
   * Setoran kas fisik kargo tetap disetorkan 100% bruto ke kasir pool (anti-sunat sepihak).
   * Kasir pool membayarkan tunai hak komisi kargo kepada kru saat settlement SPJ via BKK.
3. **Akuntansi Bruto:**
   * Pendapatan kargo dicatat utuh di `43101 - Pendapatan Kargo & Paket Bagasi Bus`.
   * Komisi kru dibukukan resmi di `53104 - Beban Komisi / Insentif Kargo Kru`.

---

## 5. Spesifikasi Terkunci: Multi-Line Disbursement & Mekanisme Tambahan UJ
1. **Pola Header – Lines (*One-to-Many* Pencairan UJ):**
   * Satu amplop pertanggungjawaban UJ (`spj_uj`) dapat memiliki lebih dari 1 baris pencairan dana (`spj_uj_disbursements`).
   * Tombol di UI: **`[+ Tambah Baris Pencairan UJ]`**
     * **Baris 1 (`INITIAL`):** Rp 3.500.000 via Kas Operasional Pool Ciputat (saat berangkat).
     * **Baris 2 (`ADDITIONAL`):** Rp 500.000 via Transfer Bank Operasional BCA (saat macet darurat di Cipali).
   * **Total Plafon UJ yang Dipegang Kru:** Otomatis terakumulasi menjadi Rp 4.000.000.
   * **Jurnal Akuntansi Atomik per Pencairan:** Masing-masing baris pencairan mengkredit akun kas/bank yang sesuai (`11101` Kas Pool untuk tunai, `11104` Bank untuk transfer), dengan debit ke `13101 - Uang Jalan Kru`.
2. **Dukungan Multi-Amplop UJ per SPJ ($1 : N$ `spj_uj`):**
   * Sistem mendukung pembuatan lebih dari 1 amplop UJ independen dalam 1 nomor SPJ yang sama untuk kru berbeda:
     * *Amplop 1 (Dipegang Driver 1):* Khusus BBM Solar & Tol Trans Jawa.
     * *Amplop 2 (Dipegang Kondektur):* Khusus tiket penyeberangan kapal ferry, parkir pariwisata, retribusi terminal.
   * Masing-masing kru mempertanggungjawabkan notanya secara mandiri tanpa risiko silang.
3. **Penanganan Kondisi Talangan Darurat Kru (*Kru Nombok*):**
   * Jika kondisi darurat tengah malam membuat kru terpaksa menggunakan uang pribadi (pengeluaran sah melebihi plafon UJ / `OVER_EXPENSE` minus):
     * Kasir pool memverifikasi seluruh nota fisik pengeluaran.
     * Kekurangan/talangan kru diganti secara resmi oleh kasir pool via **Bukti Kas Keluar (BKK)** tunai dari laci kas pool.
     * Status UJ kembali menjadi **`BALANCED`** ✅.
   * **Aturan Anti-Fraud:** Kru tetap dilarang memotong uang setoran kargo/tiket secara sepihak di jalan. Setoran kargo/tiket wajib disetor 100% utuh bruto, dan penggantian nombok diselesaikan resmi via kasir garasi.

---

## 6. Spesifikasi Terkunci: Penjualan Tiket Bruto & Komisi Agen Berkala per Kelas Kursi
1. **Penyetoran 100% Bruto oleh Agen Offline:**
   * Agen tiket fisik loket terminal menyetorkan uang hasil penjualan tiket secara utuh tanpa pemotongan sepihak di loket.
   * Uang tunai yang diserahkan agen ke kru bus atau kasir pool dicatat dan dihitung 100% bruto.
2. **Komisi Berjenjang Berdasarkan Kelas Armada (`agent_commission_rules`):**
   * Tarif komisi agen diatur per kelas kursi armada:
     * *Sleeper Class:* Rp 30.000 / tiket
     * *Luxury Seat 2-1:* Rp 20.000 / tiket
3. **Pencatatan Akuntansi & Pembayaran Berkala:**
   * Saat SPJ di-settle di kasir garasi, sistem otomatis mengakui **Beban Komisi Agen** (`54101`) di debit dan membukukan **Utang Komisi Agen** (`22101`) di kredit.
   * Hak komisi agen tidak dipotong di jalan, melainkan dibayarkan secara terjadwal/periodik oleh Finance via transfer bank korporat (`11104`).

---

## 7. Spesifikasi Terkunci: Fleksibilitas Personel Kru (2–4+ Orang), Penugasan Per-Leg & Revisi Kru Berjalan
1. **Jumlah Kru Dinamis ($1 : N$ `spj_crew_assignments`):**
   * SPJ mendukung jumlah personil fleksibel: 2 orang (Supir + Kondektur), 3 orang (Supir 1 + Supir 2 + Kondektur), hingga 4+ orang (tambahan Mekanik/Helper/Tour Leader).
   * Syarat validasi minimal penerbitan SPJ (`ISSUED`): Minimal memiliki **1 orang personil berstatus `DRIVER`**.
2. **Penugasan Independen Per-Leg Perjalanan:**
   * Kru ditugaskan terikat pada `spj_leg_id`, memungkinkan personil berbeda antara Leg 1 (Berangkat: Kru Barat) dan Leg 2 (Pulang: Kru Timur).
   * Seluruh hak keuangan (uang makan, premi ritase, bonus full seat, dan komisi kargo) dialokasikan secara adil dan terpisah per leg perjalanan.
3. **Mekanisme Revisi Kru Berjalan (*Mid-Trip Cancellation / Replacement*):**
   * Jika seorang kru berhalangan/sakit di tengah perjalanan (misal di kota transit Yogyakarta sebelum Leg 2 mulai):
     * Dispatcher/Admin membuka form SPJ dan memilih aksi **"Batalkan Penugasan" (`CANCELLED`)** atau **"Ganti Kru" (`REPLACE_CREW`)** dengan input alasan wajib.
     * Hak kompensasi kru yang sakit untuk leg tersebut otomatis dinolkan, sementara hak leg sebelumnya yang telah tuntas tetap sah.
     * Jika diganti personil baru, hak kompensasi kru pengganti otomatis dihitung berdasarkan snapshot master `crew_rate_rules`.
     * Riwayat perubahan tercatat lengkap di `audit_logs` tanpa penghapusan data fisik.

