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
  actions?: Record<string, boolean>;
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

/**
 * --- ORGANISASI & DIMENSI TYPES ---
 */
export interface Company {
  id: string;
  code: string;
  name: string;
  currency: string;
  timezone: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
}

export interface BusinessUnit {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CostCenter {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  parentId?: string;
  parent?: CostCenter;
  children?: CostCenter[];
  description?: string;
  isActive: boolean;
}

export interface ProfitCenter {
  id: string;
  companyId?: string;
  businessUnitId?: string;
  businessUnit?: BusinessUnit;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

/**
 * --- FLEET & VEHICLE TYPES ---
 */
export type VehicleType = 'BIG_BUS' | 'MEDIUM_BUS' | 'MINIBUS';
export type OwnershipStatus = 'OWNED_PAID_OFF' | 'LEASING' | 'RENTAL';
export type SeatClassName = 'SLEEPER' | 'LUXURY_2_1' | 'EXECUTIVE' | 'STANDARD';

export interface SeatClass {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  defaultLayout?: string;
  description?: string;
  isActive: boolean;
}

export interface VehicleSeatClass {
  id: string;
  vehicleId: string;
  seatClassId?: string;
  seatClass?: SeatClass;
  className: SeatClassName;
  seatCapacity: number;
  seatLayout?: string;
  isActive: boolean;
}

export interface VehicleImage {
  id: string;
  vehicleId: string;
  imageUrl: string;
  caption?: string;
  isPrimary: boolean;
  sequence: number;
  isActive: boolean;
}

export interface Vehicle {
  id: string;
  companyId?: string;
  code: string;
  nickname?: string;
  plateNumber: string;
  vehicleType: VehicleType;
  chassisModel?: string;
  bodyModel?: string;
  ownershipStatus: OwnershipStatus;
  capacity: number;
  year?: number;
  isActive: boolean;
  seatClasses?: VehicleSeatClass[];
  images?: VehicleImage[];
}

export interface VehicleFormData {
  code: string;
  nickname?: string;
  plateNumber: string;
  vehicleType: VehicleType;
  chassisModel?: string;
  bodyModel?: string;
  ownershipStatus: OwnershipStatus;
  capacity?: number;
  year?: number;
  isActive?: boolean;
  seatClasses?: {
    seatClassId?: string;
    className: SeatClassName;
    seatCapacity: number;
    seatLayout?: string;
  }[];
  images?: {
    imageUrl: string;
    caption?: string;
    isPrimary?: boolean;
    sequence?: number;
  }[];
}

/**
 * --- CUSTOMER & CRM LEADS TYPES ---
 */
export type CustomerType = 'CORPORATE' | 'SCHOOL' | 'COMMUNITY' | 'INDIVIDUAL' | 'GOVERNMENT';
export type LeadSource = 'DIRECT' | 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE' | 'REFERRAL';
export type CustomerTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Customer {
  id: string;
  companyId?: string;
  code: string;
  customerType: CustomerType;
  institutionName?: string;
  picName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  leadSource: LeadSource;
  customerTier: CustomerTier;
  lastTripDate?: string;
  totalTripsCount: number;
  specialNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  code?: string;
  customerType: CustomerType;
  institutionName?: string;
  picName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  leadSource: LeadSource;
  customerTier: CustomerTier;
  specialNotes?: string;
  isActive?: boolean;
}

