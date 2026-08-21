# GEMINI.md

This file provides guidance to gemini Code (gemini.ai/code) when working with code in this repository.

## 🚀 Development Commands

This project uses a monolithic backend architecture and a single frontend client. All services use **Yarn** as the package manager.

### Monolithic Backend (`ss-travel-backend`)

- **Start (Dev):** `cd ss-travel-backend && yarn start:dev`
- **Build:** `cd ss-travel-backend && yarn build`
- **Lint:** `cd ss-travel-backend && yarn lint`
- **Test:** `cd ss-travel-backend && yarn test` (Unit) or `yarn test:e2e` (E2E)
- **Database Migrations:**
  - Run: `yarn migration:run`
  - Generate: `yarn migration:generate`
  - Create: `yarn migration:create`

### Frontend (`ss-travel-frontend`)

- **Start (Dev):** `cd ss-travel-frontend && yarn dev`
- **Build:** `cd ss-travel-frontend && yarn build`
- **Lint:** `cd ss-travel-frontend && yarn lint`

## 🏗 Architecture & Patterns

### System Overview

- **Pattern:** Monolithic Backend Architecture.
- **Backend:** NestJS with TypeORM (Data Mapper Pattern) and PostgreSQL.
- **Frontend:** React (Vite) with Tailwind CSS and Shadcn UI.
- **Auth:** Centralized Identity management using JWT + RBAC directly handled in the monolith.

### Backend Structure (`ss-travel-backend`)

- **Modular Architecture:** Logic is organized into feature modules.
- **Source Layout:** Uses prefixed directories (e.g., `@models`, `@services`, `@dto`, `@configs`) for shared logic within the service.
- **Entity Rule:** Use `!` for TypeORM entity properties (e.g., `id!: number`).
- **Data Integrity:** Strictly typed DTOs and ACID compliance via PostgreSQL.

### Frontend Structure (`ss-travel-frontend`)

- **UI Components:** Follows Shadcn UI patterns.
- **Type Safety:** Use `import type` for type-only imports.
- **Components:** Keep components small, focused, and organized within `src/components`.

## 🛡 Security & Authorization (Distributed Authorization SOP)

1.  **Enriched JWT**: Information permissions flows via JWT payload (permissions field).
2.  **Naming Convention**: Format `aclName:action` (e.g., `User:read`, `Finance:approve`) synced with database `aclName`.
3.  **Security Guards**: Use `JwtAuthGuard` and `PermissionsGuard` (and `RolesGuard` if needed) at Controller or Method level.
4.  **Otorisasi Decorator**: Use `@RequirePermissions('...')` for granular access control.
5.  **Swagger Documentation**: Include permission requirements in `@ApiOperation({ summary: '... (Needs permission: X)' })`.
6.  **Transparent Error**: Denied access returns a detailed list of `missing` permissions.
