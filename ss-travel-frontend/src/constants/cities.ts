export const OperatingCity = {
  // ZONA BARAT (Jabodetabek & Banten)
  JAKARTA: 'JAKARTA',
  TANGERANG: 'TANGERANG',
  SOUTH_TANGERANG: 'SOUTH TANGERANG',
  BOGOR: 'BOGOR',
  BEKASI: 'BEKASI',
  DEPOK: 'DEPOK',
  SERANG: 'SERANG',
  CILEGON: 'CILEGON',

  // ZONA TENGAH (Jawa Barat & Pantura)
  SUBANG: 'SUBANG',
  CIREBON: 'CIREBON',
  TEGAL: 'TEGAL',
  PEKALONGAN: 'PEKALONGAN',
  BATANG: 'BATANG',
  SEMARANG: 'SEMARANG',
  MAGELANG: 'MAGELANG',

  // ZONA TIMUR (DIY & Jawa Tengah Bagian Selatan / Jatim)
  YOGYAKARTA: 'YOGYAKARTA',
  SLEMAN: 'SLEMAN',
  BANTUL: 'BANTUL',
  KULON_PROGO: 'KULON PROGO',
  KLATEN: 'KLATEN',
  SOLO: 'SOLO',
  SUKOHARJO: 'SUKOHARJO',
  WONOGIRI: 'WONOGIRI',
  SURABAYA: 'SURABAYA',

  // NASIONAL / ONLINE OTA
  ALL: 'ALL',
} as const;

export type OperatingCity = typeof OperatingCity[keyof typeof OperatingCity];

export type CityRegion = 'WEST' | 'CENTRAL' | 'EAST' | 'NATIONAL';

export interface OperatingCityOption {
  value: OperatingCity | string;
  label: string;
  shortLabel: string;
  region: CityRegion;
  regionLabel: string;
}

export const OPERATING_CITIES: OperatingCityOption[] = [
  // --- ZONA BARAT (Jabodetabek & Banten) ---
  {
    value: OperatingCity.JAKARTA,
    label: 'Jakarta (Pulo Gebang, Lebak Bulus, Kalideres, Kp. Rambutan)',
    shortLabel: 'Jakarta',
    region: 'WEST',
    regionLabel: 'Zona Barat (Jabodetabek & Banten)',
  },
  {
    value: OperatingCity.TANGERANG,
    label: 'Tangerang (Terminal Poris Plawad, BSD, Balaraja)',
    shortLabel: 'Tangerang',
    region: 'WEST',
    regionLabel: 'Zona Barat (Jabodetabek & Banten)',
  },
  {
    value: OperatingCity.SOUTH_TANGERANG,
    label: 'Tangerang Selatan (Ciputat, Rempoa, Pamulang)',
    shortLabel: 'Tangsel (Ciputat)',
    region: 'WEST',
    regionLabel: 'Zona Barat (Jabodetabek & Banten)',
  },
  {
    value: OperatingCity.BEKASI,
    label: 'Bekasi (Terminal Bekasi, Cikarang, Tambun)',
    shortLabel: 'Bekasi',
    region: 'WEST',
    regionLabel: 'Zona Barat (Jabodetabek & Banten)',
  },
  {
    value: OperatingCity.BOGOR,
    label: 'Bogor (Terminal Baranangsiang, Ciawi, Cibinong)',
    shortLabel: 'Bogor',
    region: 'WEST',
    regionLabel: 'Zona Barat (Jabodetabek & Banten)',
  },
  {
    value: OperatingCity.DEPOK,
    label: 'Depok (Terminal Jatijajar)',
    shortLabel: 'Depok',
    region: 'WEST',
    regionLabel: 'Zona Barat (Jabodetabek & Banten)',
  },
  {
    value: OperatingCity.SERANG,
    label: 'Serang (Terminal Pakupatan)',
    shortLabel: 'Serang',
    region: 'WEST',
    regionLabel: 'Zona Barat (Jabodetabek & Banten)',
  },
  {
    value: OperatingCity.CILEGON,
    label: 'Cilegon (Pelabuhan Merak)',
    shortLabel: 'Cilegon',
    region: 'WEST',
    regionLabel: 'Zona Barat (Jabodetabek & Banten)',
  },

  // --- ZONA TENGAH (Pantura & Jalur Tengah Jawa) ---
  {
    value: OperatingCity.SUBANG,
    label: 'Subang (Rest Area Tol Cipali)',
    shortLabel: 'Subang',
    region: 'CENTRAL',
    regionLabel: 'Zona Tengah (Pantura & Tol Trans-Jawa)',
  },
  {
    value: OperatingCity.CIREBON,
    label: 'Cirebon (Terminal Harjamukti, Plumbon)',
    shortLabel: 'Cirebon',
    region: 'CENTRAL',
    regionLabel: 'Zona Tengah (Pantura & Tol Trans-Jawa)',
  },
  {
    value: OperatingCity.TEGAL,
    label: 'Tegal (Terminal Kota Tegal)',
    shortLabel: 'Tegal',
    region: 'CENTRAL',
    regionLabel: 'Zona Tengah (Pantura & Tol Trans-Jawa)',
  },
  {
    value: OperatingCity.PEKALONGAN,
    label: 'Pekalongan (Terminal Pekalongan)',
    shortLabel: 'Pekalongan',
    region: 'CENTRAL',
    regionLabel: 'Zona Tengah (Pantura & Tol Trans-Jawa)',
  },
  {
    value: OperatingCity.BATANG,
    label: 'Batang (Rest Area Gringsing)',
    shortLabel: 'Batang',
    region: 'CENTRAL',
    regionLabel: 'Zona Tengah (Pantura & Tol Trans-Jawa)',
  },
  {
    value: OperatingCity.SEMARANG,
    label: 'Semarang (Krapyak, Terboyo, Bawen)',
    shortLabel: 'Semarang',
    region: 'CENTRAL',
    regionLabel: 'Zona Tengah (Pantura & Tol Trans-Jawa)',
  },
  {
    value: OperatingCity.MAGELANG,
    label: 'Magelang (Terminal Tidar, Muntilan)',
    shortLabel: 'Magelang',
    region: 'CENTRAL',
    regionLabel: 'Zona Tengah (Pantura & Tol Trans-Jawa)',
  },

  // --- ZONA TIMUR (DIY & Jawa Tengah Bagian Selatan / Jatim) ---
  {
    value: OperatingCity.YOGYAKARTA,
    label: 'Yogyakarta (Terminal Giwangan, Jombor)',
    shortLabel: 'Yogyakarta',
    region: 'EAST',
    regionLabel: 'Zona Timur (DIY, Solo Raya & Jatim)',
  },
  {
    value: OperatingCity.SLEMAN,
    label: 'Sleman (Terminal Jombor)',
    shortLabel: 'Sleman',
    region: 'EAST',
    regionLabel: 'Zona Timur (DIY, Solo Raya & Jatim)',
  },
  {
    value: OperatingCity.BANTUL,
    label: 'Bantul',
    shortLabel: 'Bantul',
    region: 'EAST',
    regionLabel: 'Zona Timur (DIY, Solo Raya & Jatim)',
  },
  {
    value: OperatingCity.KULON_PROGO,
    label: 'Kulon Progo (Terminal Wates / Bandara YIA)',
    shortLabel: 'Kulon Progo (Wates)',
    region: 'EAST',
    regionLabel: 'Zona Timur (DIY, Solo Raya & Jatim)',
  },
  {
    value: OperatingCity.KLATEN,
    label: 'Klaten (Terminal Ir. Soekarno, Delanggu)',
    shortLabel: 'Klaten',
    region: 'EAST',
    regionLabel: 'Zona Timur (DIY, Solo Raya & Jatim)',
  },
  {
    value: OperatingCity.SOLO,
    label: 'Solo / Surakarta (Terminal Tirtonadi, Kartasura)',
    shortLabel: 'Solo (Tirtonadi)',
    region: 'EAST',
    regionLabel: 'Zona Timur (DIY, Solo Raya & Jatim)',
  },
  {
    value: OperatingCity.SUKOHARJO,
    label: 'Sukoharjo',
    shortLabel: 'Sukoharjo',
    region: 'EAST',
    regionLabel: 'Zona Timur (DIY, Solo Raya & Jatim)',
  },
  {
    value: OperatingCity.WONOGIRI,
    label: 'Wonogiri (Terminal Giri Adipura)',
    shortLabel: 'Wonogiri',
    region: 'EAST',
    regionLabel: 'Zona Timur (DIY, Solo Raya & Jatim)',
  },
  {
    value: OperatingCity.SURABAYA,
    label: 'Surabaya (Terminal Purabaya Bungurasih)',
    shortLabel: 'Surabaya',
    region: 'EAST',
    regionLabel: 'Zona Timur (DIY, Solo Raya & Jatim)',
  },

  // --- NASIONAL / ONLINE OTA ---
  {
    value: OperatingCity.ALL,
    label: 'Nasional / Seluruh Kota (Online OTA: Traveloka, RedBus, Tiket.com)',
    shortLabel: 'Nasional (Online OTA)',
    region: 'NATIONAL',
    regionLabel: 'Nasional (Multi-Kota / Online OTA)',
  },
];

export const CITIES_BY_REGION = {
  WEST: OPERATING_CITIES.filter((c) => c.region === 'WEST'),
  CENTRAL: OPERATING_CITIES.filter((c) => c.region === 'CENTRAL'),
  EAST: OPERATING_CITIES.filter((c) => c.region === 'EAST'),
  NATIONAL: OPERATING_CITIES.filter((c) => c.region === 'NATIONAL'),
};

export const getOperatingCityLabel = (val?: string): string => {
  if (!val) return '-';
  const found = OPERATING_CITIES.find(
    (c) => c.value.toUpperCase() === val.trim().toUpperCase(),
  );
  return found ? found.shortLabel : val;
};
