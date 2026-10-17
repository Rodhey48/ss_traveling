import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { AgentEntity, AgentType } from '../../@models/master-rules/agent.entity';
import {
  AgentCommissionRuleEntity,
  CommissionRuleType,
} from '../../@models/master-rules/agent-commission-rule.entity';
import { SeatClassEntity } from '../../@models/fleet/seat-class.entity';
import {
  CreateAgentDto,
  UpdateAgentDto,
  AgentQueryFilterDto,
  CreateAgentCommissionRuleDto,
  UpdateAgentCommissionRuleDto,
  CalculateCommissionQueryDto,
} from '../../@dto/master-rules/agent.dto';

export interface CommissionCalculationResult {
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

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepo: Repository<AgentEntity>,
    @InjectRepository(AgentCommissionRuleEntity)
    private readonly commissionRuleRepo: Repository<AgentCommissionRuleEntity>,
    @InjectRepository(SeatClassEntity)
    private readonly seatClassRepo: Repository<SeatClassEntity>,
  ) {}

  // ==========================================
  // AGENTS MANAGEMENT
  // ==========================================

  async findAll(query: AgentQueryFilterDto): Promise<AgentEntity[]> {
    const qb = this.agentRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.commissionRules', 'rules')
      .leftJoinAndSelect('rules.seatClass', 'sc')
      .orderBy('a.agent_type', 'ASC')
      .addOrderBy('a.city', 'ASC')
      .addOrderBy('a.name', 'ASC');

    if (query.agentType) {
      qb.andWhere('a.agent_type = :agentType', { agentType: query.agentType });
    }

    if (query.city) {
      qb.andWhere('a.city = :city', { city: query.city.toUpperCase() });
    }

    if (query.isActive !== undefined && query.isActive !== '') {
      const activeBool = String(query.isActive) === 'true';
      qb.andWhere('a.is_active = :isActive', { isActive: activeBool });
    }

    if (query.search) {
      qb.andWhere(
        '(a.name ILIKE :search OR a.code ILIKE :search OR a.phone ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    return qb.getMany();
  }

  /**
   * Smart Filter Arah Rute SPJ (Blueprint Addendum v1.7):
   * - Keberangkatan (Jakarta/Tangerang -> Yogya): Hanya tampil Agen Kota Jakarta/Tangerang + Agen Online/OTA.
   * - Kepulangan (Yogya -> Jakarta/Tangerang): Hanya tampil Agen Kota Yogyakarta + Agen Online/OTA.
   */
  async findAgentsByRoute(origin: string, destination?: string): Promise<AgentEntity[]> {
    const orig = (origin || '').trim().toUpperCase();
    const dest = (destination || '').trim().toUpperCase();

    const qb = this.agentRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.commissionRules', 'rules')
      .where('a.is_active = true');

    if (orig.includes('JAKARTA') || orig.includes('TANGERANG')) {
      // Leg Keberangkatan Barat -> Timur
      qb.andWhere("(a.city IN ('JAKARTA', 'TANGERANG', 'ALL') OR a.agent_type = 'ONLINE_OTA')");
    } else if (orig.includes('YOGYAKARTA') || orig.includes('JOGJA')) {
      // Leg Kepulangan Timur -> Barat
      qb.andWhere("(a.city IN ('YOGYAKARTA', 'ALL') OR a.agent_type = 'ONLINE_OTA')");
    }

    return qb
      .orderBy("CASE WHEN a.agent_type = 'ONLINE_OTA' THEN 2 ELSE 1 END", 'ASC')
      .addOrderBy('a.name', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<AgentEntity> {
    const agent = await this.agentRepo.findOne({
      where: { id },
      relations: ['commissionRules', 'commissionRules.seatClass'],
    });
    if (!agent) {
      throw new NotFoundException(`Mitra agen dengan ID '${id}' tidak ditemukan.`);
    }
    return agent;
  }

  async create(dto: CreateAgentDto): Promise<AgentEntity> {
    const existing = await this.agentRepo.findOne({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Agen dengan kode '${dto.code}' sudah terdaftar.`);
    }

    const agent = this.agentRepo.create({
      ...dto,
      code: dto.code.trim().toUpperCase(),
      city: dto.city.trim().toUpperCase(),
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.agentRepo.save(agent);
  }

  async update(id: string, dto: UpdateAgentDto): Promise<AgentEntity> {
    const agent = await this.findOne(id);
    Object.assign(agent, {
      ...dto,
      city: dto.city ? dto.city.trim().toUpperCase() : agent.city,
    });
    return this.agentRepo.save(agent);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const agent = await this.findOne(id);
    await this.agentRepo.remove(agent);
    return {
      success: true,
      message: `Agen '${agent.name}' berhasil dihapus.`,
    };
  }

  // ==========================================
  // AGENT COMMISSION RULES
  // ==========================================

  async findRulesByAgent(agentId: string): Promise<AgentCommissionRuleEntity[]> {
    await this.findOne(agentId); // validate agent
    return this.commissionRuleRepo.find({
      where: { agentId },
      relations: ['seatClass'],
      order: { createdAt: 'ASC' },
    });
  }

  async createCommissionRule(
    agentId: string,
    dto: CreateAgentCommissionRuleDto,
  ): Promise<AgentCommissionRuleEntity> {
    const agent = await this.findOne(agentId);

    if (dto.seatClassId) {
      const seatClass = await this.seatClassRepo.findOne({
        where: { id: dto.seatClassId },
      });
      if (!seatClass) {
        throw new NotFoundException('Master kelas kursi tidak ditemukan.');
      }
    }

    const rule = this.commissionRuleRepo.create({
      agentId: agent.id,
      seatClassId: dto.seatClassId || undefined,
      ruleType: dto.ruleType,
      commissionValue: dto.commissionValue,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : undefined,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.commissionRuleRepo.save(rule);
  }

  async updateCommissionRule(
    ruleId: string,
    dto: UpdateAgentCommissionRuleDto,
  ): Promise<AgentCommissionRuleEntity> {
    const rule = await this.commissionRuleRepo.findOne({
      where: { id: ruleId },
      relations: ['seatClass'],
    });
    if (!rule) {
      throw new NotFoundException(`Aturan komisi dengan ID '${ruleId}' tidak ditemukan.`);
    }

    Object.assign(rule, {
      ...dto,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : rule.effectiveFrom,
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : rule.effectiveUntil,
    });

    return this.commissionRuleRepo.save(rule);
  }

  async deleteCommissionRule(
    ruleId: string,
  ): Promise<{ success: boolean; message: string }> {
    const rule = await this.commissionRuleRepo.findOne({ where: { id: ruleId } });
    if (!rule) {
      throw new NotFoundException(`Aturan komisi dengan ID '${ruleId}' tidak ditemukan.`);
    }
    await this.commissionRuleRepo.remove(rule);
    return {
      success: true,
      message: 'Aturan komisi berhasil dihapus.',
    };
  }

  // ==========================================
  // COMMISSION CALCULATION CORE ENGINE
  // ==========================================

  async calculateCommission(
    dto: CalculateCommissionQueryDto,
  ): Promise<CommissionCalculationResult> {
    const agent = await this.findOne(dto.agentId);

    let seatClassName = 'Semua Kelas';
    if (dto.seatClassId) {
      const seatClass = await this.seatClassRepo.findOne({
        where: { id: dto.seatClassId },
      });
      if (seatClass) {
        seatClassName = seatClass.name;
      }
    }

    // 1. Cek aturan spesifik untuk seatClassId
    let activeRule: AgentCommissionRuleEntity | null = null;
    if (dto.seatClassId) {
      activeRule = await this.commissionRuleRepo.findOne({
        where: {
          agentId: agent.id,
          seatClassId: dto.seatClassId,
          isActive: true,
        },
      });
    }

    // 2. Jika tidak ada aturan spesifik kelas, cari aturan universal (seatClassId IS NULL)
    if (!activeRule) {
      activeRule = await this.commissionRuleRepo
        .createQueryBuilder('r')
        .where('r.agent_id = :agentId', { agentId: agent.id })
        .andWhere('r.seat_class_id IS NULL')
        .andWhere('r.is_active = true')
        .getOne();
    }

    if (!activeRule) {
      throw new NotFoundException(
        `Tidak ditemukan aturan komisi aktif untuk agen '${agent.name}' pada kelas tersebut.`,
      );
    }

    let calculatedCommission = 0;
    const commVal = Number(activeRule.commissionValue);

    if (activeRule.ruleType === CommissionRuleType.FLAT_PER_TICKET) {
      calculatedCommission = commVal;
    } else if (activeRule.ruleType === CommissionRuleType.PERCENTAGE) {
      calculatedCommission = (dto.ticketPrice * commVal) / 100;
    }

    const netPayoutToCompany = dto.ticketPrice - calculatedCommission;

    return {
      agentId: agent.id,
      agentName: agent.name,
      agentType: agent.agentType,
      seatClassId: dto.seatClassId,
      seatClassName,
      ruleType: activeRule.ruleType,
      commissionRate: commVal,
      ticketPrice: dto.ticketPrice,
      calculatedCommission,
      netPayoutToCompany,
    };
  }
}
