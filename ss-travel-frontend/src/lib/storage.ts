import SecureLS from "secure-ls";

// Initialize SecureLS with a resilient constructor check for ESM/Vite
const SecureLSConstructor = (SecureLS as any).default || SecureLS;

let ls: any;

try {
  ls = new SecureLSConstructor({ 
    encodingType: "aes", 
    isCompression: true,
    encryptionSecret: import.meta.env.VITE_STORAGE_SECRET || "ss-travel-key-2026" 
  });
} catch (error) {
  console.error("Failed to initialize SecureLS, using fallback:", error);
  ls = {
    set: (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value)),
    get: (key: string) => {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    },
    remove: (key: string) => localStorage.removeItem(key),
    removeAll: () => localStorage.clear()
  };
}

export const storage = {
  set: (key: string, value: any) => {
    try {
      ls.set(key, value);
    } catch (e) {
      console.error(`Error setting storage [${key}]:`, e);
    }
  },
  get: (key: string) => {
    try {
      return ls.get(key);
    } catch (e) {
      console.error(`Error getting storage [${key}]:`, e);
      return null;
    }
  },
  remove: (key: string) => {
    try {
      ls.remove(key);
    } catch (e) {
      console.error(`Error removing storage [${key}]:`, e);
    }
  },
  clear: () => {
    try {
      ls.removeAll ? ls.removeAll() : ls.clear();
    } catch (e) {
      console.error("Error clearing storage:", e);
    }
  },
};
