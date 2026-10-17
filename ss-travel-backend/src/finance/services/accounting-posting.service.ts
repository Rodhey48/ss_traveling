import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import {
  JournalEntryEntity,
  JournalStatus,
  JournalSourceType,
} from '../../@models/finance/journal-entry.entity';
import { JournalLineEntity } from '../../@models/finance/journal-line.entity';
import { AccountingEventEntity } from '../../@models/finance/accounting-event.entity';
import { AccountEntity } from '../../@models/finance/account.entity';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { DocumentSequenceService } from './document-sequence.service';
import { MoneyHelper } from '../../@common/helpers/money.helper';
import {
  CreateManualJournalDto,
  JournalFilterQueryDto,
} from '../../@dto/finance/journal.dto';

@Injectable()
export class AccountingPostingService {
  constructor(
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepo: Repository<JournalEntryEntity>,
    @InjectRepository(JournalLineEntity)
    private readonly lineRepo: Repository<JournalLineEntity>,
    @InjectRepository(AccountingEventEntity)
    private readonly eventRepo: Repository<AccountingEventEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    private readonly fiscalPeriodsService: FiscalPeriodsService,
    private readonly documentSequenceService: DocumentSequenceService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Posting satu pintu transaksi jurnal akuntansi secara atomik.
   * Dapat menerima EntityManager eksternal jika bagian dari transaksi multi-service (SPJ / Kasir).
   */
  async postJournal(
    dto: CreateManualJournalDto,
    actorId?: string,
    entityManager?: EntityManager,
  ): Promise<JournalEntryEntity> {
    const executePosting = async (manager: EntityManager): Promise<JournalEntryEntity> => {
      // 1. Validasi Idempotency Key
      if (dto.idempotencyKey) {
        const existingEvent = await manager.findOne(AccountingEventEntity, {
          where: { idempotencyKey: dto.idempotencyKey },
        });

        if (existingEvent) {
          throw new ConflictException(
            `Transaksi ini sudah pernah diposting dengan kunci idempotensi '${dto.idempotencyKey}'.`,
          );
        }
      }

      // 2. Validasi Periode Fiskal Terbuka
      const period = await this.fiscalPeriodsService.findOpenPeriodForDate(dto.journalDate);

      // 3. Validasi Minimal Baris Jurnal
      if (!dto.lines || dto.lines.length < 2) {
        throw new BadRequestException('Jurnal minimal harus memiliki 2 baris (Debit & Kredit).');
      }

      // 4. Validasi Baris Debit & Kredit
      const debits: (string | number)[] = [];
      const credits: (string | number)[] = [];
      const accountIds = new Set<string>();

      for (let i = 0; i < dto.lines.length; i++) {
        const line = dto.lines[i];
        accountIds.add(line.accountId);

        // Nilai tidak boleh negatif
        if (MoneyHelper.isLessThan(line.debit, 0) || MoneyHelper.isLessThan(line.credit, 0)) {
          throw new BadRequestException(
            `Baris ke-${i + 1}: Nilai debit atau kredit tidak boleh bernilai negatif.`,
          );
        }

        // Tidak boleh debit dan kredit terisi sekaligus
        if (
          MoneyHelper.isGreaterThan(line.debit, 0) &&
          MoneyHelper.isGreaterThan(line.credit, 0)
        ) {
          throw new BadRequestException(
            `Baris ke-${i + 1}: Dalam satu baris tidak boleh terisi nominal debit dan kredit sekaligus.`,
          );
        }

        // Minimal salah satu harus > 0
        if (MoneyHelper.isEqual(line.debit, 0) && MoneyHelper.isEqual(line.credit, 0)) {
          throw new BadRequestException(
            `Baris ke-${i + 1}: Setiap baris jurnal harus memiliki nominal debit atau kredit lebih dari 0.`,
          );
        }

        debits.push(line.debit);
        credits.push(line.credit);
      }

      // 5. Validasi Akun COA (Aktif & Postable)
      const accounts = await manager.findBy(AccountEntity, {
        id: In(Array.from(accountIds)),
      });

      if (accounts.length !== accountIds.size) {
        throw new BadRequestException('Satu atau lebih akun COA pada baris jurnal tidak ditemukan.');
      }

      for (const account of accounts) {
        if (!account.isActive) {
          throw new BadRequestException(
            `Akun '${account.code} - ${account.name}' tidak aktif. Jurnal ditolak.`,
          );
        }
        if (!account.isPostable) {
          throw new BadRequestException(
            `Akun '${account.code} - ${account.name}' adalah akun induk/header (non-postable). Hanya akun detail yang dapat diposting.`,
          );
        }
      }

      // 6. Validasi Keseimbangan Jurnal (Debit == Kredit)
      if (!MoneyHelper.isBalanced(debits, credits)) {
        const totalDebitStr = MoneyHelper.formatRupiah(MoneyHelper.sum(debits));
        const totalCreditStr = MoneyHelper.formatRupiah(MoneyHelper.sum(credits));
        throw new BadRequestException(
          `Jurnal tidak seimbang! Total Debit (${totalDebitStr}) tidak sama dengan Total Kredit (${totalCreditStr}).`,
        );
      }

      const totalDebit = MoneyHelper.toAmount(MoneyHelper.sum(debits));
      const totalCredit = MoneyHelper.toAmount(MoneyHelper.sum(credits));

      // 7. Generate Nomor Jurnal Atomik (JV/YYMM/XXXX)
      const dateClean = dto.journalDate.slice(0, 10);
      const yearPart = dateClean.slice(2, 4);
      const monthPart = dateClean.slice(5, 7);
      const periodKey = `${yearPart}${monthPart}`;
      const prefix = `JV/${periodKey}`;

      const journalNo = await this.documentSequenceService.getNextDocumentNumber(
        'JOURNAL_ENTRY',
        periodKey,
        prefix,
        4,
        dto.companyId,
        manager,
      );

      // 8. Simpan Header Jurnal
      const journalEntry = manager.create(JournalEntryEntity, {
        journalNo,
        journalDate: dateClean,
        periodId: period.id,
        sourceType: dto.sourceType || JournalSourceType.MANUAL,
        sourceId: dto.sourceId,
        description: dto.description,
        status: JournalStatus.POSTED,
        postedAt: new Date(),
        postedBy: actorId,
        companyId: dto.companyId,
        totalDebit,
        totalCredit,
      });

      const savedJournal = await manager.save(JournalEntryEntity, journalEntry);

      // 9. Simpan Baris Jurnal
      const journalLines: JournalLineEntity[] = dto.lines.map((line, idx) => {
        return manager.create(JournalLineEntity, {
          journalEntryId: savedJournal.id,
          lineNo: idx + 1,
          accountId: line.accountId,
          debit: MoneyHelper.toAmount(line.debit),
          credit: MoneyHelper.toAmount(line.credit),
          description: line.description || dto.description,
          businessUnitId: line.businessUnitId,
          costCenterId: line.costCenterId,
          profitCenterId: line.profitCenterId,
          tripId: line.tripId,
          tripLegId: line.tripLegId,
          vehicleId: line.vehicleId,
          counterpartyType: line.counterpartyType,
          counterpartyId: line.counterpartyId,
        });
      });

      await manager.save(JournalLineEntity, journalLines);

      // 10. Catat Accounting Event (Idempotensi)
      const eventKey = dto.idempotencyKey || `POSTED_${savedJournal.id}`;
      const event = manager.create(AccountingEventEntity, {
        sourceType: savedJournal.sourceType,
        sourceId: savedJournal.sourceId || savedJournal.id,
        eventType: 'POSTED',
        idempotencyKey: eventKey,
        journalEntryId: savedJournal.id,
      });
      await manager.save(AccountingEventEntity, event);

      // 11. Muat Jurnal Lengkap dengan Relasi
      return await manager.findOneOrFail(JournalEntryEntity, {
        where: { id: savedJournal.id },
        relations: [
          'lines',
          'lines.account',
          'lines.vehicle',
          'lines.costCenter',
          'lines.profitCenter',
          'lines.businessUnit',
          'period',
          'postedByUser',
        ],
      });
    };

    if (entityManager) {
      return await executePosting(entityManager);
    } else {
      return await this.dataSource.transaction(async (manager) => {
        return await executePosting(manager);
      });
    }
  }

  /**
   * Menampilkan daftar jurnal terposting dengan paginasi dan filter dimensi
   */
  async findAll(filter: JournalFilterQueryDto): Promise<{
    journals: JournalEntryEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filter.page && filter.page > 0 ? Number(filter.page) : 1;
    const limit = filter.limit && filter.limit > 0 ? Number(filter.limit) : 20;
    const skip = (page - 1) * limit;

    const sortField =
      filter.sortBy === 'createdAt' ? 'journal.createdAt' : 'journal.journalDate';
    const sortDirection =
      filter.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.journalRepo
      .createQueryBuilder('journal')
      .leftJoinAndSelect('journal.period', 'period')
      .leftJoinAndSelect('journal.postedByUser', 'postedByUser')
      .leftJoinAndSelect('journal.reversalOf', 'reversalOf')
      .leftJoinAndSelect('journal.lines', 'lines')
      .leftJoinAndSelect('lines.account', 'account')
      .leftJoinAndSelect('lines.vehicle', 'vehicle')
      .leftJoinAndSelect('lines.costCenter', 'costCenter')
      .leftJoinAndSelect('lines.profitCenter', 'profitCenter')
      .leftJoinAndSelect('lines.businessUnit', 'businessUnit')
      .orderBy(sortField, sortDirection)
      .addOrderBy('journal.journalNo', sortDirection);

    if (filter.sortBy === 'createdAt') {
      qb.addOrderBy('journal.journalDate', sortDirection);
    } else {
      qb.addOrderBy('journal.createdAt', sortDirection);
    }

    if (filter.startDate) {
      qb.andWhere('journal.journalDate >= :startDate', {
        startDate: filter.startDate,
      });
    }

    if (filter.endDate) {
      qb.andWhere('journal.journalDate <= :endDate', {
        endDate: filter.endDate,
      });
    }

    if (filter.status) {
      qb.andWhere('journal.status = :status', { status: filter.status });
    }

    if (filter.sourceType) {
      qb.andWhere('journal.sourceType = :sourceType', {
        sourceType: filter.sourceType,
      });
    }

    if (filter.search) {
      qb.andWhere(
        '(journal.journalNo ILIKE :search OR journal.description ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.accountId) {
      qb.andWhere('lines.accountId = :accountId', {
        accountId: filter.accountId,
      });
    }

    if (filter.businessUnitId) {
      qb.andWhere('lines.businessUnitId = :businessUnitId', {
        businessUnitId: filter.businessUnitId,
      });
    }

    if (filter.vehicleId) {
      qb.andWhere('lines.vehicleId = :vehicleId', {
        vehicleId: filter.vehicleId,
      });
    }

    if (filter.tripId) {
      qb.andWhere('lines.tripId = :tripId', { tripId: filter.tripId });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Pastikan lines terurut lineNo
    data.forEach((j) => {
      if (j.lines) {
        j.lines.sort((a, b) => a.lineNo - b.lineNo);
      }
    });

    return {
      journals: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Detail satu jurnal beserta baris dan akun
   */
  async findOne(id: string): Promise<JournalEntryEntity> {
    const journal = await this.journalRepo.findOne({
      where: { id },
      relations: [
        'lines',
        'lines.account',
        'lines.vehicle',
        'lines.costCenter',
        'lines.profitCenter',
        'lines.businessUnit',
        'period',
        'postedByUser',
        'reversalOf',
      ],
    });

    if (!journal) {
      throw new NotFoundException(`Jurnal dengan ID '${id}' tidak ditemukan.`);
    }

    if (journal.lines) {
      journal.lines.sort((a, b) => a.lineNo - b.lineNo);
    }

    return journal;
  }
}
