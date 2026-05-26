# Project Milestones: SS Traveling

## Phase 1: Infrastructure & Auth (Completed)

### 2026-05-26: Distributed Authorization & End-to-End Permission Transparency
- **Enriched JWT Payload**: Integrated granular permissions (format aclName:action) directly into the JWT payload during login, enabling zero-network authorization for other services.
- **PermissionsGuard & Decorator**: Implemented a smart PermissionsGuard and @RequirePermissions decorator in the backend.
- **Action-based Error Reporting**: Refactored the guard to return a detailed missing field in 403 Forbidden responses, specifying exactly which permissions are required.
- **Frontend Error Interceptor**: Updated axiosClient.ts to capture backend permission errors and display them in the toast (Sonner) description for clear admin feedback.
- **Architecture SOP**: Established a new project standard for endpoint security combining Role-based and Permission-based access.

### 2026-05-25: Menu Management UX & Global State Robustness
- **Interactive Icon Picker**: Developed a high-performance, searchable icon gallery with 1,400+ Lucide icons, featuring lazy loading and mouse wheel support.
- **Contextual Menu Creation**: Refactored the Menu Management UI to support "Main Menu" and "Sub-Menu" creation paths, automatically locking parent assignments to reduce user error.
- **Folder-like Group Menus**: Repurposed the title boolean field to mark menus as "Groups." These menus act as folders that toggle child visibility without triggering page redirection.
- **Global Auth State (Context)**: Migrated local state management to a unified AuthContext, ensuring Sidebar, Mobile Sidebar, and Permissions react in real-time to background synchronization.
- **Responsive UI Overhaul**: Widen the menu management forms to a 2-column layout and enforced strict theme consistency for perfect Dark Mode support.

### 2026-05-22: Auth System Perfection & Hybrid Permissions
- **Hierarchical Menu Management**: Implemented recursive tree fetching in backend and hierarchical UI in frontend (Menus Page).
- **Hybrid Action-based Permissions**: Added support for dynamic, non-CRUD permissions (e.g., approve, export) using JSONB in PostgreSQL.
- **Dynamic Permission Sync**: Implemented background synchronization (/auth/me endpoint) to refresh permissions without user logout.
- **UI/UX Refactoring**: Aligned the dashboard layout and components with the "floating" aesthetic of the reference project (Absensi).
- **Stability Fixes**: Resolved various frontend runtime crashes using defensive programming and fixed backend pagination bugs.

### 2026-04-27: User Management & RBAC Initial Implementation
- Implemented core CRUD for Users and Roles.
- Integrated JWT authentication and basic RolesGuard.
- Established basic Sidebar navigation based on role.
