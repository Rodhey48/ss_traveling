import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, SelectQueryBuilder } from 'typeorm';
import {
  ApInvoiceEntity,
  ApInvoiceLineEntity,
  ApPaymentEntity,
  ApAllocationEntity,
  ApVendorType,
  ApInvoiceStatus,
  ApPaymentStatus,
  ApSourceType,
  FinancePaymentMethod,
  AccountEntity,
  BankAccountEntity,
  CashAccountEntity,
  RestaurantEntity,
  SpjEntity,
  SpjLegEntity,
  JournalSourceType,
} from '../../@models';
import {
  CreateApInvoiceDto,
  CreateRestaurantBillDto,
  ApInvoiceQueryDto,
} from '../../@dto/finance/ap-invoice.dto';
import {
  CreateApPaymentDto,
  ApPaymentQueryDto,
} from '../../@dto/finance/ap-payment.dto';
import { DocumentSequenceService } from './document-sequence.service';
import { AccountingPostingService } from './accounting-posting.service';
import { JournalReversalService } from './journal-reversal.service';
import { MoneyHelper } from '../../@common/helpers/money.helper';

@Injectable()
export class ApService {
  constructor(
    @InjectRepository(ApInvoiceEntity)
    private readonly invoiceRepo: Repository<ApInvoiceEntity>,
    @InjectRepository(ApInvoiceLineEntity)
    private readonly lineRepo: Repository<ApInvoiceLineEntity>,
    @InjectRepository(ApPaymentEntity)
    private readonly paymentRepo: Repository<ApPaymentEntity>,
    @InjectRepository(ApAllocationEntity)
    private readonly allocationRepo: Repository<ApAllocationEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepo: Repository<BankAccountEntity>,
    @InjectRepository(CashAccountEntity)
    private readonly cashAccountRepo: Repository<CashAccountEntity>,
    @InjectRepository(RestaurantEntity)
    private readonly restaurantRepo: Repository<RestaurantEntity>,
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(SpjLegEntity)
    private readonly spjLegRepo: Repository<SpjLegEntity>,
    private readonly documentSequenceService: DocumentSequenceService,
    private readonly accountingPostingService: AccountingPostingService,
    private readonly journalReversalService: JournalReversalService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Cari semua SPJ AKAP yang belum pernah ditagihkan oleh restoran mitra tertentu (Anti-Double Billing)
   */
  async findUnbilledSpjsForRestaurant(restaurantId: string): Promise<any[]> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException(`Restoran dengan ID '${restaurantId}' tidak ditemukan.`);
    }

    // 1. Ambil semua trip_id yang sudah pernah ditagihkan di ap_invoice_lines untuk vendor restoran ini (status non-CANCELLED)
    const billedLineQuery = this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.invoice', 'inv')
      .where('inv.vendorId = :vendorId', { vendorId: restaurantId })
      .andWhere('inv.status != :cancelledStatus', {
        cancelledStatus: ApInvoiceStatus.CANCELLED,
      })
      .andWhere('line.tripId IS NOT NULL')
      .select('line.tripId', 'tripId');

    const billedResults = await billedLineQuery.getRawMany();
    const billedTripIds: string[] = billedResults.map((r) => r.tripId);

    // 2. Kueri SPJ AKAP
    const spjQuery = this.spjRepo
      .createQueryBuilder('spj')
      .leftJoinAndSelect('spj.vehicle', 'vehicle')
      .leftJoinAndSelect('spj.legs', 'legs')
      .leftJoinAndSelect('spj.crewAssignments', 'crewAssignments')
      .leftJoinAndSelect('crewAssignments.crew', 'crew')
      .where('spj.serviceType = :serviceType', { serviceType: 'AKAP' })
      .orderBy('spj.createdAt', 'DESC');

    if (billedTripIds.length > 0) {
      spjQuery.andWhere('spj.id NOT IN (:...billedTripIds)', { billedTripIds });
    }

    const availableSpjs = await spjQuery.getMany();

    return availableSpjs.map((spj) => {
      // Ambil leg pertama atau leg yang relevan
      const firstLeg = spj.legs && spj.legs.length > 0 ? spj.legs[0] : null;
      const driver = spj.crewAssignments?.find((ca) => ca.role === 'DRIVER')?.crew?.name || '-';

      const manifestCount = firstLeg?.passengerCount || 0;
      const mealPaxCount = firstLeg?.mealPaxCount || manifestCount;
      const discrepancyNotes = firstLeg?.mealDiscrepancyNotes || null;

      return {
        tripId: spj.id,
        tripLegId: firstLeg?.id || null,
        spjNo: spj.spjNo,
        departureDate: firstLeg?.departureAt || spj.createdAt,
        vehiclePlate: spj.vehicle?.plateNumber || '-',
        vehicleCode: spj.vehicle?.code || '-',
        driverName: driver,
        manifestPaxCount: manifestCount,
        suggestedCouponCount: mealPaxCount,
        discrepancyNotes,
        ratePerPax: restaurant.ratePerPax,
        suggestedSubtotal: parseFloat(
          MoneyHelper.mul(mealPaxCount, restaurant.ratePerPax),
        ),
      };
    });
  }

  /**
   * Membuat tagihan berkala servis makan restoran mitra (Skenario 1)
   */
  async createRestaurantBill(
    dto: CreateRestaurantBillDto,
    actorId?: string,
  ): Promise<ApInvoiceEntity> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException(`Restoran mitra '${dto.restaurantId}' tidak ditemukan.`);
    }

    // Akun Utang Restoran Mitra 21101
    const apAccount = await this.accountRepo.findOne({
      where: { code: '21101' },
    });
    if (!apAccount) {
      throw new NotFoundException(`Akun Utang 21101 Utang Vendor Restoran Mitra tidak ditemukan.`);
    }

    // Akun Beban Servis Makan 51102
    const expenseAccount = await this.accountRepo.findOne({
      where: { code: '51102' },
    });
    if (!expenseAccount) {
      throw new NotFoundException(`Akun Beban 51102 Beban Servis Makan Penumpang tidak ditemukan.`);
    }

    // Validasi Anti-Double Billing
    const tripIds = dto.spjItems.map((item) => item.tripId);
    const existingBilled = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.invoice', 'inv')
      .where('inv.vendorId = :vendorId', { vendorId: dto.restaurantId })
      .andWhere('inv.status != :cancelled', { cancelled: ApInvoiceStatus.CANCELLED })
      .andWhere('line.tripId IN (:...tripIds)', { tripIds })
      .getMany();

    if (existingBilled.length > 0) {
      throw new ConflictException(
        `Salah satu atau lebih SPJ yang dipilih sudah pernah ditagihkan oleh restoran ini.`,
      );
    }

    // Ambil data SPJ untuk informasi kendaraan dan bisnis
    const spjs = await this.spjRepo.find({
      where: { id: In(tripIds) },
      relations: ['vehicle', 'legs'],
    });
    const spjMap = new Map<string, SpjEntity>();
    spjs.forEach((s) => spjMap.set(s.id, s));

    const invoiceDate = new Date(dto.invoiceDate);
    const yearMonth = `${String(invoiceDate.getFullYear()).slice(-2)}${String(
      invoiceDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    return await this.dataSource.transaction(async (manager) => {
      let billNo = await this.documentSequenceService.getNextDocumentNumber(
        'AP_INVOICE',
        yearMonth,
        `BILL/${yearMonth}`,
        4,
        restaurant.companyId,
        manager,
      );

      let attempts = 0;
      while (attempts < 20) {
        const existing = await manager.findOne(ApInvoiceEntity, {
          where: { billNo },
        });
        if (!existing) break;
        billNo = await this.documentSequenceService.getNextDocumentNumber(
          'AP_INVOICE',
          yearMonth,
          `BILL/${yearMonth}`,
          4,
          restaurant.companyId,
          manager,
        );
        attempts++;
      }

      let subtotal = 0;
      const lines: ApInvoiceLineEntity[] = [];

      for (let i = 0; i < dto.spjItems.length; i++) {
        const item = dto.spjItems[i];
        const spj = spjMap.get(item.tripId);
        const leg = spj?.legs?.find((l) => (item.tripLegId ? l.id === item.tripLegId : true)) || spj?.legs?.[0];

        const manifestPax = leg?.passengerCount || 0;
        const lineAmount = parseFloat(MoneyHelper.mul(item.couponCount, restaurant.ratePerPax));
        subtotal = parseFloat(MoneyHelper.add(subtotal, lineAmount));

        // Warning catatan jika kupon > manifes
        let discNote = item.discrepancyNotes;
        if (!discNote && item.couponCount > manifestPax) {
          discNote = `Peringatan: Kupon (${item.couponCount}) melebihi manifes fisik (${manifestPax}).`;
        }

        const line = manager.create(ApInvoiceLineEntity, {
          lineNo: i + 1,
          description: `Servis Makan Penumpang ${restaurant.name} - ${spj?.spjNo || '-'}`,
          accountId: expenseAccount.id,
          qty: item.couponCount,
          unitPrice: restaurant.ratePerPax,
          amount: lineAmount,
          tripId: item.tripId,
          tripLegId: item.tripLegId || leg?.id,
          vehicleId: spj?.vehicleId,
          manifestPaxCount: manifestPax,
          couponCount: item.couponCount,
          discrepancyNotes: discNote,
        });

        lines.push(line);
      }

      const invoice = manager.create(ApInvoiceEntity, {
        companyId: restaurant.companyId,
        billNo,
        vendorInvoiceNo: dto.vendorInvoiceNo,
        vendorType: ApVendorType.RESTAURANT,
        vendorId: restaurant.id,
        vendorName: restaurant.name,
        invoiceDate: new Date(dto.invoiceDate),
        dueDate: new Date(dto.dueDate),
        status: ApInvoiceStatus.DRAFT,
        currency: 'IDR',
        subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        paidAmount: 0,
        sourceType: ApSourceType.RESTAURANT_PERIODIC,
        apAccountId: apAccount.id,
        notes: dto.notes,
        lines,
      });

      return await manager.save(ApInvoiceEntity, invoice);
    });
  }

  /**
   * Pembuatan tagihan AP umum (Bengkel, Derek Tol Skenario 3, Komisi Agen, dll)
   */
  async createApInvoice(dto: CreateApInvoiceDto, actorId?: string): Promise<ApInvoiceEntity> {
    const apAccount = await this.accountRepo.findOne({
      where: { id: dto.apAccountId },
    });
    if (!apAccount) {
      throw new NotFoundException(`Akun Utang '${dto.apAccountId}' tidak ditemukan.`);
    }

    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Tagihan AP harus memiliki minimal 1 baris rincian.');
    }

    const invoiceDate = new Date(dto.invoiceDate);
    const yearMonth = `${String(invoiceDate.getFullYear()).slice(-2)}${String(
      invoiceDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    return await this.dataSource.transaction(async (manager) => {
      let billNo = await this.documentSequenceService.getNextDocumentNumber(
        'AP_INVOICE',
        yearMonth,
        `BILL/${yearMonth}`,
        4,
        undefined,
        manager,
      );

      let attempts = 0;
      while (attempts < 20) {
        const existing = await manager.findOne(ApInvoiceEntity, {
          where: { billNo },
        });
        if (!existing) break;
        billNo = await this.documentSequenceService.getNextDocumentNumber(
          'AP_INVOICE',
          yearMonth,
          `BILL/${yearMonth}`,
          4,
          undefined,
          manager,
        );
        attempts++;
      }

      let subtotal = 0;
      const lines: ApInvoiceLineEntity[] = [];

      for (let i = 0; i < dto.lines.length; i++) {
        const item = dto.lines[i];
        const lineAmount = parseFloat(MoneyHelper.mul(item.qty, item.unitPrice));
        subtotal = parseFloat(MoneyHelper.add(subtotal, lineAmount));

        const line = manager.create(ApInvoiceLineEntity, {
          lineNo: i + 1,
          description: item.description,
          accountId: item.accountId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          amount: lineAmount,
          tripId: item.tripId,
          tripLegId: item.tripLegId,
          vehicleId: item.vehicleId,
          costCenterId: item.costCenterId,
          businessUnitId: item.businessUnitId,
          manifestPaxCount: item.manifestPaxCount,
          couponCount: item.couponCount,
          discrepancyNotes: item.discrepancyNotes,
        });

        lines.push(line);
      }

      const invoice = manager.create(ApInvoiceEntity, {
        billNo,
        vendorInvoiceNo: dto.vendorInvoiceNo,
        vendorType: dto.vendorType,
        vendorId: dto.vendorId,
        vendorName: dto.vendorName,
        invoiceDate: new Date(dto.invoiceDate),
        dueDate: new Date(dto.dueDate),
        status: ApInvoiceStatus.DRAFT,
        currency: 'IDR',
        subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        paidAmount: 0,
        sourceType: dto.sourceType || ApSourceType.MANUAL,
        sourceId: dto.sourceId,
        apAccountId: dto.apAccountId,
        notes: dto.notes,
        lines,
      });

      return await manager.save(ApInvoiceEntity, invoice);
    });
  }

  /**
   * Persetujuan Tagihan AP & Posting Jurnal Utang Atomik
   * Debit: Beban-beban (51102 / 55101 / 54101)
   * Kredit: Utang Usaha Vendor (21101 / 21102 / 22101)
   */
  async approveApInvoice(id: string, actorId?: string): Promise<ApInvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['lines', 'apAccount'],
    });

    if (!invoice) {
      throw new NotFoundException(`Tagihan AP dengan ID '${id}' tidak ditemukan.`);
    }

    if (invoice.status !== ApInvoiceStatus.DRAFT) {
      throw new BadRequestException(`Hanya tagihan berstatus DRAFT yang dapat disetujui.`);
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Susun baris jurnal posting
      const journalLines: any[] = [];
      let lineNo = 1;

      // Baris-baris Debit (Beban)
      for (const line of invoice.lines || []) {
        journalLines.push({
          lineNo: lineNo++,
          accountId: line.accountId,
          debit: line.amount,
          credit: 0,
          description: line.description,
          tripId: line.tripId,
          tripLegId: line.tripLegId,
          vehicleId: line.vehicleId,
          costCenterId: line.costCenterId,
          businessUnitId: line.businessUnitId,
        });
      }

      // Baris Kredit (Utang Usaha Vendor)
      journalLines.push({
        lineNo: lineNo++,
        accountId: invoice.apAccountId,
        debit: 0,
        credit: invoice.totalAmount,
        description: `Utang ${invoice.vendorName} (${invoice.vendorInvoiceNo || invoice.billNo})`,
      });

      // 2. Eksekusi posting satu pintu
      const journalDateStr =
        invoice.invoiceDate instanceof Date
          ? invoice.invoiceDate.toISOString()
          : String(invoice.invoiceDate);

      const journal = await this.accountingPostingService.postJournal(
        {
          journalDate: journalDateStr,
          sourceType: JournalSourceType.AP_INVOICE,
          sourceId: invoice.id,
          description: `Pengakuan Tagihan Vendor: ${invoice.vendorName} (${invoice.billNo})`,
          lines: journalLines,
          idempotencyKey: `AP-INV-${invoice.id}`,
        },
        actorId,
        manager,
      );

      // 3. Update status invoice
      invoice.status = ApInvoiceStatus.APPROVED;
      invoice.journalEntryId = journal.id;

      return await manager.save(ApInvoiceEntity, invoice);
    });
  }

  /**
   * Pembatalan Tagihan AP
   */
  async cancelApInvoice(id: string, reason?: string, actorId?: string): Promise<ApInvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Tagihan AP '${id}' tidak ditemukan.`);
    }

    if (MoneyHelper.isGreaterThan(invoice.paidAmount, 0)) {
      throw new BadRequestException('Tagihan yang sudah memiliki riwayat pembayaran tidak dapat dibatalkan.');
    }

    if (invoice.status === ApInvoiceStatus.CANCELLED) {
      throw new BadRequestException('Tagihan ini sudah dibatalkan sebelumnya.');
    }

    return await this.dataSource.transaction(async (manager) => {
      if (invoice.status === ApInvoiceStatus.APPROVED && invoice.journalEntryId) {
        await this.journalReversalService.reverseJournal(
          invoice.journalEntryId,
          {
            reason: reason || 'Pembatalan Tagihan Vendor AP',
            reversalDate: new Date().toISOString(),
          },
          actorId,
          manager,
        );
      }

      invoice.status = ApInvoiceStatus.CANCELLED;
      return await manager.save(ApInvoiceEntity, invoice);
    });
  }

  /**
   * Pembayaran Tagihan AP (Kasir Pool / Transfer Bank Korporat)
   * Debit: Utang Usaha Vendor (21101 / 21102 / 22101)
   * Kredit: Bank BCA (11104) atau Kas Pool (11101)
   */
  async createPayment(dto: CreateApPaymentDto, actorId?: string): Promise<ApPaymentEntity> {
    if (!dto.allocations || dto.allocations.length === 0) {
      throw new BadRequestException('Pembayaran harus dialokasikan minimal ke 1 tagihan AP.');
    }

    const totalAllocated = dto.allocations.reduce<number>(
      (acc, curr) => parseFloat(MoneyHelper.add(acc, curr.amount)),
      0,
    );

    if (!MoneyHelper.isEqual(totalAllocated, dto.amount)) {
      throw new BadRequestException(
        `Total alokasi (Rp ${totalAllocated}) harus persis sama dengan jumlah pembayaran (Rp ${dto.amount}).`,
      );
    }

    // Tentukan akun kredit (Bank atau Kas)
    let creditAccountId: string;
    let paymentAccountDesc = '';

    if (dto.paymentMethod === FinancePaymentMethod.BANK_TRANSFER) {
      if (!dto.bankAccountId) {
        throw new BadRequestException('ID Rekening Bank wajib diisi untuk transfer bank.');
      }
      const bank = await this.bankAccountRepo.findOne({
        where: { id: dto.bankAccountId },
      });
      if (!bank) throw new NotFoundException('Rekening bank tidak ditemukan.');
      creditAccountId = bank.accountId;
      paymentAccountDesc = `Bank ${bank.bankName} (${bank.accountNumberMasked})`;
    } else {
      if (!dto.cashAccountId) {
        throw new BadRequestException('ID Kas Operasional wajib diisi untuk pembayaran tunai.');
      }
      const cash = await this.cashAccountRepo.findOne({
        where: { id: dto.cashAccountId },
      });
      if (!cash) throw new NotFoundException('Kas operasional tidak ditemukan.');
      creditAccountId = cash.accountId;
      paymentAccountDesc = `Kas ${cash.name}`;
    }

    const paymentDate = new Date(dto.paymentDate);
    const yearMonth = `${String(paymentDate.getFullYear()).slice(-2)}${String(
      paymentDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    return await this.dataSource.transaction(async (manager) => {
      let paymentNo = await this.documentSequenceService.getNextDocumentNumber(
        'AP_PAYMENT',
        yearMonth,
        `PAY/AP/${yearMonth}`,
        4,
        undefined,
        manager,
      );

      let attempts = 0;
      while (attempts < 20) {
        const existing = await manager.findOne(ApPaymentEntity, {
          where: { paymentNo },
        });
        if (!existing) break;
        paymentNo = await this.documentSequenceService.getNextDocumentNumber(
          'AP_PAYMENT',
          yearMonth,
          `PAY/AP/${yearMonth}`,
          4,
          undefined,
          manager,
        );
        attempts++;
      }

      const journalLines: any[] = [];
      let lineNo = 1;

      // Buat Payment Header
      const payment = manager.create(ApPaymentEntity, {
        paymentNo,
        vendorType: dto.vendorType,
        vendorId: dto.vendorId,
        vendorName: dto.vendorName,
        paymentDate,
        paymentMethod: dto.paymentMethod,
        bankAccountId: dto.bankAccountId,
        cashAccountId: dto.cashAccountId,
        amount: dto.amount,
        status: ApPaymentStatus.CONFIRMED,
        reference: dto.reference,
        notes: dto.notes,
      });

      const savedPayment = await manager.save(ApPaymentEntity, payment);

      // Proses Alokasi Tagihan & Baris Jurnal
      for (const alloc of dto.allocations) {
        const invoice = await manager.findOne(ApInvoiceEntity, {
          where: { id: alloc.invoiceId },
        });

        if (!invoice) {
          throw new NotFoundException(`Tagihan AP '${alloc.invoiceId}' tidak ditemukan.`);
        }

        if (
          invoice.status !== ApInvoiceStatus.APPROVED &&
          invoice.status !== ApInvoiceStatus.PARTIALLY_PAID
        ) {
          throw new BadRequestException(
            `Tagihan '${invoice.billNo}' tidak dalam status dapat dibayar (${invoice.status}).`,
          );
        }

        const remaining = parseFloat(MoneyHelper.sub(invoice.totalAmount, invoice.paidAmount));
        if (MoneyHelper.isGreaterThan(alloc.amount, remaining)) {
          throw new BadRequestException(
            `Alokasi pembayaran Rp ${alloc.amount} melebihi sisa tagihan Rp ${remaining} pada faktur '${invoice.billNo}'.`,
          );
        }

        // Simpan baris alokasi
        const allocation = manager.create(ApAllocationEntity, {
          paymentId: savedPayment.id,
          invoiceId: invoice.id,
          amount: alloc.amount,
        });
        await manager.save(ApAllocationEntity, allocation);

        // Update tagihan
        invoice.paidAmount = parseFloat(MoneyHelper.add(invoice.paidAmount, alloc.amount));
        if (MoneyHelper.isEqual(invoice.paidAmount, invoice.totalAmount)) {
          invoice.status = ApInvoiceStatus.PAID;
        } else {
          invoice.status = ApInvoiceStatus.PARTIALLY_PAID;
        }
        await manager.save(ApInvoiceEntity, invoice);

        // Baris Debit Jurnal (Menutup Utang Usaha)
        journalLines.push({
          lineNo: lineNo++,
          accountId: invoice.apAccountId,
          debit: alloc.amount,
          credit: 0,
          description: `Pelunasan Utang ${invoice.billNo} - ${invoice.vendorName}`,
        });
      }

      // Baris Kredit Jurnal (Kas/Bank)
      journalLines.push({
        lineNo: lineNo++,
        accountId: creditAccountId,
        debit: 0,
        credit: dto.amount,
        description: `Pembayaran Utang Vendor via ${paymentAccountDesc}`,
      });

      // Posting Jurnal Pembayaran
      const journal = await this.accountingPostingService.postJournal(
        {
          journalDate: dto.paymentDate,
          sourceType: JournalSourceType.BANK_TRANSACTION,
          sourceId: savedPayment.id,
          description: `Pembayaran Utang Vendor: ${dto.vendorName} (${paymentNo})`,
          lines: journalLines,
          idempotencyKey: `AP-PAY-${savedPayment.id}`,
        },
        actorId,
        manager,
      );

      savedPayment.journalEntryId = journal.id;
      return await manager.save(ApPaymentEntity, savedPayment);
    });
  }

  /**
   * Kueri Daftar Tagihan AP
   */
  async findAllInvoices(query: ApInvoiceQueryDto): Promise<{
    data: ApInvoiceEntity[];
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
      .leftJoinAndSelect('inv.apAccount', 'apAccount')
      .leftJoinAndSelect('lines.account', 'lineAccount')
      .leftJoinAndSelect('lines.trip', 'trip')
      .leftJoinAndSelect('lines.vehicle', 'vehicle')
      .orderBy('inv.createdAt', 'DESC');

    if (query.vendorType) {
      qb.andWhere('inv.vendorType = :vendorType', { vendorType: query.vendorType });
    }

    if (query.status) {
      qb.andWhere('inv.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        '(inv.billNo ILIKE :search OR inv.vendorInvoiceNo ILIKE :search OR inv.vendorName ILIKE :search)',
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
   * Detail Tagihan AP
   */
  async findInvoiceById(id: string): Promise<ApInvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: [
        'lines',
        'lines.account',
        'lines.trip',
        'lines.vehicle',
        'apAccount',
        'allocations',
        'allocations.payment',
        'journalEntry',
        'journalEntry.lines',
      ],
    });

    if (!invoice) {
      throw new NotFoundException(`Tagihan AP dengan ID '${id}' tidak ditemukan.`);
    }

    return invoice;
  }

  /**
   * Kueri Riwayat Pembayaran AP
   */
  async findAllPayments(query: ApPaymentQueryDto): Promise<{
    data: ApPaymentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.paymentRepo
      .createQueryBuilder('pay')
      .leftJoinAndSelect('pay.allocations', 'allocations')
      .leftJoinAndSelect('allocations.invoice', 'invoice')
      .leftJoinAndSelect('pay.bankAccount', 'bankAccount')
      .leftJoinAndSelect('pay.cashAccount', 'cashAccount')
      .orderBy('pay.paymentDate', 'DESC');

    if (query.vendorType) {
      qb.andWhere('pay.vendorType = :vendorType', { vendorType: query.vendorType });
    }

    if (query.paymentMethod) {
      qb.andWhere('pay.paymentMethod = :paymentMethod', {
        paymentMethod: query.paymentMethod,
      });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('pay.paymentDate BETWEEN :startDate AND :endDate', {
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
}
