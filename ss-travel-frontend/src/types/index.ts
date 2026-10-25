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

// -------------------------------------------------------------
// STAGE 6: ENUMS & TIPE FINANSIAL SPJ
// -------------------------------------------------------------

export type SpjExpenseType =
  | 'FUEL'
  | 'TOLL'
  | 'PARKING'
  | 'RETRIBUTION'
  | 'RESTAURANT_MEAL_SERVICE'
  | 'COORDINATOR_FEE'
  | 'CREW_LODGING'
  | 'PARKING_TOURISM'
  | 'EMERGENCY_REPAIR'
  | 'TOWING'
  | 'OTHER';

export type SpjExpensePaymentSource =
  | 'UJ'
  | 'OFFICE_AP'
  | 'OFFICE_CASH'
  | 'OFFICE_BANK'
  | 'CREW_POCKET';

export type SpjExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SpjUjStatus = 'DRAFT' | 'DISBURSED' | 'BALANCED' | 'DISCREPANCY';

export type SpjDisbursementType = 'INITIAL' | 'ADDITIONAL' | 'ROLLOVER_IN';

export type SpjPaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'ROLLOVER';

export type SpjAdditionalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SpjRevenueDeclarationType =
  | 'TICKET_CASH'
  | 'AGENT_DEPOSIT'
  | 'CARGO_MOTORCYCLE'
  | 'CARGO_BOX'
  | 'CHARTER_CASH';

export type SpjRevenueDeclarationStatus = 'DECLARED' | 'VERIFIED' | 'DISCREPANCY';

export type CrewMealPaymentCategory =
  | 'MEAL_ALLOWANCE'
  | 'TRIP_INCENTIVE'
  | 'FULL_SEAT_BONUS'
  | 'CARGO_COMMISSION';

export type CrewMealPaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export type CrewPayoutTiming = 'AT_SETTLEMENT' | 'EARLY_DISBURSEMENT';

export interface SpjExpense {
  id: string;
  spjId: string;
  spjLegId?: string;
  spjLeg?: SpjLeg;
  vehicleId: string;
  vehicle?: Vehicle;
  expenseType: SpjExpenseType;
  amount: string;
  expenseDate: string;
  paymentSource: SpjExpensePaymentSource;
  fuelLiters?: string;
  odometerKm?: number;
  fuelStation?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  notes?: string;
  status: SpjExpenseStatus;
  verifiedBy?: string;
  verifier?: User;
  verifiedAt?: string;
  createdAt: string;
}

export interface SpjUjDisbursement {
  id: string;
  spjUjId: string;
  crewAssignmentId?: string;
  crewAssignment?: SpjCrewAssignment;
  disbursementType: SpjDisbursementType;
  amount: string;
  disbursedAt: string;
  paymentMethod: SpjPaymentMethod;
  cashAccountId?: string;
  cashAccount?: CashAccount;
  bankAccountId?: string;
  bankAccount?: BankAccount;
  disbursedBy?: string;
  disburser?: User;
  receiptRef?: string;
  notes?: string;
  createdAt: string;
}

export interface SpjUjExpense {
  id: string;
  spjUjId: string;
  expenseId: string;
  expense?: SpjExpense;
  amount: string;
  receiptRef?: string;
  notes?: string;
  createdAt: string;
}

export interface SpjUjReturn {
  id: string;
  spjUjId: string;
  crewAssignmentId?: string;
  crewAssignment?: SpjCrewAssignment;
  amount: string;
  returnedAt: string;
  paymentMethod: SpjPaymentMethod;
  cashAccountId?: string;
  cashAccount?: CashAccount;
  bankAccountId?: string;
  bankAccount?: BankAccount;
  receivedBy?: string;
  receiver?: User;
  receiptRef?: string;
  notes?: string;
  createdAt: string;
}

export interface SpjUjAdditionalRequest {
  id: string;
  spjId: string;
  spjUjId: string;
  crewAssignmentId?: string;
  requestedBy: string;
  requester?: User;
  amount: string;
  reason: string;
  status: SpjAdditionalRequestStatus;
  processedBy?: string;
  processor?: User;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface SpjUj {
  id: string;
  companyId?: string;
  spjId: string;
  crewId: string;
  crew?: User;
  status: SpjUjStatus;
  totalDisbursed: string;
  totalSpent: string;
  totalReturned: string;
  balance: string;
  rolloverFromSpjId?: string;
  rolloverFromSpj?: Spj;
  rolloverToSpjId?: string;
  rolloverToSpj?: Spj;
  notes?: string;
  disbursements?: SpjUjDisbursement[];
  expenses?: SpjUjExpense[];
  returns?: SpjUjReturn[];
  additionalRequests?: SpjUjAdditionalRequest[];
  createdAt: string;
}

export interface SpjRevenueDeclaration {
  id: string;
  spjId: string;
  spjLegId?: string;
  spjLeg?: SpjLeg;
  declarationType: SpjRevenueDeclarationType;
  amount: string;
  declaredBy: string;
  declarer?: User;
  declaredAt: string;
  sourceReference?: string;
  crewCommissionPercentage?: string;
  crewCommissionAmount?: string;
  cargoSenderName?: string;
  cargoSenderPhone?: string;
  cargoReceiverName?: string;
  cargoReceiverPhone?: string;
  cargoItemDescription?: string;
  status: SpjRevenueDeclarationStatus;
  verifiedBy?: string;
  verifier?: User;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface CrewMealPayment {
  id: string;
  spjId: string;
  crewAssignmentId?: string;
  crewAssignment?: SpjCrewAssignment;
  crewId: string;
  crew?: User;
  paymentCategory: CrewMealPaymentCategory;
  amount: string;
  payoutTiming: CrewPayoutTiming;
  status: CrewMealPaymentStatus;
  paidAt?: string;
  paymentMethod?: SpjPaymentMethod;
  cashAccountId?: string;
  cashAccount?: CashAccount;
  bankAccountId?: string;
  bankAccount?: BankAccount;
  paidBy?: string;
  payer?: User;
  receiptRef?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateSpjUjDisbursementFormData {
  crewAssignmentId?: string;
  disbursementType?: SpjDisbursementType;
  amount: string;
  paymentMethod: SpjPaymentMethod;
  cashAccountId?: string;
  bankAccountId?: string;
  receiptRef?: string;
  notes?: string;
}

export interface CreateSpjUjReturnFormData {
  crewAssignmentId?: string;
  amount: string;
  paymentMethod: SpjPaymentMethod;
  cashAccountId?: string;
  bankAccountId?: string;
  receiptRef?: string;
  notes?: string;
}

export interface CreateSpjUjAdditionalRequestFormData {
  crewAssignmentId?: string;
  amount: string;
  reason: string;
}

export interface ProcessAdditionalRequestFormData {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface UjRolloverFormData {
  targetSpjId: string;
  amount: string;
  notes?: string;
}

export interface CreateSpjExpenseFormData {
  spjLegId?: string;
  vehicleId?: string;
  expenseType: SpjExpenseType;
  amount: string;
  expenseDate?: string;
  paymentSource?: SpjExpensePaymentSource;
  fuelLiters?: string;
  odometerKm?: number;
  fuelStation?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface CreateSpjRevenueDeclarationFormData {
  spjLegId?: string;
  declarationType: SpjRevenueDeclarationType;
  amount: string;
  sourceReference?: string;
  crewCommissionPercentage?: string;
  cargoSenderName?: string;
  cargoSenderPhone?: string;
  cargoReceiverName?: string;
  cargoReceiverPhone?: string;
  cargoItemDescription?: string;
  notes?: string;
}

export interface DisburseEarlyMealPaymentFormData {
  paymentMethod: SpjPaymentMethod;
  bankAccountId?: string;
  cashAccountId?: string;
  receiptRef?: string;
  notes?: string;
}

/**
 * --- TAHAP 7: MEJA KASIR POOL & SETTLEMENT KAS KRU (ANTI-NETTING) ---
 */
export type CrewCashSettlementStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
export type SettlementUjStatus = 'PENDING' | 'BALANCED' | 'DISCREPANCY';
export type SettlementRevenueStatus = 'PENDING' | 'MATCHED' | 'DISCREPANCY_RECORDED';
export type RemittancePaymentMethod = 'CASH' | 'BANK_TRANSFER';
export type RemittanceStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type DiscrepancySourceType =
  | 'UJ_EXPENSE_UNVERIFIED'
  | 'REVENUE_SHORTAGE'
  | 'REVENUE_OVERAGE'
  | 'OTHER';
export type DiscrepancyResolutionStatus =
  | 'PENDING_INVESTIGATION'
  | 'RESOLVED'
  | 'REJECTED';
export type DiscrepancyResolutionDecision =
  | 'COMPANY_WAIVER'
  | 'CHARGE_TO_CREW'
  | 'ALLOCATION_CORRECTION';

export interface CrewCashRemittanceAllocation {
  id: string;
  remittanceId: string;
  revenueDeclarationId: string;
  allocatedAmount: number;
  notes?: string;
  revenueDeclaration?: SpjRevenueDeclaration;
}

export interface CrewCashRemittance {
  id: string;
  companyId?: string;
  remittanceNo: string;
  settlementId?: string;
  spjId: string;
  depositorCrewId: string;
  depositorCrew?: User;
  amount: number;
  cashAccountId?: string;
  cashAccount?: CashAccount;
  receivedByCashierId?: string;
  receivedByCashier?: User;
  remittedAt: string;
  paymentMethod: RemittancePaymentMethod;
  status: RemittanceStatus;
  bkmNo?: string;
  notes?: string;
  allocations?: CrewCashRemittanceAllocation[];
  createdAt: string;
}

export interface CrewCashDiscrepancy {
  id: string;
  companyId?: string;
  discrepancyNo: string;
  settlementId?: string;
  spjId: string;
  spj?: Spj;
  sourceType: DiscrepancySourceType;
  expectedAmount: number;
  actualAmount: number;
  differenceAmount: number;
  reportedById: string;
  reportedBy?: User;
  responsibleCrewId?: string;
  responsibleCrew?: User;
  reason: string;
  investigationNotes?: string;
  resolutionStatus: DiscrepancyResolutionStatus;
  resolutionDecision?: DiscrepancyResolutionDecision;
  resolutionAccountId?: string;
  resolutionAccount?: Account;
  resolvedById?: string;
  resolvedBy?: User;
  resolvedAt?: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface CrewCashSettlement {
  id: string;
  companyId?: string;
  settlementNo: string;
  spjId: string;
  spj?: Spj;
  status: CrewCashSettlementStatus;
  ujStatus: SettlementUjStatus;
  revenueStatus: SettlementRevenueStatus;
  cashierId?: string;
  cashier?: User;
  submittedAt?: string;
  reviewedById?: string;
  reviewedBy?: User;
  reviewedAt?: string;
  notes?: string;
  totalUjDisbursed: number;
  totalUjSpent: number;
  totalUjReturned: number;
  ujBalance: number;
  totalRevenueExpected: number;
  totalRevenueRemitted: number;
  revenueBalance: number;
  totalCashReceived: number;
  totalCashPaid: number;
  bkmNo?: string;
  bkkNo?: string;
  journalEntryId?: string;
  remittances?: CrewCashRemittance[];
  discrepancies?: CrewCashDiscrepancy[];
  createdAt: string;
}

export interface SettlementSummary {
  spj: Spj;
  existingSettlement: CrewCashSettlement | null;
  kantong1Uj: {
    totalDisbursed: number;
    totalSpent: number;
    totalReturned: number;
    balance: number;
    status: SettlementUjStatus;
    breakdownExpenses: Array<{
      type: string;
      amount: number;
      fuelLiters?: number;
      odometerKm?: number;
      notes?: string;
    }>;
  };
  kantong2Revenue: {
    totalExpected: number;
    totalRemitted: number;
    balance: number;
    status: SettlementRevenueStatus;
    breakdownDeclarations: Array<{
      id: string;
      type: string;
      amount: number;
      sourceReference?: string;
      crewCommissionAmount?: number;
      allocatedAmount: number;
      status: string;
    }>;
    remittances: CrewCashRemittance[];
  };
  cashDesk: {
    totalCashReceived: number;
    totalCrewCompensationPayable: number;
    netCashPosition: number;
    pendingMealPayments: CrewMealPayment[];
  };
  discrepancies: CrewCashDiscrepancy[];
}

export interface RemittanceAllocationItemFormData {
  revenueDeclarationId: string;
  allocatedAmount: number;
  notes?: string;
}

export interface CreateRemittanceFormData {
  spjId: string;
  depositorCrewId: string;
  amount: number;
  cashAccountId?: string;
  paymentMethod?: RemittancePaymentMethod;
  notes?: string;
  allocations?: RemittanceAllocationItemFormData[];
}

export interface CreateSettlementFormData {
  spjId: string;
  cashAccountId: string;
  notes?: string;
  cashPaidToCrew?: boolean;
  remittances?: CreateRemittanceFormData[];
}

export interface CreateDiscrepancyFormData {
  spjId: string;
  settlementId?: string;
  sourceType: DiscrepancySourceType;
  expectedAmount: number;
  actualAmount: number;
  differenceAmount?: number;
  responsibleCrewId?: string;
  reason: string;
  investigationNotes?: string;
}

export interface ResolveDiscrepancyFormData {
  decision: DiscrepancyResolutionDecision;
  resolutionAccountId?: string;
  resolutionNotes: string;
}

export interface CashierFilterParams {
  status?: CrewCashSettlementStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface DiscrepancyFilterParams {
  resolutionStatus?: DiscrepancyResolutionStatus;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * ==========================================
 * --- AP (ACCOUNTS PAYABLE) TYPES ---
 * ==========================================
 */
export type ApVendorType = 'RESTAURANT' | 'WORKSHOP' | 'AGENT' | 'OTHER';
export type ApInvoiceStatus = 'DRAFT' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type ApPaymentStatus = 'CONFIRMED' | 'CANCELLED';
export type FinancePaymentMethod = 'BANK_TRANSFER' | 'CASH';

export interface ApInvoiceLine {
  id: string;
  invoiceId: string;
  lineNo: number;
  description: string;
  accountId: string;
  account?: Account;
  qty: number;
  unitPrice: number;
  amount: number;
  tripId?: string;
  trip?: Spj;
  tripLegId?: string;
  vehicleId?: string;
  vehicle?: Vehicle;
  manifestPaxCount?: number;
  couponCount?: number;
  discrepancyNotes?: string;
}

export interface ApAllocation {
  id: string;
  paymentId: string;
  payment?: ApPayment;
  invoiceId: string;
  invoice?: ApInvoice;
  amount: number;
}

export interface ApInvoice {
  id: string;
  companyId?: string;
  billNo: string;
  vendorInvoiceNo?: string;
  vendorType: ApVendorType;
  vendorId?: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  status: ApInvoiceStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  sourceType: string;
  sourceId?: string;
  apAccountId: string;
  apAccount?: Account;
  notes?: string;
  journalEntryId?: string;
  journalEntry?: JournalEntry;
  lines?: ApInvoiceLine[];
  allocations?: ApAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface ApPayment {
  id: string;
  companyId?: string;
  paymentNo: string;
  vendorType: ApVendorType;
  vendorId?: string;
  vendorName: string;
  paymentDate: string;
  paymentMethod: FinancePaymentMethod;
  bankAccountId?: string;
  bankAccount?: BankAccount;
  cashAccountId?: string;
  cashAccount?: CashAccount;
  amount: number;
  status: ApPaymentStatus;
  reference?: string;
  notes?: string;
  journalEntryId?: string;
  allocations?: ApAllocation[];
  createdAt: string;
}

export interface UnbilledSpjItem {
  tripId: string;
  tripLegId?: string;
  spjNo: string;
  departureDate: string;
  vehiclePlate: string;
  vehicleCode: string;
  driverName: string;
  manifestPaxCount: number;
  suggestedCouponCount: number;
  discrepancyNotes?: string;
  ratePerPax: number;
  suggestedSubtotal: number;
}

export interface RestaurantBillSpjItemFormData {
  tripId: string;
  tripLegId?: string;
  couponCount: number;
  discrepancyNotes?: string;
}

export interface CreateRestaurantBillFormData {
  restaurantId: string;
  vendorInvoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  notes?: string;
  spjItems: RestaurantBillSpjItemFormData[];
}

export interface CreateApInvoiceLineFormData {
  description: string;
  accountId: string;
  qty: number;
  unitPrice: number;
  tripId?: string;
  vehicleId?: string;
  costCenterId?: string;
  businessUnitId?: string;
}

export interface CreateApInvoiceFormData {
  vendorType: ApVendorType;
  vendorId?: string;
  vendorName: string;
  vendorInvoiceNo?: string;
  invoiceDate: string;
  dueDate: string;
  apAccountId: string;
  sourceType?: string;
  notes?: string;
  lines: CreateApInvoiceLineFormData[];
}

export interface CreateApPaymentFormData {
  vendorType: ApVendorType;
  vendorId?: string;
  vendorName: string;
  paymentDate: string;
  paymentMethod: FinancePaymentMethod;
  bankAccountId?: string;
  cashAccountId?: string;
  amount: number;
  reference?: string;
  notes?: string;
  allocations: Array<{ invoiceId: string; amount: number }>;
}

export interface ApInvoiceFilterParams {
  vendorType?: ApVendorType;
  status?: ApInvoiceStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ApPaymentFilterParams {
  vendorType?: ApVendorType;
  paymentMethod?: FinancePaymentMethod;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * ==========================================
 * --- AR (ACCOUNTS RECEIVABLE) TYPES ---
 * ==========================================
 */
export type ArInvoiceStatus = 'DRAFT' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type ArReceiptStatus = 'CONFIRMED' | 'CANCELLED';

export interface ArInvoiceLine {
  id: string;
  invoiceId: string;
  lineNo: number;
  description: string;
  accountId: string;
  account?: Account;
  qty: number;
  unitPrice: number;
  amount: number;
  tripId?: string;
  vehicleId?: string;
}

export interface ArAllocation {
  id: string;
  receiptId: string;
  receipt?: ArReceipt;
  invoiceId: string;
  invoice?: ArInvoice;
  amount: number;
}

export interface ArInvoice {
  id: string;
  companyId?: string;
  invoiceNo: string;
  customerId?: string;
  customer?: Customer;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  status: ArInvoiceStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  sourceType: string;
  sourceId?: string;
  tripId?: string;
  trip?: Spj;
  arAccountId: string;
  arAccount?: Account;
  isDownPayment: boolean;
  notes?: string;
  journalEntryId?: string;
  journalEntry?: JournalEntry;
  lines?: ArInvoiceLine[];
  allocations?: ArAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface ArReceipt {
  id: string;
  companyId?: string;
  receiptNo: string;
  customerId?: string;
  customer?: Customer;
  customerName: string;
  receiptDate: string;
  paymentMethod: FinancePaymentMethod;
  bankAccountId?: string;
  bankAccount?: BankAccount;
  cashAccountId?: string;
  cashAccount?: CashAccount;
  amount: number;
  status: ArReceiptStatus;
  reference?: string;
  isDownPayment: boolean;
  downPaymentTripId?: string;
  downPaymentTrip?: Spj;
  notes?: string;
  journalEntryId?: string;
  allocations?: ArAllocation[];
  createdAt: string;
}

export interface CharterContractStatus {
  downPaymentReceived: number;
  totalInvoiced: number;
  totalPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
}

export interface CreateDownPaymentFormData {
  customerId?: string;
  customerName: string;
  receiptDate: string;
  paymentMethod: FinancePaymentMethod;
  bankAccountId?: string;
  cashAccountId?: string;
  amount: number;
  downPaymentTripId?: string;
  reference?: string;
  notes?: string;
}

export interface CreateCharterPelunasanFormData {
  tripId: string;
  customerId?: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  remainingAmount: number;
  notes?: string;
}

export interface CreateArInvoiceLineFormData {
  description: string;
  accountId: string;
  qty: number;
  unitPrice: number;
  tripId?: string;
  vehicleId?: string;
}

export interface CreateArInvoiceFormData {
  customerId?: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  arAccountId?: string;
  tripId?: string;
  isDownPayment?: boolean;
  notes?: string;
  lines: CreateArInvoiceLineFormData[];
}

export interface CreateArReceiptFormData {
  customerId?: string;
  customerName: string;
  receiptDate: string;
  paymentMethod: FinancePaymentMethod;
  bankAccountId?: string;
  cashAccountId?: string;
  amount: number;
  reference?: string;
  notes?: string;
  allocations?: Array<{ invoiceId: string; amount: number }>;
}

export interface ArInvoiceFilterParams {
  customerId?: string;
  status?: ArInvoiceStatus;
  isDownPayment?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ArReceiptFilterParams {
  customerId?: string;
  isDownPayment?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ==========================================
// TAHAP 9: LAPORAN FINANSIAL & PROFITABILITAS
// ==========================================

export type TripProfitabilityViewMode = 'BY_BUS' | 'BY_JOURNEY_GROUP';

export interface GeneralLedgerFilterParams {
  accountId?: string;
  accountCode?: string;
  startDate?: string;
  endDate?: string;
  periodId?: string;
  businessUnitId?: string;
  costCenterId?: string;
}

export interface LedgerLineReport {
  lineId: string;
  journalId: string;
  journalNo: string;
  journalDate: string;
  sourceType: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: string;
  tripId?: string;
  vehicleId?: string;
}

export interface AccountLedgerReport {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  openingBalance: string;
  totalDebit: string;
  totalCredit: string;
  endingBalance: string;
  lines: LedgerLineReport[];
}

export interface GeneralLedgerResponse {
  periodInfo?: {
    startDate: string;
    endDate: string;
    periodName?: string;
  };
  accounts: AccountLedgerReport[];
  grandTotalDebit: string;
  grandTotalCredit: string;
}

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  openingDebit: string;
  openingCredit: string;
  periodDebit: string;
  periodCredit: string;
  endingDebit: string;
  endingCredit: string;
}

export interface TrialBalanceResponse {
  periodInfo: {
    startDate: string;
    endDate: string;
    periodName?: string;
  };
  items: TrialBalanceItem[];
  totals: {
    openingDebit: string;
    openingCredit: string;
    periodDebit: string;
    periodCredit: string;
    endingDebit: string;
    endingCredit: string;
    isBalanced: boolean;
  };
}

export interface PnLGroupItem {
  accountCode: string;
  accountName: string;
  amount: string;
}

export interface PnLGroup {
  groupCode: string;
  groupName: string;
  subtotal: string;
  accounts: PnLGroupItem[];
}

export interface IncomeStatementResponse {
  periodInfo: {
    startDate: string;
    endDate: string;
    periodName?: string;
  };
  revenues: {
    groups: PnLGroup[];
    totalRevenue: string;
  };
  expenses: {
    directFleetCosts: PnLGroup[];
    crewCosts: PnLGroup[];
    agentPartnerCosts: PnLGroup[];
    maintenanceCosts: PnLGroup[];
    generalPoolCosts: PnLGroup[];
    otherCosts: PnLGroup[];
    totalExpense: string;
  };
  grossProfit: string;
  operatingProfit: string;
  netIncome: string;
}

export interface BalanceSheetItem {
  accountCode: string;
  accountName: string;
  amount: string;
}

export interface BalanceSheetCategory {
  categoryCode: string;
  categoryName: string;
  subtotal: string;
  items: BalanceSheetItem[];
}

export interface BalanceSheetResponse {
  asOfDate: string;
  periodName?: string;
  assets: {
    categories: BalanceSheetCategory[];
    totalAssets: string;
  };
  liabilities: {
    categories: BalanceSheetCategory[];
    totalLiabilities: string;
  };
  equity: {
    categories: BalanceSheetCategory[];
    currentPeriodNetIncome: string;
    totalEquity: string;
  };
  isBalanced: boolean;
}

export interface TripProfitabilityFilterParams {
  startDate?: string;
  endDate?: string;
  serviceType?: TripServiceType;
  vehicleId?: string;
  viewMode?: TripProfitabilityViewMode;
  search?: string;
}

export interface TripProfitabilityItem {
  id: string;
  journeyGroupId?: string;
  spjNo: string;
  parentSpjNo?: string;
  hasReplacement: boolean;
  serviceType: string;
  departureDate: string;
  origin: string;
  destination: string;
  vehicleCode: string;
  vehiclePlate: string;
  driverName?: string;
  paxCount: number;
  ticketRevenue: string;
  cargoRevenue: string;
  charterRevenue: string;
  grossRevenue: string;
  fuelCost: string;
  tollAndParkingCost: string;
  mealCouponCost: string;
  crewCost: string;
  agentAndPartnerCost: string;
  incidentalRepairCost: string;
  totalDirectCost: string;
  contributionMargin: string;
  contributionMarginRatio: number;
  status: string;
}

export interface TripProfitabilitySummary {
  totalTrips: number;
  totalRevenue: string;
  totalDirectCost: string;
  totalContributionMargin: string;
  averageMarginRatio: number;
}

export interface TripProfitabilityResponse {
  summary: TripProfitabilitySummary;
  viewMode: TripProfitabilityViewMode;
  items: TripProfitabilityItem[];
}

export interface TripProfitabilityDetailResponse {
  info: TripProfitabilityItem;
  relatedSpjs?: Array<{
    id: string;
    spjNo: string;
    vehicleCode: string;
    role: 'PARENT' | 'REPLACEMENT';
  }>;
  revenueDetails: Array<{
    source: string;
    description: string;
    amount: string;
  }>;
  costDetails: Array<{
    category: string;
    accountCode: string;
    accountName: string;
    description: string;
    amount: string;
  }>;
  journalEntries: Array<{
    journalId: string;
    journalNo: string;
    journalDate: string;
    sourceType: string;
    description: string;
    totalDebit: string;
    totalCredit: string;
  }>;
}

// ==========================================
// TAHAP 9: TUTUP BUKU BULANAN (PERIOD CLOSING)
// ==========================================

export type PeriodCheckStatus = 'PASSED' | 'WARNING' | 'BLOCKED';

export interface PeriodCloseCheckItemResult {
  checkCode: string;
  checkName: string;
  status: PeriodCheckStatus;
  description: string;
  details?: Record<string, any>;
}

export interface PeriodClosingChecklistResponse {
  period: {
    id: string;
    periodNo: number;
    name: string;
    startDate: string;
    endDate: string;
    status: FiscalPeriodStatus;
    closedAt?: string;
    closedByName?: string;
    closeReason?: string;
  };
  canClose: boolean;
  blockerReasons: string[];
  warningReasons: string[];
  checks: PeriodCloseCheckItemResult[];
  lastCheckedAt?: string;
}

export interface ClosePeriodFormData {
  notes?: string;
}

export interface ReopenPeriodFormData {
  reason: string;
}

export interface PeriodClosingFilterParams {
  year?: number;
  status?: FiscalPeriodStatus;
}

/**
 * --- MODUL KAS KECIL POOL (PETTY CASH) ---
 */
export type CashTransactionType = 'DISBURSEMENT' | 'REPLENISHMENT';
export type CashTransactionStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
export type PettyCashCategory =
  | 'FACILITY_SNACK'
  | 'STANDBY_CREW'
  | 'DEADHEAD_INSENTIF'
  | 'POOL_SUPPLIES'
  | 'OVERTIME_MEKANIK'
  | 'OFFICE_CONSUMPTION'
  | 'OFFICE_TRAVEL'
  | 'WORKSHOP_EMERGENCY'
  | 'OTHER';

export interface CashTransaction {
  id: string;
  transactionNo: string;
  cashAccountId: string;
  cashAccount?: CashAccount;
  type: CashTransactionType;
  transactionDate: string;
  amount: string;
  recipient: string;
  expenseAccountId?: string;
  expenseAccount?: Account;
  sourceBankAccountId?: string;
  sourceBankAccount?: BankAccount;
  sourceCashAccountId?: string;
  sourceCashAccount?: CashAccount;
  vehicleId?: string;
  vehicle?: Vehicle;
  costCenterId?: string;
  costCenter?: CostCenter;
  category: PettyCashCategory;
  description: string;
  receiptNo?: string;
  receiptImageUrl?: string;
  status: CashTransactionStatus;
  journalEntryId?: string;
  journalEntry?: JournalEntry;
  createdById?: string;
  createdByUser?: User;
  verifiedById?: string;
  verifiedByUser?: User;
  verifiedAt?: string;
  rejectionReason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PettyCashSummary {
  cashAccount: {
    id: string;
    code: string;
    name: string;
    glAccountCode?: string;
    glAccountName?: string;
  };
  currentBalance: string;
  thisMonthExpenses: string;
  pendingVerificationCount: number;
  todayTransactionsCount: number;
}

export interface CreatePettyCashDisbursementFormData {
  cashAccountId: string;
  transactionDate: string;
  amount: string;
  recipient: string;
  expenseAccountId: string;
  category: PettyCashCategory;
  vehicleId?: string;
  costCenterId?: string;
  description: string;
  receiptNo?: string;
  receiptImageUrl?: string;
  autoVerify?: boolean;
}

export interface CreatePettyCashReplenishmentFormData {
  cashAccountId: string;
  transactionDate: string;
  amount: string;
  sourceType: 'BANK' | 'CASH';
  sourceBankAccountId?: string;
  sourceCashAccountId?: string;
  recipient?: string;
  description: string;
  receiptNo?: string;
}

export interface VerifyPettyCashFormData {
  notes?: string;
}

export interface RejectPettyCashFormData {
  reason: string;
}

export interface PettyCashFilterParams {
  startDate?: string;
  endDate?: string;
  type?: CashTransactionType;
  status?: CashTransactionStatus;
  cashAccountId?: string;
  category?: PettyCashCategory;
  vehicleId?: string;
  search?: string;
}


