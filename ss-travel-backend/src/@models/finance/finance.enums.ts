export enum ApVendorType {
  RESTAURANT = 'RESTAURANT',
  WORKSHOP = 'WORKSHOP',
  AGENT = 'AGENT',
  OTHER = 'OTHER',
}

export enum ApInvoiceStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum ApPaymentStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum ArInvoiceStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum ArReceiptStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum FinancePaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
}

export enum ApSourceType {
  RESTAURANT_PERIODIC = 'RESTAURANT_PERIODIC',
  WORKSHOP_REPAIR = 'WORKSHOP_REPAIR',
  AGENT_COMMISSION = 'AGENT_COMMISSION',
  MANUAL = 'MANUAL',
  OTHER = 'OTHER',
}

export enum ArSourceType {
  CHARTER_CONTRACT = 'CHARTER_CONTRACT',
  OTA_SETTLEMENT = 'OTA_SETTLEMENT',
  MANUAL = 'MANUAL',
  OTHER = 'OTHER',
}

export enum CashTransactionType {
  DISBURSEMENT = 'DISBURSEMENT', // Pengeluaran Kas Kecil (BKK)
  REPLENISHMENT = 'REPLENISHMENT', // Pengisian Kembali Kas Kecil (BKM)
}

export enum CashTransactionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED', // Menunggu verifikasi Akuntan
  VERIFIED = 'VERIFIED', // Disetujui & otomatis posting jurnal ke GL
  REJECTED = 'REJECTED',
}

export enum PettyCashCategory {
  FACILITY_SNACK = 'FACILITY_SNACK', // 52104 Snack, Amenity, & Fasilitas Onboard
  STANDBY_CREW = 'STANDBY_CREW', // 53105 Uang Makan Standby Kru (Non-SPJ Garasi)
  DEADHEAD_INSENTIF = 'DEADHEAD_INSENTIF', // 53106 Insentif Langsir Armada (Non-SPJ)
  POOL_SUPPLIES = 'POOL_SUPPLIES', // 57102 Perlengkapan, Sabun Cuci Bus & ATK Pool
  OVERTIME_MEKANIK = 'OVERTIME_MEKANIK', // 57107 Upah Lembur Mekanik & Teknisi Pool
  OFFICE_CONSUMPTION = 'OFFICE_CONSUMPTION', // 57108 Konsumsi Staf, Air Galon & Kopi Piket
  OFFICE_TRAVEL = 'OFFICE_TRAVEL', // 57109 Transport & Perjalanan Dinas Luar Kantor
  WORKSHOP_EMERGENCY = 'WORKSHOP_EMERGENCY', // 55101/55102 Baut, Klem, atau Servis Kecil Bengkel
  OTHER = 'OTHER', // Beban Lain-Lain
}

