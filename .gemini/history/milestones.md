# Project Milestones: SS Traveling

## Phase 1: Infrastructure & Auth (Completed)

### 2026-06-03: Security Hardening & Session Integrity (Triple-Lock Auth)
- **Token Rotation Architecture**: Implemented a robust Access/Refresh token system. Access Token (1h, stateless) for performance, Refresh Token (7d, stateful) for session continuity.
- **Single Device Login (SDL)**: Introduced `sessionToken` validation in the backend. New logins automatically invalidate previous sessions on other devices.
- **Stateless Fingerprint Validation**: Integrated device fingerprinting (hash of `deviceId` + `User-Agent`) into the JWT payload. Requests are validated statelessly in `JwtAuthGuard` against client headers (`x-device-id`).
- **Encrypted LocalStorage**: Integrated `secure-ls` with AES encryption and LZ compression to safeguard tokens and user data in the browser. Developed a centralized `storage` utility for consistent encryption/decryption.
- **Robust Auto-Refresh Interceptor**: Optimized the Axios interceptor to handle concurrent requests, implement a 3-second delay for stability, and ensure seamless retry with refreshed credentials.
- **Background Sync Stabilization**: Fixed a critical bug where background synchronization (`/auth/me`) was inadvertently clearing session tokens from storage.
- **Entity & DTO Synchronization**: Refactored `UsersEntity` and Auth DTOs to support new security columns (`session_token`, `refresh_token`, `last_origin`) with strict data exclusion (`select: false`).

### 2026-05-26: Distributed Authorization & Local-First Stability
- **Architecture Pivot**: Adopted a "Distributed but Independent" authorization strategy. Logic is implemented locally in each service to avoid monorepo dependency complexities while maintaining a unified security standard.
- **Enriched JWT Payload**: Refactored AuthService and MenusService to include granular permission strings (format aclName:action) directly in the JWT payload.
- **Granular PermissionsGuard**: Implemented a local PermissionsGuard and @RequirePermissions decorator that provides detailed feedback on missing permissions during 403 Forbidden errors.
- **Full Controller Integration**: Standardized Users, Menus, and Roles controllers with the new authorization SOP (Dual-layer: Roles + Permissions).
- **Frontend Error Interceptor**: Updated axiosClient.ts to display specific missing permissions in toast notifications, improving admin UX and transparency.

### 2026-05-25: Menu Management UX & Global State Robustness
- **Interactive Icon Picker**: Developed a high-performance, searchable icon gallery with 1,400+ Lucide icons.
- **Contextual Menu Creation**: Refactored Menu Management UI to support smart parent assignments.
- **Folder-like Group Menus**: Implemented non-redirecting "Group" menus using the title field.
- **Global Auth State (Context)**: Migrated local state to a unified AuthContext for real-time UI reactions.

### 2026-05-22: Auth System Perfection & Hybrid Permissions
- **Hierarchical Menu Management**: Implemented recursive tree fetching and UI.
- **Hybrid Action-based Permissions**: Added support for dynamic JSONB permissions (approve, export, etc.).
- **Dynamic Permission Sync**: Implemented background synchronization via /auth/me.
