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
import { JournalLineEntity } from '../../@models/finance/journal-line.entity';
import { JournalStatus } from '../../@models/finance/journal-entry.entity';
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
    @InjectRepository(JournalLineEntity)
    private readonly lineRepo: Repository<JournalLineEntity>,
  ) {}

  /**
   * Helper ORM untuk menghitung saldo buku besar (GL) real-time dari jurnal POSTED
   */
  private async calculateAccountBalance(accountId?: string): Promise<string> {
    if (!accountId) return '0.00';

    const raw = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.journalEntry', 'j')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('j.status = :status', { status: JournalStatus.POSTED })
      .select('COALESCE(SUM(CAST(line.debit AS numeric)) - SUM(CAST(line.credit AS numeric)), 0)', 'balance')
      .getRawOne();

    return Number(raw?.balance || 0).toFixed(2);
  }

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

  async findAllCashAccounts(filter: CashAccountQueryFilterDto = {}): Promise<CashAccountEntity[]> {
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

    const accounts = await qb.getMany();

    for (const c of accounts) {
      (c as any).currentBalance = await this.calculateAccountBalance(c.accountId);
    }

    return accounts;
  }

  async findOneCashAccount(id: string): Promise<CashAccountEntity> {
    const cash = await this.cashRepo.findOne({
      where: { id },
      relations: ['account', 'custodianUser', 'costCenter'],
    });

    if (!cash) {
      throw new NotFoundException(`Rekening kas dengan ID '${id}' tidak ditemukan.`);
    }

    (cash as any).currentBalance = await this.calculateAccountBalance(cash.accountId);
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

  async findAllBankAccounts(filter: BankAccountQueryFilterDto = {}): Promise<BankAccountEntity[]> {
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

    const accounts = await qb.getMany();

    for (const b of accounts) {
      (b as any).currentBalance = await this.calculateAccountBalance(b.accountId);
    }

    return accounts;
  }

  async findOneBankAccount(id: string): Promise<BankAccountEntity> {
    const bank = await this.bankRepo.findOne({
      where: { id },
      relations: ['account'],
    });

    if (!bank) {
      throw new NotFoundException(`Rekening bank dengan ID '${id}' tidak ditemukan.`);
    }

    (bank as any).currentBalance = await this.calculateAccountBalance(bank.accountId);
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

  // ==========================================
  // Digital Statement (Rekening Koran) — Pure ORM
  // ==========================================

  async getBankStatement(id: string, startDate?: string, endDate?: string) {
    const bank = await this.findOneBankAccount(id);
    return await this.generateStatement(bank.accountId, bank, 'BANK', startDate, endDate);
  }

  async getCashStatement(id: string, startDate?: string, endDate?: string) {
    const cash = await this.findOneCashAccount(id);
    return await this.generateStatement(cash.accountId, cash, 'CASH', startDate, endDate);
  }

  private async generateStatement(
    accountId: string,
    accountEntity: any,
    type: 'BANK' | 'CASH',
    startDate?: string,
    endDate?: string,
  ) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();

    const start = startDate || `${y}-${m}-01`;
    const end = endDate || `${y}-${m}-${String(lastDay).padStart(2, '0')}`;

    if (!accountId) {
      return {
        account: accountEntity,
        type,
        startDate: start,
        endDate: end,
        openingBalance: '0.00',
        totalDebit: '0.00',
        totalCredit: '0.00',
        endingBalance: '0.00',
        lines: [],
      };
    }

    // 1. Saldo Awal (sebelum startDate) menggunakan ORM QueryBuilder
    const openRaw = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.journalEntry', 'j')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('j.status = :status', { status: JournalStatus.POSTED })
      .andWhere('j.journalDate < :start', { start })
      .select('COALESCE(SUM(CAST(line.debit AS numeric)) - SUM(CAST(line.credit AS numeric)), 0)', 'balance')
      .getRawOne();

    const openingBalNum = Number(openRaw?.balance || 0);

    // 2. Baris Mutasi menggunakan ORM QueryBuilder & Entity Relations
    const lineEntities = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoinAndSelect('line.journalEntry', 'j')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('j.status = :status', { status: JournalStatus.POSTED })
      .andWhere('j.journalDate >= :start AND j.journalDate <= :end', { start, end })
      .orderBy('j.journalDate', 'ASC')
      .addOrderBy('j.createdAt', 'ASC')
      .addOrderBy('line.id', 'ASC')
      .getMany();

    let running = openingBalNum;
    let totD = 0;
    let totC = 0;
    const lines = [];

    for (const item of lineEntities) {
      const d = Number(item.debit);
      const c = Number(item.credit);
      totD += d;
      totC += c;
      running = running + d - c;
      lines.push({
        id: item.id,
        date: item.journalEntry?.journalDate || '',
        journalNo: item.journalEntry?.journalNo || '',
        sourceType: item.journalEntry?.sourceType || '',
        description: item.description || item.journalEntry?.description || '',
        debit: d.toFixed(2),
        credit: c.toFixed(2),
        runningBalance: running.toFixed(2),
      });
    }

    return {
      account: accountEntity,
      type,
      startDate: start,
      endDate: end,
      openingBalance: openingBalNum.toFixed(2),
      totalDebit: totD.toFixed(2),
      totalCredit: totC.toFixed(2),
      endingBalance: running.toFixed(2),
      lines,
    };
  }
}
