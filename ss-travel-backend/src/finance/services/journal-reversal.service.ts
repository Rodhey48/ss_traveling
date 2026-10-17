import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  JournalEntryEntity,
  JournalStatus,
} from '../../@models/finance/journal-entry.entity';
import { JournalLineEntity } from '../../@models/finance/journal-line.entity';
import { AccountingEventEntity } from '../../@models/finance/accounting-event.entity';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { DocumentSequenceService } from './document-sequence.service';
import { ReverseJournalDto } from '../../@dto/finance/journal.dto';

@Injectable()
export class JournalReversalService {
  constructor(
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepo: Repository<JournalEntryEntity>,
    @InjectRepository(JournalLineEntity)
    private readonly lineRepo: Repository<JournalLineEntity>,
    @InjectRepository(AccountingEventEntity)
    private readonly eventRepo: Repository<AccountingEventEntity>,
    private readonly fiscalPeriodsService: FiscalPeriodsService,
    private readonly documentSequenceService: DocumentSequenceService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Membalik (reversal) jurnal yang telah terposting secara atomik.
   * Jurnal asli diubah statusnya menjadi REVERSED dan dibuat jurnal pembalik baru.
   */
  async reverseJournal(
    journalId: string,
    dto: ReverseJournalDto,
    actorId?: string,
    entityManager?: EntityManager,
    allowOperationalReversal = false,
  ): Promise<JournalEntryEntity> {
    const executeReversal = async (manager: EntityManager): Promise<JournalEntryEntity> => {
      // 1. Ambil Jurnal Asal
      const original = await manager.findOne(JournalEntryEntity, {
        where: { id: journalId },
        relations: ['lines', 'lines.account'],
      });

      if (!original) {
        throw new NotFoundException(`Jurnal dengan ID '${journalId}' tidak ditemukan.`);
      }

      // 2. Validasi Status: Hanya POSTED yang boleh di-reverse
      if (original.status !== JournalStatus.POSTED) {
        throw new BadRequestException(
          `Hanya jurnal berstatus POSTED yang dapat dibalik (reverse). Status jurnal saat ini: ${original.status}.`,
        );
      }

      // 3. Validasi Dokumen Sumber: Cegah reversal manual langsung untuk jurnal operasional (SPJ / Invoice)
      if (!allowOperationalReversal && original.sourceType !== 'MANUAL') {
        throw new BadRequestException(
          `Jurnal ini diterbitkan secara otomatis oleh modul operasional (${original.sourceType}). Pembatalan atau koreksi wajib dilakukan melalui menu dokumen operasional terkait (misal: SPJ di Meja Kasir Pool) agar sinkronisasi data operasional armada tetap terjaga.`,
        );
      }

      // 4. Validasi: Jangan izinkan reverse ganda
      const existingReversal = await manager.findOne(JournalEntryEntity, {
        where: { reversalOfId: original.id },
      });

      if (existingReversal) {
        throw new ConflictException(
          `Jurnal '${original.journalNo}' sudah pernah dibalik oleh jurnal '${existingReversal.journalNo}'.`,
        );
      }

      // 5. Validasi Tanggal Reversal & Periode Fiskal Terbuka
      const reversalDate = dto.reversalDate
        ? dto.reversalDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      const period = await this.fiscalPeriodsService.findOpenPeriodForDate(reversalDate);

      // 6. Inversikan Baris Jurnal (Debit menjadi Kredit, Kredit menjadi Debit)
      if (!original.lines || original.lines.length === 0) {
        throw new BadRequestException('Jurnal asal tidak memiliki baris transaksi untuk dibalik.');
      }

      original.lines.sort((a, b) => a.lineNo - b.lineNo);

      // 7. Generate Nomor Dokumen Jurnal Pembalik Atomik (JV/YYMM/XXXX)
      const yearPart = reversalDate.slice(2, 4);
      const monthPart = reversalDate.slice(5, 7);
      const periodKey = `${yearPart}${monthPart}`;
      const prefix = `JV/${periodKey}`;

      const journalNo = await this.documentSequenceService.getNextDocumentNumber(
        'JOURNAL_ENTRY',
        periodKey,
        prefix,
        4,
        original.companyId,
        manager,
      );

      // 7. Buat Header Jurnal Pembalik
      const reversalJournal = manager.create(JournalEntryEntity, {
        journalNo,
        journalDate: reversalDate,
        periodId: period.id,
        sourceType: original.sourceType,
        sourceId: original.sourceId,
        description: `[REVERSAL ${original.journalNo}] ${dto.reason}`,
        status: JournalStatus.POSTED,
        postedAt: new Date(),
        postedBy: actorId,
        reversalOfId: original.id,
        totalDebit: original.totalCredit, // Menukar posisi total
        totalCredit: original.totalDebit,
        companyId: original.companyId,
      });

      const savedReversal = await manager.save(JournalEntryEntity, reversalJournal);

      // 8. Simpan Baris Jurnal Pembalik (Dibalik Debit <-> Kredit)
      const reversalLines: JournalLineEntity[] = original.lines.map((origLine, idx) => {
        return manager.create(JournalLineEntity, {
          journalEntryId: savedReversal.id,
          lineNo: idx + 1,
          accountId: origLine.accountId,
          debit: origLine.credit, // Balik
          credit: origLine.debit, // Balik
          description: `[REVERSAL] ${origLine.description || original.description}`,
          businessUnitId: origLine.businessUnitId,
          costCenterId: origLine.costCenterId,
          profitCenterId: origLine.profitCenterId,
          tripId: origLine.tripId,
          tripLegId: origLine.tripLegId,
          vehicleId: origLine.vehicleId,
          counterpartyType: origLine.counterpartyType,
          counterpartyId: origLine.counterpartyId,
        });
      });

      await manager.save(JournalLineEntity, reversalLines);

      // 9. Update Status Jurnal Asal menjadi REVERSED
      original.status = JournalStatus.REVERSED;
      await manager.save(JournalEntryEntity, original);

      // 10. Catat Accounting Event
      const eventKey = dto.idempotencyKey || `REVERSED_${original.id}_${savedReversal.id}`;
      const event = manager.create(AccountingEventEntity, {
        sourceType: original.sourceType,
        sourceId: original.sourceId || original.id,
        eventType: 'REVERSED',
        idempotencyKey: eventKey,
        journalEntryId: savedReversal.id,
      });
      await manager.save(AccountingEventEntity, event);

      // 11. Muat Jurnal Pembalik Lengkap
      return await manager.findOneOrFail(JournalEntryEntity, {
        where: { id: savedReversal.id },
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
    };

    if (entityManager) {
      return await executeReversal(entityManager);
    } else {
      return await this.dataSource.transaction(async (manager) => {
        return await executeReversal(manager);
      });
    }
  }
}
