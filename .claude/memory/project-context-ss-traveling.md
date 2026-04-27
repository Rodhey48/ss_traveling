---
name: Project Context: SS Traveling
description: Overview of the ERP SS Traveling project goals, architecture, and recent build fixes.
type: project
---

# Project Context: SS Traveling ERP

## Goals
Transform manual operations of SS Traveling (Bus rental, AKAP, Karoseri, Gas Station, Warehouse) into a web-based ERP with a focus on auditability (SAP-style).

## Architecture & Tech Stack
- **Architecture**: Microservices (Polyrepo) with API Gateway.
- **Backend**: NestJS (TypeScript).
- **ORM**: TypeORM (Data Mapper Pattern).
- **Database**: PostgreSQL.
- **Communication**: RabbitMQ for internal events.
- **Frontend**: React / Next.js.
- **Package Manager**: Yarn.

## Recent Progress (2026-04-27)
- **ss-travel-auth-service Fixes**:
  - Resolved build errors in `tsconfig.json` (invalid `ignoreDeprecations`, `baseUrl` deprecation, and `moduleResolution`).
  - Fixed `eslint.config.mjs` ESM compatibility (`import.meta.dirname`).
  - Corrected missing `Column` decorator in `RoleModuleEntity`.
  - Fixed `InitialSeeding.ts` import paths using fixed path aliases.
  - Cleaned up accidental `.js` files generated in `src/`.
  - Current state: `nest build` is successful.

## Key Modules
- **Finance Service**: Phase 1 priority. Focus on double-entry bookkeeping, COA, and General Ledger.
- **Auth Service**: Centralized JWT-based auth with RBAC (Roles, Menus, Permissions).

## User Preferences
- **Coding Pattern**: Reference project at `/home/rodhey/Documents/wira/Absensi/Absensi_BE`.
- **Project Structure**: Uses `@models`, `@services`, `@configs`, `@guards` directories inside `src`.
- **Auth Pattern**: Prefers a specific pattern involving `tokenLogin` validation in the DB and granular menu access.

**Current Status**: `ss-travel-auth-service` build is stable. Ready to continue implementation (Database connection, further seeding, or controller/service logic).
