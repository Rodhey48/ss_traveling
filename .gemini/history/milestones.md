# Project Milestones: SS Traveling

## Phase 2: Fleet Management, Operations (SPJ) & Accounting (In Design & Planning)

### 2026-10-05: Harmonisasi Menyeluruh Blueprint v1.3 & Addendum v1.10
- **Status Ganda SPJ Tunggal**: Menetapkan secara definitif pemisahan independen antara `operational_status` (`DRAFT`, `ISSUED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) dan `financial_status` (`PENDING_SETTLEMENT`, `UNDER_REVIEW`, `DISCREPANCY`, `SETTLED`). Menggantikan dan menyelaraskan seluruh draft status sebelumnya di Bab 8.2 dan Addendum v1.1.
- **Standarisasi Akun Beban COA**: Memisahkan secara tegas COA akun Beban Layanan Makan Restoran Penumpang (`51102`), Beban Tol/Fasilitas (`521xx`), Beban Hak/Kompensasi Kru Bus (`531xx`: Uang Makan `53101`, Premi `53102`, Bonus Full Seat `53103`), serta Beban Keagenan & Jasa Koordinator (`541xx`: Komisi Agen `54101`, Uang Jasa Koordinator `54102`).
- **Penyelesaian Kas Yogyakarta**: Menetapkan 2 SOP resmi untuk pergantian kru di Yogyakarta (Mekanisme A: Settlement cabang via BKM vs Mekanisme B: Handover estafet sisa UJ antar-kru dengan verifikasi akhir di pool Jakarta).
- **Zonasi Koordinator & Bonus Full Seat Per-Leg**: Mengotomasi penentuan koordinator wilayah Barat (Berangkat) vs Timur (Pulang) dan evaluasi bonus okupansi 100% per-leg perjalanan.
- **Integritas Setoran Kargo Bruto**: Penegasan kewajiban penyetoran 100% penerimaan kargo manual tanpa pemotongan pribadi oleh kru.

### 2026-10-05: Blueprint Addendum v1.9 — Service Makan Restoran, Bonus Full Seat, Uang Koordinator & Klasifikasi Kargo
- **Master Restoran Mitra (`restaurants`)**: Master data rumah makan rekanan untuk fasilitas service makan penumpang AKAP (tarif per pax, lokasi kota, dan metode penyelesaian: tunai via UJ kru vs tagihan bulanan kantor via AP vendor).
- **Bonus Kru Full Seat (Okupansi 100%)**: Pemicu otomatis di SPJ saat seluruh kursi terisi penuh, menambahkan nominal bonus performa ke hak kompensasi kru (`crew_meal_payments`) yang bersumber dari kolom `full_seat_bonus` pada `crew_rate_rules`.
- **Fee Koordinator Wilayah (`coordinator_fee_rules`)**: Aturan fee jasa koordinator lapangan Barat (Jabodetabek) dan Timur (Jogja/Jateng-DIY) berbasis jumlah penumpang (default Rp10.000/pax, dinamis dapat diubah di master) yang dicatat ke biaya SPJ `COORDINATOR_FEE`.
- **Klasifikasi Kargo Manual (`spj_revenue_declarations`)**: Pemisahan tegas penerimaan paket bagasi bus ke dalam `CARGO_MOTORCYCLE` (sepeda motor) dan `CARGO_BOX` (kardus/titipan barang) dengan tarif yang diinput secara manual per resi/surat jalan.

### 2026-10-05: Blueprint Addendum v1.8 — Standardisasi Kompensasi & Master Tarif Kru
- **Master Rate Kru (`crew_rate_rules`)**: Menetapkan standar nominal Uang Makan (`meal_allowance`) dan Premi Ritase (`trip_incentive`) berjenjang berdasarkan peran (`DRIVER`, `CO_DRIVER`, `CONDUCTOR`) dan jenis penugasan (AKAP `PER_TRIP` vs Pariwisata `PER_DAY`).
- **Otomasi Snapshot ke SPJ**: Saat kru ditugaskan pada `spj_crew_assignments`, sistem otomatis menarik dan menyalin permanen (*snapshot*) rate hak kru ke transaksi `crew_meal_payments` dengan dukungan *manual override* berizin supervisor.
- **Pemisahan Finansial**: Hak kru dipisahkan secara tegas dari UJ operasional bus dan dibukukan ke akun beban akuntansi masing-masing (`Beban Uang Makan Kru` dan `Beban Premi Kru`).

### 2026-10-05: Blueprint Addendum v1.7 — Pengelolaan Agen (Online vs Offline), Rute Asal/Zonasi & Komisi Penjualan
- **Klasifikasi Agen (`agents`)**: Membedakan `OFFLINE` (loket terminal fisik) dan `ONLINE_OTA` (RedBus, Traveloka), atribut kota (`city`: `JAKARTA`, `YOGYAKARTA`, `ALL`), serta cara penyelesaian kas (`settlement_type`).
- **Smart Filter Arah Rute**: Sistem otomatis memfilter pilihan agen sesuai arah leg SPJ (Jkt $\to$ Jogja hanya menampilkan agen Jakarta + OTA; Jogja $\to$ Jkt hanya agen Jogja + OTA) untuk mencegah kesalahan input manifest.
- **Matriks Komisi Fleksibel (`agent_commission_rules`)**: Mendukung komisi flat per tiket maupun persentase potongan fee platform per kelas kursi.
- **Pemisahan Finansial OTA vs Kru**: Kru bus terbebas dari beban setoran uang tiket OTA; tiket OTA dialokasikan langsung ke piutang AR OTA, sedangkan kru hanya menyetorkan penerimaan fisik tiket offline.

### 2026-10-05: Blueprint Addendum v1.6 — Multi-Class Kursi, Dynamic Pricing & Integritas Keuangan
- **Multi-Class Kursi per Bus (`vehicle_seat_classes`)**: Memfasilitasi konfigurasi kabin majemuk dalam 1 armada (misal: gabungan 4 kabin Sleeper + 20 kursi Luxury Seat 2-1) sekaligus bertindak sebagai *hard ceiling* kuota penumpang saat manifes/SPJ.
- **Dynamic Seasonal Pricing (`fare_seasons` & `fare_matrix`)**: Memfasilitasi kalender tarif musiman (reguler, tuslah Lebaran, peak season liburan/weekend) dengan rentang tanggal berlaku dinamis.
- **Price Snapshotting & Immutable Journals**: Menjamin 100% catatan keuangan masa lalu tetap abadi menggunakan harga saat transaksi dibuat, terlepas dari adanya perubahan harga master di masa depan.

## Phase 1: Infrastructure & Auth (Completed)

### 2026-10-01: Dual-Strategy Auth (HttpOnly Cookie + Bearer), Machine-Readable Errors & Security Hardening
- **Hybrid Token Extraction**: Refactored `JwtAuthGuard` to support dual token extraction: Authorization Header (`Bearer <token>`) for Mobile Apps and API clients, with seamless fallback to `HttpOnly` Cookie (`token`) for Web Browsers to provide complete immunity against XSS.
- **Cookie-Parser & CORS Hardening**: Integrated `cookie-parser` with CommonJS-compliant module import (`import * as cookieParser`) and configured CORS with `credentials: true` and dynamic origin reflection.
- **Machine-Readable Error Codes**: Standardized all 401 Unauthorized responses with structured error codes: `TOKEN_EXPIRED` (the sole trigger for client-side refresh), `MISSING_DEVICE_ID`, `UNAUTHORIZED`, `INVALID_DEVICE_CONTEXT` (anti-hijacking anomaly), `INVALID_TOKEN`, `INVALID_SESSION`, and `REFRESH_TOKEN_EXPIRED`.
- **Session Revocation & Logout API**: Implemented `POST /api/auth/logout` that invalidates active sessions (`sessionToken = null`, `refreshToken = null`) in the database and clears the browser cookie.
- **Automated Verification**: Added comprehensive unit test suite in `src/auth/guards/jwt-auth.guard.spec.ts` covering 6 critical security scenarios with 100% pass rate.
- **Developer Documentation & FE Guide**: Published complete blueprint and implementation guide with copy-paste Axios client interceptors in `.gemini/plan/AUTH_SPECIFICATION_AND_FE_GUIDE.md`.

### 2026-06-04: Session Binding Stability & Security Anomaly Resolution
- **Device ID Standardization**: Resolved an issue where users were unexpectedly logged out due to "Security Anomaly" errors. The root cause was storing the `deviceId` in encrypted storage, which could trigger a re-generation if decryption failed. Moved `deviceId` to plain `localStorage` for absolute fingerprint stability across sessions and browser restarts.
- **Enhanced Security Logging**: Added granular server-side logging in `AuthService.refreshToken` to track token, origin, and fingerprint matches, enabling rapid diagnosis of session binding issues.
- **Robust Error Interceptor**: Refined the frontend Axios interceptor with detailed error reporting to distinguish between missing tokens, failed refresh calls, and retry failures.

### 2026-06-03: Security Hardening & Session Integrity (Triple-Lock Auth)
- **Token Rotation Architecture**: Implemented a robust Access/Refresh token system. Access Token (1h, stateless) for performance, Refresh Token (7d, stateful) for session continuity.
- **Single Device Login (SDL)**: Introduced `sessionToken` validation in the backend. New logins automatically invalidate previous sessions on other devices.
- **Stateless Fingerprint Validation**: Integrated device fingerprinting (hash of `deviceId` + `User-Agent`) into the JWT payload. Requests are validated statelessly in `JwtAuthGuard` against client headers (`x-device-id`).
- **Encrypted LocalStorage**: Integrated `secure-ls` with AES encryption and LZ compression to safeguard tokens and user data in the browser. Developed a centralized `storage` utility for consistent encryption/decryption.
- **Environment Variable Standardization**: Centralized all configurable strings (API URL, Storage Secret, App Name, Theme Keys) into `.env` and `.env.example`. Removed all hardcoded fallbacks from the source code to ensure strict configuration management.
- **Robust Auto-Refresh Interceptor**: Optimized the Axios interceptor to handle concurrent requests, implement a 3-second delay for stability, and ensure seamless retry with refreshed credentials.
- **Background Sync Stabilization**: Fixed a critical bug where background synchronization (`/auth/me`) was inadvertently clearing session tokens from storage.
- **Entity & DTO Synchronization**: Refactored `UsersEntity` and Auth DTOs to support new security columns (`session_token`, `refresh_token`, `last_origin`) with strict data exclusion (`select: false`).

### 2026-05-26: Distributed Authorization & Local-First Stability
- **Architecture Pivot**: Adopted a "Distributed but Independent" authorization strategy. Logic is implemented locally in each service to avoid monorepo dependency complexities while maintaining a unified security standard.
- **Enriched JWT Payload**: Refactored AuthService and MenusService to include granular permission strings (format aclName:action) directly in the JWT payload.
- **Granular PermissionsGuard**: Implemented a local PermissionsGuard and @RequirePermissions decorator that provides detailed feedback on missing permissions during 403 Forbidden errors.
- **Full Controller Integration**: Standardized Users, Menus, and Roles controllers with the new authorization SOP (Dual-layer: Roles + Permissions).
- **Frontend Error Interceptor**: Updated axiosClient.ts to display specific missing permissions in toast notifications, improving admin UX and transparency.

### 2026-05-25: Menu Management UX & Global State Robustness
- **Interactive Icon Picker**: Developed a high-performance, searchable icon gallery with 1,400+ Lucide icons.
- **Contextual Menu Creation**: Refactored Menu Management UI to support smart parent assignments.
- **Folder-like Group Menus**: Implemented non-redirecting "Group" menus using the title field.
- **Global Auth State (Context)**: Migrated local state to a unified AuthContext for real-time UI reactions.

### 2026-05-22: Auth System Perfection & Hybrid Permissions
- **Hierarchical Menu Management**: Implemented recursive tree fetching and UI.
- **Hybrid Action-based Permissions**: Added support for dynamic JSONB permissions (approve, export, etc.).
- **Dynamic Permission Sync**: Implemented background synchronization via /auth/me.
