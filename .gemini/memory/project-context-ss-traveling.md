---
name: Project Context: SS Traveling
description: Overview of the ERP SS Traveling project goals, architecture, and roadmap for Phase 3 implementation.
type: project
---

# Project Context: SS Traveling ERP

## Goals
Membangun sistem ERP komprehensif untuk SS Traveling Official (layanan Bus AKAP Tangerang-Yogya, Pariwisata/Charter Luxury Seat 2-1, Combi, Sleeper, Executive) yang mengintegrasikan manajemen armada, Surat Perintah Jalan (SPJ), kasir pool, serta akuntansi berbasis jurnal atomik (*Journal-First Accounting*) dengan auditabilitas tinggi (SAP-grade).

## Architecture & Tech Stack
- **Architecture**: Modular Monolith.
- **Backend**: NestJS 10 (TypeScript) di `ss-travel-backend/`.
- **ORM**: TypeORM 0.3.x (PostgreSQL).
- **Frontend**: React + TypeScript + Vite di `ss-travel-frontend/`.
- **Security & Auth**: Dual-Strategy Auth (`HttpOnly` Cookie untuk Web, Bearer Token untuk Mobile/API), Single Device Login (SDL), Stateless Device Fingerprinting (`x-device-id` + User-Agent), Machine-Readable Error Codes (401), dan RBAC dengan Separation of Duties (SoD).

## Status Fase Saat Ini (Per 15 Oktober 2026)
- **Fase 1: Infrastructure & Auth**: [COMPLETED]
  - Autentikasi hybrid stabil, RBAC dynamic menu hierarkis, JSONB action-based permissions.
- **Fase 2: Design Verification & Specs**: [COMPLETED & LOCKED]
  - Blueprint Keuangan v1.3 lengkap dengan Addendum v1.1 s.d. v1.15.
  - Seluruh 4 Dokumen Test Case Skenario Bisnis & Akuntansi terkunci:
    1. Skenario 1: Operasional Normal AKAP PP, Tagihan Servis Makan AP Berkala & Komisi Dinamis Kargo Kru.
    2. Skenario 2: Sewa Wisata / Charter Multi-Day & B2B Partner Cashback.
    3. Skenario 3: Anomali AKAP Breakdown, Penggantian Armada (`parent_spj_id`) & Estafet UJ.
    4. Skenario 4: Rekonsiliasi Kasir Bermasalah, Musyawarah Kru & Resolusi Selisih Kas.
- **Fase 3: Core Implementation**: [IN PROGRESS]
  - **Master Plan Terkunci**: Roadmap 10 tahap terdokumentasi lengkap di `.gemini/plan/Plan.md`.
  - **Progres Selesai**: Tahap 0 s.d. Tahap 8 telah tuntas 100% (RBAC, Master Organisasi & 10 Bus, COA Kelompok 1-8, Matriks Tarif & Kompensasi Kru, Accounting Posting & Reversal Engine, Penjadwalan & SPJ Lifecycle, Uang Jalan Multi-Line, Biaya BBM Odometer, Deklarasi Kas Anti-Netting, Meja Kasir Pool & Resolusi Selisih, Modul AR & AP).
  - **Fokus Berikutnya (Tahap 9)**: Laporan Finansial (GL, Neraca Saldo, Laba Rugi, Neraca), Trip Profitability (Margin Kontribusi Per Bus vs Per Kelompok Perjalanan), & Tutup Buku Bulanan Unblocked via Akun 11999.

## Rencana Eksekusi Bertahap (Fase 3)
Lihat rincian lengkap 10 tahap eksekusi di `.gemini/plan/Plan.md`:
* Tahap 1: Master Organisasi, Dimensi, & Armada Bus (Entities & Seeder 10 Bus) [COMPLETED]
* Tahap 2: Master Keuangan, Hierarki COA (Kelompok 1-8), & Kas/Bank (Entities & Seeder) [COMPLETED]
* Tahap 3: Master Aturan Bisnis & Tarif Lapangan (Fare Matrix, Komisi, Rate Kru, Restoran) [COMPLETED]
* Tahap 4: Accounting Core Engine (Jurnal, Lines, Posting Service Atomik, Idempotency) [COMPLETED]
* Tahap 5: SPJ Life Cycle & Multi-Leg State Machine (Status Ganda & Penomoran Dokumen) [COMPLETED]
* Tahap 6: Uang Jalan (UJ), Biaya SPJ, & Deklarasi Penerimaan (Multi-Line UJ & Anti-Netting) [COMPLETED]
* Tahap 7: Kasir Pool, Settlement Kas Kru, & Resolusi Selisih (Skenario 1 & Skenario 4) [COMPLETED]
* Tahap 8: Modul AR & AP (Tagihan Servis Makan Mitra, Kontrak Charter Wisata, Komisi Agen) [COMPLETED]
* Tahap 9: Laporan Finansial, Trip Profitability (Margin), & Tutup Buku Bulanan [NEXT]
* Tahap 10: Integrasi Frontend UI & E2E Verification
