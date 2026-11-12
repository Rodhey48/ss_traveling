import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RestaurantEntity,
  RestaurantSettlementType,
} from '../../@models/master-rules/restaurant.entity';
import {
  CoordinatorEntity,
  CoordinatorType,
} from '../../@models/master-rules/coordinator.entity';
import {
  CoordinatorFeeRuleEntity,
} from '../../@models/master-rules/coordinator-fee-rule.entity';
import { UsersEntity } from '../../@models/user/user.entity';
import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
  CreateCoordinatorDto,
  UpdateCoordinatorDto,
  CoordinatorFilterDto,
  CreateCoordinatorFeeRuleDto,
  UpdateCoordinatorFeeRuleDto,
} from '../../@dto/master-rules/partner.dto';

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

export interface CalculatedCoordinatorFeeResult {
  origin: string;
  destination: string;
  feePerPax: number;
  paxCount: number;
  totalFee: number;
  coordinatorId?: string;
  coordinatorUserId?: string;
  coordinatorName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  phone?: string;
}

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(RestaurantEntity)
    private readonly restaurantRepo: Repository<RestaurantEntity>,
    @InjectRepository(CoordinatorEntity)
    private readonly coordinatorRepo: Repository<CoordinatorEntity>,
    @InjectRepository(CoordinatorFeeRuleEntity)
    private readonly coordinatorFeeRepo: Repository<CoordinatorFeeRuleEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepo: Repository<UsersEntity>,
  ) {}

  // ==========================================
  // RESTAURANTS MANAGEMENT
  // ==========================================

  async findAllRestaurants(): Promise<RestaurantEntity[]> {
    return this.restaurantRepo.find({
      order: { code: 'ASC' },
    });
  }

  async findOneRestaurant(id: string): Promise<RestaurantEntity> {
    const rest = await this.restaurantRepo.findOne({ where: { id } });
    if (!rest) {
      throw new NotFoundException(`Rumah makan mitra dengan ID '${id}' tidak ditemukan.`);
    }
    return rest;
  }

  async createRestaurant(dto: CreateRestaurantDto): Promise<RestaurantEntity> {
    const existing = await this.restaurantRepo.findOne({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Rumah makan dengan kode '${dto.code}' sudah terdaftar.`);
    }

    const rest = this.restaurantRepo.create({
      code: dto.code.trim().toUpperCase(),
      name: dto.name,
      city: dto.city.trim().toUpperCase(),
      address: dto.address,
      phone: dto.phone,
      ratePerPax: dto.ratePerPax,
      settlementType: dto.settlementType,
      contactPerson: dto.contactPerson,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.restaurantRepo.save(rest);
  }

  async updateRestaurant(id: string, dto: UpdateRestaurantDto): Promise<RestaurantEntity> {
    const rest = await this.findOneRestaurant(id);
    Object.assign(rest, {
      ...dto,
      city: dto.city ? dto.city.trim().toUpperCase() : rest.city,
    });
    return this.restaurantRepo.save(rest);
  }

  async deleteRestaurant(id: string): Promise<{ success: boolean; message: string }> {
    const rest = await this.findOneRestaurant(id);
    await this.restaurantRepo.remove(rest);
    return {
      success: true,
      message: `Rumah makan mitra '${rest.name}' berhasil dihapus.`,
    };
  }

  async calculateMealExpense(restaurantId: string, paxCount: number): Promise<CalculatedMealResult> {
    const rest = await this.findOneRestaurant(restaurantId);
    const count = paxCount > 0 ? paxCount : 0;
    const rate = Number(rest.ratePerPax);
    const totalExpense = rate * count;

    return {
      restaurantId: rest.id,
      restaurantCode: rest.code,
      restaurantName: rest.name,
      city: rest.city,
      ratePerPax: rate,
      paxCount: count,
      totalExpense,
      settlementType: rest.settlementType,
      requiresInvoiceAP: rest.settlementType === RestaurantSettlementType.INVOICED_MONTHLY_AP,
      requiresCashFromCrewUJ: rest.settlementType === RestaurantSettlementType.PAID_BY_CREW_UJ,
    };
  }

  // ==========================================
  // MASTER FIELD COORDINATORS (KORLAP)
  // ==========================================

  async findAllCoordinators(filter?: CoordinatorFilterDto): Promise<CoordinatorEntity[]> {
    const qb = this.coordinatorRepo.createQueryBuilder('c');

    if (filter?.search) {
      qb.andWhere(
        '(c.code ILIKE :search OR c.name ILIKE :search OR c.organizationName ILIKE :search OR c.phone ILIKE :search OR c.bankAccountNumber ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter?.area) {
      qb.andWhere('c.area ILIKE :area', { area: `%${filter.area}%` });
    }

    if (filter?.type) {
      qb.andWhere('c.type = :type', { type: filter.type });
    }

    if (filter?.isActive !== undefined) {
      qb.andWhere('c.isActive = :isActive', { isActive: filter.isActive });
    }

    qb.orderBy('c.code', 'ASC');
    return qb.getMany();
  }

  async findOneCoordinator(id: string): Promise<CoordinatorEntity> {
    const coordinator = await this.coordinatorRepo.findOne({
      where: { id },
      relations: ['feeRules'],
    });
    if (!coordinator) {
      throw new NotFoundException(`Koordinator Lapangan dengan ID '${id}' tidak ditemukan.`);
    }
    return coordinator;
  }

  async createCoordinator(dto: CreateCoordinatorDto): Promise<CoordinatorEntity> {
    const existing = await this.coordinatorRepo.findOne({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Koordinator lapangan dengan kode '${dto.code}' sudah terdaftar.`);
    }

    const coordinator = this.coordinatorRepo.create({
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      type: dto.type || CoordinatorType.INDIVIDUAL,
      organizationName: dto.organizationName?.trim(),
      phone: dto.phone.trim(),
      email: dto.email?.trim(),
      area: dto.area ? dto.area.trim().toUpperCase() : 'ALL',
      address: dto.address?.trim(),
      bankName: dto.bankName.trim().toUpperCase(),
      bankAccountNumber: dto.bankAccountNumber.trim(),
      bankAccountHolder: dto.bankAccountHolder.trim(),
      notes: dto.notes,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.coordinatorRepo.save(coordinator);
  }

  async updateCoordinator(id: string, dto: UpdateCoordinatorDto): Promise<CoordinatorEntity> {
    const coordinator = await this.findOneCoordinator(id);

    Object.assign(coordinator, {
      ...dto,
      name: dto.name !== undefined ? dto.name.trim() : coordinator.name,
      organizationName: dto.organizationName !== undefined ? dto.organizationName?.trim() : coordinator.organizationName,
      phone: dto.phone !== undefined ? dto.phone.trim() : coordinator.phone,
      email: dto.email !== undefined ? dto.email?.trim() : coordinator.email,
      area: dto.area !== undefined ? dto.area.trim().toUpperCase() : coordinator.area,
      address: dto.address !== undefined ? dto.address?.trim() : coordinator.address,
      bankName: dto.bankName !== undefined ? dto.bankName.trim().toUpperCase() : coordinator.bankName,
      bankAccountNumber: dto.bankAccountNumber !== undefined ? dto.bankAccountNumber.trim() : coordinator.bankAccountNumber,
      bankAccountHolder: dto.bankAccountHolder !== undefined ? dto.bankAccountHolder.trim() : coordinator.bankAccountHolder,
    });

    return this.coordinatorRepo.save(coordinator);
  }

  async deleteCoordinator(id: string): Promise<{ success: boolean; message: string }> {
    const coordinator = await this.findOneCoordinator(id);
    await this.coordinatorRepo.remove(coordinator);
    return {
      success: true,
      message: `Koordinator lapangan '${coordinator.name}' berhasil dihapus.`,
    };
  }

  // ==========================================
  // COORDINATOR FEE RULES MANAGEMENT
  // ==========================================

  async findAllCoordinatorFeeRules(): Promise<CoordinatorFeeRuleEntity[]> {
    return this.coordinatorFeeRepo.find({
      relations: ['coordinator', 'coordinatorUser', 'route'],
      order: { origin: 'ASC', destination: 'ASC' },
    });
  }

  async findOneCoordinatorFeeRule(id: string): Promise<CoordinatorFeeRuleEntity> {
    const rule = await this.coordinatorFeeRepo.findOne({
      where: { id },
      relations: ['coordinator', 'coordinatorUser', 'route'],
    });
    if (!rule) {
      throw new NotFoundException(`Aturan fee korlap dengan ID '${id}' tidak ditemukan.`);
    }
    return rule;
  }

  async createCoordinatorFeeRule(dto: CreateCoordinatorFeeRuleDto): Promise<CoordinatorFeeRuleEntity> {
    if (dto.coordinatorId) {
      const coordinator = await this.coordinatorRepo.findOne({ where: { id: dto.coordinatorId } });
      if (!coordinator) {
        throw new NotFoundException('Data Koordinator Lapangan tidak ditemukan.');
      }
    }

    if (dto.coordinatorUserId) {
      const user = await this.userRepo.findOne({ where: { id: dto.coordinatorUserId } });
      if (!user) {
        throw new NotFoundException('Pengguna korlap tidak ditemukan.');
      }
    }

    const rule = this.coordinatorFeeRepo.create({
      routeId: dto.routeId || undefined,
      origin: dto.origin || 'ALL',
      destination: dto.destination || 'ALL',
      coordinatorId: dto.coordinatorId || undefined,
      coordinatorUserId: dto.coordinatorUserId || undefined,
      feePerPax: dto.feePerPax,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : undefined,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.coordinatorFeeRepo.save(rule);
  }

  async updateCoordinatorFeeRule(
    id: string,
    dto: UpdateCoordinatorFeeRuleDto,
  ): Promise<CoordinatorFeeRuleEntity> {
    const rule = await this.findOneCoordinatorFeeRule(id);

    if (dto.coordinatorId) {
      const coordinator = await this.coordinatorRepo.findOne({ where: { id: dto.coordinatorId } });
      if (!coordinator) {
        throw new NotFoundException('Data Koordinator Lapangan tidak ditemukan.');
      }
    }

    if (dto.coordinatorUserId) {
      const user = await this.userRepo.findOne({ where: { id: dto.coordinatorUserId } });
      if (!user) {
        throw new NotFoundException('Pengguna korlap tidak ditemukan.');
      }
    }

    Object.assign(rule, {
      ...dto,
      routeId: dto.routeId !== undefined ? (dto.routeId || null) : rule.routeId,
      coordinatorId: dto.coordinatorId !== undefined ? (dto.coordinatorId || null) : rule.coordinatorId,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : rule.effectiveFrom,
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : rule.effectiveUntil,
    });

    return this.coordinatorFeeRepo.save(rule);
  }

  async deleteCoordinatorFeeRule(id: string): Promise<{ success: boolean; message: string }> {
    const rule = await this.findOneCoordinatorFeeRule(id);
    await this.coordinatorFeeRepo.remove(rule);
    return {
      success: true,
      message: 'Aturan fee korlap berhasil dihapus.',
    };
  }

  /**
   * Menghitung fee koordinator lapangan berdasarkan rute origin-destination.
   */
  async getFeeForRoute(origin: string, destination: string, paxCount: number): Promise<CalculatedCoordinatorFeeResult> {
    const count = paxCount > 0 ? paxCount : 0;

    let rule = await this.coordinatorFeeRepo.findOne({
      where: { origin, destination, isActive: true },
      relations: ['coordinator', 'coordinatorUser'],
    });

    if (!rule) {
      // Fallback
      rule = await this.coordinatorFeeRepo.findOne({
        where: { origin: 'ALL', destination: 'ALL', isActive: true },
        relations: ['coordinator', 'coordinatorUser'],
      });

      if (!rule) {
        throw new NotFoundException(`Aturan fee korlap untuk rute '${origin}-${destination}' tidak ditemukan.`);
      }
    }

    const feePerPax = Number(rule.feePerPax);
    const totalFee = feePerPax * count;
    const coordinatorName = rule.coordinator?.name || rule.coordinatorUser?.name;

    return {
      origin: rule.origin,
      destination: rule.destination,
      feePerPax,
      paxCount: count,
      totalFee,
      coordinatorId: rule.coordinatorId,
      coordinatorUserId: rule.coordinatorUserId,
      coordinatorName,
      bankName: rule.coordinator?.bankName,
      bankAccountNumber: rule.coordinator?.bankAccountNumber,
      bankAccountHolder: rule.coordinator?.bankAccountHolder,
      phone: rule.coordinator?.phone,
    };
  }
}
