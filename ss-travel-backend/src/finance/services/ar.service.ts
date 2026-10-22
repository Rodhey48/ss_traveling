import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  ArInvoiceEntity,
  ArInvoiceLineEntity,
  ArReceiptEntity,
  ArAllocationEntity,
  ArInvoiceStatus,
  ArReceiptStatus,
  ArSourceType,
  FinancePaymentMethod,
  AccountEntity,
  BankAccountEntity,
  CashAccountEntity,
  CustomerEntity,
  SpjEntity,
  JournalSourceType,
} from '../../@models';
import {
  CreateArInvoiceDto,
  CreateCharterPelunasanInvoiceDto,
  ArInvoiceQueryDto,
} from '../../@dto/finance/ar-invoice.dto';
import {
  CreateArReceiptDto,
  CreateDownPaymentReceiptDto,
  ArReceiptQueryDto,
} from '../../@dto/finance/ar-receipt.dto';
import { DocumentSequenceService } from './document-sequence.service';
import { AccountingPostingService } from './accounting-posting.service';
import { JournalReversalService } from './journal-reversal.service';
import { MoneyHelper } from '../../@common/helpers/money.helper';

@Injectable()
export class ArService {
  constructor(
    @InjectRepository(ArInvoiceEntity)
    private readonly invoiceRepo: Repository<ArInvoiceEntity>,
    @InjectRepository(ArInvoiceLineEntity)
    private readonly lineRepo: Repository<ArInvoiceLineEntity>,
    @InjectRepository(ArReceiptEntity)
    private readonly receiptRepo: Repository<ArReceiptEntity>,
    @InjectRepository(ArAllocationEntity)
    private readonly allocationRepo: Repository<ArAllocationEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepo: Repository<BankAccountEntity>,
    @InjectRepository(CashAccountEntity)
    private readonly cashAccountRepo: Repository<CashAccountEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    private readonly documentSequenceService: DocumentSequenceService,
    private readonly accountingPostingService: AccountingPostingService,
    private readonly journalReversalService: JournalReversalService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Penerimaan Uang Muka (DP) Sewa Wisata 30% (Skenario 2)
   * Debit: Bank BCA (11104) atau Kas Pool (11101)
   * Kredit: Pendapatan Diterima di Muka (24101)
   */
  async createDownPaymentReceipt(
    dto: CreateDownPaymentReceiptDto,
    actorId?: string,
  ): Promise<ArReceiptEntity> {
    // 1. Akun Liabilitas DP 24101
    const dpAccount = await this.accountRepo.findOne({
      where: { code: '24101' },
    });
    if (!dpAccount) {
      throw new NotFoundException('Akun 24101 Pendapatan Diterima di Muka (DP Sewa Wisata) tidak ditemukan.');
    }

    // 2. Akun Debit (Bank atau Kas)
    let debitAccountId: string;
    let paymentDesc = '';

    if (dto.paymentMethod === FinancePaymentMethod.BANK_TRANSFER) {
      if (!dto.bankAccountId) {
        throw new BadRequestException('ID Rekening Bank wajib diisi untuk transfer bank.');
      }
      const bank = await this.bankAccountRepo.findOne({
        where: { id: dto.bankAccountId },
      });
      if (!bank) throw new NotFoundException('Rekening bank tidak ditemukan.');
      debitAccountId = bank.accountId;
      paymentDesc = `Bank ${bank.bankName} (${bank.accountNumberMasked})`;
    } else {
      if (!dto.cashAccountId) {
        throw new BadRequestException('ID Kas Operasional wajib diisi untuk pembayaran tunai.');
      }
      const cash = await this.cashAccountRepo.findOne({
        where: { id: dto.cashAccountId },
      });
      if (!cash) throw new NotFoundException('Kas operasional tidak ditemukan.');
      debitAccountId = cash.accountId;
      paymentDesc = `Kas ${cash.name}`;
    }

    const receiptDate = new Date(dto.receiptDate);
    const yearMonth = `${String(receiptDate.getFullYear()).slice(-2)}${String(
      receiptDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    return await this.dataSource.transaction(async (manager) => {
      let receiptNo = await this.documentSequenceService.getNextDocumentNumber(
        'AR_RECEIPT',
        yearMonth,
        `RCT/AR/${yearMonth}`,
        4,
        undefined,
        manager,
      );

      let attempts = 0;
      while (attempts < 20) {
        const existing = await manager.findOne(ArReceiptEntity, {
          where: { receiptNo },
        });
        if (!existing) break;
        receiptNo = await this.documentSequenceService.getNextDocumentNumber(
          'AR_RECEIPT',
          yearMonth,
          `RCT/AR/${yearMonth}`,
          4,
          undefined,
          manager,
        );
        attempts++;
      }

      const receipt = manager.create(ArReceiptEntity, {
        receiptNo,
        customerId: dto.customerId,
        customerName: dto.customerName,
        receiptDate,
        paymentMethod: dto.paymentMethod,
        bankAccountId: dto.bankAccountId,
        cashAccountId: dto.cashAccountId,
        amount: dto.amount,
        status: ArReceiptStatus.CONFIRMED,
        reference: dto.reference,
        isDownPayment: true,
        downPaymentTripId: dto.downPaymentTripId,
        notes: dto.notes,
      });

      const savedReceipt = await manager.save(ArReceiptEntity, receipt);

      // Posting Jurnal Penerimaan DP (Skenario 2 Jurnal #1)
      const journalLines = [
        {
          lineNo: 1,
          accountId: debitAccountId,
          debit: dto.amount,
          credit: 0,
          description: `Penerimaan DP Sewa Wisata ${dto.customerName} via ${paymentDesc}`,
          tripId: dto.downPaymentTripId,
        },
        {
          lineNo: 2,
          accountId: dpAccount.id,
          debit: 0,
          credit: dto.amount,
          description: `Titipan DP Sewa Wisata (${savedReceipt.receiptNo}) - ${dto.customerName}`,
          tripId: dto.downPaymentTripId,
        },
      ];

      const journal = await this.accountingPostingService.postJournal(
        {
          journalDate: dto.receiptDate,
          sourceType: JournalSourceType.BANK_TRANSACTION,
          sourceId: savedReceipt.id,
          description: `Penerimaan DP Sewa Wisata: ${dto.customerName} (${savedReceipt.receiptNo})`,
          lines: journalLines,
          idempotencyKey: `AR-DP-${savedReceipt.id}`,
        },
        actorId,
        manager,
      );

      savedReceipt.journalEntryId = journal.id;
      return await manager.save(ArReceiptEntity, savedReceipt);
    });
  }

  /**
   * Penerbitan Invoice Pelunasan Sewa Wisata 70% (Skenario 2)
   */
  async createCharterPelunasanInvoice(
    dto: CreateCharterPelunasanInvoiceDto,
    actorId?: string,
  ): Promise<ArInvoiceEntity> {
    const spj = await this.spjRepo.findOne({
      where: { id: dto.tripId },
      relations: ['vehicle'],
    });

    if (!spj) {
      throw new NotFoundException(`SPJ Wisata '${dto.tripId}' tidak ditemukan.`);
    }

    // Akun Piutang Sewa Wisata 12101
    const arAccount = await this.accountRepo.findOne({
      where: { code: '12101' },
    });
    if (!arAccount) {
      throw new NotFoundException('Akun 12101 Piutang Sewa Charter Bus Wisata tidak ditemukan.');
    }

    const invoiceDate = new Date(dto.invoiceDate);
    const yearMonth = `${String(invoiceDate.getFullYear()).slice(-2)}${String(
      invoiceDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    return await this.dataSource.transaction(async (manager) => {
      let invoiceNo = await this.documentSequenceService.getNextDocumentNumber(
        'AR_INVOICE_CHARTER',
        yearMonth,
        `INV/WIS/${yearMonth}`,
        4,
        spj.companyId,
        manager,
      );

      let attempts = 0;
      while (attempts < 20) {
        const existing = await manager.findOne(ArInvoiceEntity, {
          where: { invoiceNo },
        });
        if (!existing) break;
        invoiceNo = await this.documentSequenceService.getNextDocumentNumber(
          'AR_INVOICE_CHARTER',
          yearMonth,
          `INV/WIS/${yearMonth}`,
          4,
          spj.companyId,
          manager,
        );
        attempts++;
      }

      const line = manager.create(ArInvoiceLineEntity, {
        lineNo: 1,
        description: `Pelunasan 70% Kontrak Sewa Wisata (${spj.spjNo})`,
        accountId: arAccount.id,
        qty: 1,
        unitPrice: dto.remainingAmount,
        amount: dto.remainingAmount,
        tripId: spj.id,
        vehicleId: spj.vehicleId,
      });

      const invoice = manager.create(ArInvoiceEntity, {
        companyId: spj.companyId,
        invoiceNo,
        customerId: dto.customerId,
        customerName: dto.customerName,
        invoiceDate,
        dueDate: new Date(dto.dueDate),
        status: ArInvoiceStatus.APPROVED, // Langsung disetujui untuk penagihan pelunasan
        currency: 'IDR',
        subtotal: dto.remainingAmount,
        taxAmount: 0,
        totalAmount: dto.remainingAmount,
        paidAmount: 0,
        sourceType: ArSourceType.CHARTER_CONTRACT,
        sourceId: spj.id,
        tripId: spj.id,
        arAccountId: arAccount.id,
        isDownPayment: false,
        notes: dto.notes,
        lines: [line],
      });

      return await manager.save(ArInvoiceEntity, invoice);
    });
  }

  /**
   * Pembuatan Invoice AR Umum
   */
  async createArInvoice(dto: CreateArInvoiceDto, actorId?: string): Promise<ArInvoiceEntity> {
    const arAccountId =
      dto.arAccountId ||
      (await this.accountRepo.findOne({ where: { code: '12101' } }))?.id;

    if (!arAccountId) {
      throw new NotFoundException('Akun Piutang 12101 tidak ditemukan.');
    }

    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Invoice AR harus memiliki minimal 1 baris rincian.');
    }

    const invoiceDate = new Date(dto.invoiceDate);
    const yearMonth = `${String(invoiceDate.getFullYear()).slice(-2)}${String(
      invoiceDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    return await this.dataSource.transaction(async (manager) => {
      const isCharter = dto.sourceType === ArSourceType.CHARTER_CONTRACT;
      const prefix = isCharter ? 'INV/WIS' : 'INV/AR';
      const docType = isCharter ? 'AR_INVOICE_CHARTER' : 'AR_INVOICE';
      let invoiceNo = await this.documentSequenceService.getNextDocumentNumber(
        docType,
        yearMonth,
        `${prefix}/${yearMonth}`,
        4,
        undefined,
        manager,
      );

      let attempts = 0;
      while (attempts < 20) {
        const existing = await manager.findOne(ArInvoiceEntity, {
          where: { invoiceNo },
        });
        if (!existing) break;
        invoiceNo = await this.documentSequenceService.getNextDocumentNumber(
          docType,
          yearMonth,
          `${prefix}/${yearMonth}`,
          4,
          undefined,
          manager,
        );
        attempts++;
      }

      let subtotal = 0;
      const lines: ArInvoiceLineEntity[] = [];

      for (let i = 0; i < dto.lines.length; i++) {
        const item = dto.lines[i];
        const lineAmount = parseFloat(MoneyHelper.mul(item.qty, item.unitPrice));
        subtotal = parseFloat(MoneyHelper.add(subtotal, lineAmount));

        const line = manager.create(ArInvoiceLineEntity, {
          lineNo: i + 1,
          description: item.description,
          accountId: item.accountId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          amount: lineAmount,
          tripId: item.tripId || dto.tripId,
          vehicleId: item.vehicleId,
          businessUnitId: item.businessUnitId,
          profitCenterId: item.profitCenterId,
        });

        lines.push(line);
      }

      const invoice = manager.create(ArInvoiceEntity, {
        invoiceNo,
        customerId: dto.customerId,
        customerName: dto.customerName,
        invoiceDate,
        dueDate: new Date(dto.dueDate),
        status: ArInvoiceStatus.DRAFT,
        currency: 'IDR',
        subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        paidAmount: 0,
        sourceType: dto.sourceType || ArSourceType.MANUAL,
        sourceId: dto.sourceId,
        tripId: dto.tripId,
        arAccountId,
        isDownPayment: dto.isDownPayment || false,
        notes: dto.notes,
        lines,
      });

      return await manager.save(ArInvoiceEntity, invoice);
    });
  }

  /**
   * Persetujuan Invoice AR
   */
  async approveArInvoice(id: string, actorId?: string): Promise<ArInvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice AR '${id}' tidak ditemukan.`);

    if (invoice.status !== ArInvoiceStatus.DRAFT) {
      throw new BadRequestException('Hanya invoice berstatus DRAFT yang dapat disetujui.');
    }

    invoice.status = ArInvoiceStatus.APPROVED;
    return await this.invoiceRepo.save(invoice);
  }

  /**
   * Penerimaan Pembayaran Piutang AR (Pelunasan via Bank / Kas)
   * Debit: Bank BCA (11104) atau Kas Pool (11101)
   * Kredit: Piutang Sewa Charter Bus Wisata (12101)
   */
  async createReceipt(dto: CreateArReceiptDto, actorId?: string): Promise<ArReceiptEntity> {
    let debitAccountId: string;
    let paymentAccountDesc = '';

    if (dto.paymentMethod === FinancePaymentMethod.BANK_TRANSFER) {
      if (!dto.bankAccountId) {
        throw new BadRequestException('ID Rekening Bank wajib diisi untuk transfer bank.');
      }
      const bank = await this.bankAccountRepo.findOne({
        where: { id: dto.bankAccountId },
      });
      if (!bank) throw new NotFoundException('Rekening bank tidak ditemukan.');
      debitAccountId = bank.accountId;
      paymentAccountDesc = `Bank ${bank.bankName} (${bank.accountNumberMasked})`;
    } else {
      if (!dto.cashAccountId) {
        throw new BadRequestException('ID Kas Operasional wajib diisi untuk pembayaran tunai.');
      }
      const cash = await this.cashAccountRepo.findOne({
        where: { id: dto.cashAccountId },
      });
      if (!cash) throw new NotFoundException('Kas operasional tidak ditemukan.');
      debitAccountId = cash.accountId;
      paymentAccountDesc = `Kas ${cash.name}`;
    }

    const receiptDate = new Date(dto.receiptDate);
    const yearMonth = `${String(receiptDate.getFullYear()).slice(-2)}${String(
      receiptDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    return await this.dataSource.transaction(async (manager) => {
      let receiptNo = await this.documentSequenceService.getNextDocumentNumber(
        'AR_RECEIPT',
        yearMonth,
        `RCT/AR/${yearMonth}`,
        4,
        undefined,
        manager,
      );

      let attempts = 0;
      while (attempts < 20) {
        const existing = await manager.findOne(ArReceiptEntity, {
          where: { receiptNo },
        });
        if (!existing) break;
        receiptNo = await this.documentSequenceService.getNextDocumentNumber(
          'AR_RECEIPT',
          yearMonth,
          `RCT/AR/${yearMonth}`,
          4,
          undefined,
          manager,
        );
        attempts++;
      }

      const receipt = manager.create(ArReceiptEntity, {
        receiptNo,
        customerId: dto.customerId,
        customerName: dto.customerName,
        receiptDate,
        paymentMethod: dto.paymentMethod,
        bankAccountId: dto.bankAccountId,
        cashAccountId: dto.cashAccountId,
        amount: dto.amount,
        status: ArReceiptStatus.CONFIRMED,
        reference: dto.reference,
        isDownPayment: false,
        downPaymentTripId: dto.downPaymentTripId,
        notes: dto.notes,
      });

      const savedReceipt = await manager.save(ArReceiptEntity, receipt);
      const journalLines: any[] = [];
      let lineNo = 1;

      // Baris Debit: Kas/Bank
      journalLines.push({
        lineNo: lineNo++,
        accountId: debitAccountId,
        debit: dto.amount,
        credit: 0,
        description: `Penerimaan Pelunasan Piutang ${dto.customerName} via ${paymentAccountDesc}`,
      });

      // Proses Alokasi ke Invoice (jika ada)
      if (dto.allocations && dto.allocations.length > 0) {
        for (const alloc of dto.allocations) {
          const invoice = await manager.findOne(ArInvoiceEntity, {
            where: { id: alloc.invoiceId },
          });

          if (!invoice) {
            throw new NotFoundException(`Invoice AR '${alloc.invoiceId}' tidak ditemukan.`);
          }

          const remaining = parseFloat(MoneyHelper.sub(invoice.totalAmount, invoice.paidAmount));
          if (MoneyHelper.isGreaterThan(alloc.amount, remaining)) {
            throw new BadRequestException(
              `Alokasi penerimaan Rp ${alloc.amount} melebihi sisa piutang Rp ${remaining} pada invoice '${invoice.invoiceNo}'.`,
            );
          }

          const allocation = manager.create(ArAllocationEntity, {
            receiptId: savedReceipt.id,
            invoiceId: invoice.id,
            amount: alloc.amount,
          });
          await manager.save(ArAllocationEntity, allocation);

          invoice.paidAmount = parseFloat(MoneyHelper.add(invoice.paidAmount, alloc.amount));
          if (MoneyHelper.isEqual(invoice.paidAmount, invoice.totalAmount)) {
            invoice.status = ArInvoiceStatus.PAID;
          } else {
            invoice.status = ArInvoiceStatus.PARTIALLY_PAID;
          }
          await manager.save(ArInvoiceEntity, invoice);

          // Baris Kredit: Menutup Piutang Usaha
          journalLines.push({
            lineNo: lineNo++,
            accountId: invoice.arAccountId,
            debit: 0,
            credit: alloc.amount,
            description: `Pelunasan Piutang Invoice ${invoice.invoiceNo} - ${invoice.customerName}`,
            tripId: invoice.tripId,
          });
        }
      } else {
        // Jika tidak dialokasikan ke invoice tertentu, kreditkan ke 12101 umum
        const defaultAr = await this.accountRepo.findOne({
          where: { code: '12101' },
        });
        if (defaultAr) {
          journalLines.push({
            lineNo: lineNo++,
            accountId: defaultAr.id,
            debit: 0,
            credit: dto.amount,
            description: `Penerimaan Kas/Bank Piutang ${dto.customerName}`,
          });
        }
      }

      // Posting Jurnal Pelunasan Piutang (Skenario 2 Jurnal #5)
      const journal = await this.accountingPostingService.postJournal(
        {
          journalDate: dto.receiptDate,
          sourceType: JournalSourceType.BANK_TRANSACTION,
          sourceId: savedReceipt.id,
          description: `Penerimaan Pembayaran Piutang AR: ${dto.customerName} (${receiptNo})`,
          lines: journalLines,
          idempotencyKey: `AR-RCT-${savedReceipt.id}`,
        },
        actorId,
        manager,
      );

      savedReceipt.journalEntryId = journal.id;
      return await manager.save(ArReceiptEntity, savedReceipt);
    });
  }

  /**
   * Kueri Daftar Invoice AR
   */
  async findAllInvoices(query: ArInvoiceQueryDto): Promise<{
    data: ArInvoiceEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.lines', 'lines')
      .leftJoinAndSelect('inv.customer', 'customer')
      .leftJoinAndSelect('inv.trip', 'trip')
      .leftJoinAndSelect('inv.arAccount', 'arAccount')
      .orderBy('inv.createdAt', 'DESC');

    if (query.customerId) {
      qb.andWhere('inv.customerId = :customerId', { customerId: query.customerId });
    }

    if (query.status) {
      qb.andWhere('inv.status = :status', { status: query.status });
    }

    if (query.isDownPayment !== undefined) {
      qb.andWhere('inv.isDownPayment = :isDownPayment', {
        isDownPayment: query.isDownPayment,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(inv.invoiceNo ILIKE :search OR inv.customerName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('inv.invoiceDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Detail Invoice AR
   */
  async findInvoiceById(id: string): Promise<ArInvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: [
        'lines',
        'lines.account',
        'customer',
        'trip',
        'arAccount',
        'allocations',
        'allocations.receipt',
        'journalEntry',
        'journalEntry.lines',
      ],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice AR dengan ID '${id}' tidak ditemukan.`);
    }

    return invoice;
  }

  /**
   * Kueri Riwayat Penerimaan / DP AR
   */
  async findAllReceipts(query: ArReceiptQueryDto): Promise<{
    data: ArReceiptEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.receiptRepo
      .createQueryBuilder('rct')
      .leftJoinAndSelect('rct.customer', 'customer')
      .leftJoinAndSelect('rct.downPaymentTrip', 'downPaymentTrip')
      .leftJoinAndSelect('rct.bankAccount', 'bankAccount')
      .leftJoinAndSelect('rct.cashAccount', 'cashAccount')
      .leftJoinAndSelect('rct.allocations', 'allocations')
      .leftJoinAndSelect('allocations.invoice', 'invoice')
      .orderBy('rct.receiptDate', 'DESC');

    if (query.customerId) {
      qb.andWhere('rct.customerId = :customerId', { customerId: query.customerId });
    }

    if (query.isDownPayment !== undefined) {
      qb.andWhere('rct.isDownPayment = :isDownPayment', {
        isDownPayment: query.isDownPayment,
      });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('rct.receiptDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Status Finansial Kontrak Sewa Wisata per SPJ
   */
  async getCharterContractStatus(tripId: string): Promise<{
    downPaymentReceived: number;
    totalInvoiced: number;
    totalPaid: number;
    remainingBalance: number;
    isFullyPaid: boolean;
  }> {
    const dpReceipts = await this.receiptRepo.find({
      where: { downPaymentTripId: tripId, status: ArReceiptStatus.CONFIRMED },
    });
    const dpTotal = dpReceipts.reduce<number>(
      (acc, curr) => parseFloat(MoneyHelper.add(acc, curr.amount)),
      0,
    );

    const invoices = await this.invoiceRepo.find({
      where: { tripId },
    });
    const totalInvoiced = invoices.reduce<number>(
      (acc, curr) => parseFloat(MoneyHelper.add(acc, curr.totalAmount)),
      0,
    );
    const totalPaid = invoices.reduce<number>(
      (acc, curr) => parseFloat(MoneyHelper.add(acc, curr.paidAmount)),
      0,
    );
    const remainingBalance = parseFloat(MoneyHelper.sub(totalInvoiced, totalPaid));

    return {
      downPaymentReceived: dpTotal,
      totalInvoiced,
      totalPaid,
      remainingBalance,
      isFullyPaid: MoneyHelper.isEqual(remainingBalance, 0) && totalInvoiced > 0,
    };
  }
}
