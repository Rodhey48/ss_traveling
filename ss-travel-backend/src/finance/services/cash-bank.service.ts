import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashAccountEntity } from '../../@models/finance/cash-account.entity';
import { BankAccountEntity } from '../../@models/finance/bank-account.entity';
import { AccountEntity } from '../../@models/finance/account.entity';
import {
  CreateCashAccountDto,
  UpdateCashAccountDto,
  CashAccountQueryFilterDto,
} from '../../@dto/finance/cash-account.dto';
import {
  CreateBankAccountDto,
  UpdateBankAccountDto,
  BankAccountQueryFilterDto,
} from '../../@dto/finance/bank-account.dto';

export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return '';
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
}

@Injectable()
export class CashBankService {
  constructor(
    @InjectRepository(CashAccountEntity)
    private readonly cashRepo: Repository<CashAccountEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly bankRepo: Repository<BankAccountEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
  ) {}

  // ==========================================
  // Cash Accounts
  // ==========================================

  async createCashAccount(dto: CreateCashAccountDto): Promise<CashAccountEntity> {
    const existing = await this.cashRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Kode kas '${dto.code}' sudah digunakan.`);
    }

    const account = await this.accountRepo.findOne({
      where: { id: dto.accountId },
    });
    if (!account) {
      throw new NotFoundException(`Akun GL dengan ID '${dto.accountId}' tidak ditemukan.`);
    }

    const cashAccount = this.cashRepo.create({
      ...dto,
      isActive: true,
    });

    return await this.cashRepo.save(cashAccount);
  }

  async findAllCashAccounts(filter: CashAccountQueryFilterDto): Promise<CashAccountEntity[]> {
    const qb = this.cashRepo
      .createQueryBuilder('cash')
      .leftJoinAndSelect('cash.account', 'account')
      .leftJoinAndSelect('cash.custodianUser', 'custodian')
      .leftJoinAndSelect('cash.costCenter', 'costCenter')
      .orderBy('cash.code', 'ASC');

    if (filter.costCenterId) {
      qb.andWhere('cash.costCenterId = :costCenterId', {
        costCenterId: filter.costCenterId,
      });
    }

    const includeInactive =
      filter.includeInactive === true || filter.includeInactive === 'true';
    if (!includeInactive) {
      qb.andWhere('cash.isActive = true');
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(cash.code) LIKE LOWER(:search) OR LOWER(cash.name) LIKE LOWER(:search))',
        { search: `%${filter.search}%` },
      );
    }

    return await qb.getMany();
  }

  async findOneCashAccount(id: string): Promise<CashAccountEntity> {
    const cash = await this.cashRepo.findOne({
      where: { id },
      relations: ['account', 'custodianUser', 'costCenter'],
    });

    if (!cash) {
      throw new NotFoundException(`Rekening kas dengan ID '${id}' tidak ditemukan.`);
    }

    return cash;
  }

  async updateCashAccount(id: string, dto: UpdateCashAccountDto): Promise<CashAccountEntity> {
    const cash = await this.findOneCashAccount(id);

    if (dto.code && dto.code !== cash.code) {
      const existing = await this.cashRepo.findOne({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Kode kas '${dto.code}' sudah digunakan.`);
      }
    }

    if (dto.accountId) {
      const account = await this.accountRepo.findOne({
        where: { id: dto.accountId },
      });
      if (!account) {
        throw new NotFoundException(`Akun GL dengan ID '${dto.accountId}' tidak ditemukan.`);
      }
    }

    Object.assign(cash, dto);
    return await this.cashRepo.save(cash);
  }

  async deleteCashAccount(id: string): Promise<{ success: boolean; message: string }> {
    const cash = await this.findOneCashAccount(id);
    cash.isActive = false;
    await this.cashRepo.save(cash);

    return {
      success: true,
      message: `Rekening kas '${cash.code} - ${cash.name}' berhasil dinonaktifkan.`,
    };
  }

  // ==========================================
  // Bank Accounts
  // ==========================================

  async createBankAccount(dto: CreateBankAccountDto): Promise<BankAccountEntity> {
    const existing = await this.bankRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Kode bank '${dto.code}' sudah digunakan.`);
    }

    const account = await this.accountRepo.findOne({
      where: { id: dto.accountId },
    });
    if (!account) {
      throw new NotFoundException(`Akun GL dengan ID '${dto.accountId}' tidak ditemukan.`);
    }

    const masked = maskAccountNumber(dto.accountNumber);

    const bankAccount = this.bankRepo.create({
      ...dto,
      accountNumberMasked: masked,
      currency: dto.currency || 'IDR',
      isActive: true,
    });

    return await this.bankRepo.save(bankAccount);
  }

  async findAllBankAccounts(filter: BankAccountQueryFilterDto): Promise<BankAccountEntity[]> {
    const qb = this.bankRepo
      .createQueryBuilder('bank')
      .leftJoinAndSelect('bank.account', 'account')
      .orderBy('bank.code', 'ASC');

    if (filter.bankName) {
      qb.andWhere('LOWER(bank.bankName) = LOWER(:bankName)', {
        bankName: filter.bankName,
      });
    }

    const includeInactive =
      filter.includeInactive === true || filter.includeInactive === 'true';
    if (!includeInactive) {
      qb.andWhere('bank.isActive = true');
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(bank.code) LIKE LOWER(:search) OR LOWER(bank.accountName) LIKE LOWER(:search) OR LOWER(bank.bankName) LIKE LOWER(:search) OR bank.accountNumber LIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    return await qb.getMany();
  }

  async findOneBankAccount(id: string): Promise<BankAccountEntity> {
    const bank = await this.bankRepo.findOne({
      where: { id },
      relations: ['account'],
    });

    if (!bank) {
      throw new NotFoundException(`Rekening bank dengan ID '${id}' tidak ditemukan.`);
    }

    return bank;
  }

  async updateBankAccount(id: string, dto: UpdateBankAccountDto): Promise<BankAccountEntity> {
    const bank = await this.findOneBankAccount(id);

    if (dto.code && dto.code !== bank.code) {
      const existing = await this.bankRepo.findOne({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Kode bank '${dto.code}' sudah digunakan.`);
      }
    }

    if (dto.accountId) {
      const account = await this.accountRepo.findOne({
        where: { id: dto.accountId },
      });
      if (!account) {
        throw new NotFoundException(`Akun GL dengan ID '${dto.accountId}' tidak ditemukan.`);
      }
    }

    if (dto.accountNumber) {
      bank.accountNumberMasked = maskAccountNumber(dto.accountNumber);
    }

    Object.assign(bank, dto);
    return await this.bankRepo.save(bank);
  }

  async deleteBankAccount(id: string): Promise<{ success: boolean; message: string }> {
    const bank = await this.findOneBankAccount(id);
    bank.isActive = false;
    await this.bankRepo.save(bank);

    return {
      success: true,
      message: `Rekening bank '${bank.code} - ${bank.bankName} (${bank.accountNumberMasked})' berhasil dinonaktifkan.`,
    };
  }
}
