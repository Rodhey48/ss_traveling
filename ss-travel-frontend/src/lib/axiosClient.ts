import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// Extend AxiosRequestConfig to support 'silent' flag
declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean;
  }
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/';

const getToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isLoggingOut = false;

const handleLogout = () => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  localStorage.removeItem('token');
  localStorage.removeItem('user');

  toast.error('Sesi Berakhir', {
    description: 'Silakan login kembali.'
  });

  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const isSilent = error.config?.silent === true;

    if (error.response) {
      const { status, data } = error.response;

      let errorMessage = 'Terjadi kesalahan pada server.';
      if (typeof data?.message === 'string') {
        errorMessage = data.message;
      } else if (Array.isArray(data?.message)) {
        errorMessage = data.message.join(', ');
      }

      if (status === 401) {
        handleLogout();
      } else if (!isSilent) {
        switch (status) {
          case 400:
            toast.error('🚨 Bad Request', { description: errorMessage });
            break;
          case 403:
            toast.error('⛔ Forbidden', {
              description: 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
            });
            break;
          case 404:
            toast.error('🔍 Not Found', {
              description: 'Data tidak ditemukan atau endpoint salah.'
            });
            break;
          case 500:
            toast.error('💥 Server Error', {
              description: 'Terjadi kesalahan internal pada server.'
            });
            break;
          default:
            toast.error(`⚠️ Error ${status}`, { description: errorMessage });
        }
      }
    } else if (error.request) {
      if (!isSilent) {
        if (error.code === 'ECONNABORTED') {
          toast.error('⏳ Timeout', {
            description: 'Server tidak merespons dalam waktu yang ditentukan.'
          });
        } else {
          toast.error('❌ Network Error', {
            description: 'Tidak dapat terhubung ke server. Periksa koneksi internet.'
          });
        }
      }
    } else {
      if (!isSilent) {
        toast.error('⚙️ Request Error', { description: error.message });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
