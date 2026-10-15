# Test Case Skenario 4: Rekonsiliasi Kasir Bermasalah, Musyawarah Operasional Kru & Resolusi Selisih Kas

**Versi:** 1.0  
**Tanggal Penguncian:** 14 Oktober 2026  
**Status:** Terverifikasi & Dikunci (Locked Specification)  
**Referensi:** Blueprint v1.3 (Bab 7.2, Bab 8.2, Bab 9.6), Addendum v1.1 (Poin 2), Addendum v1.2 (Poin 3 & 5), Addendum v1.10  

---

## 1. Filosofi Bisnis & Profil Simulasi Pengujian
Di operasional nyata perusahaan bus, temuan selisih kas di meja kasir pool adalah hal yang lumrah (salah kembalian ke penumpang, nota tercecer/rusak, uang tercecer). 
Sistem SS Traveling dirancang dengan **Prinsip 2 Lapis**:
1. **Lapis 1 (Budaya Lapangan — Musyawarah Internal Kru):** Memberikan ruang bagi kru untuk bermusyawarah dan menyelesaikan selisih operasional secara kekeluargaan/mandiri di meja kasir sebelum data dikunci.
2. **Lapis 2 (Sistem Finansial & Tata Kelola — Akun Penampung & Approval):** Jika selisih tidak dapat ditutup seketika, sistem mencatatnya secara transparan (`financial_status = DISCREPANCY`) tanpa menghakimi sepihak, menyediakan alur investigasi berwenang, dan menjamin **penutupan buku bulanan kantor pusat tidak terblokir**.

---

### Profil Simulasi:
* **Jenis Layanan:** AKAP Reguler Pulang-Pergi (Ciputat $\leftrightarrow$ Yogyakarta) Bus `SS-01`
* **Personel Kru:**
  * Driver 1: Pak Budi (`users.id` / `CREW_DRIVER`)
  * Driver 2: Pak Joko (`users.id` / `CREW_DRIVER`)
  * Kondektur: Mas Anto (`users.id` / `CREW_CONDUCTOR`)
* **Aktor Keuangan:**
  * Kasir Pool Ciputat: Mas Deni (`users.id` / `POOL_CASHIER`)
  * Manajer Keuangan: Pak Hendro (`users.id` / `FINANCE_MANAGER`)
  * Akuntan: Mbak Dewi (`users.id` / `ACCOUNTANT`)
* **Kondisi Perjalanan:**
  * Plafon UJ Diberikan: **Rp 3.500.000**
  * Target Setoran Kas Tiket Tunai Kru (4 Pax Langsung): **Rp 1.000.000**
  * Target Setoran Kargo Tunai Kru (1 Motor): **Rp 350.000**
  * Total Kas Bruto Perusahaan yang Wajib Disetor Kru: **Rp 1.350.000**

---

## 2. Alur Transaksi & 2 Kasus Temuan di Meja Kasir

Saat armada tiba kembali di Pool Ciputat, kru menghadap Kasir Mas Deni untuk penyelesaian kas:

```text
                                  KEDATANGAN KRU DI KASIR POOL
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
        [ KANTONG 1: UANG JALAN (UJ) ]                  [ KANTONG 2: SETORAN PENERIMAAN ]
         Plafon UJ: Rp 3.500.000                         Target Setoran: Rp 1.350.000
                       │                                                 │
            Kasus A: Nota BBM Hilang                         Kasus B: Salah Kembalian
            Struk Rp 300.000 Tercecer                        Fisik Kurang Rp 200.000
                       │                                                 │
                       ▼                                                 ▼
            [ JALUR 2: SISTEMIK ]                            [ JALUR 1: MUSYAWARAH KRU ]
         Dicatat Selisih Transparan                       Kru Patungan Tunai di Meja
       financial_status = DISCREPANCY                    Fisik Disetor Genap Rp 1.350.000
                       │                                                 │
                       ▼                                                 ▼
             Status UJ: DISCREPANCY                           Status Penerimaan: MATCHED ✅
```

---

### A. Kasus 1: Selisih Tiket Kurang Rp 200.000 (Selesai via Jalur Musyawarah Kru)
* **Temuan Kasir:**
  * Berdasarkan manifes, kru membawa 4 penumpang tiket tunai @ Rp 250.000 (Target: Rp 1.000.000) dan kargo motor Rp 350.000. Total kewajiban setoran = Rp 1.350.000.
  * Saat uang dihitung di meja kasir, fisik uang tunai hanya ada **Rp 1.150.000** (Kekurangan fisik Rp 200.000).
  * *Penyebab:* Mas Anto (Kondektur) salah memberikan uang kembalian pecahan Rp 100.000 saat penumpang terburu-buru turun di Cirebon.
* **Resolusi Lapangan (Musyawarah Antar-Kru):**
  * Driver 1, Driver 2, dan Kondektur bermusyawarah sejenak di ruang kasir.
  * Mereka sepakat bahwa selisih ini adalah risiko lapangan bersama dan langsung menalangi uang Rp 200.000 dari dompet pribadi mereka (Pak Budi menalangi 100rb, Mas Anto 100rb).
  * Uang fisik Rp 200.000 diserahkan ke kasir menggenapkan total fisik menjadi **Rp 1.350.000**.
* **Dampak ke Sistem ERP:**
  * Kasir menginput penerimaan fisik utuh Rp 1.350.000.
  * Sistem mencocokkan target Rp 1.350.000 dengan fisik Rp 1.350.000 $\to$ **Status Kantong 2: `MATCHED` ✅**.
  * **Tidak ada catatan selisih/utang di sistem keuangan**, nama kru tetap bersih, dan proses berlangsung cepat.

---

### B. Kasus 2: Nota BBM Hilang Rp 300.000 (Masuk ke Jalur Pencatatan Sistem)
* **Temuan Kasir:**
  * Kru menyerahkan nota riil: BBM Solar (Rp 2.300.000), Tol (Rp 900.000), Parkir/Cuci (Rp 100.000) = Total Nota Rp 3.300.000.
  * Sisa fisik UJ di tangan kru seharusnya: Rp 3.500.000 - Rp 3.300.000 = **Rp 200.000**.
  * Namun, kru hanya mengembalikan sisa fisik **Rp 200.000**, padahal satu nota pengisian solar darurat di SPBU Cirebon sebesar **Rp 300.000** hilang/tidak tercetak karena mesin struk SPBU rusak.
  * *Perhitungan Kasir:*
    $$\text{Plafon UJ (3.5jt)} - \text{Nota Sah (3.0jt)} - \text{Sisa Fisik Dikembalikan (200rb)} = \mathbf{Rp\ 300.000\ (UNVERIFIED)}$$
* **Resolusi Lapangan (Masuk ke Sistem):**
  * Karena nilai Rp 300.000 cukup signifikan dan solar riil masuk ke tangki bus (terbukti dari jarum indikator solar & foto odometer), kru meminta agar temuan ini dilaporkan resmi ke manajemen untuk dicek riwayat GPS-nya.
  * Kasir **tidak memaksakan kru membayar di tempat** dan **tidak menahan SPJ secara liar**.
  * Kasir menginput temuan ke menu **Temuan Selisih SPJ (`crew_cash_discrepancies`)**:
    * `spj_id`: `SPJ/AKP/2610/0001`
    * `source_type`: `UJ_EXPENSE_UNVERIFIED`
    * `expected_amount`: Rp 3.300.000
    * `actual_amount`: Rp 3.000.000
    * `difference_amount`: **Rp 300.000**
    * `reason`: *"Struk SPBU Palimanan hilang saat pengisian solar darurat 34 liter. Odometer dan foto solar terlampir."*
    * `resolution_status`: **`PENDING_INVESTIGATION`**
* **Dampak ke Status Dokumen SPJ:**
  * `operational_status`: **`COMPLETED`** (Bus sudah di pool, penumpang sudah tuntas).
  * `financial_status`: Berubah menjadi **`DISCREPANCY`** ⚠️.
  * `uj_status`: **`DISCREPANCY_RECORDED`**.

---

## 3. Alur Investigasi & Otorisasi Manajemen Keuangan

Pada level sistem, Manajer Keuangan (`FINANCE_MANAGER`) menerima notifikasi dashboard: **`1 SPJ Memerlukan Resolusi Selisih Kas`**.

### Proses Investigasi:
1. Manajer Keuangan membuka dokumen SPJ dan memeriksa data telematika/GPS:
   * Bus terdeteksi berhenti 8 menit di SPBU Pertamina KM 208 Palimanan pada jam 02:15 WIB.
   * Odometer sebelum dan sesudah menunjukkan konsumsi solar wajar ($1\text{ liter} : 3.2\text{ km}$).
2. Manajer Keuangan memutuskan bahwa pengeluaran Rp 300.000 adalah **BBM Operasional Sah (Kelalaian Struk)**, bukan penggelapan kas oleh kru.

### Eksekusi Keputusan di Sistem:
Manajer Keuangan membuka modal resolusi selisih dan memilih aksi:
* **Pilihan Keputusan:** **`DISPENSASI_PERUSAHAAN (COMPANY_WAIVER)`**
* **Akun Beban Pengalihan:** **`58101 — Beban Selisih Kas Operasional (Pasca Investigasi Kasir)`** (atau langsung diakui ke `51101 Beban Solar Bus`).
* **Catatan Approval:** *"GPS valid berhenti di SPBU Palimanan, konsumsi liter normal. Selisih disetujui dibebankan ke perusahaan sebagai dispensasi operasional."*
* **Hasil:**
  * Status selisih di `crew_cash_discrepancies` berubah menjadi **`RESOLVED`**.
  * Status UJ berubah dari `DISCREPANCY_RECORDED` menjadi **`BALANCED`** ✅.
  * Status finansial SPJ naik dari `DISCREPANCY` menjadi **`UNDER_REVIEW`** $\to$ siap di-**`SETTLED`** oleh Akuntan!

---

## 4. Opsi Alternatif: Jika Terbukti Kelalaian / Penggelapan Kru (Klaim Piutang)

Jika dalam kasus lain kru tidak dapat membuktikan pengeluaran dan terbukti merupakan kelalaian pribadi:
* Manajer Keuangan memilih: **`BEBANKAN_KE_KRU (CHARGE_TO_CREW)`**.
* Sistem secara otomatis membentuk piutang usaha karyawan:
  * **Debit:** **`12901 — Piutang Klaim Selisih Kas Kru`** (Dimensi: `crew_id = Pak Budi`).
  * **Kredit:** **`13101 — Uang Jalan (UJ) Kru Perjalanan Bus`** (Menutup saldo UJ menjadi seimbang).
* Piutang ini nantinya akan otomatis dipotongkan dari daftar transfer rekap payroll gaji/premi ritase kru bulan berjalan, tanpa perlu penagihan fisik yang memicu konflik di lapangan.

---

## 5. Verifikasi Akuntansi & Posting Jurnal Resolusi SPJ

Dengan disetujuinya resolusi dispensasi oleh Manajer Keuangan, Akuntan (`ACCOUNTANT`) memposting jurnal rekonsiliasi SPJ:

### Jurnal Rekonsiliasi SPJ (Dengan Akun Selisih Terinvestigasi):
| No. Akun | Nama Akun | Posisi | Nominal (Rp) | Keterangan & Dimensi Terikat |
| :--- | :--- | :---: | :---: | :--- |
| **11101** | Kas Operasional Pool (Terima Kasir) | **Debit** | 1.550.000 | Sisa UJ (200rb) + Setoran Kas (1.35jt utuh) |
| **51101** | Beban Bahan Bakar Minyak (Solar Sah) | **Debit** | 2.300.000 | Dimensi: `SPJ-001`, `SS-01` |
| **52101** | Beban Tol Trans Jawa | **Debit** | 900.000 | Dimensi: `SPJ-001`, `SS-01` |
| **52103** | Beban Cuci & Parkir Armada | **Debit** | 100.000 | Dimensi: `SPJ-001`, `SS-01` |
| **58101** | Beban Selisih Kas Operasional | **Debit** | 300.000 | **Hasil Investigasi Kasir (Dispensasi FM)** |
| **53101** | Beban Uang Makan Kru Bus | **Debit** | 400.000 | Dimensi: `SPJ-001` |
| **53102** | Beban Premi / Insentif Ritase Kru | **Debit** | 650.000 | Hak Premi PP (ke payroll) |
| **53103** | Beban Bonus Full Seat Kru | **Debit** | 150.000 | Dimensi: `SPJ-001` (Leg 1 100%) |
| **53104** | Beban Komisi / Insentif Kargo Kru | **Debit** | 70.000 | 20% omzet kargo motor |
| **54102** | Beban Uang Jasa Koordinator Lapangan | **Debit** | 440.000 | Korlap Barat (240rb) + Timur (200rb) |
| **12102** | Piutang Agen Penjualan Online (AR OTA) | **Debit** | 3.000.000 | RedBus/Traveloka |
| **12101** | Piutang Agen Penjualan Tiket Offline | **Debit** | 2.000.000 | Loket Terminal |
| | | | | |
| **13101** | Uang Jalan (UJ) Kru Perjalanan Bus | **Kredit** | 3.500.000 | **Saldo UJ tuntas/lunas menjadi Rp 0** |
| **41101** | Pendapatan Tiket AKAP Reguler | **Kredit** | 6.000.000 | Omzet tiket sah |
| **43101** | Pendapatan Kargo & Paket Bagasi Bus | **Kredit** | 350.000 | Omzet bruto kargo motor |
| **11101** | Kas Operasional Pool (Bayar Tunai Kru) | **Kredit** | 620.000 | BKK: Makan (400rb) + Bonus (150rb) + Kargo (70rb) |
| **23101** | Utang Kompensasi Kru | **Kredit** | 650.000 | Premi ritase kru (payroll) |
| **22102** | Utang Jasa Koordinator Lapangan | **Kredit** | 440.000 | Hak Korlap Barat & Timur |

* **Invariant Check Jurnal Rekonsiliasi SPJ Discrepancy:**
  * **Total Debit:**  
    $$1.550.000 + 2.300.000 + 900.000 + 100.000 + 300.000 + 400.000 + 650.000 + 150.000 + 70.000 + 440.000 + 3.000.000 + 2.000.000 = \mathbf{Rp\ 11.860.000}$$
  * **Total Kredit:**  
    $$3.500.000 + 6.000.000 + 350.000 + 620.000 + 650.000 + 440.000 = \mathbf{Rp\ 11.860.000}$$
  * **Status Invariant:** **SEIMBANG (BALANCED)** ✅
  * **Saldo Akhir Akun UJ (`13101`):** **Rp 0** (Tuntas).

---

## 6. Spesifikasi Terkunci: Kemerdekaan Tutup Buku Bulanan (*Period Closing Unblocked*)

Salah satu kelemahan sistem lama adalah penutupan periode akuntansi tertunda berminggu-minggu hanya karena 1 atau 2 SPJ bersengketa selisih. Blueprint mengunci proteksi berikut:

1. **SPJ Berselisih Bukan Pemblokir Tutup Buku:**
   * Jika sampai tanggal akhir bulan (misal 31 Oktober 2026) investigasi selisih kas belum selesai, sistem **TIDAK MENGUNCI** proses tutup buku periode (*Month-End Close*).
2. **Mekanisme Akun Penampung Neraca Sementara (`11999`):**
   * Transaksi kas riil yang sudah terjadi tetap diposting pada periode Oktober.
   * Nilai selisih yang masih menggantung (Rp 300.000) dialokasikan sementara ke akun neraca penampung: **`11999 — Selisih Kas Operasional Sementara`**.
   * Checklist tutup buku menampilkan peringatan (*Warning Exception*):
     > ⚠️ *"Terdapat 1 dokumen SPJ dengan selisih belum selesai di akun 11999 sebesar Rp 300.000. Tutup periode diizinkan melanjutkan."*
3. **Resolusi Periode Berikutnya:**
   * Saat investigasi selesai di bulan November, jurnal memorial penyesuaian (*Adjustment Journal*) diposting di bulan November untuk mengosongkan akun `11999` ke beban atau piutang kru, menjaga laporan keuangan Oktober tetap stabil dan sah.

---

## 7. Kesimpulan & Penegasan Aturan Bisnis

* **Kru Diberdayakan Bermusyawarah:** Kesalahan kembalian kecil dianjurkan diselesaikan mandiri di meja kasir agar administrasi keuangan tetap ringkas dan transparan.
* **Tidak Ada Penghakiman Sepihak:** Selisih yang tidak terselesaikan dicatat sebagai temuan investigasi, bukan langsung dituduh sebagai utang kru.
* **Separation of Duties Terjaga:** Kasir hanya mencatat fakta fisik; penetapan beban perusahaan vs pemotongan gaji kru adalah wewenang mutlak **`FINANCE_MANAGER`**.
* **Keuangan Perusahaan Tetap Melaju:** Penutupan buku bulanan dan penyajian laporan laba rugi tidak terhambat oleh perselisihan kas di jalan.
