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

---
*Gunakan dokumen ini sebagai referensi saat melakukan pengembangan fitur baru atau debugging sistem otorisasi.*
