import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SpjEntity,
  SpjRevenueDeclarationEntity,
  CrewMealPaymentEntity,
  SpjCrewAssignmentEntity,
  SpjRevenueDeclarationType,
  CrewMealPaymentCategory,
  CrewMealPaymentStatus,
  CrewPayoutTiming,
  CrewAssignmentRole,
} from '../../@models/trips';
import {
  CreateSpjRevenueDeclarationDto,
  VerifySpjRevenueDeclarationDto,
} from '../../@dto/trips/spj-revenue.dto';
import { MoneyHelper } from '../../@common/helpers/money.helper';

@Injectable()
export class SpjRevenueService {
  constructor(
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(SpjRevenueDeclarationEntity)
    private readonly revRepo: Repository<SpjRevenueDeclarationEntity>,
    @InjectRepository(CrewMealPaymentEntity)
    private readonly mealPaymentRepo: Repository<CrewMealPaymentEntity>,
    @InjectRepository(SpjCrewAssignmentEntity)
    private readonly crewRepo: Repository<SpjCrewAssignmentEntity>,
  ) {}

  /**
   * Menampilkan seluruh deklarasi penerimaan tiket/kargo pada SPJ terkait
   */
  async findBySpjId(spjId: string): Promise<SpjRevenueDeclarationEntity[]> {
    return this.revRepo.find({
      where: { spjId },
      relations: ['declarer', 'verifier', 'spjLeg'],
      order: {
        declaredAt: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Kru mendeklarasikan penerimaan kas (Tiket Loket, Titipan Agen, atau Kargo Bagasi Bus)
   */
  async create(
    spjId: string,
    dto: CreateSpjRevenueDeclarationDto,
    userId: string,
  ): Promise<SpjRevenueDeclarationEntity> {
    const spj = await this.spjRepo.findOne({
      where: { id: spjId },
      relations: ['crewAssignments'],
    });

    if (!spj) {
      throw new NotFoundException(`SPJ dengan ID '${spjId}' tidak ditemukan.`);
    }

    const amount = MoneyHelper.toAmount(dto.amount);
    if (MoneyHelper.toDecimal(amount).lte(0)) {
      throw new BadRequestException('Nominal penerimaan harus lebih besar dari 0.');
    }

    let commissionPercentage = '0.00';
    let commissionAmount = '0.00';

    // Logika Kargo Motor / Kardus & Komisi Kru Dinamis (Addendum v1.9 & Skenario 1)
    const isCargo =
      dto.declarationType === SpjRevenueDeclarationType.CARGO_MOTORCYCLE ||
      dto.declarationType === SpjRevenueDeclarationType.CARGO_BOX;

    if (isCargo) {
      commissionPercentage = dto.crewCommissionPercentage
        ? MoneyHelper.toAmount(dto.crewCommissionPercentage)
        : '20.00'; // Default 20% komisi kru kargo

      // Hitung nominal hak komisi kru = amount * (percentage / 100)
      const pctDecimal = MoneyHelper.div(commissionPercentage, 100, 4);
      commissionAmount = MoneyHelper.mul(amount, pctDecimal);
    }

    const declaration = this.revRepo.create({
      companyId: spj.companyId,
      spjId,
      spjLegId: dto.spjLegId,
      declarationType: dto.declarationType,
      amount,
      declaredBy: userId,
      sourceReference: dto.sourceReference,
      crewCommissionPercentage: commissionPercentage,
      crewCommissionAmount: commissionAmount,
      cargoSenderName: dto.cargoSenderName,
      cargoSenderPhone: dto.cargoSenderPhone,
      cargoReceiverName: dto.cargoReceiverName,
      cargoReceiverPhone: dto.cargoReceiverPhone,
      cargoItemDescription: dto.cargoItemDescription,
      notes: dto.notes,
    });

    const savedDeclaration = await this.revRepo.save(declaration);

    // Jika ada komisi kargo kru, otomatis daftarkan hak kompensasi kru di crew_meal_payments
    if (isCargo && MoneyHelper.toDecimal(commissionAmount).gt(0)) {
      // Prioritaskan Driver 1 atau Kondektur yang terdaftar di SPJ
      const recipientCrew =
        spj.crewAssignments?.find((c) => c.role === CrewAssignmentRole.DRIVER) ||
        spj.crewAssignments?.[0];

      if (recipientCrew?.crewId) {
        const mealPayment = this.mealPaymentRepo.create({
          companyId: spj.companyId,
          spjId,
          crewAssignmentId: recipientCrew.id,
          crewId: recipientCrew.crewId,
          paymentCategory: CrewMealPaymentCategory.CARGO_COMMISSION,
          amount: commissionAmount,
          payoutTiming: CrewPayoutTiming.AT_SETTLEMENT,
          status: CrewMealPaymentStatus.PENDING,
          notes: `Komisi kargo ${dto.declarationType} (${commissionPercentage}%) - Resi ${dto.sourceReference || '-'}`,
        });
        await this.mealPaymentRepo.save(mealPayment);
      }
    }

    return savedDeclaration;
  }

  /**
   * Verifikasi kesesuaian deklarasi penerimaan oleh Kasir Pool
   */
  async verify(
    declarationId: string,
    dto: VerifySpjRevenueDeclarationDto,
    userId: string,
  ): Promise<SpjRevenueDeclarationEntity> {
    const declaration = await this.revRepo.findOne({
      where: { id: declarationId },
    });

    if (!declaration) {
      throw new NotFoundException(`Deklarasi penerimaan ID '${declarationId}' tidak ditemukan.`);
    }

    declaration.status = dto.status;
    declaration.verifiedBy = userId;
    declaration.verifiedAt = new Date();
    if (dto.notes) {
      declaration.notes = declaration.notes
        ? `${declaration.notes} | ${dto.notes}`
        : dto.notes;
    }

    return this.revRepo.save(declaration);
  }

  /**
   * Membatalkan deklarasi penerimaan
   */
  async delete(declarationId: string, userId: string): Promise<{ success: boolean }> {
    const declaration = await this.revRepo.findOne({
      where: { id: declarationId },
    });

    if (!declaration) {
      throw new NotFoundException(`Deklarasi penerimaan ID '${declarationId}' tidak ditemukan.`);
    }

    await this.revRepo.remove(declaration);
    return { success: true };
  }
}
