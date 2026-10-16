import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FiscalYearEntity,
  FiscalYearStatus,
} from '../../@models/finance/fiscal-year.entity';
import {
  FiscalPeriodEntity,
  FiscalPeriodStatus,
} from '../../@models/finance/fiscal-period.entity';
import {
  CreateFiscalYearDto,
  UpdateFiscalPeriodStatusDto,
  FiscalPeriodQueryFilterDto,
} from '../../@dto/finance/fiscal-period.dto';

@Injectable()
export class FiscalPeriodsService {
  constructor(
    @InjectRepository(FiscalYearEntity)
    private readonly yearRepo: Repository<FiscalYearEntity>,
    @InjectRepository(FiscalPeriodEntity)
    private readonly periodRepo: Repository<FiscalPeriodEntity>,
  ) {}

  async createFiscalYear(dto: CreateFiscalYearDto): Promise<FiscalYearEntity> {
    const existing = await this.yearRepo.findOne({
      where: { year: dto.year },
    });
    if (existing) {
      throw new ConflictException(`Tahun fiskal '${dto.year}' sudah terdaftar.`);
    }

    const fiscalYear = this.yearRepo.create({
      year: dto.year,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: FiscalYearStatus.OPEN,
      companyId: dto.companyId,
      isActive: true,
    });

    const savedYear = await this.yearRepo.save(fiscalYear);

    // Auto-generate 12 standard monthly periods
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    const isLeapYear = (dto.year % 4 === 0 && dto.year % 100 !== 0) || dto.year % 400 === 0;
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    for (let i = 0; i < 12; i++) {
      const periodNo = i + 1;
      const monthStr = String(periodNo).padStart(2, '0');
      const start = `${dto.year}-${monthStr}-01`;
      const end = `${dto.year}-${monthStr}-${String(daysInMonth[i]).padStart(2, '0')}`;
      const name = `${monthNames[i]} ${dto.year}`;

      const period = this.periodRepo.create({
        fiscalYearId: savedYear.id,
        periodNo,
        name,
        startDate: start,
        endDate: end,
        status: FiscalPeriodStatus.OPEN,
        isActive: true,
      });

      await this.periodRepo.save(period);
    }

    return await this.findOneFiscalYear(savedYear.id);
  }

  async findAllFiscalYears(): Promise<FiscalYearEntity[]> {
    return await this.yearRepo.find({
      order: { year: 'DESC' },
      relations: ['periods'],
    });
  }

  async findOneFiscalYear(id: string): Promise<FiscalYearEntity> {
    const year = await this.yearRepo.findOne({
      where: { id },
      relations: ['periods'],
    });

    if (!year) {
      throw new NotFoundException(`Tahun fiskal dengan ID '${id}' tidak ditemukan.`);
    }

    if (year.periods) {
      year.periods.sort((a, b) => a.periodNo - b.periodNo);
    }

    return year;
  }

  async findAllPeriods(filter: FiscalPeriodQueryFilterDto): Promise<FiscalPeriodEntity[]> {
    const qb = this.periodRepo
      .createQueryBuilder('period')
      .leftJoinAndSelect('period.fiscalYear', 'fiscalYear')
      .leftJoinAndSelect('period.closedByUser', 'closedByUser')
      .orderBy('fiscalYear.year', 'DESC')
      .addOrderBy('period.periodNo', 'ASC');

    if (filter.year) {
      qb.andWhere('fiscalYear.year = :year', { year: filter.year });
    }

    if (filter.status) {
      qb.andWhere('period.status = :status', { status: filter.status });
    }

    return await qb.getMany();
  }

  async findOnePeriod(id: string): Promise<FiscalPeriodEntity> {
    const period = await this.periodRepo.findOne({
      where: { id },
      relations: ['fiscalYear', 'closedByUser'],
    });

    if (!period) {
      throw new NotFoundException(`Periode fiskal dengan ID '${id}' tidak ditemukan.`);
    }

    return period;
  }

  async updatePeriodStatus(
    id: string,
    dto: UpdateFiscalPeriodStatusDto,
    userId?: string,
  ): Promise<FiscalPeriodEntity> {
    const period = await this.findOnePeriod(id);

    if (dto.status === FiscalPeriodStatus.CLOSED) {
      period.status = FiscalPeriodStatus.CLOSED;
      period.closedAt = new Date();
      period.closedBy = userId;
      period.closeReason = dto.reason;
    } else if (dto.status === FiscalPeriodStatus.REOPENED) {
      if (!dto.reason) {
        throw new BadRequestException('Alasan pembukaan kembali periode wajib disertakan.');
      }
      period.status = FiscalPeriodStatus.REOPENED;
      period.closeReason = `[REOPENED] ${dto.reason}`;
    } else {
      period.status = dto.status;
      if (dto.reason) {
        period.closeReason = dto.reason;
      }
    }

    return await this.periodRepo.save(period);
  }

  /**
   * Helper method to validate if a date falls into an OPEN (or REOPENED) fiscal period.
   * Throws BadRequestException if period is closed or not found.
   */
  async findOpenPeriodForDate(dateInput: string | Date): Promise<FiscalPeriodEntity> {
    const dateStr =
      dateInput instanceof Date
        ? dateInput.toISOString().slice(0, 10)
        : String(dateInput).slice(0, 10);

    const period = await this.periodRepo
      .createQueryBuilder('period')
      .leftJoinAndSelect('period.fiscalYear', 'fiscalYear')
      .where(':dateStr >= period.startDate AND :dateStr <= period.endDate', {
        dateStr,
      })
      .andWhere('period.isActive = true')
      .getOne();

    if (!period) {
      throw new NotFoundException(
        `Tidak ditemukan kalender periode fiskal untuk tanggal transaksi '${dateStr}'.`,
      );
    }

    if (period.status === FiscalPeriodStatus.CLOSED) {
      throw new BadRequestException(
        `Periode fiskal '${period.name}' telah DITUTUP (CLOSED). Posting transaksi ditolak.`,
      );
    }

    return period;
  }
}
