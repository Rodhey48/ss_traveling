import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
import {
  CreateCrewMealPaymentDto,
  DisburseEarlyMealPaymentDto,
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

    return this.paymentRepo.save(payment);
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
}
