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
  role?: string;
  token?: string;
}

export interface LoginResponseData {
  user: UserLoginInfo;
  token: string;
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
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export type MainNavItem = NavItemWithOptionalChildren;
export type SidebarNavItem = NavItemWithChildren;
