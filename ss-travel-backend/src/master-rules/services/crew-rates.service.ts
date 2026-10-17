import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CrewRateRuleEntity,
  CrewRateType,
  CrewRole,
  CrewServiceType,
} from '../../@models/master-rules/crew-rate-rule.entity';
import {
  CreateCrewRateRuleDto,
  UpdateCrewRateRuleDto,
  CrewRateQueryFilterDto,
  CrewRateSnapshotQueryDto,
} from '../../@dto/master-rules/crew-rate.dto';

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

@Injectable()
export class CrewRatesService {
  constructor(
    @InjectRepository(CrewRateRuleEntity)
    private readonly ruleRepo: Repository<CrewRateRuleEntity>,
  ) {}

  async findAll(query: CrewRateQueryFilterDto): Promise<CrewRateRuleEntity[]> {
    const qb = this.ruleRepo.createQueryBuilder('c')
      .orderBy('c.service_type', 'ASC')
      .addOrderBy('c.role', 'ASC');

    if (query.role) {
      qb.andWhere('c.role = :role', { role: query.role });
    }

    if (query.serviceType) {
      qb.andWhere('c.service_type = :serviceType', { serviceType: query.serviceType });
    }

    if (query.rateType) {
      qb.andWhere('c.rate_type = :rateType', { rateType: query.rateType });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<CrewRateRuleEntity> {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Aturan tarif kompensasi kru dengan ID '${id}' tidak ditemukan.`);
    }
    return rule;
  }

  async create(dto: CreateCrewRateRuleDto): Promise<CrewRateRuleEntity> {
    const rule = this.ruleRepo.create({
      role: dto.role,
      serviceType: dto.serviceType,
      origin: (dto.origin || 'ALL').trim().toUpperCase(),
      destination: (dto.destination || 'ALL').trim().toUpperCase(),
      rateType: dto.rateType,
      mealAllowance: dto.mealAllowance,
      tripIncentive: dto.tripIncentive,
      fullSeatBonus: dto.fullSeatBonus !== undefined ? dto.fullSeatBonus : 0,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : undefined,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.ruleRepo.save(rule);
  }

  async update(id: string, dto: UpdateCrewRateRuleDto): Promise<CrewRateRuleEntity> {
    const rule = await this.findOne(id);
    Object.assign(rule, {
      ...dto,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : rule.effectiveFrom,
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : rule.effectiveUntil,
    });
    return this.ruleRepo.save(rule);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const rule = await this.findOne(id);
    await this.ruleRepo.remove(rule);
    return {
      success: true,
      message: 'Aturan tarif kompensasi kru berhasil dihapus.',
    };
  }

  // ==========================================
  // CREW RATE SNAPSHOTTING ENGINE
  // ==========================================

  /**
   * Mengambil snapshot kompensasi kru untuk pembuatan SPJ (AKAP atau Wisata).
   * Menghitung total UJ (Uang Makan + Premi) sesuai durasi hari (khusus Wisata).
   */
  async getRateSnapshot(dto: CrewRateSnapshotQueryDto): Promise<CrewRateSnapshotResult> {
    const travelDate = dto.travelDate || new Date().toISOString().split('T')[0];
    const durationDays = dto.durationDays && dto.durationDays > 0 ? dto.durationDays : 1;
    const origin = (dto.origin || 'ALL').trim().toUpperCase();
    const destination = (dto.destination || 'ALL').trim().toUpperCase();

    // 1. Coba cari spesifik origin-destination
    let rule = await this.ruleRepo
      .createQueryBuilder('r')
      .where('r.role = :role', { role: dto.role })
      .andWhere('r.service_type = :serviceType', { serviceType: dto.serviceType })
      .andWhere('r.origin = :origin', { origin })
      .andWhere('r.destination = :destination', { destination })
      .andWhere('r.is_active = true')
      .getOne();

    // 2. Fallback ke universal 'ALL' - 'ALL'
    if (!rule) {
      rule = await this.ruleRepo
        .createQueryBuilder('r')
        .where('r.role = :role', { role: dto.role })
        .andWhere('r.service_type = :serviceType', { serviceType: dto.serviceType })
        .andWhere('r.origin = :origin', { origin: 'ALL' })
        .andWhere('r.destination = :destination', { destination: 'ALL' })
        .andWhere('r.is_active = true')
        .getOne();
    }

    if (!rule) {
      throw new NotFoundException(
        `Tidak ditemukan aturan tarif kompensasi untuk kru '${dto.role}' pada layanan '${dto.serviceType}'.`,
      );
    }

    const dailyMeal = Number(rule.mealAllowance);
    const dailyIncentive = Number(rule.tripIncentive);
    const bonus = Number(rule.fullSeatBonus);

    let totalMeal = dailyMeal;
    let totalIncentive = dailyIncentive;
    let applicableBonus = bonus;

    if (rule.rateType === CrewRateType.PER_DAY) {
      totalMeal = dailyMeal * durationDays;
      totalIncentive = dailyIncentive * durationDays;
      applicableBonus = 0; // Wisata tidak menggunakan bonus full seat AKAP
    }

    return {
      ruleId: rule.id,
      role: rule.role,
      serviceType: rule.serviceType,
      rateType: rule.rateType,
      durationDays: rule.rateType === CrewRateType.PER_DAY ? durationDays : 1,
      dailyMealAllowance: dailyMeal,
      dailyTripIncentive: dailyIncentive,
      mealAllowance: totalMeal,
      tripIncentive: totalIncentive,
      fullSeatBonus: applicableBonus,
      totalStandardCompensation: totalMeal + totalIncentive,
      origin,
      destination,
      travelDate,
    };
  }
}
