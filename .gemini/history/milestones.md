# Project Milestones: SS Traveling

## Phase 1: Infrastructure & Auth (Completed)

### 2026-05-22: Auth System Perfection & Hybrid Permissions
- **Hierarchical Menu Management**: Implemented recursive tree fetching in backend and hierarchical UI in frontend (Menus Page).
- **Hybrid Action-based Permissions**: Added support for dynamic, non-CRUD permissions (e.g., `approve`, `export`) using JSONB in PostgreSQL.
- **Dynamic Permission Sync**: Implemented background synchronization (`/auth/me` endpoint) to refresh permissions without user logout.
- **UI/UX Refactoring**: Aligned the dashboard layout and components with the "floating" aesthetic of the reference project (Absensi).
- **Stability Fixes**: Resolved various frontend runtime crashes using defensive programming and fixed backend pagination bugs.

### 2026-04-27: User Management & RBAC Initial Implementation
- Implemented core CRUD for Users and Roles.
- Integrated JWT authentication and basic RolesGuard.
- Established basic Sidebar navigation based on role.
