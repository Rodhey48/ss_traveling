# SS Travelink ERP - Central Control Center

## Project Overview

SS Travelink ERP (PT SS Travelink Official) adalah sistem ERP manajemen transportasi bus AKAP & Pariwisata terintegrasi berbasis arsitektur monolit dengan akuntansi single-entry GL (Blueprint v1.3).

## Project Structure

- `ss-travel-frontend`: React 19, Tailwind v4, Shadcn UI.
- `ss-travel-backend`: Monolithic backend menggunakan NestJS, TypeORM, PostgreSQL.

## Core Instructions (Global)

1. **Branding Standard**: Wajib menggunakan nama resmi **"PT SS Travelink Official"** (Case Sensitive). Dilarang keras melakukan hardcode nama perusahaan di UI; wajib mengambil dari database/API (`useAuth` atau `/auth/company`).
2. **Tooling & Package Manager**: Wajib menggunakan **Yarn** (`yarn.lock`). Dilarang membuat atau meng-commit `package-lock.json`.
3. **Frontend**: Gunakan `import type` untuk tipe data TS, Tailwind v4 (CSS variables based), dan Shadcn UI.
4. **Backend**: Gunakan modular pattern NestJS, path alias (`@models`, `@dto`, `@services`, `@interfaces`, `@configs`, dll.), dan class-validator.
5. **Database**: Menggunakan PostgreSQL untuk seluruh domain modul dengan TypeORM Data Mapper pattern.
6. **Commits**: Gunakan pesan yang jelas, konvensional, dan deskriptif.

## Tech Stack Summary

- **Languages**: TypeScript (Frontend & Backend).
- **Styling**: Tailwind CSS v4.
- **State/API**: TanStack Query, Axios.
- **Infrastructure**: Monolithic architecture.

## Recent Progress

- [x] Gateway & Auth Service basic setup.
- [x] Frontend Dashboard & Auth Flow.
- [x] Unified Project Memory (.gemini).
- [x] UI/UX Brand Overhaul (Pendopo favicon, AI fleet carousel, obsidian frosted glass, dan pendopo watermark).
- [x] Global Branding Migration to PT SS Travelink Official (40+ file frontend & seeder backend).
- [x] Dynamic Company Name Architecture (Public `@Get('auth/company')` & `useAuth` dynamic resolution).
- [x] Asset Structure Refactoring (`carousel/` & `ss-travelink-wordmark.webp`) & Strict Yarn Cleanup.
- [x] Global API Call Loading Tracker & Indicator (Top emerald indeterminate progress bar & header sync badge).
- [x] Skeleton UI Infrastructure across 27 operational, financial, and master modules (MetricCardGridSkeleton, BankAccountCardSkeleton, and Table Skeletons).
- [x] Production-ready audit & perfection across Master Data, CRM, and Fiscal modules (/vehicles, /cash-bank, /fares, /crew-rates, /agents, /partners, /organization, /fiscal-periods, /customers) with zero native alerts, debounced search, multi-filters, and photo gallery preview.
- [x] Production-ready overhaul across Financial, Reporting, and Administration modules (/journals, /ap-invoices, /ar-invoices, /reports, /period-closing, /users, /roles, /menu-management) with 11 GL presets, reversal modal, and hierarchical RBAC matrix.
- [x] SPJ Full-Page Finance Layout (`/spjs/:id/finance`) with 6 stacked sections, real-time metric headers, smart route agent ticket sales with atomic journal preview (100% Gross), crew perpal & full-seat allowances, and dynamic cargo commission.
- [x] Field Coordination Fees Module (`/finance/coordination-fees`) & Restaurant Settlements Module (`/finance/restaurant-settlements`) with ticket/coupon snapshotting, COA 52105/22102 and 51102/21101, bulk bank transfer settlement, WhatsApp remittance text generator, and automatic journal reversals.
- [x] COA hierarchy fix for account 52105 under account 52 (Beban Operasional Tidak Langsung) / Head 5 BEBAN.
- [x] Master Trayek (Rute Perjalanan `routes`) & Smart Route Dynamic Fare Matrix Engine.
- [x] Master Koordinator Lapangan Eksternal (`coordinators`) & Field Coordination Fee Rules.
- [x] Full Financial E2E Test Suites for AKAP & Wisata lifecycle (43 tests, 6 suites passed 100%).
- [x] Root-Level BrandLoader navigation transition, Fleet pagination bug fix & Global Fleet Statistics (`GET /api/v1/vehicles/stats`).
- [x] Dynamic Seat Class Name support (`character varying(50)`) on fleet vehicles.
- [x] High-Contrast Sonner Toast notification system (WCAG AAA compliant Glassmorphism).
- [x] Permanent COA Parent Hierarchy repair for Bank Accounts (11111-11124), Utang Korlap (22102), and Beban Korlap (52105).
- [x] Dynamic Route Selector in ScheduleModal, SPJ Review & Gantt Timeline.
- [x] Dynamic Crew Compensation Standardization (Base Meal = 0, dynamic from DB) & Zero Amount GL Guard.
- [x] Automatic Uang Jalan (UJ) Disbursement Journal Posting (Debit 13101 vs Kredit Kas/Bank).
- [x] Menu Custom Action Permission `disburse_uj` & Financial Confirmation Dialog with accounting warning banner.
- [x] 100% Quality Assurance: 36 backend test suites (279 unit tests) & 6 E2E test suites (43 tests) passed.
