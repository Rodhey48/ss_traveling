import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SpjEntity,
  CrewMealPaymentEntity,
  SpjCrewAssignmentEntity,
  CrewMealPaymentCategory,
  CrewMealPaymentStatus,
  CrewPayoutTiming,
  SpjPaymentMethod,
} from '../../@models/trips';
import { AccountEntity } from '../../@models/finance/account.entity';
import { BankAccountEntity } from '../../@models/finance/bank-account.entity';
import { CashAccountEntity } from '../../@models/finance/cash-account.entity';
import { AccountingPostingService } from '../../finance/services/accounting-posting.service';
import { JournalSourceType } from '../../@models/finance/journal-entry.entity';
import {
  CreateCrewMealPaymentDto,
  DisburseEarlyMealPaymentDto,
  AddPerpalPaymentDto,
  ClaimFullSeatBonusDto,
} from '../../@dto/trips/crew-meal-payment.dto';
import { MoneyHelper } from '../../@common/helpers/money.helper';

@Injectable()
export class CrewMealPaymentsService {
  constructor(
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(CrewMealPaymentEntity)
    private readonly paymentRepo: Repository<CrewMealPaymentEntity>,
    @InjectRepository(SpjCrewAssignmentEntity)
    private readonly crewAssignmentRepo: Repository<SpjCrewAssignmentEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepo: Repository<BankAccountEntity>,
    @InjectRepository(CashAccountEntity)
    private readonly cashAccountRepo: Repository<CashAccountEntity>,
    @Optional()
    private readonly accountingPostingService?: AccountingPostingService,
  ) {}

  /**
   * Menampilkan seluruh baris hak kompensasi kru SPJ (Uang Makan, Premi Ritase, Bonus Full Seat, Komisi Kargo)
   */
  async findBySpjId(spjId: string): Promise<CrewMealPaymentEntity[]> {
    return this.paymentRepo.find({
      where: { spjId },
      relations: [
        'crew',
        'crewAssignment',
        'cashAccount',
        'bankAccount',
        'payer',
      ],
      order: {
        paymentCategory: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Menambahkan baris pembayaran kompensasi kru secara manual
   */
  async create(
    spjId: string,
    dto: CreateCrewMealPaymentDto,
    userId: string,
  ): Promise<CrewMealPaymentEntity> {
    const spj = await this.spjRepo.findOne({ where: { id: spjId } });
    if (!spj) {
      throw new NotFoundException(`SPJ dengan ID '${spjId}' tidak ditemukan.`);
    }

    const amount = MoneyHelper.toAmount(dto.amount);
    if (MoneyHelper.toDecimal(amount).lte(0)) {
      throw new BadRequestException('Nominal hak kompensasi harus lebih besar dari 0.');
    }

    const payment = this.paymentRepo.create({
      companyId: spj.companyId,
      spjId,
      crewAssignmentId: dto.crewAssignmentId,
      crewId: dto.crewId,
      paymentCategory: dto.paymentCategory,
      amount,
      payoutTiming: dto.payoutTiming || CrewPayoutTiming.AT_SETTLEMENT,
      status: CrewMealPaymentStatus.PENDING,
      notes: dto.notes,
    });

    return this.paymentRepo.save(payment);
  }

  /**
   * Skenario 2: Pencairan Lebih Awal di Tengah Perjalanan (Early Payout via Bank Transfer)
   * Contoh: Transfer uang nafkah keluarga driver di tengah tour pariwisata multi-day
   */
  async disburseEarly(
    paymentId: string,
    dto: DisburseEarlyMealPaymentDto,
    userId: string,
  ): Promise<CrewMealPaymentEntity> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['crew', 'spj'],
    });

    if (!payment) {
      throw new NotFoundException(`Baris hak kompensasi kru ID '${paymentId}' tidak ditemukan.`);
    }

    if (payment.status === CrewMealPaymentStatus.PAID) {
      throw new BadRequestException('Kompensasi ini telah dicairkan sebelumnya.');
    }

    payment.status = CrewMealPaymentStatus.PAID;
    payment.paidAt = new Date();
    payment.paymentMethod = dto.paymentMethod;
    payment.bankAccountId = dto.bankAccountId;
    payment.cashAccountId = dto.cashAccountId;
    payment.paidBy = userId;
    payment.receiptRef = dto.receiptRef;
    if (dto.notes) {
      payment.notes = payment.notes ? `${payment.notes} | ${dto.notes}` : dto.notes;
    }

    const saved = await this.paymentRepo.save(payment);

    // Posting Jurnal Mid-Trip Payout (Skenario 2 Jurnal #4)
    if (
      this.accountingPostingService &&
      typeof this.accountingPostingService.postJournal === 'function'
    ) {
      try {
        let debitAccountId: string | undefined;
        const targetAccCode =
          payment.paymentCategory === CrewMealPaymentCategory.TRIP_INCENTIVE
            ? '53102'
            : '53101';
        const expenseAcc = await this.accountRepo.findOne({
          where: { code: targetAccCode },
        });
        if (expenseAcc) debitAccountId = expenseAcc.id;

        let creditAccountId: string | undefined;
        if (
          dto.paymentMethod === SpjPaymentMethod.BANK_TRANSFER &&
          dto.bankAccountId
        ) {
          const bank = await this.bankAccountRepo.findOne({
            where: { id: dto.bankAccountId },
          });
          if (bank) creditAccountId = bank.accountId;
        } else if (dto.cashAccountId) {
          const cash = await this.cashAccountRepo.findOne({
            where: { id: dto.cashAccountId },
          });
          if (cash) creditAccountId = cash.accountId;
        }

        if (debitAccountId && creditAccountId) {
          const numAmount = parseFloat(payment.amount);
          await this.accountingPostingService.postJournal(
            {
              journalDate: new Date().toISOString().split('T')[0],
              sourceType: JournalSourceType.BANK_TRANSACTION,
              sourceId: saved.id,
              description: `Pencairan di Muka Kompensasi Kru (${payment.paymentCategory}) SPJ ${payment.spj?.spjNo || payment.spjId} - ${payment.crew?.name || 'Kru'}`,
              lines: [
                {
                  accountId: debitAccountId,
                  debit: numAmount,
                  credit: 0,
                  description: `Beban ${targetAccCode} Mid-Trip Payout: ${payment.crew?.name || 'Kru'}`,
                  tripId: payment.spjId,
                  vehicleId: payment.spj?.vehicleId,
                  costCenterId: payment.spj?.costCenterId,
                  businessUnitId: payment.spj?.businessUnitId,
                },
                {
                  accountId: creditAccountId,
                  debit: 0,
                  credit: numAmount,
                  description: `Pencairan Bank/Kas Hak Kru: ${payment.crew?.name || 'Kru'}`,
                  tripId: payment.spjId,
                  vehicleId: payment.spj?.vehicleId,
                  costCenterId: payment.spj?.costCenterId,
                  businessUnitId: payment.spj?.businessUnitId,
                },
              ],
              idempotencyKey: `CREW-EARLY-${saved.id}`,
            },
            userId,
          );
        }
      } catch (err) {
        // Abaikan jika posting gagal agar tidak memblokir operasional di jalan
      }
    }

    return saved;
  }

  /**
   * Otomasi Rate Snapshotting: Menyalin hak uang makan & premi dari penugasan kru ke baris pembayaran permanen
   */
  async syncFromCrewAssignments(spjId: string): Promise<CrewMealPaymentEntity[]> {
    const spj = await this.spjRepo.findOne({
      where: { id: spjId },
      relations: ['crewAssignments'],
    });

    if (!spj || !spj.crewAssignments) {
      return [];
    }

    for (const assignment of spj.crewAssignments) {
      if (!assignment.crewId) continue;

      // 1. Uang Makan
      const mealAmount = MoneyHelper.toAmount(assignment.mealAllowanceSnapshot);
      if (MoneyHelper.toDecimal(mealAmount).gt(0)) {
        const existingMeal = await this.paymentRepo.findOne({
          where: {
            spjId,
            crewAssignmentId: assignment.id,
            paymentCategory: CrewMealPaymentCategory.MEAL_ALLOWANCE,
          },
        });
        if (!existingMeal) {
          const mealPay = this.paymentRepo.create({
            companyId: spj.companyId,
            spjId,
            crewAssignmentId: assignment.id,
            crewId: assignment.crewId,
            paymentCategory: CrewMealPaymentCategory.MEAL_ALLOWANCE,
            amount: mealAmount,
            payoutTiming: CrewPayoutTiming.AT_SETTLEMENT,
            status: CrewMealPaymentStatus.PENDING,
            notes: `Uang Makan (${assignment.role})`,
          });
          await this.paymentRepo.save(mealPay);
        }
      }

      // 2. Premi Ritase / Harian
      const incentiveAmount = MoneyHelper.toAmount(assignment.incentiveSnapshot);
      if (MoneyHelper.toDecimal(incentiveAmount).gt(0)) {
        const existingInc = await this.paymentRepo.findOne({
          where: {
            spjId,
            crewAssignmentId: assignment.id,
            paymentCategory: CrewMealPaymentCategory.TRIP_INCENTIVE,
          },
        });
        if (!existingInc) {
          const incPay = this.paymentRepo.create({
            companyId: spj.companyId,
            spjId,
            crewAssignmentId: assignment.id,
            crewId: assignment.crewId,
            paymentCategory: CrewMealPaymentCategory.TRIP_INCENTIVE,
            amount: incentiveAmount,
            payoutTiming: assignment.notes?.includes('EARLY_DISBURSEMENT')
              ? CrewPayoutTiming.EARLY_DISBURSEMENT
              : CrewPayoutTiming.AT_SETTLEMENT,
            status: CrewMealPaymentStatus.PENDING,
            notes: `Premi Ritase/Kompensasi (${assignment.role})`,
          });
          await this.paymentRepo.save(incPay);
        }
      }
    }

    return this.findBySpjId(spjId);
  }

  /**
   * Menambahkan Uang Perpal Kru (Uang Makan Tambahan Menginap di Terminal / Luar Kota)
   */
  async addPerpalPayment(
    spjId: string,
    dto: AddPerpalPaymentDto,
    userId: string,
  ): Promise<CrewMealPaymentEntity[]> {
    const spj = await this.spjRepo.findOne({
      where: { id: spjId },
      relations: ['crewAssignments'],
    });

    if (!spj) {
      throw new NotFoundException(`SPJ ID '${spjId}' tidak ditemukan.`);
    }

    const days = Math.max(1, Number(dto.daysCount) || 1);
    const ratePerDay = MoneyHelper.toAmount(dto.amountPerPersonPerDay);
    const totalAmountPerPerson = MoneyHelper.mul(ratePerDay, days);

    for (const assignmentId of dto.crewAssignmentIds) {
      const assignment = spj.crewAssignments?.find((c) => c.id === assignmentId);
      if (!assignment || !assignment.crewId) continue;

      const perpalPayment = this.paymentRepo.create({
        companyId: spj.companyId,
        spjId,
        crewAssignmentId: assignment.id,
        crewId: assignment.crewId,
        paymentCategory: CrewMealPaymentCategory.PERPAL_ALLOWANCE,
        amount: totalAmountPerPerson,
        payoutTiming: dto.payoutTiming || CrewPayoutTiming.AT_SETTLEMENT,
        status: CrewMealPaymentStatus.PENDING,
        notes: `Uang Perpal (${days} Hari di ${dto.terminalLocation || 'Terminal'})${dto.notes ? ' - ' + dto.notes : ''}`,
      });

      await this.paymentRepo.save(perpalPayment);
    }

    return this.findBySpjId(spjId);
  }

  /**
   * Klaim Bonus Full Seat Kru (Okupansi Penumpang 100%)
   */
  async claimFullSeatBonus(
    spjId: string,
    dto: ClaimFullSeatBonusDto,
    userId: string,
  ): Promise<CrewMealPaymentEntity[]> {
    const spj = await this.spjRepo.findOne({
      where: { id: spjId },
      relations: ['crewAssignments'],
    });

    if (!spj) {
      throw new NotFoundException(`SPJ ID '${spjId}' tidak ditemukan.`);
    }

    const bonusAmount = MoneyHelper.toAmount(dto.bonusAmountPerPerson);

    for (const assignmentId of dto.crewAssignmentIds) {
      const assignment = spj.crewAssignments?.find((c) => c.id === assignmentId);
      if (!assignment || !assignment.crewId) continue;

      // Cek apakah sudah pernah ada bonus full seat untuk assignment ini
      const existing = await this.paymentRepo.findOne({
        where: {
          spjId,
          crewAssignmentId: assignment.id,
          paymentCategory: CrewMealPaymentCategory.FULL_SEAT_BONUS,
        },
      });

      if (existing) {
        existing.amount = bonusAmount;
        if (dto.notes) existing.notes = `Bonus Full Seat (100% Okupansi) - ${dto.notes}`;
        await this.paymentRepo.save(existing);
      } else {
        const bonusPay = this.paymentRepo.create({
          companyId: spj.companyId,
          spjId,
          crewAssignmentId: assignment.id,
          crewId: assignment.crewId,
          paymentCategory: CrewMealPaymentCategory.FULL_SEAT_BONUS,
          amount: bonusAmount,
          payoutTiming: CrewPayoutTiming.AT_SETTLEMENT,
          status: CrewMealPaymentStatus.PENDING,
          notes: `Bonus Full Seat (100% Okupansi)${dto.notes ? ' - ' + dto.notes : ''}`,
        });

        await this.paymentRepo.save(bonusPay);
      }
    }

    return this.findBySpjId(spjId);
  }
}
