import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CashTransactionEntity } from '../../@models/finance/cash-transaction.entity';
import { CashAccountEntity } from '../../@models/finance/cash-account.entity';
import { BankAccountEntity } from '../../@models/finance/bank-account.entity';
import { AccountEntity } from '../../@models/finance/account.entity';
import {
  JournalEntryEntity,
  JournalSourceType,
} from '../../@models/finance/journal-entry.entity';
import {
  CashTransactionType,
  CashTransactionStatus,
  PettyCashCategory,
} from '../../@models/finance/finance.enums';
import {
  CreatePettyCashDisbursementDto,
  CreatePettyCashReplenishmentDto,
  VerifyPettyCashDto,
  RejectPettyCashDto,
  PettyCashFilterDto,
} from '../../@dto/finance/petty-cash.dto';
import { DocumentSequenceService } from './document-sequence.service';
import { AccountingPostingService } from './accounting-posting.service';
import { MoneyHelper } from '../../@common/helpers/money.helper';

export interface PettyCashSummaryResponse {
  cashAccount: {
    id: string;
    code: string;
    name: string;
    glAccountCode?: string;
    glAccountName?: string;
  };
  currentBalance: string;
  thisMonthExpenses: string;
  pendingVerificationCount: number;
  todayTransactionsCount: number;
}

@Injectable()
export class PettyCashService {
  constructor(
    @InjectRepository(CashTransactionEntity)
    private readonly transactionRepo: Repository<CashTransactionEntity>,
    @InjectRepository(CashAccountEntity)
    private readonly cashAccountRepo: Repository<CashAccountEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepo: Repository<BankAccountEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepo: Repository<JournalEntryEntity>,
    private readonly docSeqService: DocumentSequenceService,
    private readonly postingService: AccountingPostingService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Mengambil Ringkasan Saldo dan Aktivitas Kas Kecil Pool
   */
  async getSummary(cashAccountId?: string): Promise<PettyCashSummaryResponse> {
    let cashAccount: CashAccountEntity | null = null;

    if (cashAccountId) {
      cashAccount = await this.cashAccountRepo.findOne({
        where: { id: cashAccountId },
        relations: ['account'],
      });
    }

    if (!cashAccount) {
      cashAccount = await this.cashAccountRepo.findOne({
        where: { code: 'CASH-PETTY-GARASI' },
        relations: ['account'],
      });
    }

    if (!cashAccount) {
      cashAccount = await this.cashAccountRepo.findOne({
        where: { isActive: true },
        relations: ['account'],
      });
    }

    if (!cashAccount) {
      throw new NotFoundException('Rekening Kas Kecil tidak ditemukan di master data.');
    }

    // Hitung saldo aktual berjalan: Saldo dari GL account 11103 jika ada, atau net transaksi cash_transactions
    let currentBalance = '0.00';
    if (cashAccount.accountId) {
      const glBalRaw = await this.dataSource.query(
        `
        SELECT 
          COALESCE(SUM(CAST(jl.debit AS numeric)) - SUM(CAST(jl.credit AS numeric)), 0) AS "balance"
        FROM journal_lines jl
        INNER JOIN journal_entries j ON j.id = jl.journal_entry_id
        WHERE j.status = 'POSTED' AND jl.account_id = $1
      `,
        [cashAccount.accountId],
      );
      if (glBalRaw.length > 0) {
        currentBalance = Number(glBalRaw[0].balance).toFixed(2);
      }
    }

    // Jika belum ada jurnal GL yang terposting, gunakan akumulasi dari cash_transactions
    if (MoneyHelper.isEqual(currentBalance, 0)) {
      const transBalRaw = await this.dataSource.query(
        `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'REPLENISHMENT' AND status = 'VERIFIED' THEN CAST(amount AS numeric) ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN type = 'DISBURSEMENT' AND status = 'VERIFIED' THEN CAST(amount AS numeric) ELSE 0 END), 0) AS "balance"
        FROM cash_transactions
        WHERE cash_account_id = $1 AND is_active = true
      `,
        [cashAccount.id],
      );
      if (transBalRaw.length > 0) {
        currentBalance = Number(transBalRaw[0].balance).toFixed(2);
      }
    }

    // Hitung pengeluaran bulan ini (current month)
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const expRaw = await this.dataSource.query(
      `
      SELECT COALESCE(SUM(CAST(amount AS numeric)), 0) AS "totalExpenses"
      FROM cash_transactions
      WHERE cash_account_id = $1 
        AND type = 'DISBURSEMENT' 
        AND status = 'VERIFIED' 
        AND transaction_date >= $2
        AND is_active = true
    `,
      [cashAccount.id, startOfMonth],
    );
    const thisMonthExpenses = Number(expRaw[0]?.totalExpenses || 0).toFixed(2);

    // Hitung pengeluaran menunggu verifikasi (SUBMITTED)
    const pendingCount = await this.transactionRepo.count({
      where: {
        cashAccountId: cashAccount.id,
        status: CashTransactionStatus.SUBMITTED,
        type: CashTransactionType.DISBURSEMENT,
        isActive: true,
      },
    });

    // Hitung transaksi hari ini
    const todayStr = now.toISOString().slice(0, 10);
    const todayCount = await this.transactionRepo.count({
      where: {
        cashAccountId: cashAccount.id,
        transactionDate: todayStr,
        isActive: true,
      },
    });

    return {
      cashAccount: {
        id: cashAccount.id,
        code: cashAccount.code,
        name: cashAccount.name,
        glAccountCode: cashAccount.account?.code,
        glAccountName: cashAccount.account?.name,
      },
      currentBalance,
      thisMonthExpenses,
      pendingVerificationCount: pendingCount,
      todayTransactionsCount: todayCount,
    };
  }

  /**
   * Mengambil Daftar Transaksi Kas Kecil Pool dengan Filter
   */
  async getTransactions(filter: PettyCashFilterDto): Promise<CashTransactionEntity[]> {
    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.cashAccount', 'ca')
      .leftJoinAndSelect('ca.account', 'caGl')
      .leftJoinAndSelect('t.expenseAccount', 'ea')
      .leftJoinAndSelect('t.sourceBankAccount', 'sba')
      .leftJoinAndSelect('t.sourceCashAccount', 'sca')
      .leftJoinAndSelect('t.vehicle', 'v')
      .leftJoinAndSelect('t.costCenter', 'cc')
      .leftJoinAndSelect('t.createdByUser', 'creator')
      .leftJoinAndSelect('t.verifiedByUser', 'verifier')
      .leftJoinAndSelect('t.journalEntry', 'journal')
      .where('t.isActive = true')
      .orderBy('t.transactionDate', 'DESC')
      .addOrderBy('t.createdAt', 'DESC');

    if (filter.startDate) {
      qb.andWhere('t.transactionDate >= :startDate', { startDate: filter.startDate });
    }
    if (filter.endDate) {
      qb.andWhere('t.transactionDate <= :endDate', { endDate: filter.endDate });
    }
    if (filter.type) {
      qb.andWhere('t.type = :type', { type: filter.type });
    }
    if (filter.status) {
      qb.andWhere('t.status = :status', { status: filter.status });
    }
    if (filter.cashAccountId) {
      qb.andWhere('t.cashAccountId = :cashAccountId', { cashAccountId: filter.cashAccountId });
    }
    if (filter.category) {
      qb.andWhere('t.category = :category', { category: filter.category });
    }
    if (filter.vehicleId) {
      qb.andWhere('t.vehicleId = :vehicleId', { vehicleId: filter.vehicleId });
    }
    if (filter.search) {
      qb.andWhere(
        '(t.transactionNo ILIKE :q OR t.description ILIKE :q OR t.recipient ILIKE :q OR t.receiptNo ILIKE :q OR v.code ILIKE :q)',
        { q: `%${filter.search}%` },
      );
    }

    return await qb.getMany();
  }

  /**
   * Detail Transaksi Kas Kecil beserta Baris Jurnal Akuntansinya
   */
  async getTransactionDetail(id: string): Promise<CashTransactionEntity> {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
      relations: [
        'cashAccount',
        'cashAccount.account',
        'expenseAccount',
        'sourceBankAccount',
        'sourceCashAccount',
        'vehicle',
        'costCenter',
        'createdByUser',
        'verifiedByUser',
        'journalEntry',
        'journalEntry.lines',
        'journalEntry.lines.account',
      ],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaksi kas kecil dengan ID '${id}' tidak ditemukan.`);
    }

    return transaction;
  }

  /**
   * Mengambil Rekomendasi Akun Beban Populer untuk Pengeluaran Kas Kecil Garasi
   */
  async getExpenseAccounts(): Promise<AccountEntity[]> {
    return await this.accountRepo
      .createQueryBuilder('a')
      .where('a.type = :type', { type: 'EXPENSE' })
      .andWhere('a.isPostable = true')
      .andWhere('a.isActive = true')
      .orderBy('a.code', 'ASC')
      .getMany();
  }

  /**
   * Input Pengeluaran Kas Kecil Pool (BKK)
   */
  async createDisbursement(
    dto: CreatePettyCashDisbursementDto,
    userId?: string,
  ): Promise<CashTransactionEntity> {
    const cashAccount = await this.cashAccountRepo.findOne({
      where: { id: dto.cashAccountId },
      relations: ['account'],
    });
    if (!cashAccount) {
      throw new NotFoundException('Rekening kas kecil tidak ditemukan.');
    }
    if (!cashAccount.accountId) {
      throw new BadRequestException('Rekening kas kecil belum memiliki tautan Akun GL COA.');
    }

    const expenseAccount = await this.accountRepo.findOne({
      where: { id: dto.expenseAccountId },
    });
    if (!expenseAccount) {
      throw new NotFoundException('Akun beban COA tidak ditemukan.');
    }
    if (!expenseAccount.isPostable) {
      throw new BadRequestException('Akun beban COA yang dipilih bukan akun detail postable.');
    }

    // Generate BKK Number: BKK-KAS/YYMM/XXXX
    const d = new Date(dto.transactionDate || new Date());
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const periodKey = `${yy}${mm}`;
    const prefix = `BKK-KAS/${periodKey}`;

    const transactionNo = await this.docSeqService.getNextDocumentNumber(
      'BKK_PETTY',
      periodKey,
      prefix,
      4,
    );

    const isAutoVerified = Boolean(dto.autoVerify);

    const transaction = this.transactionRepo.create({
      transactionNo,
      cashAccountId: dto.cashAccountId,
      type: CashTransactionType.DISBURSEMENT,
      transactionDate: dto.transactionDate,
      amount: MoneyHelper.toDecimal(dto.amount).toFixed(2),
      recipient: dto.recipient,
      expenseAccountId: dto.expenseAccountId,
      vehicleId: dto.vehicleId || undefined,
      costCenterId: dto.costCenterId || cashAccount.costCenterId || undefined,
      category: dto.category,
      description: dto.description,
      receiptNo: dto.receiptNo,
      receiptImageUrl: dto.receiptImageUrl,
      status: isAutoVerified ? CashTransactionStatus.VERIFIED : CashTransactionStatus.SUBMITTED,
      createdById: userId,
      verifiedById: isAutoVerified ? userId : undefined,
      verifiedAt: isAutoVerified ? new Date() : undefined,
    });

    const saved = await this.transactionRepo.save(transaction);

    // Jika langsung diverifikasi, posting jurnal ke GL
    if (isAutoVerified) {
      await this.postDisbursementJournal(saved, cashAccount, expenseAccount, userId);
    }

    return await this.getTransactionDetail(saved.id);
  }

  /**
   * Input Pengisian Kembali Dana Kas Kecil / Replenishment (BKM)
   */
  async createReplenishment(
    dto: CreatePettyCashReplenishmentDto,
    userId?: string,
  ): Promise<CashTransactionEntity> {
    const cashAccount = await this.cashAccountRepo.findOne({
      where: { id: dto.cashAccountId },
      relations: ['account'],
    });
    if (!cashAccount) {
      throw new NotFoundException('Rekening kas kecil tujuan tidak ditemukan.');
    }
    if (!cashAccount.accountId) {
      throw new BadRequestException('Rekening kas kecil belum memiliki tautan Akun GL COA.');
    }

    let sourceCreditAccountId: string;
    let recipientDesc = dto.recipient || '';

    if (dto.sourceType === 'BANK') {
      if (!dto.sourceBankAccountId) {
        throw new BadRequestException('Rekening bank sumber dana wajib dipilih.');
      }
      const bank = await this.bankAccountRepo.findOne({
        where: { id: dto.sourceBankAccountId },
        relations: ['account'],
      });
      if (!bank || !bank.accountId) {
        throw new NotFoundException('Rekening bank sumber dana tidak ditemukan.');
      }
      sourceCreditAccountId = bank.accountId;
      if (!recipientDesc) recipientDesc = `Bank ${bank.bankName} (${bank.accountNumberMasked || bank.accountNumber})`;
    } else {
      if (!dto.sourceCashAccountId) {
        throw new BadRequestException('Rekening kas induk sumber dana wajib dipilih.');
      }
      const sourceCash = await this.cashAccountRepo.findOne({
        where: { id: dto.sourceCashAccountId },
        relations: ['account'],
      });
      if (!sourceCash || !sourceCash.accountId) {
        throw new NotFoundException('Rekening kas sumber dana tidak ditemukan.');
      }
      sourceCreditAccountId = sourceCash.accountId;
      if (!recipientDesc) recipientDesc = `Kas ${sourceCash.name}`;
    }

    // Generate BKM Number: BKM-KAS/YYMM/XXXX
    const d = new Date(dto.transactionDate || new Date());
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const periodKey = `${yy}${mm}`;
    const prefix = `BKM-KAS/${periodKey}`;

    const transactionNo = await this.docSeqService.getNextDocumentNumber(
      'BKM_PETTY',
      periodKey,
      prefix,
      4,
    );

    const transaction = this.transactionRepo.create({
      transactionNo,
      cashAccountId: dto.cashAccountId,
      type: CashTransactionType.REPLENISHMENT,
      transactionDate: dto.transactionDate,
      amount: MoneyHelper.toDecimal(dto.amount).toFixed(2),
      recipient: recipientDesc,
      sourceBankAccountId: dto.sourceType === 'BANK' ? dto.sourceBankAccountId : undefined,
      sourceCashAccountId: dto.sourceType === 'CASH' ? dto.sourceCashAccountId : undefined,
      category: PettyCashCategory.OTHER,
      description: dto.description,
      receiptNo: dto.receiptNo,
      status: CashTransactionStatus.VERIFIED,
      createdById: userId,
      verifiedById: userId,
      verifiedAt: new Date(),
    });

    const saved = await this.transactionRepo.save(transaction);

    // Posting Jurnal GL Replenishment: Debit Kas Kecil, Kredit Bank / Kas Induk
    const formattedAmount = MoneyHelper.toDecimal(saved.amount).toFixed(2);
    const journal = await this.postingService.postJournal(
      {
        journalDate: saved.transactionDate,
        sourceType: JournalSourceType.CASH_TRANSACTION,
        sourceId: saved.id,
        description: `[REPLENISHMENT KAS KECIL] ${saved.description} (${saved.transactionNo})`,
        lines: [
          {
            accountId: cashAccount.accountId,
            debit: formattedAmount,
            credit: '0.00',
            costCenterId: cashAccount.costCenterId,
            description: `Penambahan saldo Kas Kecil: ${saved.description}`,
          },
          {
            accountId: sourceCreditAccountId,
            debit: '0.00',
            credit: formattedAmount,
            description: `Pencairan dana kas kecil ke ${cashAccount.name}`,
          },
        ],
        idempotencyKey: `PETTY-REPLENISH-${saved.id}`,
      },
      userId,
    );

    saved.journalEntryId = journal.id;
    await this.transactionRepo.save(saved);

    return await this.getTransactionDetail(saved.id);
  }

  /**
   * Verifikasi & Approval Pengeluaran Kas Kecil oleh Akuntan (Otomatis Posting Jurnal GL)
   */
  async verifyTransaction(
    id: string,
    dto: VerifyPettyCashDto,
    userId?: string,
  ): Promise<CashTransactionEntity> {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
      relations: ['cashAccount', 'expenseAccount'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaksi kas kecil dengan ID '${id}' tidak ditemukan.`);
    }

    if (transaction.status === CashTransactionStatus.VERIFIED) {
      throw new BadRequestException('Transaksi kas kecil ini sudah diverifikasi sebelumnya.');
    }

    if (!transaction.cashAccount || !transaction.cashAccount.accountId) {
      throw new BadRequestException('Rekening kas kecil tidak memiliki akun GL COA.');
    }

    if (!transaction.expenseAccount) {
      throw new BadRequestException('Akun beban belum ditentukan untuk transaksi pengeluaran ini.');
    }

    await this.postDisbursementJournal(
      transaction,
      transaction.cashAccount,
      transaction.expenseAccount,
      userId,
    );

    transaction.status = CashTransactionStatus.VERIFIED;
    transaction.verifiedById = userId;
    transaction.verifiedAt = new Date();
    if (dto.notes) {
      transaction.description = `${transaction.description} (Catatan Verifikasi: ${dto.notes})`;
    }

    await this.transactionRepo.save(transaction);
    return await this.getTransactionDetail(transaction.id);
  }

  /**
   * Tolak Pengeluaran Kas Kecil (Reject)
   */
  async rejectTransaction(
    id: string,
    dto: RejectPettyCashDto,
    userId?: string,
  ): Promise<CashTransactionEntity> {
    const transaction = await this.transactionRepo.findOne({ where: { id } });

    if (!transaction) {
      throw new NotFoundException(`Transaksi kas kecil dengan ID '${id}' tidak ditemukan.`);
    }

    if (transaction.status === CashTransactionStatus.VERIFIED) {
      throw new BadRequestException('Transaksi kas kecil yang sudah terposting (VERIFIED) tidak dapat ditolak.');
    }

    transaction.status = CashTransactionStatus.REJECTED;
    transaction.rejectionReason = dto.reason;
    transaction.verifiedById = userId;
    transaction.verifiedAt = new Date();

    await this.transactionRepo.save(transaction);
    return await this.getTransactionDetail(transaction.id);
  }

  /**
   * Hapus Transaksi Kas Kecil (Hanya bisa jika berstatus DRAFT atau SUBMITTED)
   */
  async deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
    const transaction = await this.transactionRepo.findOne({ where: { id } });

    if (!transaction) {
      throw new NotFoundException(`Transaksi kas kecil dengan ID '${id}' tidak ditemukan.`);
    }

    if (transaction.status === CashTransactionStatus.VERIFIED) {
      throw new BadRequestException(
        'Transaksi kas kecil yang sudah VERIFIED (terposting ke GL) tidak dapat dihapus secara langsung.',
      );
    }

    transaction.isActive = false;
    await this.transactionRepo.save(transaction);

    return {
      success: true,
      message: `Transaksi kas kecil '${transaction.transactionNo}' berhasil dihapus.`,
    };
  }

  /**
   * Private Helper: Posting Jurnal Pengeluaran Kas Kecil ke GL via AccountingPostingService
   */
  private async postDisbursementJournal(
    transaction: CashTransactionEntity,
    cashAccount: CashAccountEntity,
    expenseAccount: AccountEntity,
    userId?: string,
  ): Promise<void> {
    const formattedAmount = MoneyHelper.toDecimal(transaction.amount).toFixed(2);

    const journal = await this.postingService.postJournal(
      {
        journalDate: transaction.transactionDate,
        sourceType: JournalSourceType.CASH_TRANSACTION,
        sourceId: transaction.id,
        description: `[KAS KECIL POOL] ${transaction.description} (${transaction.transactionNo})`,
        lines: [
          {
            accountId: expenseAccount.id,
            debit: formattedAmount,
            credit: '0.00',
            vehicleId: transaction.vehicleId,
            costCenterId: transaction.costCenterId || cashAccount.costCenterId,
            description: `${expenseAccount.name}: ${transaction.description}`,
          },
          {
            accountId: cashAccount.accountId,
            debit: '0.00',
            credit: formattedAmount,
            costCenterId: cashAccount.costCenterId,
            description: `Pengeluaran Kas Kecil ${cashAccount.name} (${transaction.transactionNo})`,
          },
        ],
        idempotencyKey: `PETTY-DISBURSE-${transaction.id}`,
      },
      userId,
    );

    transaction.journalEntryId = journal.id;
    await this.transactionRepo.save(transaction);
  }
}
