# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Development Commands

This project uses a microservices architecture with multiple sub-projects. All services use **Yarn** as the package manager.

### Authentication Service (`ss-travel-auth-service`)
- **Start (Dev):** `cd ss-travel-auth-service && yarn start:dev`
- **Build:** `cd ss-travel-auth-service && yarn build`
- **Lint:** `cd ss-travel-auth-service && yarn lint`
- **Test:** `cd ss-travel-auth-service && yarn test` (Unit) or `yarn test:e2e` (E2E)
- **Database Migrations:**
  - Run: `yarn migration:run`
  - Generate: `yarn migration:generate`
  - Create: `yarn migration:create`

### API Gateway (`ss-travel-gateway`)
- **Start (Dev):** `cd ss-travel-gateway && yarn start:dev`
- **Build:** `cd ss-travel-gateway && yarn build`
- **Lint:** `cd ss-travel-gateway && yarn lint`
- **Test:** `cd ss-travel-gateway && yarn test`

### Frontend (`ss-travel-frontend`)
- **Start (Dev):** `cd ss-travel-frontend && yarn dev`
- **Build:** `cd ss-travel-frontend && yarn build`
- **Lint:** `cd ss-travel-frontend && yarn lint`

## 🏗 Architecture & Patterns

### System Overview
- **Pattern:** Microservices (Event-Driven) with a central API Gateway.
- **Backend:** NestJS with TypeORM (Data Mapper Pattern) and PostgreSQL.
- **Frontend:** React (Vite) with Tailwind CSS and Shadcn UI.
- **Communication:** External via API Gateway; Internal via RabbitMQ (planned).
- **Auth:** Centralized Identity Service using JWT + RBAC.

### Backend Structure (`ss-travel-auth-service`, `ss-travel-gateway`)
- **Modular Architecture:** Logic is organized into feature modules.
- **Source Layout:** Uses prefixed directories (e.g., `@models`, `@services`, `@dto`, `@configs`) for shared logic within the service.
- **Entity Rule:** Use `!` for TypeORM entity properties (e.g., `id!: number`).
- **Data Integrity:** Strictly typed DTOs and ACID compliance via PostgreSQL.

### Frontend Structure (`ss-travel-frontend`)
- **UI Components:** Follows Shadcn UI patterns.
- **Type Safety:** Use `import type` for type-only imports.
- **Components:** Keep components small, focused, and organized within `src/components`.
