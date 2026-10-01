# Master Plan

## Phase 1: Infrastructure & Auth (Completed)
- [x] API Gateway.
- [x] Auth Service (User, Role, Hierarchical Menus).
- [x] Frontend Shell & Management UI.
- [x] **Hybrid Action-based Permissions** (Dynamic custom actions like approve, export).
- [x] **Dual-Strategy Auth & Security Hardening**:
  - HttpOnly Cookie (Web) + Bearer Token (Mobile).
  - Single Device Login (SDL) & Stateless Device Fingerprinting (`x-device-id` + `User-Agent`).
  - Standardized Machine-Readable Error Codes (`TOKEN_EXPIRED`, `INVALID_DEVICE_CONTEXT`, etc.).
  - Logout API (`POST /api/auth/logout`) with server-side session revocation and cookie clearing.
  - Complete Frontend Implementation Guide: [AUTH_SPECIFICATION_AND_FE_GUIDE.md](./AUTH_SPECIFICATION_AND_FE_GUIDE.md).

## Phase 2: Core Features (Next)
- [ ] Fleet Management (Kendaraan).
- [ ] Driver Management.
- [ ] Finance (Kas & Transaksi).
