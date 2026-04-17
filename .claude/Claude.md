# SS Traveling ERP - Central Control Center

## Project Overview
SS Traveling ERP adalah sistem manajemen transportasi berbasis mikroservis.

## Project Structure
- `ss-travel-frontend`: React 19, Tailwind v4, Shadcn UI.
- `ss-travel-auth-service`: NestJS, TypeORM, PostgreSQL.
- `ss-travel-gateway`: NestJS Gateway (Proxying).

## Core Instructions (Global)
1. **Frontend**: Gunakan `import type` untuk tipe data TS.
2. **Backend**: Gunakan modular pattern NestJS & class-validator.
3. **Database**: 1 Service 1 Database (PostgreSQL).
4. **Commits**: Gunakan pesan yang jelas dan deskriptif.

## Tech Stack Summary
- **Languages**: TypeScript (Frontend & Backend).
- **Styling**: Tailwind CSS v4.
- **State/API**: TanStack Query, Axios.
- **Infrastructure**: Microservices via Polyrepo.

## Recent Progress
- [x] Gateway & Auth Service basic setup.
- [x] Frontend Dashboard & Auth Flow.
- [x] Unified Project Memory (.claude).
