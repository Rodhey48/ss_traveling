/**
 * --- API RESPONSE WRAPPERS ---
 */
export interface BaseResponse<T = any> {
  status: string;
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

/**
 * --- AUTH TYPES ---
 */
export interface UserLoginInfo {
  id: string;
  name: string;
  email: string;
  nip?: string;
  phone?: string;
  role?: string;
  token?: string;
  menus?: BackendMenu[];
  roles?: any[];
  avatar?: string;
  isPasswordChanged?: boolean;
}

export interface BackendMenu {
  id: string;
  name: string;
  url?: string;
  icon?: string;
  sequence: number;
  isWeb: boolean;
  isMobile: boolean;
  isActive: boolean;
  parentId?: string;
  parent?: BackendMenu;
  children?: BackendMenu[];
  isRead: boolean;
  isCreate: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  availableActions?: string[];
  title: boolean;
}

export interface MenuFormData {
  name: string;
  url?: string;
  icon?: string;
  sequence?: number;
  parentId?: string;
  isActive?: boolean;
  isWeb?: boolean;
  isMobile?: boolean;
  availableActions?: string[];
  title?: boolean;
}

export interface LoginResponseData {
  user: UserLoginInfo;
  token: string;
  refreshToken: string;
  menus: BackendMenu[];
}

/**
 * --- USER TYPES ---
 */
export interface User {
  id: string;
  name: string;
  email: string;
  nip?: string;
  phone?: string;
  type: 'admin' | 'employee' | 'user';
  isActive: boolean;
  isPasswordChanged: boolean;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  roles?: any[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  menus?: RolePermission[];
}

export interface RolePermission {
  id?: string;
  menuId: string;
  menu?: BackendMenu;
  isRead: boolean;
  isCreate: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  actions?: Record<string, boolean>;
}

export interface RoleFormData {
  name: string;
  description: string;
  permissions: {
    menuId: string;
    isRead: boolean;
    isCreate: boolean;
    isUpdate: boolean;
    isDelete: boolean;
    actions?: Record<string, boolean>;
  }[];
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  nip?: string;
  phone?: string;
  type: 'admin' | 'employee' | 'user';
  roleIds?: string[];
  isActive?: boolean;
  isPasswordChanged?: boolean;
  avatar?: string;
}

/**
 * --- NAVIGATION TYPES ---
 */
export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: string;
  label?: string;
  description?: string;
  isParentGroup?: boolean;
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export type MainNavItem = NavItemWithOptionalChildren;
export type SidebarNavItem = NavItemWithChildren;
