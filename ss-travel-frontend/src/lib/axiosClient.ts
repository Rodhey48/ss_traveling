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

// Delay helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Extend AxiosRequestConfig to support 'silent' and retry flags
declare module "axios" {
  export interface AxiosRequestConfig {
    silent?: boolean;
    _retry?: boolean;
  }
}

const baseURL = import.meta.env.VITE_API_URL;

// Utility for Device ID (Fixed: Use plain localStorage for absolute stability of fingerprint)
export const getDeviceId = () => {
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

const api = axios.create({
  baseURL: baseURL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    const deviceId = getDeviceId();

    if (token && config.headers) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    if (config.headers) {
      config.headers.set("x-device-id", deviceId);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: any[] = [];

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

const handleLogout = (reason = "Sesi Berakhir", detail = "") => {
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
  }, 1500);
};

// Response Interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    const isSilent = originalRequest?.silent === true;

    // 1. Handle 401 Unauthorized (Trigger Refresh)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.set("Authorization", `Bearer ${token}`);
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      const deviceId = getDeviceId();

      if (!refreshToken) {
        handleLogout("Sesi Habis", "Refresh token tidak ditemukan.");
        return Promise.reject(error);
      }

      try {
        console.log("Token expired. Attempting to refresh...");
        
        // Panggil Refresh API menggunakan instance axios murni
        const resp = await axios.post(`${baseURL}auth-api/auth/refresh`, {
          refreshToken,
          deviceId,
        });

        if (!resp.data?.data) {
          throw new Error("Invalid response from refresh server");
        }

        const { token: newToken, refreshToken: newRefreshToken } = resp.data.data;

        // Simpan token baru
        storage.set("token", newToken);
        storage.set("refreshToken", newRefreshToken);

        // DELAY 3 DETIK sesuai permintaan
        console.log("Refresh success. Waiting 3s before retry...");
        await sleep(3000);

        processQueue(null, newToken);
        isRefreshing = false;

        // Pasang token baru dan retry request awal
        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        originalRequest.headers.set("x-device-id", deviceId);
        
        console.log("Retrying original request with new token.");
        return api(originalRequest);

      } catch (refreshError: any) {
        console.error("Auto-refresh process failed:", refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        
        const errorMsg = refreshError.response?.data?.message || refreshError.message || "Gagal memperbarui sesi.";
        handleLogout("Sesi Tidak Valid", errorMsg);
        return Promise.reject(refreshError);
      }
    }

    // 2. Jika retry GAGAL LAGI (masuk ke sini dengan _retry: true)
    if (error.response && originalRequest._retry) {
      const errorDetail = `Retry failed with status ${error.response.status}`;
      handleLogout("Gagal Verifikasi", errorDetail);
      return Promise.reject(error);
    }

    // 3. Standard Error Handling
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = data?.message || "Terjadi kesalahan pada server.";

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
