import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CompanyEntity,
  BusinessUnitEntity,
  CostCenterEntity,
  ProfitCenterEntity,
} from '@models';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateBusinessUnitDto,
  UpdateBusinessUnitDto,
  CreateCostCenterDto,
  UpdateCostCenterDto,
  CreateProfitCenterDto,
  UpdateProfitCenterDto,
} from '../../@dto/organization/organization.dto';
import { ResponseInterface } from '@interfaces';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(CompanyEntity)
    private companyRepo: Repository<CompanyEntity>,
    @InjectRepository(BusinessUnitEntity)
    private buRepo: Repository<BusinessUnitEntity>,
    @InjectRepository(CostCenterEntity)
    private ccRepo: Repository<CostCenterEntity>,
    @InjectRepository(ProfitCenterEntity)
    private pcRepo: Repository<ProfitCenterEntity>,
  ) {}

  // ==================== COMPANY ====================
  async getCompanyProfile(): Promise<ResponseInterface> {
    const company = await this.companyRepo.findOne({
      where: { code: 'SST' },
    });
    if (!company) {
      throw new NotFoundException('Data perusahaan belum dikonfigurasi');
    }
    return {
      status: true,
      message: 'Profil perusahaan berhasil dimuat',
      data: company,
    };
  }

  async updateCompanyProfile(
    id: string,
    dto: UpdateCompanyDto,
  ): Promise<ResponseInterface> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('Perusahaan tidak ditemukan');
    }
    Object.assign(company, dto);
    const updated = await this.companyRepo.save(company);
    return {
      status: true,
      message: 'Profil perusahaan berhasil diperbarui',
      data: updated,
    };
  }

  // ==================== BUSINESS UNITS ====================
  async findAllBusinessUnits(): Promise<ResponseInterface> {
    const list = await this.buRepo.find({
      order: { code: 'ASC' },
      relations: ['company'],
    });
    return {
      status: true,
      message: 'Daftar unit bisnis berhasil dimuat',
      data: list,
    };
  }

  async findOneBusinessUnit(id: string): Promise<ResponseInterface> {
    const bu = await this.buRepo.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!bu) {
      throw new NotFoundException('Unit bisnis tidak ditemukan');
    }
    return {
      status: true,
      message: 'Detail unit bisnis berhasil dimuat',
      data: bu,
    };
  }

  async createBusinessUnit(
    dto: CreateBusinessUnitDto,
  ): Promise<ResponseInterface> {
    const existing = await this.buRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Unit bisnis dengan kode '${dto.code}' sudah terdaftar`);
    }

    if (!dto.companyId) {
      const defaultComp = await this.companyRepo.findOne({
        where: { code: 'SST' },
      });
      dto.companyId = defaultComp?.id;
    }

    const bu = this.buRepo.create(dto);
    const saved = await this.buRepo.save(bu);
    return {
      status: true,
      message: 'Unit bisnis berhasil dibuat',
      data: saved,
    };
  }

  async updateBusinessUnit(
    id: string,
    dto: UpdateBusinessUnitDto,
  ): Promise<ResponseInterface> {
    const bu = await this.buRepo.findOne({ where: { id } });
    if (!bu) {
      throw new NotFoundException('Unit bisnis tidak ditemukan');
    }

    if (dto.code && dto.code !== bu.code) {
      const existing = await this.buRepo.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Kode '${dto.code}' sudah digunakan`);
      }
    }

    Object.assign(bu, dto);
    const updated = await this.buRepo.save(bu);
    return {
      status: true,
      message: 'Unit bisnis berhasil diperbarui',
      data: updated,
    };
  }

  async removeBusinessUnit(id: string): Promise<ResponseInterface> {
    const bu = await this.buRepo.findOne({ where: { id } });
    if (!bu) {
      throw new NotFoundException('Unit bisnis tidak ditemukan');
    }
    await this.buRepo.remove(bu);
    return {
      status: true,
      message: 'Unit bisnis berhasil dihapus',
      data: null,
    };
  }

  // ==================== COST CENTERS ====================
  async findAllCostCenters(): Promise<ResponseInterface> {
    const list = await this.ccRepo.find({
      order: { code: 'ASC' },
      relations: ['parent', 'children'],
    });
    return {
      status: true,
      message: 'Daftar cost center berhasil dimuat',
      data: list,
    };
  }

  async findOneCostCenter(id: string): Promise<ResponseInterface> {
    const cc = await this.ccRepo.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!cc) {
      throw new NotFoundException('Cost center tidak ditemukan');
    }
    return {
      status: true,
      message: 'Detail cost center berhasil dimuat',
      data: cc,
    };
  }

  async createCostCenter(dto: CreateCostCenterDto): Promise<ResponseInterface> {
    const existing = await this.ccRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Cost center dengan kode '${dto.code}' sudah terdaftar`);
    }

    if (!dto.companyId) {
      const defaultComp = await this.companyRepo.findOne({
        where: { code: 'SST' },
      });
      dto.companyId = defaultComp?.id;
    }

    const cc = this.ccRepo.create(dto);
    const saved = await this.ccRepo.save(cc);
    return {
      status: true,
      message: 'Cost center berhasil dibuat',
      data: saved,
    };
  }

  async updateCostCenter(
    id: string,
    dto: UpdateCostCenterDto,
  ): Promise<ResponseInterface> {
    const cc = await this.ccRepo.findOne({ where: { id } });
    if (!cc) {
      throw new NotFoundException('Cost center tidak ditemukan');
    }

    if (dto.code && dto.code !== cc.code) {
      const existing = await this.ccRepo.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Kode '${dto.code}' sudah digunakan`);
      }
    }

    Object.assign(cc, dto);
    const updated = await this.ccRepo.save(cc);
    return {
      status: true,
      message: 'Cost center berhasil diperbarui',
      data: updated,
    };
  }

  async removeCostCenter(id: string): Promise<ResponseInterface> {
    const cc = await this.ccRepo.findOne({ where: { id } });
    if (!cc) {
      throw new NotFoundException('Cost center tidak ditemukan');
    }
    await this.ccRepo.remove(cc);
    return {
      status: true,
      message: 'Cost center berhasil dihapus',
      data: null,
    };
  }

  // ==================== PROFIT CENTERS ====================
  async findAllProfitCenters(): Promise<ResponseInterface> {
    const list = await this.pcRepo.find({
      order: { code: 'ASC' },
      relations: ['businessUnit'],
    });
    return {
      status: true,
      message: 'Daftar profit center berhasil dimuat',
      data: list,
    };
  }

  async findOneProfitCenter(id: string): Promise<ResponseInterface> {
    const pc = await this.pcRepo.findOne({
      where: { id },
      relations: ['businessUnit'],
    });
    if (!pc) {
      throw new NotFoundException('Profit center tidak ditemukan');
    }
    return {
      status: true,
      message: 'Detail profit center berhasil dimuat',
      data: pc,
    };
  }

  async createProfitCenter(
    dto: CreateProfitCenterDto,
  ): Promise<ResponseInterface> {
    const existing = await this.pcRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Profit center dengan kode '${dto.code}' sudah terdaftar`);
    }

    if (!dto.companyId) {
      const defaultComp = await this.companyRepo.findOne({
        where: { code: 'SST' },
      });
      dto.companyId = defaultComp?.id;
    }

    const pc = this.pcRepo.create(dto);
    const saved = await this.pcRepo.save(pc);
    return {
      status: true,
      message: 'Profit center berhasil dibuat',
      data: saved,
    };
  }

  async updateProfitCenter(
    id: string,
    dto: UpdateProfitCenterDto,
  ): Promise<ResponseInterface> {
    const pc = await this.pcRepo.findOne({ where: { id } });
    if (!pc) {
      throw new NotFoundException('Profit center tidak ditemukan');
    }

    if (dto.code && dto.code !== pc.code) {
      const existing = await this.pcRepo.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Kode '${dto.code}' sudah digunakan`);
      }
    }

    Object.assign(pc, dto);
    const updated = await this.pcRepo.save(pc);
    return {
      status: true,
      message: 'Profit center berhasil diperbarui',
      data: updated,
    };
  }

  async removeProfitCenter(id: string): Promise<ResponseInterface> {
    const pc = await this.pcRepo.findOne({ where: { id } });
    if (!pc) {
      throw new NotFoundException('Profit center tidak ditemukan');
    }
    await this.pcRepo.remove(pc);
    return {
      status: true,
      message: 'Profit center berhasil dihapus',
      data: null,
    };
  }
}
