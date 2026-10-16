import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  VehicleEntity,
  VehicleSeatClassEntity,
  SeatClassEntity,
  VehicleImageEntity,
  CompanyEntity,
} from '@models';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleQueryFilterDto,
  CreateVehicleSeatClassDto,
  CreateSeatClassDto,
  UpdateSeatClassDto,
  CreateVehicleImageDto,
} from '../../@dto/vehicle/vehicle.dto';
import { ResponseInterface } from '@interfaces';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    @InjectRepository(VehicleEntity)
    private vehicleRepo: Repository<VehicleEntity>,
    @InjectRepository(VehicleSeatClassEntity)
    private seatClassRepo: Repository<VehicleSeatClassEntity>,
    @InjectRepository(SeatClassEntity)
    private seatClassMasterRepo: Repository<SeatClassEntity>,
    @InjectRepository(VehicleImageEntity)
    private vehicleImageRepo: Repository<VehicleImageEntity>,
    @InjectRepository(CompanyEntity)
    private companyRepo: Repository<CompanyEntity>,
    private dataSource: DataSource,
  ) {}

  // ==================== MASTER SEAT CLASSES (TIPE KELAS KURSI) ====================
  async findAllSeatClasses(): Promise<ResponseInterface> {
    const list = await this.seatClassMasterRepo.find({
      order: { code: 'ASC' },
      relations: ['company'],
    });

    return {
      status: true,
      message: 'Daftar master kelas kursi berhasil dimuat',
      data: list,
    };
  }

  async findOneSeatClass(id: string): Promise<ResponseInterface> {
    const sc = await this.seatClassMasterRepo.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!sc) {
      throw new NotFoundException('Master kelas kursi tidak ditemukan');
    }

    return {
      status: true,
      message: 'Detail kelas kursi berhasil dimuat',
      data: sc,
    };
  }

  async createSeatClass(dto: CreateSeatClassDto): Promise<ResponseInterface> {
    const existing = await this.seatClassMasterRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Master kelas kursi dengan kode '${dto.code}' sudah terdaftar`,
      );
    }

    if (!dto.companyId) {
      const defaultComp = await this.companyRepo.findOne({
        where: { code: 'SST' },
      });
      dto.companyId = defaultComp?.id;
    }

    const item = this.seatClassMasterRepo.create(dto);
    const saved = await this.seatClassMasterRepo.save(item);

    return {
      status: true,
      message: 'Master kelas kursi berhasil ditambahkan',
      data: saved,
    };
  }

  async updateSeatClass(
    id: string,
    dto: UpdateSeatClassDto,
  ): Promise<ResponseInterface> {
    const item = await this.seatClassMasterRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Master kelas kursi tidak ditemukan');
    }

    if (dto.code && dto.code !== item.code) {
      const existing = await this.seatClassMasterRepo.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(`Kode '${dto.code}' sudah digunakan`);
      }
    }

    Object.assign(item, dto);
    const updated = await this.seatClassMasterRepo.save(item);

    return {
      status: true,
      message: 'Master kelas kursi berhasil diperbarui',
      data: updated,
    };
  }

  async removeSeatClassMaster(id: string): Promise<ResponseInterface> {
    const item = await this.seatClassMasterRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Master kelas kursi tidak ditemukan');
    }

    // Pastikan tidak ada armada yang sedang memakai kelas kursi ini
    const usedCount = await this.seatClassRepo.count({
      where: { seatClassId: id },
    });
    if (usedCount > 0) {
      throw new ConflictException(
        `Kelas kursi '${item.name}' tidak dapat dihapus karena sedang digunakan oleh ${usedCount} armada bus`,
      );
    }

    await this.seatClassMasterRepo.remove(item);
    return {
      status: true,
      message: 'Master kelas kursi berhasil dihapus',
      data: null,
    };
  }

  // ==================== VEHICLES MANAGEMENT ====================
  async findAll(query: VehicleQueryFilterDto): Promise<ResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.vehicleRepo
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.seatClasses', 'seatClasses')
      .leftJoinAndSelect('seatClasses.seatClass', 'masterSeatClass')
      .leftJoinAndSelect('vehicle.images', 'images')
      .leftJoinAndSelect('vehicle.company', 'company');

    if (query.search) {
      const search = `%${query.search}%`;
      queryBuilder.andWhere(
        '(vehicle.code ILIKE :search OR vehicle.plate_number ILIKE :search OR vehicle.nickname ILIKE :search)',
        { search },
      );
    }

    if (query.vehicleType) {
      queryBuilder.andWhere('vehicle.vehicle_type = :vType', {
        vType: query.vehicleType,
      });
    }

    if (query.ownershipStatus) {
      queryBuilder.andWhere('vehicle.ownership_status = :oStatus', {
        oStatus: query.ownershipStatus,
      });
    }

    if (typeof query.isActive === 'boolean') {
      queryBuilder.andWhere('vehicle.is_active = :isActive', {
        isActive: query.isActive,
      });
    }

    queryBuilder
      .orderBy('vehicle.code', 'ASC')
      .addOrderBy('images.sequence', 'ASC')
      .skip(skip)
      .take(limit);

    const [vehicles, total] = await queryBuilder.getManyAndCount();

    return {
      status: true,
      message: 'Daftar armada bus berhasil dimuat',
      data: {
        data: vehicles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ResponseInterface> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id },
      relations: ['seatClasses', 'seatClasses.seatClass', 'images', 'company'],
      order: {
        images: { sequence: 'ASC' },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Armada bus tidak ditemukan');
    }

    return {
      status: true,
      message: 'Detail armada bus berhasil dimuat',
      data: vehicle,
    };
  }

  async create(dto: CreateVehicleDto): Promise<ResponseInterface> {
    // 1. Validasi keunikan nomor lambung & nopol
    const existingCode = await this.vehicleRepo.findOne({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new ConflictException(
        `Nomor lambung bus '${dto.code}' sudah digunakan`,
      );
    }

    const existingPlate = await this.vehicleRepo.findOne({
      where: { plateNumber: dto.plateNumber },
    });
    if (existingPlate) {
      throw new ConflictException(
        `Plat nomor '${dto.plateNumber}' sudah terdaftar`,
      );
    }

    // 2. Set default company jika kosong
    if (!dto.companyId) {
      const defaultComp = await this.companyRepo.findOne({
        where: { code: 'SST' },
      });
      dto.companyId = defaultComp?.id;
    }

    // 3. Kalkulasi total kapasitas dari seatClasses jika ada
    let totalCapacity = dto.capacity || 0;
    if (dto.seatClasses && dto.seatClasses.length > 0) {
      const sumSeats = dto.seatClasses.reduce(
        (sum, sc) => sum + (sc.seatCapacity || 0),
        0,
      );
      totalCapacity = sumSeats;
    }

    // Load master seat classes untuk mengaitkan FK seat_class_id otomatis
    const masterSeatClasses = await this.seatClassMasterRepo.find();

    const saved = await this.dataSource.transaction(async (manager) => {
      const vehicle = manager.create(VehicleEntity, {
        ...dto,
        capacity: totalCapacity,
      });
      const insertedVehicle = await manager.save(vehicle);

      // Simpan seat classes
      if (dto.seatClasses && dto.seatClasses.length > 0) {
        const scEntities = dto.seatClasses.map((sc) => {
          let resolvedSeatClassId = sc.seatClassId;
          if (!resolvedSeatClassId && sc.className) {
            const matchedMaster = masterSeatClasses.find(
              (m) => m.code === sc.className,
            );
            if (matchedMaster) resolvedSeatClassId = matchedMaster.id;
          }

          return manager.create(VehicleSeatClassEntity, {
            ...sc,
            seatClassId: resolvedSeatClassId,
            vehicleId: insertedVehicle.id,
          });
        });
        await manager.save(scEntities);
        insertedVehicle.seatClasses = scEntities;
      }

      // Simpan galeri foto armada
      if (dto.images && dto.images.length > 0) {
        const imgEntities = dto.images.map((img, idx) =>
          manager.create(VehicleImageEntity, {
            ...img,
            sequence: img.sequence !== undefined ? img.sequence : idx,
            vehicleId: insertedVehicle.id,
          }),
        );
        await manager.save(imgEntities);
        insertedVehicle.images = imgEntities;
      }

      return insertedVehicle;
    });

    return {
      status: true,
      message: 'Armada bus berhasil ditambahkan',
      data: saved,
    };
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<ResponseInterface> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id },
      relations: ['seatClasses', 'images'],
    });

    if (!vehicle) {
      throw new NotFoundException('Armada bus tidak ditemukan');
    }

    if (dto.code && dto.code !== vehicle.code) {
      const existing = await this.vehicleRepo.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(
          `Nomor lambung bus '${dto.code}' sudah digunakan`,
        );
      }
    }

    if (dto.plateNumber && dto.plateNumber !== vehicle.plateNumber) {
      const existing = await this.vehicleRepo.findOne({
        where: { plateNumber: dto.plateNumber },
      });
      if (existing) {
        throw new ConflictException(
          `Plat nomor '${dto.plateNumber}' sudah terdaftar`,
        );
      }
    }

    Object.assign(vehicle, dto);

    const masterSeatClasses = await this.seatClassMasterRepo.find();

    const updated = await this.dataSource.transaction(async (manager) => {
      // Jika ada seatClasses baru yang dikirimkan, update
      if (dto.seatClasses && dto.seatClasses.length > 0) {
        await manager.delete(VehicleSeatClassEntity, { vehicleId: id });
        const scEntities = dto.seatClasses.map((sc) => {
          let resolvedSeatClassId = sc.seatClassId;
          if (!resolvedSeatClassId && sc.className) {
            const matchedMaster = masterSeatClasses.find(
              (m) => m.code === sc.className,
            );
            if (matchedMaster) resolvedSeatClassId = matchedMaster.id;
          }

          return manager.create(VehicleSeatClassEntity, {
            ...sc,
            seatClassId: resolvedSeatClassId,
            vehicleId: id,
          });
        });
        await manager.save(scEntities);
        vehicle.capacity = scEntities.reduce(
          (sum, sc) => sum + sc.seatCapacity,
          0,
        );
        vehicle.seatClasses = scEntities;
      }

      // Jika ada update images
      if (dto.images) {
        await manager.delete(VehicleImageEntity, { vehicleId: id });
        if (dto.images.length > 0) {
          const imgEntities = dto.images.map((img, idx) =>
            manager.create(VehicleImageEntity, {
              ...img,
              sequence: img.sequence !== undefined ? img.sequence : idx,
              vehicleId: id,
            }),
          );
          await manager.save(imgEntities);
          vehicle.images = imgEntities;
        } else {
          vehicle.images = [];
        }
      }

      return manager.save(vehicle);
    });

    return {
      status: true,
      message: 'Data armada bus berhasil diperbarui',
      data: updated,
    };
  }

  async remove(id: string): Promise<ResponseInterface> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException('Armada bus tidak ditemukan');
    }

    await this.vehicleRepo.remove(vehicle);
    return {
      status: true,
      message: 'Armada bus berhasil dihapus',
      data: null,
    };
  }

  // --- SEAT CLASS SUBOBJECT MANAGEMENT (PER ARMADA) ---
  async addSeatClass(
    vehicleId: string,
    dto: CreateVehicleSeatClassDto,
  ): Promise<ResponseInterface> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
      relations: ['seatClasses'],
    });

    if (!vehicle) {
      throw new NotFoundException('Armada bus tidak ditemukan');
    }

    let resolvedSeatClassId = dto.seatClassId;
    if (!resolvedSeatClassId && dto.className) {
      const matched = await this.seatClassMasterRepo.findOne({
        where: { code: dto.className },
      });
      if (matched) resolvedSeatClassId = matched.id;
    }

    const sc = this.seatClassRepo.create({
      ...dto,
      seatClassId: resolvedSeatClassId,
      vehicleId,
    });
    const savedSc = await this.seatClassRepo.save(sc);

    // Update vehicle capacity
    const allSc = await this.seatClassRepo.find({ where: { vehicleId } });
    vehicle.capacity = allSc.reduce((sum, item) => sum + item.seatCapacity, 0);
    await this.vehicleRepo.save(vehicle);

    return {
      status: true,
      message: 'Konfigurasi kelas kursi berhasil ditambahkan',
      data: savedSc,
    };
  }

  async removeSeatClass(
    vehicleId: string,
    seatClassId: string,
  ): Promise<ResponseInterface> {
    const sc = await this.seatClassRepo.findOne({
      where: { id: seatClassId, vehicleId },
    });

    if (!sc) {
      throw new NotFoundException('Kelas kursi tidak ditemukan');
    }

    await this.seatClassRepo.remove(sc);

    // Update vehicle capacity
    const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId } });
    if (vehicle) {
      const allSc = await this.seatClassRepo.find({ where: { vehicleId } });
      vehicle.capacity = allSc.reduce((sum, item) => sum + item.seatCapacity, 0);
      await this.vehicleRepo.save(vehicle);
    }

    return {
      status: true,
      message: 'Kelas kursi berhasil dihapus',
      data: null,
    };
  }

  // --- VEHICLE IMAGES (GALERI FOTO BUS) ---
  async addImage(
    vehicleId: string,
    dto: CreateVehicleImageDto,
  ): Promise<ResponseInterface> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Armada bus tidak ditemukan');
    }

    // Jika foto baru diset sebagai primary, reset isPrimary foto lama
    if (dto.isPrimary) {
      await this.vehicleImageRepo.update(
        { vehicleId },
        { isPrimary: false },
      );
    }

    const count = await this.vehicleImageRepo.count({ where: { vehicleId } });
    const img = this.vehicleImageRepo.create({
      ...dto,
      sequence: dto.sequence !== undefined ? dto.sequence : count,
      vehicleId,
    });

    const saved = await this.vehicleImageRepo.save(img);

    return {
      status: true,
      message: 'Foto armada berhasil ditambahkan',
      data: saved,
    };
  }

  async removeImage(
    vehicleId: string,
    imageId: string,
  ): Promise<ResponseInterface> {
    const img = await this.vehicleImageRepo.findOne({
      where: { id: imageId, vehicleId },
    });

    if (!img) {
      throw new NotFoundException('Foto armada tidak ditemukan');
    }

    await this.vehicleImageRepo.remove(img);

    return {
      status: true,
      message: 'Foto armada berhasil dihapus',
      data: null,
    };
  }
}
