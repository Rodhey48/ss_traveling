import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity, CompanyEntity } from '@models';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryFilterDto,
} from '../../@dto/customer/customer.dto';
import { ResponseInterface } from '@interfaces';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(CustomerEntity)
    private customerRepo: Repository<CustomerEntity>,
    @InjectRepository(CompanyEntity)
    private companyRepo: Repository<CompanyEntity>,
  ) {}

  async findAll(query: CustomerQueryFilterDto): Promise<ResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.customerRepo
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.company', 'company');

    if (query.search) {
      const search = `%${query.search}%`;
      queryBuilder.andWhere(
        '(customer.institution_name ILIKE :search OR customer.pic_name ILIKE :search OR customer.phone ILIKE :search OR customer.code ILIKE :search OR customer.city ILIKE :search)',
        { search },
      );
    }

    if (query.customerType) {
      queryBuilder.andWhere('customer.customer_type = :cType', {
        cType: query.customerType,
      });
    }

    if (query.leadSource) {
      queryBuilder.andWhere('customer.lead_source = :lSource', {
        lSource: query.leadSource,
      });
    }

    if (query.customerTier) {
      queryBuilder.andWhere('customer.customer_tier = :cTier', {
        cTier: query.customerTier,
      });
    }

    if (typeof query.isActive === 'boolean') {
      queryBuilder.andWhere('customer.is_active = :isActive', {
        isActive: query.isActive,
      });
    }

    queryBuilder
      .orderBy('customer.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [customers, total] = await queryBuilder.getManyAndCount();

    return {
      status: true,
      message: 'Daftar pelanggan & leads berhasil dimuat',
      data: {
        data: customers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ResponseInterface> {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan');
    }

    return {
      status: true,
      message: 'Detail pelanggan berhasil dimuat',
      data: customer,
    };
  }

  async autocomplete(search: string = ''): Promise<ResponseInterface> {
    const queryBuilder = this.customerRepo
      .createQueryBuilder('customer')
      .select([
        'customer.id',
        'customer.code',
        'customer.institutionName',
        'customer.picName',
        'customer.phone',
        'customer.city',
        'customer.customerTier',
      ])
      .where('customer.is_active = true');

    if (search) {
      queryBuilder.andWhere(
        '(customer.institution_name ILIKE :search OR customer.pic_name ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const list = await queryBuilder
      .orderBy('customer.institutionName', 'ASC')
      .take(20)
      .getMany();

    return {
      status: true,
      message: 'Hasil pencarian pelanggan',
      data: list,
    };
  }

  async create(dto: CreateCustomerDto): Promise<ResponseInterface> {
    // 1. Generate code otomatis jika tidak diisi
    if (!dto.code) {
      const count = await this.customerRepo.count();
      const nextNum = (count + 1).toString().padStart(4, '0');
      dto.code = `CUST-${nextNum}`;
    }

    // 2. Cek keunikan code
    const existing = await this.customerRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Kode pelanggan '${dto.code}' sudah digunakan`);
    }

    // 3. Set default company jika kosong
    if (!dto.companyId) {
      const defaultComp = await this.companyRepo.findOne({
        where: { code: 'SST' },
      });
      dto.companyId = defaultComp?.id;
    }

    const customer = this.customerRepo.create({
      ...dto,
      lastTripDate: dto.lastTripDate ? new Date(dto.lastTripDate) : undefined,
    });

    const saved = await this.customerRepo.save(customer);

    return {
      status: true,
      message: 'Pelanggan berhasil ditambahkan',
      data: saved,
    };
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<ResponseInterface> {
    const customer = await this.customerRepo.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan');
    }

    if (dto.code && dto.code !== customer.code) {
      const existing = await this.customerRepo.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(
          `Kode pelanggan '${dto.code}' sudah digunakan`,
        );
      }
    }

    Object.assign(customer, {
      ...dto,
      lastTripDate: dto.lastTripDate
        ? new Date(dto.lastTripDate)
        : customer.lastTripDate,
    });

    const updated = await this.customerRepo.save(customer);

    return {
      status: true,
      message: 'Data pelanggan berhasil diperbarui',
      data: updated,
    };
  }

  async remove(id: string): Promise<ResponseInterface> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan');
    }

    await this.customerRepo.remove(customer);

    return {
      status: true,
      message: 'Pelanggan berhasil dihapus',
      data: null,
    };
  }
}
