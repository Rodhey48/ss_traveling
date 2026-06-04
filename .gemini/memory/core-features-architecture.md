# 🏗️ Arsitektur & Fitur Inti: SS Traveling ERP

Dokumen ini merangkum detail teknis, model data, dan alur kerja dari fitur-fitur yang telah diimplementasikan dalam Fase 1.

## 1. Sistem Otentikasi & Keamanan (Triple-Lock Auth)

Sistem ini dirancang untuk memberikan keamanan maksimal namun tetap transparan bagi pengguna.

### A. Alur Token (Access & Refresh)
*   **Access Token (JWT)**:
    *   **Masa Aktif**: 1 Jam.
    *   **Payload**: `id`, `name`, `roles`, `permissions`, `sid` (Session ID), dan `fingerprint`.
    *   **Sifat**: Stateless (Tanpa cek database di setiap request) untuk performa tinggi.
*   **Refresh Token**:
    *   **Masa Aktif**: 7 Hari.
    *   **Payload**: `sid` dan `fingerprint`.
    *   **Sifat**: Stateful (Divalidasi ke database saat proses refresh).
*   **Rotasi Token**: Setiap kali refresh token digunakan, sistem akan menghasilkan pasangan token baru (Access & Refresh) dan membuang yang lama.

### B. Mekanisme Keamanan Utama
1.  **Single Device Login (SDL)**:
    *   Menggunakan kolom `session_token` di tabel `users`.
    *   Setiap login baru akan menghasilkan UUID baru yang disimpan di DB dan JWT.
    *   Jika user login di perangkat lain, `session_token` di DB berubah, sehingga sesi di perangkat lama otomatis ditolak saat mencoba refresh.
2.  **Stateless Fingerprinting**:
    *   Menggabungkan `deviceId` (dari browser) dan `User-Agent` menjadi sebuah Hash unik.
    *   Hash ini disimpan di payload JWT.
    *   `JwtAuthGuard` akan memverifikasi hash ini di setiap request. Jika token dicuri dan dipakai di browser/perangkat berbeda, akses akan ditolak **tanpa perlu kueri database**.
3.  **Encrypted LocalStorage**:
    *   Frontend menggunakan library `secure-ls` (AES Encryption + LZ Compression).
    *   Data sensitif (`token`, `user`, `menus`) tidak terlihat sebagai teks biasa di Inspect Element browser.

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

### A. API Gateway
*   **Teknologi**: NestJS + `express-http-proxy`.
*   **Fungsi**: 
    *   Entry point tunggal untuk Frontend.
    *   Routing ke microservices (misal: `/auth-api/*` -> Auth Service).
    *   CORS management dan standarisasi header.

### B. Distributed Authorization
*   **Konsep**: "Pusat Otoritas, Eksekusi Lokal".
*   **Cara Kerja**: Auth Service menyuntikkan semua string permission user (format `aclName:action`) ke dalam payload JWT.
*   **Manfaat**: Service lain (seperti Finance/Fleet nantinya) bisa memvalidasi izin user secara lokal menggunakan `PermissionsGuard` tanpa perlu melakukan panggilan jaringan ke Auth Service.

## 4. Fitur Frontend Terpilih

*   **Auto-Refresh Interceptor**: Interceptor Axios yang cerdas. Jika mendapat error 401, ia akan mengantri request lain, melakukan refresh token di background, tunggu 3 detik untuk stabilitas, lalu mencoba ulang request awal.
*   **Background Sync**: `SyncProvider` yang secara periodik (5 menit) memperbarui data user dan menu dari endpoint `/me` tanpa perlu refresh halaman.
*   **Icon Picker**: UI khusus untuk memilih dari 1.400+ ikon Lucide dengan pencarian cepat.

---
*Gunakan dokumen ini sebagai referensi saat melakukan pengembangan fitur baru atau debugging sistem otorisasi.*
