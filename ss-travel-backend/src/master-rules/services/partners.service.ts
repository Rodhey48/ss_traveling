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
  CoordinatorFeeRuleEntity,
} from '../../@models/master-rules/coordinator-fee-rule.entity';
import { UsersEntity } from '../../@models/user/user.entity';
import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
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
  coordinatorUserId?: string;
  coordinatorName?: string;
}

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(RestaurantEntity)
    private readonly restaurantRepo: Repository<RestaurantEntity>,
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
  // COORDINATOR FEE RULES MANAGEMENT
  // ==========================================

  async findAllCoordinatorFeeRules(): Promise<CoordinatorFeeRuleEntity[]> {
    return this.coordinatorFeeRepo.find({
      relations: ['coordinatorUser', 'route'],
      order: { origin: 'ASC', destination: 'ASC' },
    });
  }

  async findOneCoordinatorFeeRule(id: string): Promise<CoordinatorFeeRuleEntity> {
    const rule = await this.coordinatorFeeRepo.findOne({
      where: { id },
      relations: ['coordinatorUser', 'route'],
    });
    if (!rule) {
      throw new NotFoundException(`Aturan fee korlap dengan ID '${id}' tidak ditemukan.`);
    }
    return rule;
  }

  async createCoordinatorFeeRule(dto: CreateCoordinatorFeeRuleDto): Promise<CoordinatorFeeRuleEntity> {
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

    if (dto.coordinatorUserId) {
      const user = await this.userRepo.findOne({ where: { id: dto.coordinatorUserId } });
      if (!user) {
        throw new NotFoundException('Pengguna korlap tidak ditemukan.');
      }
    }

    Object.assign(rule, {
      ...dto,
      routeId: dto.routeId !== undefined ? (dto.routeId || null) : rule.routeId,
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
      relations: ['coordinatorUser'],
    });

    if (!rule) {
      // Fallback
      rule = await this.coordinatorFeeRepo.findOne({
        where: { origin: 'ALL', destination: 'ALL', isActive: true },
        relations: ['coordinatorUser'],
      });

      if (!rule) {
        throw new NotFoundException(`Aturan fee korlap untuk rute '${origin}-${destination}' tidak ditemukan.`);
      }
    }

    const feePerPax = Number(rule.feePerPax);
    const totalFee = feePerPax * count;

    return {
      origin: rule.origin,
      destination: rule.destination,
      feePerPax,
      paxCount: count,
      totalFee,
      coordinatorUserId: rule.coordinatorUserId,
      coordinatorName: rule.coordinatorUser ? rule.coordinatorUser.name : undefined,
    };
  }
}
