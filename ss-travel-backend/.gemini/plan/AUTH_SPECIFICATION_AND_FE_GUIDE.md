# 🛡️ Panduan & Spesifikasi Lengkap Autentikasi: SS Traveling ERP

> **Dokumen Resmi untuk Backend & Frontend Developer**  
> *Lokasi: `.gemini/plan/AUTH_SPECIFICATION_AND_FE_GUIDE.md`*  
> *Versi: 2.0 (Dual-Strategy Auth: HttpOnly Cookie + Bearer Token)*

---

## 1. Ikhtisar Arsitektur Autentikasi (Hybrid Strategy)

Sistem autentikasi SS Traveling ERP dirancang menggunakan **Hybrid Dual-Strategy**:
1. **Web Client (Browser)**: Menggunakan **HttpOnly Cookie** untuk menyimpan Access Token. JavaScript browser tidak dapat membaca cookie ini sehingga kebal terhadap serangan **XSS (Cross-Site Scripting)**. Refresh Token disimpan di storage lokal untuk keperluan rotasi sesi.
2. **Mobile Client (Android & iOS)**: Karena aplikasi native tidak memiliki sandbox cookie browser secara otomatis, mobile app membaca `token` dari JSON body dan mengirimkannya melalui Header `Authorization: Bearer <token>`.
3. **Stateless Device Fingerprinting & Single Device Login (SDL)**:
   - Setiap perangkat wajib memiliki `x-device-id` unik yang dikirimkan pada setiap request.
   - Backend memverifikasi fingerprint perangkat secara stateless di setiap request:
     $$\text{fingerprint} = \text{SHA256}(\text{deviceId} + \text{User-Agent})$$
   - Jika refresh token dicuri dan ditembak dari perangkat lain, sistem langsung mendeteksi anomali, menghapus sesi di database, dan memblokir akses seketika.
4. **Machine-Readable Error Codes**:
   - Response error 401 tidak lagi mengembalikan teks acak.
   - Backend mengembalikan field `errorCode` yang baku (misalnya `TOKEN_EXPIRED`), sehingga Frontend memiliki kepastian kapan harus me-refresh token dan kapan harus langsung force logout tanpa loop.

---

## 2. Matriks Kode Error Baku (Machine-Readable Error Codes)

Saat request gagal dengan status **HTTP 401 Unauthorized**, periksa properti `error.response.data.errorCode`:

| `errorCode` | Penyebab | Tindakan Wajib Frontend |
| :--- | :--- | :--- |
| **`TOKEN_EXPIRED`** | Access token telah melewati masa aktif (1 jam). | **Pemicu SATU-SATUNYA untuk memanggil `POST /api/auth/refresh`**. Antrekan request lain yang gagal, panggil refresh token, lalu retry request. |
| **`MISSING_DEVICE_ID`** | Header `x-device-id` tidak disertakan dalam request. | Pasang header `x-device-id` di request interceptor Axios. |
| **`UNAUTHORIZED`** | Tidak ada token sama sekali di Cookie maupun Header `Authorization`. | Langsung arahkan user ke halaman login (`/login`). Jangan panggil refresh. |
| **`INVALID_DEVICE_CONTEXT`** | Fingerprint perangkat tidak cocok dengan token (indikasi pembajakan sesi). | Bersihkan storage lokal, tampilkan notifikasi keamanan, dan arahkan user ke login. |
| **`INVALID_TOKEN`** | Token korup, signature tidak valid, atau malformed. | Bersihkan storage dan arahkan user ke login. |
| **`INVALID_SESSION`** | Sesi pengguna tidak ditemukan atau telah dibatalkan di server (misal login dari perangkat lain / SDL). | Force logout, bersihkan storage, tampilkan pesan: *"Sesi Anda telah berakhir atau akun aktif di perangkat lain"*. |
| **`REFRESH_TOKEN_EXPIRED`** | Refresh token (7 hari) telah kadaluarsa. | Force logout dan arahkan user ke login. |

---

## 3. Spesifikasi Lengkap Endpoint API

Semua endpoint berada di bawah prefix `/api`.

### A. POST `/api/auth/login`
Digunakan oleh Web dan Mobile untuk login ke dalam sistem.

#### Request Headers
```http
Content-Type: application/json
User-Agent: Mozilla/5.0... (atau Mobile App User-Agent)
x-device-id: uuid-device-1234-5678 (Wajib stabil per perangkat)
```

#### Request Body (DTO)
```json
{
  "identifier": "admin@email.com",
  "password": "PasswordRahasia123",
  "deviceId": "uuid-device-1234-5678"
}
```
*(Catatan: `identifier` bisa berupa Email atau NIP).*

#### Response: Berhasil (200 OK)
* **Cookie yang diset oleh Backend**:
  ```http
  Set-Cookie: token=<accessToken>; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax
  ```
* **Response Body (JSON)**:
  ```json
  {
    "status": true,
    "message": "Login success",
    "code": 200,
    "data": {
      "user": {
        "id": "c1f7a012-...",
        "name": "Super Admin",
        "email": "admin@email.com",
        "nip": "ADM-001",
        "phone": "081234567890",
        "avatar": null,
        "isPasswordChanged": true,
        "roles": [
          { "id": "uuid-role-1", "name": "SUPERADMIN" }
        ]
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "menus": [
        {
          "id": "uuid-menu-1",
          "name": "Dashboard",
          "url": "/dashboard",
          "icon": "LayoutDashboard",
          "sequence": 1,
          "isRead": true,
          "isCreate": true,
          "isUpdate": true,
          "isDelete": true,
          "actions": {}
        }
      ]
    }
  }
  ```

#### Response: Gagal
* **Password Salah (400 Bad Request)**:
  ```json
  {
    "statusCode": 400,
    "message": "Email or password is wrong",
    "status": false
  }
  ```
* **User Tidak Ditemukan (404 Not Found)**:
  ```json
  {
    "statusCode": 404,
    "message": "Email or password not found",
    "status": false
  }
  ```

---

### B. POST `/api/auth/refresh`
Digunakan ketika client mendeteksi error `TOKEN_EXPIRED`.

#### Request Headers
```http
Content-Type: application/json
User-Agent: Mozilla/5.0...
x-device-id: uuid-device-1234-5678
```

#### Request Body (`RefreshTokenDto`)
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "deviceId": "uuid-device-1234-5678"
}
```

#### Response: Berhasil (200 OK)
* **Cookie yang diperbarui oleh Backend**:
  ```http
  Set-Cookie: token=<newAccessToken>; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax
  ```
* **Response Body**:
  ```json
  {
    "status": true,
    "message": "Token refreshed successfully",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### Response: Gagal (401 Unauthorized)
* **Perangkat Berbeda / Anomali Keamanan**:
  ```json
  {
    "statusCode": 401,
    "errorCode": "INVALID_DEVICE_CONTEXT",
    "message": "Security anomaly detected: device or fingerprint mismatch"
  }
  ```
* **Sesi Hangus / Diganti Login Lain**:
  ```json
  {
    "statusCode": 401,
    "errorCode": "INVALID_SESSION",
    "message": "Invalid session or user not found"
  }
  ```
* **Refresh Token Kadaluarsa**:
  ```json
  {
    "statusCode": 401,
    "errorCode": "REFRESH_TOKEN_EXPIRED",
    "message": "Session expired or refresh token invalid"
  }
  ```

---

### C. POST `/api/auth/logout`
Menghapus cookie di browser dan membatalkan token sesi aktif di database.

#### Request Headers
* **Web**: Otomatis mengirimkan Cookie `token`.
* **Mobile**: Mengirimkan `Authorization: Bearer <token>`.
* **Wajib**: `x-device-id`.

#### Response: Berhasil (200 OK)
* **Cookie dibersihkan**:
  ```http
  Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
  ```
* **Response Body**:
  ```json
  {
    "status": true,
    "message": "Logout successful"
  }
  ```

---

### D. GET `/api/auth/me`
Mengambil data profil pengguna yang sedang login dan daftar menu dinamis terbarunya.

#### Request Headers
* **Web**: Disertai cookie (via `withCredentials: true`).
* **Mobile**: `Authorization: Bearer <token>`.
* **Header Wajib**: `x-device-id`.

#### Response: Berhasil (200 OK)
```json
{
  "status": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": "c1f7a012-...",
      "name": "Super Admin",
      "email": "admin@email.com",
      "nip": "ADM-001",
      "phone": "081234567890",
      "avatar": null,
      "isPasswordChanged": true,
      "roles": [{ "id": "...", "name": "SUPERADMIN" }]
    },
    "menus": [ /* Daftar menu terotorisasi */ ]
  }
}
```

#### Response: Gagal (401 Unauthorized - Token Expired)
```json
{
  "statusCode": 401,
  "errorCode": "TOKEN_EXPIRED",
  "message": "Access token has expired"
}
```

---

## 4. Panduan Implementasi untuk Tim Frontend (Web)

Berikut implementasi lengkap dan standar untuk Axios Client di Frontend (`axiosClient.ts`):

```typescript
import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// 1. Dapatkan atau buat Device ID permanen di localStorage
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem("ss_device_id");
  if (!deviceId) {
    deviceId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem("ss_device_id", deviceId);
  }
  return deviceId;
};

// 2. Inisialisasi Axios dengan withCredentials: true
const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true, // WAJIB: Agar browser otomatis mengirim dan menerima HttpOnly Cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Pasang header x-device-id di setiap request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers.set("x-device-id", getDeviceId());

    // Opsional untuk Web jika access token ada di storage,
    // tapi karena sudah HttpOnly cookie, Authorization header boleh dikosongkan untuk Web.
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// 3. State Management untuk Antrean Refresh Token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper Logout Bersih
export const forceLogout = (title: string, description: string) => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("menus");

  toast.error(title, { description });

  setTimeout(() => {
    window.location.href = "/login";
  }, 1200);
};

// 4. Response Interceptor: Tangani 401 Berdasarkan errorCode
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    const errData = error.response?.data;
    const errorCode = errData?.errorCode;

    // Jika terjadi 401 dan token expired, lakukan refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // HANYA proses refresh jika errorCode adalah TOKEN_EXPIRED
      if (errorCode === "TOKEN_EXPIRED") {
        if (isRefreshing) {
          // Jika sedang ada proses refresh yang berjalan, masukkan request ke antrean
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => api(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem("refreshToken");
        const deviceId = getDeviceId();

        if (!refreshToken) {
          isRefreshing = false;
          forceLogout("Sesi Berakhir", "Silakan masuk kembali.");
          return Promise.reject(error);
        }

        try {
          // Panggil API refresh menggunakan instance axios biasa (tanpa interceptor loop)
          const refreshRes = await axios.post(
            `${baseURL}/api/auth/refresh`,
            { refreshToken, deviceId },
            { withCredentials: true }
          );

          const { token: newAccessToken, refreshToken: newRefreshToken } =
            refreshRes.data.data;

          // Simpan refresh token baru
          if (newAccessToken) localStorage.setItem("token", newAccessToken);
          if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);

          processQueue(null, newAccessToken);
          isRefreshing = false;

          // Ulangi request awal
          return api(originalRequest);
        } catch (refreshErr: any) {
          processQueue(refreshErr, null);
          isRefreshing = false;

          const refreshErrorCode = refreshErr.response?.data?.errorCode;
          let message = "Sesi Anda telah berakhir.";
          if (refreshErrorCode === "INVALID_DEVICE_CONTEXT") {
            message = "Terdeteksi anomali perangkat. Silakan login kembali.";
          } else if (refreshErrorCode === "INVALID_SESSION") {
            message = "Akun telah login di perangkat lain.";
          }

          forceLogout("Autentikasi Gagal", message);
          return Promise.reject(refreshErr);
        }
      }

      // Jika 401 BUKAN karena TOKEN_EXPIRED (misal INVALID_DEVICE_CONTEXT atau UNAUTHORIZED)
      if (errorCode === "INVALID_DEVICE_CONTEXT") {
        forceLogout("Peringatan Keamanan", "Sesi Anda tidak valid pada perangkat ini.");
      } else if (errorCode === "INVALID_SESSION") {
        forceLogout("Sesi Berakhir", "Akun Anda aktif di perangkat lain.");
      } else if (errorCode === "UNAUTHORIZED") {
        forceLogout("Akses Ditolak", "Silakan login terlebih dahulu.");
      } else {
        forceLogout("Sesi Tidak Valid", errData?.message || "Silakan login kembali.");
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 5. Panduan Implementasi untuk Tim Mobile (Flutter / React Native / Kotlin / Swift)

1. **Penyimpanan Kredensial**:
   - Simpan `token` dan `refreshToken` di secure storage bawaan OS (misalnya *EncryptedSharedPreferences / KeyStore* di Android, atau *Keychain* di iOS).
2. **Device Identifier**:
   - Gunakan ID perangkat unik bawaan OS (misalnya `android_id` di Android, atau `identifierForVendor` di iOS) dan kirimkan pada header `x-device-id`.
3. **Setiap Panggilan API**:
   - Selalu pasang header:
     ```http
     Authorization: Bearer <token>
     x-device-id: <deviceId>
     ```
4. **Alur Tangani 401**:
   - Baca properti `errorCode` di response error.
   - Jika `errorCode === "TOKEN_EXPIRED"`:
     - Tembak endpoint `POST /api/auth/refresh` dengan payload:
       ```json
       {
         "refreshToken": "<stored_refresh_token>",
         "deviceId": "<deviceId>"
       }
       ```
     - Simpan `token` dan `refreshToken` baru ke secure storage.
     - Retry request HTTP awal.
   - Jika `errorCode` lainnya:
     - Hapus credential dari secure storage dan arahkan user kembali ke form Login.

---

## 6. Rangkuman Keamanan & Keuntungan

1. **Kebal XSS**: Web browser menyimpan token di HttpOnly Cookie, skrip jahat yang disuntikkan via browser tidak dapat mencuri token.
2. **Anti Replay & Hijacking**: Refresh Token hanya valid jika ditembak dari perangkat yang sama persis (fingerprint matching).
3. **Single Device Enforcement (SDL)**: User yang login di HP akan otomatis menghentikan sesi aktif di Laptop (atau sebaliknya) secara elegan.
4. **Zero Confusion**: Frontend tidak lagi menebak-nebak status error karena kode `errorCode` sudah standardized.
