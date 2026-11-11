import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteEntity } from '../../@models/master-rules/route.entity';
import {
  CreateRouteDto,
  UpdateRouteDto,
} from '../../@dto/master-rules/route.dto';
import { TripServiceType } from '../../@models/trips/trip.enums';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(RouteEntity)
    private readonly routeRepo: Repository<RouteEntity>,
  ) {}

  async findAll(serviceType?: TripServiceType): Promise<RouteEntity[]> {
    const where: any = {};
    if (serviceType) {
      where.serviceType = serviceType;
    }
    return this.routeRepo.find({
      where,
      order: { origin: 'ASC', destination: 'ASC', code: 'ASC' },
    });
  }

  async findOne(id: string): Promise<RouteEntity> {
    const route = await this.routeRepo.findOne({
      where: { id },
    });
    if (!route) {
      throw new NotFoundException(`Rute trayek dengan ID '${id}' tidak ditemukan.`);
    }
    return route;
  }

  async create(dto: CreateRouteDto): Promise<RouteEntity> {
    const existing = await this.routeRepo.findOne({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(
        `Rute dengan kode '${dto.code}' sudah terdaftar dalam sistem.`,
      );
    }

    const route = this.routeRepo.create({
      ...dto,
      code: dto.code.trim().toUpperCase(),
      origin: dto.origin.trim().toUpperCase(),
      destination: dto.destination.trim().toUpperCase(),
      via: dto.via ? dto.via.trim() : undefined,
    });

    return this.routeRepo.save(route);
  }

  async update(id: string, dto: UpdateRouteDto): Promise<RouteEntity> {
    const route = await this.findOne(id);

    if (dto.code && dto.code.trim().toUpperCase() !== route.code) {
      const existing = await this.routeRepo.findOne({
        where: { code: dto.code.trim().toUpperCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Rute dengan kode '${dto.code}' sudah terdaftar dalam sistem.`,
        );
      }
      route.code = dto.code.trim().toUpperCase();
    }

    if (dto.origin) route.origin = dto.origin.trim().toUpperCase();
    if (dto.destination) route.destination = dto.destination.trim().toUpperCase();
    if (dto.name !== undefined) route.name = dto.name.trim();
    if (dto.via !== undefined) route.via = dto.via ? dto.via.trim() : undefined;
    if (dto.distanceKm !== undefined) route.distanceKm = dto.distanceKm;
    if (dto.estimatedHours !== undefined) route.estimatedHours = dto.estimatedHours;
    if (dto.serviceType !== undefined) route.serviceType = dto.serviceType;
    if (dto.isActive !== undefined) route.isActive = dto.isActive;

    return this.routeRepo.save(route);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const route = await this.findOne(id);
    await this.routeRepo.remove(route);
    return {
      success: true,
      message: `Rute trayek '${route.name}' (${route.code}) berhasil dihapus.`,
    };
  }
}
