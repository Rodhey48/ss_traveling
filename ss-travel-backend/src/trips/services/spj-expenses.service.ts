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
  SpjExpensePaymentSource,
} from '../../@models/trips';
import {
  CreateSpjExpenseDto,
  VerifySpjExpenseDto,
} from '../../@dto/trips/spj-expense.dto';
import { MoneyHelper } from '../../@common/helpers/money.helper';
import { SpjUjService } from './spj-uj.service';

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
}
