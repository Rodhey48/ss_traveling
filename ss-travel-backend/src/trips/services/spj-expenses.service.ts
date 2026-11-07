import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SpjEntity,
  SpjExpenseEntity,
  SpjUjEntity,
  SpjUjExpenseEntity,
  SpjLegEntity,
  SpjExpensePaymentSource,
} from '../../@models/trips';
import {
  CreateSpjExpenseDto,
  VerifySpjExpenseDto,
} from '../../@dto/trips/spj-expense.dto';
import { MoneyHelper } from '../../@common/helpers/money.helper';
import { SpjUjService } from './spj-uj.service';
import { ApInvoiceLineEntity } from '../../@models/finance/ap-invoice-line.entity';
import { RestaurantEntity } from '../../@models/master-rules/restaurant.entity';

@Injectable()
export class SpjExpensesService {
  constructor(
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(SpjExpenseEntity)
    private readonly expenseRepo: Repository<SpjExpenseEntity>,
    @InjectRepository(SpjUjEntity)
    private readonly ujRepo: Repository<SpjUjEntity>,
    @InjectRepository(SpjUjExpenseEntity)
    private readonly ujExpenseRepo: Repository<SpjUjExpenseEntity>,
    @InjectRepository(SpjLegEntity)
    private readonly legRepo: Repository<SpjLegEntity>,
    @InjectRepository(ApInvoiceLineEntity)
    private readonly apInvoiceLineRepo: Repository<ApInvoiceLineEntity>,
    @InjectRepository(RestaurantEntity)
    private readonly restaurantRepo: Repository<RestaurantEntity>,
    private readonly ujService: SpjUjService,
  ) {}

  /**
   * Menampilkan seluruh pengeluaran operasional pada SPJ terkait
   */
  async findBySpjId(spjId: string): Promise<SpjExpenseEntity[]> {
    return this.expenseRepo.find({
      where: { spjId },
      relations: ['vehicle', 'verifier', 'spjLeg', 'ujExpenses'],
      order: {
        expenseDate: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Menambahkan pengeluaran operasional perjalanan (BBM, Tol, Parkir, Tambal Ban, dll.)
   */
  async create(
    spjId: string,
    dto: CreateSpjExpenseDto,
    userId: string,
  ): Promise<SpjExpenseEntity> {
    const spj = await this.spjRepo.findOne({
      where: { id: spjId },
      relations: ['crewAssignments'],
    });

    if (!spj) {
      throw new NotFoundException(`SPJ dengan ID '${spjId}' tidak ditemukan.`);
    }

    const amount = MoneyHelper.toAmount(dto.amount);
    if (MoneyHelper.toDecimal(amount).lte(0)) {
      throw new BadRequestException('Nominal biaya pengeluaran harus lebih besar dari 0.');
    }

    const vehicleId = dto.vehicleId || spj.vehicleId;
    const paymentSource = dto.paymentSource || SpjExpensePaymentSource.UJ;

    const expense = this.expenseRepo.create({
      companyId: spj.companyId,
      spjId,
      spjLegId: dto.spjLegId,
      vehicleId,
      expenseType: dto.expenseType,
      amount,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
      paymentSource,
      fuelLiters: dto.fuelLiters,
      odometerKm: dto.odometerKm,
      fuelStation: dto.fuelStation,
      receiptNumber: dto.receiptNumber,
      receiptUrl: dto.receiptUrl,
      notes: dto.notes,
    });

    const savedExpense = await this.expenseRepo.save(expense);

    // Jika dibayar menggunakan uang jalan kru (UJ), otomatis potong saldo UJ
    if (paymentSource === SpjExpensePaymentSource.UJ) {
      const uj = await this.ujService.getOrCreateUj(spjId);

      const ujExpense = this.ujExpenseRepo.create({
        spjUjId: uj.id,
        expenseId: savedExpense.id,
        amount,
        receiptRef: dto.receiptNumber,
        notes: dto.notes,
      });
      await this.ujExpenseRepo.save(ujExpense);

      uj.totalSpent = MoneyHelper.add(uj.totalSpent, amount);
      uj.balance = MoneyHelper.sub(
        MoneyHelper.sub(uj.totalDisbursed, uj.totalSpent),
        uj.totalReturned,
      );
      await this.ujRepo.update(uj.id, {
        totalSpent: uj.totalSpent,
        balance: uj.balance,
      });
    }

    return savedExpense;
  }

  /**
   * Verifikasi pengeluaran oleh Kasir / Staff Akuntansi
   */
  async verify(
    expenseId: string,
    dto: VerifySpjExpenseDto,
    userId: string,
  ): Promise<SpjExpenseEntity> {
    const expense = await this.expenseRepo.findOne({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new NotFoundException(`Pengeluaran ID '${expenseId}' tidak ditemukan.`);
    }

    expense.status = dto.status;
    expense.verifiedBy = userId;
    expense.verifiedAt = new Date();
    if (dto.notes) {
      expense.notes = expense.notes ? `${expense.notes} | ${dto.notes}` : dto.notes;
    }

    return this.expenseRepo.save(expense);
  }

  /**
   * Membatalkan / menghapus catatan pengeluaran
   */
  async delete(expenseId: string, userId: string): Promise<{ success: boolean }> {
    const expense = await this.expenseRepo.findOne({
      where: { id: expenseId },
      relations: ['ujExpenses'],
    });

    if (!expense) {
      throw new NotFoundException(`Pengeluaran ID '${expenseId}' tidak ditemukan.`);
    }

    // Jika tadinya memotong UJ, kembalikan saldo UJ
    if (expense.paymentSource === SpjExpensePaymentSource.UJ) {
      const uj = await this.ujRepo.findOne({ where: { spjId: expense.spjId } });
      if (uj) {
        await this.ujExpenseRepo.delete({ expenseId });
        uj.totalSpent = MoneyHelper.sub(uj.totalSpent, expense.amount);
        uj.balance = MoneyHelper.sub(
          MoneyHelper.sub(uj.totalDisbursed, uj.totalSpent),
          uj.totalReturned,
        );
        await this.ujRepo.update(uj.id, {
          totalSpent: uj.totalSpent,
          balance: uj.balance,
        });
      }
    }

    await this.expenseRepo.remove(expense);
    return { success: true };
  }

  /**
   * Mengambil status servis makan penumpang dan tagihan invoice AP rumah makan mitra (Skenario 1)
   */
  async getMealServiceStatus(spjId: string): Promise<any> {
    const spj = await this.spjRepo.findOne({
      where: { id: spjId },
      relations: ['legs'],
    });

    if (!spj) {
      throw new NotFoundException(`SPJ ID '${spjId}' tidak ditemukan.`);
    }

    const apLines = await this.apInvoiceLineRepo.find({
      where: { tripId: spjId },
      relations: ['invoice'],
    });

    const restaurants = await this.restaurantRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const isBilled = apLines.length > 0;
    const billedDetails = apLines.map((line) => ({
      lineId: line.id,
      invoiceId: line.invoice?.id,
      billNo: line.invoice?.billNo,
      vendorInvoiceNo: line.invoice?.vendorInvoiceNo,
      vendorName: line.invoice?.vendorName,
      invoiceDate: line.invoice?.invoiceDate,
      invoiceStatus: line.invoice?.status,
      manifestPaxCount: line.manifestPaxCount,
      couponCount: line.couponCount,
      amount: line.amount,
      discrepancyNotes: line.discrepancyNotes,
    }));

    return {
      spjId,
      spjNo: spj.spjNo,
      isBilled,
      billedDetails,
      legs: spj.legs?.sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0)) || [],
      restaurants,
    };
  }

  /**
   * Mencatat / memperbarui jumlah kupon makan riil yang ditukarkan penumpang pada leg SPJ
   */
  async updateLegMealService(
    spjId: string,
    legId: string,
    mealPaxCount: number,
    discrepancyNotes?: string,
  ): Promise<SpjLegEntity> {
    const leg = await this.legRepo.findOne({
      where: { id: legId, spjId },
    });

    if (!leg) {
      throw new NotFoundException(`Leg SPJ ID '${legId}' tidak ditemukan.`);
    }

    leg.mealPaxCount = Number(mealPaxCount) || 0;
    if (discrepancyNotes !== undefined) {
      leg.mealDiscrepancyNotes = discrepancyNotes || '';
    }

    return this.legRepo.save(leg);
  }
}
