# 📋 Blueprint Proyek: ERP SS Traveling

## 1. Visi Proyek
Transformasi operasional manual (Excel/kertas) menjadi sistem ERP berbasis web yang terintegrasi, *auditable*, dan *scalable* untuk mengelola bisnis utama (Bus Pariwisata & AKAP) serta bisnis penunjang (Karoseri, Pom Bensin, Gudang).

## 2. Arsitektur Sistem
*   **Pola Pengembangan:** Polyrepo (Setiap service memiliki repository Git sendiri).
*   **Gaya Arsitektur:** Microservices (Event-Driven).
*   **Database Strategy:** One Service, One Database (Isolasi total).
*   **Relasi Antar Data:** Logical Relationship (menghubungkan data lintas service menggunakan ID, bukan Foreign Key fisik).
*   **Komunikasi Antar Service:**
    *   **External:** API Gateway (NestJS) sebagai pintu masuk tunggal.
    *   **Internal:** RabbitMQ (untuk sinkronisasi data/event antar service).
    *   **Auth:** Centralized Identity Service (JWT + RBAC).

## 3. Tech Stack (Teknologi)
*   **Backend:** NestJS (TypeScript).
*   **ORM:** TypeORM (Data Mapper Pattern).
*   **Database:** PostgreSQL (ACID Compliance untuk data keuangan).
*   **Package Manager:** Yarn.
*   **Frontend:** React / Next.js (Tailwind CSS).

## 4. Modul Utama (Fase 1: Finance Service)
Menerapkan sistem **Double-Entry Bookkeeping** (seperti SAP).
*   **Fitur Utama:**
    *   **Chart of Accounts (COA):** Pengelolaan daftar akun (Aset, Liabilitas, Ekuitas, Pendapatan, Beban).
    *   **General Ledger:** Pencatatan Jurnal otomatis dari setiap transaksi operasional.
    *   **Cost Center:** Pelacakan pengeluaran per unit bus atau per divisi bisnis.
    *   **Audit Trail:** Rekam jejak setiap perubahan data keuangan.

## 5. Pola Keamanan & Auth (Referensi: Pattern Absensi_BE)
*   **Metode:** JWT (Stateless) dengan validasi `tokenLogin` di Database.
*   **Identitas:** Login via `email` atau `nip`.
*   **Struktur RBAC (Role-Based Access Control):**
    *   **Users:** Data personil.
    *   **Roles:** Jabatan/Peran (Admin, Finance, Operational, Driver).
    *   **Menus & Modules:** Mengatur akses UI di Frontend.
    *   **Permissions (Enhancement):** Akses granular (Create, Read, Update, Delete) pada setiap fitur.

## 6. Daftar Repository yang Akan Dibuat
1.  `ss-travel-auth-service`: Mengelola User, Role, dan Sesi.
2.  `ss-travel-gateway`: Pintu masuk API dan validasi keamanan.
3.  `ss-travel-finance-service`: Inti pembukuan dan laporan keuangan.
4.  `ss-travel-frontend`: Aplikasi web utama.

---

## 7. Langkah Eksekusi (Next Steps)
1.  Inisialisasi `ss-travel-auth-service` menggunakan Yarn.
2.  Setup boilerplate NestJS sesuai pattern referensi (`@models`, `@services`, dll).
3.  Desain Database Schema untuk Auth & RBAC.
