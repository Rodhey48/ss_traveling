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

/**
 * --- FINANCE MASTER & COA TYPES ---
 */
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface Account {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentId?: string;
  parent?: Account;
  children?: Account[];
  isPostable: boolean;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountTreeNode extends Account {
  children?: AccountTreeNode[];
}

export interface AccountFormData {
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentId?: string;
  isPostable?: boolean;
  description?: string;
  isActive?: boolean;
}

export interface CashAccount {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  accountId: string;
  account?: Account;
  custodianUserId?: string;
  custodianUser?: User;
  costCenterId?: string;
  costCenter?: CostCenter;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashAccountFormData {
  code: string;
  name: string;
  accountId: string;
  custodianUserId?: string;
  costCenterId?: string;
  description?: string;
  isActive?: boolean;
}

export interface BankAccount {
  id: string;
  companyId?: string;
  code: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountNumberMasked: string;
  accountId: string;
  account?: Account;
  currency: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountFormData {
  code: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountId: string;
  currency?: string;
  description?: string;
  isActive?: boolean;
}

export type FiscalYearStatus = 'OPEN' | 'CLOSED';
export type FiscalPeriodStatus = 'OPEN' | 'CLOSING' | 'CLOSED' | 'REOPENED';

export interface FiscalYear {
  id: string;
  companyId?: string;
  year: number;
  startDate: string;
  endDate: string;
  status: FiscalYearStatus;
  isActive: boolean;
  periods?: FiscalPeriod[];
  createdAt: string;
  updatedAt: string;
}

export interface FiscalPeriod {
  id: string;
  fiscalYearId: string;
  fiscalYear?: FiscalYear;
  periodNo: number;
  name: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
  closedAt?: string;
  closedBy?: string;
  closedByUser?: User;
  closeReason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFiscalYearFormData {
  year: number;
  startDate: string;
  endDate: string;
}

export interface UpdatePeriodStatusFormData {
  status: FiscalPeriodStatus;
  reason?: string;
}

/**
 * --- TAHAP 3: MASTER ATURAN BISNIS & TARIF LAPANGAN ---
 */

// 1. FARE SEASONS & MATRIX
export interface FareSeason {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  isActive: boolean;
  matrices?: FareMatrix[];
  createdAt: string;
  updatedAt: string;
}

export interface FareSeasonFormData {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  isActive?: boolean;
}

export interface FareMatrix {
  id: string;
  companyId?: string;
  fareSeasonId: string;
  fareSeason?: FareSeason;
  origin: string;
  destination: string;
  seatClassId: string;
  seatClass?: SeatClass;
  amount: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FareMatrixFormData {
  fareSeasonId: string;
  origin: string;
  destination: string;
  seatClassId: string;
  amount: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
  isActive?: boolean;
}

export interface FareCalculationQuery {
  origin: string;
  destination: string;
  seatClassId: string;
  travelDate?: string;
}

export interface CalculatedFareResult {
  amount: number;
  seasonName: string;
  seasonCode: string;
  isSeasonal: boolean;
  origin: string;
  destination: string;
  travelDate: string;
  seatClass: {
    id: string;
    code: string;
    name: string;
  };
}

// 2. AGENTS & COMMISSIONS
export type AgentType = 'OFFLINE' | 'ONLINE_OTA';
export type AgentSettlementType = 'CASH_TO_CREW' | 'CASH_TO_OFFICE' | 'BANK_TRANSFER';
export type CommissionRuleType = 'FLAT_PER_TICKET' | 'PERCENTAGE';

export interface Agent {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  agentType: AgentType;
  city: string;
  phone: string;
  email?: string;
  address?: string;
  settlementType: AgentSettlementType;
  contactPerson?: string;
  isActive: boolean;
  commissionRules?: AgentCommissionRule[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentFormData {
  code: string;
  name: string;
  agentType: AgentType;
  city: string;
  phone: string;
  email?: string;
  address?: string;
  settlementType: AgentSettlementType;
  contactPerson?: string;
  isActive?: boolean;
}

export interface AgentCommissionRule {
  id: string;
  companyId?: string;
  agentId: string;
  seatClassId?: string;
  seatClass?: SeatClass;
  ruleType: CommissionRuleType;
  commissionValue: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCommissionRuleFormData {
  seatClassId?: string;
  ruleType: CommissionRuleType;
  commissionValue: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
  isActive?: boolean;
}

export interface CalculatedCommissionResult {
  agentId: string;
  agentName: string;
  agentType: string;
  seatClassId?: string;
  seatClassName?: string;
  ruleType: CommissionRuleType;
  commissionRate: number;
  ticketPrice: number;
  calculatedCommission: number;
  netPayoutToCompany: number;
}

// 3. CREW RATES & COMPENSATION
export type CrewRole = 'DRIVER' | 'CO_DRIVER' | 'CONDUCTOR' | 'STEWARDESS';
export type CrewServiceType = 'AKAP' | 'TOURISM';
export type CrewRateType = 'PER_TRIP' | 'PER_DAY';

export interface CrewRateRule {
  id: string;
  companyId?: string;
  role: CrewRole;
  serviceType: CrewServiceType;
  origin: string;
  destination: string;
  rateType: CrewRateType;
  mealAllowance: number;
  tripIncentive: number;
  fullSeatBonus: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrewRateRuleFormData {
  role: CrewRole;
  serviceType: CrewServiceType;
  origin: string;
  destination: string;
  rateType: CrewRateType;
  mealAllowance: number;
  tripIncentive: number;
  fullSeatBonus?: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
  isActive?: boolean;
}

export interface CrewRateSnapshotQuery {
  role: CrewRole;
  serviceType: CrewServiceType;
  origin?: string;
  destination?: string;
  travelDate?: string;
  durationDays?: number;
}

export interface CrewRateSnapshotResult {
  ruleId: string;
  role: CrewRole;
  serviceType: CrewServiceType;
  rateType: CrewRateType;
  durationDays: number;
  dailyMealAllowance: number;
  dailyTripIncentive: number;
  mealAllowance: number;
  tripIncentive: number;
  fullSeatBonus: number;
  totalStandardCompensation: number;
  origin: string;
  destination: string;
  travelDate: string;
}

// 4. RESTAURANTS & COORDINATORS
export type RestaurantSettlementType = 'PAID_BY_CREW_UJ' | 'INVOICED_MONTHLY_AP';
export type CoordinatorZone = 'WEST' | 'EAST';

export interface Restaurant {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  ratePerPax: number;
  settlementType: RestaurantSettlementType;
  contactPerson?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantFormData {
  code: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  ratePerPax: number;
  settlementType: RestaurantSettlementType;
  contactPerson?: string;
  isActive?: boolean;
}

export interface CalculatedMealResult {
  restaurantId: string;
  restaurantCode: string;
  restaurantName: string;
  city: string;
  ratePerPax: number;
  paxCount: number;
  totalExpense: number;
  settlementType: RestaurantSettlementType;
  requiresInvoiceAP: boolean;
  requiresCashFromCrewUJ: boolean;
}

export interface CoordinatorFeeRule {
  id: string;
  companyId?: string;
  zone: CoordinatorZone;
  coordinatorUserId?: string;
  coordinatorUser?: User;
  feePerPax: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoordinatorFeeRuleFormData {
  zone: CoordinatorZone;
  coordinatorUserId?: string;
  feePerPax: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
  isActive?: boolean;
}

export interface CalculatedCoordinatorFeeResult {
  zone: CoordinatorZone;
  legDirection: string;
  feePerPax: number;
  paxCount: number;
  totalFee: number;
  coordinatorUserId?: string;
  coordinatorName?: string;
}

/**
 * --- JOURNAL & ACCOUNTING CORE TYPES ---
 */
export type JournalStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export type JournalSourceType =
  | 'MANUAL'
  | 'SPJ'
  | 'AR_INVOICE'
  | 'AP_INVOICE'
  | 'CASH_TRANSACTION'
  | 'BANK_TRANSACTION'
  | 'DEPRECIATION'
  | 'PERIOD_CLOSING'
  | 'SETTLEMENT';

export interface JournalLine {
  id: string;
  journalEntryId: string;
  lineNo: number;
  accountId: string;
  account?: Account;
  debit: string | number;
  credit: string | number;
  description?: string;
  businessUnitId?: string;
  businessUnit?: BusinessUnit;
  costCenterId?: string;
  costCenter?: CostCenter;
  profitCenterId?: string;
  profitCenter?: ProfitCenter;
  tripId?: string;
  tripLegId?: string;
  vehicleId?: string;
  vehicle?: Vehicle;
  counterpartyType?: string;
  counterpartyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  companyId?: string;
  journalNo: string;
  journalDate: string;
  periodId: string;
  period?: FiscalPeriod;
  sourceType: JournalSourceType;
  sourceId?: string;
  description: string;
  status: JournalStatus;
  postedAt?: string;
  postedBy?: string;
  postedByUser?: User;
  reversalOfId?: string;
  reversalOf?: JournalEntry;
  totalDebit: string | number;
  totalCredit: string | number;
  lines?: JournalLine[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalLineInputFormData {
  accountId: string;
  debit: string | number;
  credit: string | number;
  description?: string;
  businessUnitId?: string;
  costCenterId?: string;
  profitCenterId?: string;
  tripId?: string;
  tripLegId?: string;
  vehicleId?: string;
  counterpartyType?: string;
  counterpartyId?: string;
}

export interface CreateManualJournalFormData {
  journalDate: string;
  description: string;
  sourceType?: JournalSourceType;
  sourceId?: string;
  idempotencyKey?: string;
  companyId?: string;
  lines: JournalLineInputFormData[];
}

export interface ReverseJournalFormData {
  reason: string;
  reversalDate?: string;
  idempotencyKey?: string;
}

export interface JournalFilterParams {
  startDate?: string;
  endDate?: string;
  status?: JournalStatus;
  sourceType?: JournalSourceType;
  accountId?: string;
  businessUnitId?: string;
  vehicleId?: string;
  tripId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'journalDate' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * --- TAHAP 5: JADWAL BUS & SPJ (SURAT PERINTAH JALAN) ---
 */
export type TripServiceType = 'AKAP' | 'WISATA' | 'SHUTTLE';
export type TripScheduleStatus = 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type SpjOperationalStatus = 'DRAFT' | 'ISSUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type SpjFinancialStatus = 'PENDING_SETTLEMENT' | 'UNDER_REVIEW' | 'DISCREPANCY' | 'SETTLED';
export type SpjLegDirection = 'DEPARTURE' | 'RETURN' | 'ONE_WAY';
export type SpjLegStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type CrewAssignmentRole = 'DRIVER' | 'CO_DRIVER' | 'CONDUCTOR' | 'STEWARDESS' | 'MECHANIC' | 'HELPER';
export type CrewAssignmentStatus = 'ASSIGNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REPLACED';

export interface BufferWarning {
  type: 'VEHICLE' | 'CREW';
  targetId: string;
  targetName: string;
  message: string;
  gapMinutes: number;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictDetails: string[];
  warnings: BufferWarning[];
}

export interface TripSchedule {
  id: string;
  companyId?: string;
  scheduleNo: string;
  serviceType: TripServiceType;
  businessUnitId?: string;
  businessUnit?: BusinessUnit;
  vehicleId?: string;
  vehicle?: Vehicle;
  plannedDepartureAt: string;
  plannedReturnAt: string;
  origin: string;
  destination: string;
  customerId?: string;
  customer?: Customer;
  picName?: string;
  picPhone?: string;
  pickupNotes?: string;
  totalPackagePrice: string | number;
  plannedDriver1Id?: string;
  plannedDriver1?: User;
  plannedDriver2Id?: string;
  plannedDriver2?: User;
  plannedConductorId?: string;
  plannedConductor?: User;
  status: TripScheduleStatus;
  spjId?: string;
  spj?: Spj;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpjLeg {
  id: string;
  spjId: string;
  sequenceNo: number;
  direction: SpjLegDirection;
  origin: string;
  destination: string;
  departureAt?: string;
  arrivalAt?: string;
  status: SpjLegStatus;
  passengerCount: number;
  mealPaxCount: number;
  mealDiscrepancyNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpjCrewAssignment {
  id: string;
  spjId: string;
  spjLegId?: string;
  crewId: string;
  crew?: User;
  role: CrewAssignmentRole;
  assignedFrom?: string;
  assignedUntil?: string;
  status: CrewAssignmentStatus;
  replacementCrewId?: string;
  replacementCrew?: User;
  notes?: string;
  mealAllowanceSnapshot: string | number;
  incentiveSnapshot: string | number;
  fullSeatBonusSnapshot: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface Spj {
  id: string;
  companyId?: string;
  spjNo: string;
  serviceType: TripServiceType;
  tripScheduleId?: string;
  tripSchedule?: TripSchedule;
  parentSpjId?: string;
  parentSpj?: Spj;
  replacementSpjs?: Spj[];
  vehicleId: string;
  vehicle?: Vehicle;
  businessUnitId?: string;
  businessUnit?: BusinessUnit;
  profitCenterId?: string;
  profitCenter?: ProfitCenter;
  operationalStatus: SpjOperationalStatus;
  financialStatus: SpjFinancialStatus;
  issuedAt?: string;
  operationallyCompletedAt?: string;
  closedAt?: string;
  notes?: string;
  legs?: SpjLeg[];
  crewAssignments?: SpjCrewAssignment[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripScheduleFormData {
  serviceType: TripServiceType;
  vehicleId?: string;
  plannedDepartureAt: string;
  plannedReturnAt: string;
  origin: string;
  destination: string;
  customerId?: string;
  picName?: string;
  picPhone?: string;
  pickupNotes?: string;
  totalPackagePrice?: number;
  plannedDriver1Id?: string;
  plannedDriver2Id?: string;
  plannedConductorId?: string;
  notes?: string;
}

export interface UpdateTripScheduleFormData extends Partial<CreateTripScheduleFormData> {
  status?: TripScheduleStatus;
}

export interface ScheduleFilterParams {
  serviceType?: TripServiceType;
  status?: TripScheduleStatus;
  vehicleId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateSpjFormData {
  serviceType: TripServiceType;
  vehicleId: string;
  tripScheduleId?: string;
  notes?: string;
  legs?: {
    sequenceNo: number;
    direction: SpjLegDirection;
    origin: string;
    destination: string;
    departureAt?: string;
    arrivalAt?: string;
    passengerCount?: number;
  }[];
  crewAssignments?: {
    crewId: string;
    role: CrewAssignmentRole;
    spjLegId?: string;
    notes?: string;
  }[];
}

export interface ReplaceCrewFormData {
  assignmentId: string;
  replacementCrewId: string;
  role?: CrewAssignmentRole;
  reason: string;
}

export interface EmergencyReplaceBusFormData {
  parentSpjId: string;
  newVehicleId: string;
  incidentLocation: string;
  incidentNotes: string;
  transferPassengerCount?: number;
  continueWithExistingCrew?: boolean;
}

export interface SpjFilterParams {
  serviceType?: TripServiceType;
  operationalStatus?: SpjOperationalStatus;
  financialStatus?: SpjFinancialStatus;
  vehicleId?: string;
  crewId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}



