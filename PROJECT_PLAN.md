# 📋 Blueprint Proyek: ERP SS Travelink (PT SS Travelink Official)

## 1. Visi Proyek
Transformasi operasional manual (Excel/kertas) menjadi sistem ERP berbasis web yang terintegrasi, *auditable*, dan *scalable* untuk mengelola bisnis utama (Bus Pariwisata & AKAP) serta bisnis penunjang (Karoseri, Pom Bensin, Gudang) milik **PT SS Travelink Official**.

## 2. Arsitektur Sistem
*   **Pola Pengembangan:** Monorepo Workspace (Backend & Frontend).
*   **Gaya Arsitektur:** Monolithic Backend Architecture dengan Single-Entry General Ledger (Blueprint v1.3).
*   **Database Strategy:** PostgreSQL dengan TypeORM Data Mapper Pattern dan transaksi atomik.
*   **Komunikasi:** REST API standar dengan global prefix `/api/v1` dan Swagger Docs di `/api/v1/docs`.
*   **Auth & Security:** Triple-Lock Auth (JWT Access + Refresh Token di HttpOnly Cookie untuk Web dan Bearer Header untuk Mobile, Single Device Login / SDL, Stateless Device Fingerprinting `x-device-id`).
*   **Authorization:** Granular RBAC (Roles + Nested Set, Menus Adjacency Tree, Custom Permissions Actions JSONB).

## 3. Tech Stack (Teknologi)
*   **Backend (`ss-travel-backend`):** NestJS v10, TypeORM, PostgreSQL, class-validator, decimal.js (`MoneyHelper`).
*   **Frontend (`ss-travel-frontend`):** React 19, Vite, Tailwind CSS v4, Shadcn UI, TanStack Query, Axios, Lucide Icons.
*   **Package Manager:** Yarn (`yarn.lock` strictly enforced).

## 4. Struktur Modul ERP Inti (Telah Selesai & Teruji 100%)
1.  **Identity, Auth & RBAC:** Single Device Login, Hierarki Menu Dinamis, Matriks Hak Akses Peran, Audit Trail.
2.  **Master Organisasi & Armada:** Multi-Entitas, 5 Cost Center, Kelas Kursi (`seat_classes`), Galeri Multi-Image Bus, CRM Leads.
3.  **Master Aturan Bisnis & Tarif:** Dynamic Pricing Musiman/Tuslah, Mitra Agen Terminal & OTA, Komisi Berjenjang, Rate Kru Snapshot, RM Mitra & Korlap.
4.  **Accounting Core Engine & Jurnal:** Single entry posting atomik, proteksi idempotensi, Buku Jurnal GL, Reversal abadi, 11 Preset Jurnal Memorial.
5.  **Perencanaan Jadwal & Operasional SPJ:** Validasi anti-bentrok armada/kru, buffer istirahat 3 jam, Gantt Chart, Dokumen SPJ resmi, Emergency Breakdown rollover.
6.  **Keuangan SPJ Full-Page (`/spjs/:id/finance`):** Amplop UJ, biaya solar/odometer & tol, tiket agen 100% bruto, tiket tunai, komisi kargo dinamis, uang perpal kru (`53101`), bonus full seat 100% (`53103`), early payout transfer bank.
7.  **Meja Kasir Pool (`/cashier`):** Rekonsiliasi Dua Kantong Kas Kru (Anti-Netting), Musyawarah Lapis 1 vs Investigasi FM Lapis 2, Dispensasi Perusahaan (`58101`) vs Klaim Kru (`12901`), Kemerdekaan Tutup Buku unblocked via akun `11999`, Voucher BKM/BKK.
8.  **Utang (AP) & Piutang (AR):** Servis makan restoran berkala anti-double bill, tagihan vendor bengkel/derek, DP wisata 30% (`24101`), pelunasan invoice wisata 70% (`12101`), Bukti Bayar AP & Kwitansi Terima AR.
9.  **Kas Kecil Pool (`/petty-cash`) & Treasury (`/treasury`):** 8 preset SOP pengeluaran non-SPJ garasi, mutasi dropping antar-rekening ber-approval Maker-Checker, rekening koran digital GL.
10. **Layanan Gelondongan Mitra:** Uang koordinasi lapangan per leg (`/finance/coordination-fees`) dan servis makan restoran gelondongan (`/finance/restaurant-settlements`) dengan bulk bank transfer dan generator pesan WhatsApp.
11. **Laporan & Tutup Buku:** Trip Profitability dual-view (Per Bus vs Per Kelompok Perjalanan Skenario 3), General Ledger 4-Tab (GL, Neraca Saldo, Laba Rugi Komprehensif, Neraca Keuangan), Meja Tutup Buku Bulanan 6-point audit checklist.

---

## 5. Status Verifikasi Kualitas
*   **Backend Unit Tests:** 35 Test Suites, 264 Tests Passing 100%.
*   **Backend Build:** `yarn build` NestJS sukses 100%.
*   **Frontend Build:** `yarn build` Vite React sukses.

---

## 6. Langkah Eksekusi Berikutnya (Next Steps)
1.  **Tahap 10: E2E Simulation Testing**: Simulasi alur lengkap Skenario 1 s.d. 4 pada browser secara terintegrasi.
2.  **Final Polish & User Guide**: Penyempurnaan manual panduan operasional pengguna.
