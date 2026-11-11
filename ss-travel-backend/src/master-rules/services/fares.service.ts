import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FareSeasonEntity } from '../../@models/master-rules/fare-season.entity';
import { FareMatrixEntity } from '../../@models/master-rules/fare-matrix.entity';
import { SeatClassEntity } from '../../@models/fleet/seat-class.entity';
import { RouteEntity } from '../../@models/master-rules/route.entity';
import {
  CreateFareSeasonDto,
  UpdateFareSeasonDto,
  CreateFareMatrixDto,
  UpdateFareMatrixDto,
  FareCalculationQueryDto,
} from '../../@dto/master-rules/fare.dto';

export interface CalculatedFareResult {
  amount: number;
  seasonName: string;
  seasonCode: string;
  isSeasonal: boolean;
  origin: string;
  destination: string;
  travelDate: string;
  routeId?: string;
  routeName?: string;
  routeCode?: string;
  seatClass: {
    id: string;
    code: string;
    name: string;
  };
}

@Injectable()
export class FaresService {
  constructor(
    @InjectRepository(FareSeasonEntity)
    private readonly seasonRepo: Repository<FareSeasonEntity>,
    @InjectRepository(FareMatrixEntity)
    private readonly matrixRepo: Repository<FareMatrixEntity>,
    @InjectRepository(SeatClassEntity)
    private readonly seatClassRepo: Repository<SeatClassEntity>,
    @InjectRepository(RouteEntity)
    private readonly routeRepo: Repository<RouteEntity>,
  ) {}

  // ==========================================
  // FARE SEASONS (Kalender Musim Tarif)
  // ==========================================

  async findAllSeasons(): Promise<FareSeasonEntity[]> {
    return this.seasonRepo.find({
      order: { startDate: 'ASC' },
      relations: ['matrices', 'matrices.route'],
    });
  }

  async findOneSeason(id: string): Promise<FareSeasonEntity> {
    const season = await this.seasonRepo.findOne({
      where: { id },
      relations: ['matrices', 'matrices.seatClass', 'matrices.route'],
    });
    if (!season) {
      throw new NotFoundException(`Musim tarif dengan ID '${id}' tidak ditemukan.`);
    }
    return season;
  }

  async createSeason(dto: CreateFareSeasonDto): Promise<FareSeasonEntity> {
    const existing = await this.seasonRepo.findOne({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(
        `Musim tarif dengan kode '${dto.code}' sudah terdaftar.`,
      );
    }

    if (new Date(dto.startDate) > new Date(dto.endDate)) {
      throw new BadRequestException(
        'Tanggal mulai (startDate) tidak boleh lebih besar dari tanggal selesai (endDate).',
      );
    }

    const season = this.seasonRepo.create({
      code: dto.code.trim().toUpperCase(),
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      description: dto.description,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.seasonRepo.save(season);
  }

  async updateSeason(id: string, dto: UpdateFareSeasonDto): Promise<FareSeasonEntity> {
    const season = await this.findOneSeason(id);

    const startDate = dto.startDate || season.startDate;
    const endDate = dto.endDate || season.endDate;

    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException(
        'Tanggal mulai (startDate) tidak boleh lebih besar dari tanggal selesai (endDate).',
      );
    }

    Object.assign(season, {
      ...dto,
      startDate,
      endDate,
    });

    return this.seasonRepo.save(season);
  }

  async deleteSeason(id: string): Promise<{ success: boolean; message: string }> {
    const season = await this.findOneSeason(id);
    if (season.code === 'REGULER') {
      throw new BadRequestException('Musim REGULER adalah sistem default dan tidak dapat dihapus.');
    }
    await this.seasonRepo.remove(season);
    return {
      success: true,
      message: `Musim tarif '${season.name}' berhasil dihapus.`,
    };
  }

  // ==========================================
  // FARE MATRIX (Matriks Harga Tiket Rute & Kelas)
  // ==========================================

  async findAllMatrix(seasonId?: string): Promise<FareMatrixEntity[]> {
    const where: any = {};
    if (seasonId) {
      where.fareSeasonId = seasonId;
    }

    return this.matrixRepo.find({
      where,
      relations: ['fareSeason', 'seatClass', 'route'],
      order: {
        origin: 'ASC',
        destination: 'ASC',
        amount: 'DESC',
      },
    });
  }

  async findAllMatrices(seasonId?: string): Promise<FareMatrixEntity[]> {
    return this.findAllMatrix(seasonId);
  }

  async findOneMatrix(id: string): Promise<FareMatrixEntity> {
    const matrix = await this.matrixRepo.findOne({
      where: { id },
      relations: ['fareSeason', 'seatClass', 'route'],
    });
    if (!matrix) {
      throw new NotFoundException(`Matriks tarif dengan ID '${id}' tidak ditemukan.`);
    }
    return matrix;
  }

  async createMatrix(dto: CreateFareMatrixDto): Promise<FareMatrixEntity> {
    // Validate season exists
    const season = await this.seasonRepo.findOne({
      where: { id: dto.fareSeasonId },
    });
    if (!season) {
      throw new NotFoundException(`Musim tarif tidak ditemukan.`);
    }

    // Validate seat class exists
    const seatClass = await this.seatClassRepo.findOne({
      where: { id: dto.seatClassId },
    });
    if (!seatClass) {
      throw new NotFoundException(`Master kelas kursi tidak ditemukan.`);
    }

    let origin = dto.origin ? dto.origin.trim().toUpperCase() : '';
    let destination = dto.destination ? dto.destination.trim().toUpperCase() : '';

    if (dto.routeId) {
      const route = await this.routeRepo.findOne({ where: { id: dto.routeId } });
      if (!route) {
        throw new NotFoundException(`Master rute trayek dengan ID '${dto.routeId}' tidak ditemukan.`);
      }
      if (!origin) origin = route.origin;
      if (!destination) destination = route.destination;
    }

    if (!origin || !destination) {
      throw new BadRequestException('Kota Asal dan Kota Tujuan harus ditentukan atau dipilih melalui Master Rute.');
    }

    const matrix = this.matrixRepo.create({
      fareSeasonId: dto.fareSeasonId,
      routeId: dto.routeId || undefined,
      origin,
      destination,
      seatClassId: dto.seatClassId,
      amount: dto.amount,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : undefined,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.matrixRepo.save(matrix);
  }

  async updateMatrix(id: string, dto: UpdateFareMatrixDto): Promise<FareMatrixEntity> {
    const matrix = await this.findOneMatrix(id);

    if (dto.routeId) {
      const route = await this.routeRepo.findOne({ where: { id: dto.routeId } });
      if (!route) {
        throw new NotFoundException(`Master rute trayek tidak ditemukan.`);
      }
    }

    const { fareSeasonId: _seasonId, seatClassId: _classId, ...allowedUpdates } = dto;

    Object.assign(matrix, {
      ...allowedUpdates,
      origin: dto.origin ? dto.origin.trim().toUpperCase() : matrix.origin,
      destination: dto.destination ? dto.destination.trim().toUpperCase() : matrix.destination,
      routeId: dto.routeId !== undefined ? (dto.routeId || null) : matrix.routeId,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : matrix.effectiveFrom,
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : matrix.effectiveUntil,
    });
    return this.matrixRepo.save(matrix);
  }

  async deleteMatrix(id: string): Promise<{ success: boolean; message: string }> {
    const matrix = await this.findOneMatrix(id);
    await this.matrixRepo.remove(matrix);
    return {
      success: true,
      message: 'Matriks tarif berhasil dihapus.',
    };
  }

  // ==========================================
  // DYNAMIC PRICING CALCULATION CORE ENGINE
  // ==========================================

  /**
   * Menghitung tarif tiket dinamis:
   * Harga Tiket = f(Route/Rute Asal-Tujuan, Musim Tarif / Tuslah, seat_class_id)
   * Prioritas 1: Pencarian berbasis routeId spesifik pada musim aktif
   * Prioritas 2: Pencarian berbasis origin-destination pada musim aktif
   * Prioritas 3: Fallback ke musim REGULER (routeId / origin-destination)
   */
  async calculateFare(dto: FareCalculationQueryDto): Promise<CalculatedFareResult> {
    let origin = dto.origin ? dto.origin.trim().toUpperCase() : '';
    let destination = dto.destination ? dto.destination.trim().toUpperCase() : '';
    let matchedRoute: RouteEntity | null = null;

    if (dto.routeId) {
      matchedRoute = await this.routeRepo.findOne({ where: { id: dto.routeId } });
      if (matchedRoute) {
        if (!origin) origin = matchedRoute.origin;
        if (!destination) destination = matchedRoute.destination;
      }
    }

    if (!origin || !destination) {
      throw new BadRequestException('Kota Asal dan Tujuan harus ditentukan atau dipilih melalui Master Rute.');
    }

    const travelDate = dto.travelDate || new Date().toISOString().split('T')[0];

    // 1. Validasi Seat Class
    const seatClass = await this.seatClassRepo.findOne({
      where: { id: dto.seatClassId },
    });
    if (!seatClass) {
      throw new NotFoundException('Master kelas kursi tidak ditemukan.');
    }

    // 2. Cari musim aktif pada tanggal keberangkatan (Prioritas musim non-REGULER terlebih dahulu)
    const activeSeasons = await this.seasonRepo
      .createQueryBuilder('s')
      .where('s.is_active = true')
      .andWhere(':travelDate >= s.start_date AND :travelDate <= s.end_date', { travelDate })
      .orderBy("CASE WHEN s.code = 'REGULER' THEN 2 ELSE 1 END", 'ASC')
      .getMany();

    // 3. Cek apakah ada matriks tarif pada musim aktif yang cocok
    for (const season of activeSeasons) {
      // 3.a Prioritas Route ID spesifik
      let match: FareMatrixEntity | null = null;
      if (dto.routeId) {
        match = await this.matrixRepo.findOne({
          where: {
            fareSeasonId: season.id,
            routeId: dto.routeId,
            seatClassId: dto.seatClassId,
            isActive: true,
          },
          relations: ['seatClass', 'route'],
        });
      }

      // 3.b Fallback ke Origin & Destination
      if (!match) {
        match = await this.matrixRepo.findOne({
          where: {
            fareSeasonId: season.id,
            origin,
            destination,
            seatClassId: dto.seatClassId,
            isActive: true,
          },
          relations: ['seatClass', 'route'],
        });
      }

      if (match) {
        return {
          amount: Number(match.amount),
          seasonName: season.name,
          seasonCode: season.code,
          isSeasonal: season.code !== 'REGULER',
          origin,
          destination,
          travelDate,
          routeId: match.routeId || matchedRoute?.id,
          routeName: match.route?.name || matchedRoute?.name,
          routeCode: match.route?.code || matchedRoute?.code,
          seatClass: {
            id: seatClass.id,
            code: seatClass.code,
            name: seatClass.name,
          },
        };
      }
    }

    // 4. Jika musim musiman tidak memiliki spesifik rute, coba fallback ke musim REGULER
    const regulerSeason = await this.seasonRepo.findOne({
      where: { code: 'REGULER', isActive: true },
    });

    if (regulerSeason) {
      let regulerMatch: FareMatrixEntity | null = null;

      if (dto.routeId) {
        regulerMatch = await this.matrixRepo.findOne({
          where: {
            fareSeasonId: regulerSeason.id,
            routeId: dto.routeId,
            seatClassId: dto.seatClassId,
            isActive: true,
          },
          relations: ['seatClass', 'route'],
        });
      }

      if (!regulerMatch) {
        regulerMatch = await this.matrixRepo.findOne({
          where: {
            fareSeasonId: regulerSeason.id,
            origin,
            destination,
            seatClassId: dto.seatClassId,
            isActive: true,
          },
          relations: ['seatClass', 'route'],
        });
      }

      if (regulerMatch) {
        return {
          amount: Number(regulerMatch.amount),
          seasonName: regulerSeason.name,
          seasonCode: regulerSeason.code,
          isSeasonal: false,
          origin,
          destination,
          travelDate,
          routeId: regulerMatch.routeId || matchedRoute?.id,
          routeName: regulerMatch.route?.name || matchedRoute?.name,
          routeCode: regulerMatch.route?.code || matchedRoute?.code,
          seatClass: {
            id: seatClass.id,
            code: seatClass.code,
            name: seatClass.name,
          },
        };
      }
    }

    throw new NotFoundException(
      `Tarif tiket tidak ditemukan untuk rute ${origin} -> ${destination} pada kelas '${seatClass.name}' untuk tanggal ${travelDate}.`,
    );
  }
}
