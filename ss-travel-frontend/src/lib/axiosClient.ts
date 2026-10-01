import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { toast } from "sonner";
import { storage } from "./storage";

// Manual lightweight UUID generator
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Extend AxiosRequestConfig to support 'silent' and retry flags
declare module "axios" {
  export interface AxiosRequestConfig {
    silent?: boolean;
    _retry?: boolean;
  }
}

const rawBaseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/";
const baseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;

// Utility for Device ID (Fixed: Use plain localStorage for absolute fingerprint stability)
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem("ss_device_id");
  if (!deviceId) {
    console.warn("Device ID not found in storage, generating new one...");
    deviceId = generateUUID();
    localStorage.setItem("ss_device_id", deviceId);
  }
  return deviceId;
};

const getToken = () => storage.get("token");
const getRefreshToken = () => storage.get("refreshToken");

export const handleLogout = (reason = "Sesi Berakhir", detail = "") => {
  console.error(`LOGOUT TRIGGERED: ${reason} | Detail: ${detail}`);

  storage.remove("token");
  storage.remove("refreshToken");
  storage.remove("user");
  storage.remove("menus");

  toast.error(reason, {
    description: detail || "Silakan login kembali.",
  });

  setTimeout(() => {
    window.location.href = "/login";
  }, 1200);
};

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true, // Wajib: Browser otomatis mengirimkan dan menerima HttpOnly Cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Selalu pasang x-device-id dan Authorization token jika ada
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    const deviceId = getDeviceId();

    if (config.headers) {
      config.headers.set("x-device-id", deviceId);

      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

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

// Response Interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    const isSilent = originalRequest?.silent === true;
    const errData = error.response?.data;
    const errorCode = errData?.errorCode;

    // 1. Tangani 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // HANYA proses refresh jika errorCode adalah TOKEN_EXPIRED
      if (errorCode === "TOKEN_EXPIRED") {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (token) {
                originalRequest.headers.set("Authorization", `Bearer ${token}`);
              }
              originalRequest.headers.set("x-device-id", getDeviceId());
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = getRefreshToken();
        const deviceId = getDeviceId();

        if (!refreshToken) {
          isRefreshing = false;
          handleLogout("Sesi Habis", "Refresh token tidak ditemukan. Silakan login kembali.");
          return Promise.reject(error);
        }

        try {
          console.log("[Auth] Token expired. Refreshing session...");

          // Panggil Refresh API menggunakan instance axios murni dengan withCredentials: true
          const resp = await axios.post(
            `${baseURL}api/auth/refresh`,
            {
              refreshToken,
              deviceId,
            },
            {
              withCredentials: true,
            },
          );

          if (!resp.data?.data) {
            throw new Error("Respons server refresh tidak valid");
          }

          const { token: newToken, refreshToken: newRefreshToken } = resp.data.data;

          // Simpan token baru di storage terenkripsi
          if (newToken) storage.set("token", newToken);
          if (newRefreshToken) storage.set("refreshToken", newRefreshToken);

          processQueue(null, newToken);
          isRefreshing = false;

          // Pasang token baru dan retry request awal secara instan (tanpa delay buatan)
          if (newToken) {
            originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
          }
          originalRequest.headers.set("x-device-id", deviceId);

          return api(originalRequest);
        } catch (refreshError: any) {
          console.error("[Auth] Refresh token failed:", refreshError);
          processQueue(refreshError, null);
          isRefreshing = false;

          const refreshErrorCode = refreshError.response?.data?.errorCode;
          let message = "Sesi Anda telah berakhir. Silakan login kembali.";

          if (refreshErrorCode === "INVALID_DEVICE_CONTEXT") {
            message = "Terdeteksi anomali perangkat. Silakan login kembali.";
          } else if (refreshErrorCode === "INVALID_SESSION") {
            message = "Akun telah login di perangkat lain atau sesi hangus.";
          } else if (refreshErrorCode === "REFRESH_TOKEN_EXPIRED") {
            message = "Sesi login 7 hari telah kadaluarsa.";
          }

          handleLogout("Autentikasi Gagal", message);
          return Promise.reject(refreshError);
        }
      }

      // Jika 401 BUKAN karena TOKEN_EXPIRED: Jangan refresh, langsung force logout
      if (errorCode === "INVALID_DEVICE_CONTEXT") {
        handleLogout("Peringatan Keamanan", "Sesi Anda tidak valid pada perangkat ini.");
      } else if (errorCode === "INVALID_SESSION") {
        handleLogout("Sesi Berakhir", "Akun Anda aktif di perangkat lain.");
      } else if (errorCode === "UNAUTHORIZED") {
        handleLogout("Akses Ditolak", "Silakan login terlebih dahulu.");
      } else if (errorCode === "MISSING_DEVICE_ID") {
        handleLogout("Konteks Tidak Valid", "Header identifikasi perangkat tidak ditemukan.");
      } else {
        handleLogout("Sesi Tidak Valid", errData?.message || "Silakan login kembali.");
      }

      return Promise.reject(error);
    }

    // 2. Jika retry GAGAL LAGI (masuk dengan _retry: true)
    if (error.response && originalRequest?._retry) {
      handleLogout("Gagal Verifikasi", "Percobaan otentikasi ulang gagal.");
      return Promise.reject(error);
    }

    // 3. Penanganan Error Standar (400, 403, 500)
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || "Terjadi kesalahan pada server.";

      if (!isSilent) {
        switch (status) {
          case 400:
            toast.error("🚨 Bad Request", { description: errorMessage });
            break;
          case 403:
            toast.error("⛔ Akses Ditolak", { description: "Izin tidak cukup." });
            break;
          case 500:
            toast.error("💥 Server Error", { description: "Kesalahan internal." });
            break;
          default:
            if (status !== 401) {
              toast.error(`⚠️ Error ${status}`, { description: errorMessage });
            }
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
