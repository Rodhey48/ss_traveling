import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SpjEntity,
  SpjUjEntity,
  SpjUjDisbursementEntity,
  SpjUjExpenseEntity,
  SpjUjReturnEntity,
  SpjUjAdditionalRequestEntity,
  SpjCrewAssignmentEntity,
  SpjUjStatus,
  SpjDisbursementType,
  SpjPaymentMethod,
  SpjAdditionalRequestStatus,
  CrewAssignmentRole,
} from '../../@models/trips';
import {
  CreateSpjUjDisbursementDto,
  CreateSpjUjReturnDto,
  CreateSpjUjAdditionalRequestDto,
  ProcessAdditionalRequestDto,
  UjRolloverDto,
} from '../../@dto/trips/spj-uj.dto';
import { MoneyHelper } from '../../@common/helpers/money.helper';

@Injectable()
export class SpjUjService {
  constructor(
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(SpjUjEntity)
    private readonly ujRepo: Repository<SpjUjEntity>,
    @InjectRepository(SpjUjDisbursementEntity)
    private readonly disbRepo: Repository<SpjUjDisbursementEntity>,
    @InjectRepository(SpjUjExpenseEntity)
    private readonly ujExpenseRepo: Repository<SpjUjExpenseEntity>,
    @InjectRepository(SpjUjReturnEntity)
    private readonly returnRepo: Repository<SpjUjReturnEntity>,
    @InjectRepository(SpjUjAdditionalRequestEntity)
    private readonly additionalReqRepo: Repository<SpjUjAdditionalRequestEntity>,
    @InjectRepository(SpjCrewAssignmentEntity)
    private readonly crewRepo: Repository<SpjCrewAssignmentEntity>,
  ) {}

  /**
   * Mengambil atau membuat amplop UJ (SpjUjEntity) untuk SPJ terkait
   */
  async getOrCreateUj(spjId: string): Promise<SpjUjEntity> {
    const spj = await this.spjRepo.findOne({
      where: { id: spjId },
      relations: ['crewAssignments', 'crewAssignments.crew'],
    });

    if (!spj) {
      throw new NotFoundException(`SPJ dengan ID '${spjId}' tidak ditemukan.`);
    }

    let uj = await this.ujRepo.findOne({
      where: { spjId },
      relations: [
        'crew',
        'disbursements',
        'disbursements.cashAccount',
        'disbursements.bankAccount',
        'disbursements.disburser',
        'disbursements.crewAssignment',
        'expenses',
        'expenses.expense',
        'expenses.crewAssignment',
        'returns',
        'returns.cashAccount',
        'returns.bankAccount',
        'returns.receiver',
        'returns.crewAssignment',
        'additionalRequests',
        'additionalRequests.requester',
        'additionalRequests.processor',
        'rolloverFromSpj',
        'rolloverToSpj',
      ],
      order: {
        createdAt: 'ASC',
      },
    });

    if (!uj) {
      // Tentukan kru pemegang UJ: prioritaskan DRIVER 1, lalu CO_DRIVER, atau kru pertama
      const driver1 =
        spj.crewAssignments?.find((c) => c.role === CrewAssignmentRole.DRIVER) ||
        spj.crewAssignments?.[0];

      if (!driver1 || !driver1.crewId) {
        throw new BadRequestException(
          'SPJ belum memiliki kru driver yang ditugaskan untuk memegang amplop UJ.',
        );
      }

      uj = this.ujRepo.create({
        spjId,
        companyId: spj.companyId,
        crewId: driver1.crewId,
        status: SpjUjStatus.DRAFT,
        totalDisbursed: '0.00',
        totalSpent: '0.00',
        totalReturned: '0.00',
        balance: '0.00',
      });

      await this.ujRepo.save(uj);
      return this.getOrCreateUj(spjId);
    }

    return uj;
  }

  /**
   * Pencairan UJ (Awal di Pool maupun Tambahan di Jalan)
   */
  async disburse(
    spjId: string,
    dto: CreateSpjUjDisbursementDto,
    userId: string,
  ): Promise<SpjUjEntity> {
    const uj = await this.getOrCreateUj(spjId);

    const amount = MoneyHelper.toAmount(dto.amount);
    if (MoneyHelper.toDecimal(amount).lte(0)) {
      throw new BadRequestException('Nominal pencairan UJ harus lebih besar dari 0.');
    }

    const disbursement = this.disbRepo.create({
      spjUjId: uj.id,
      crewAssignmentId: dto.crewAssignmentId,
      disbursementType: dto.disbursementType || SpjDisbursementType.INITIAL,
      amount,
      paymentMethod: dto.paymentMethod,
      cashAccountId: dto.cashAccountId,
      bankAccountId: dto.bankAccountId,
      disbursedBy: userId,
      receiptRef: dto.receiptRef,
      notes: dto.notes,
    });

    await this.disbRepo.save(disbursement);

    // Update akumulasi UJ
    uj.totalDisbursed = MoneyHelper.add(uj.totalDisbursed, amount);
    uj.balance = MoneyHelper.sub(
      MoneyHelper.sub(uj.totalDisbursed, uj.totalSpent),
      uj.totalReturned,
    );

    if (uj.status === SpjUjStatus.DRAFT) {
      uj.status = SpjUjStatus.DISBURSED;
    }

    await this.ujRepo.update(uj.id, {
      totalDisbursed: uj.totalDisbursed,
      balance: uj.balance,
      status: uj.status,
    });

    return this.getOrCreateUj(spjId);
  }

  /**
   * Pengembalian Sisa UJ oleh Kru (Tunai / Transfer Bank ke Kasir)
   */
  async recordReturn(
    spjId: string,
    dto: CreateSpjUjReturnDto,
    userId: string,
  ): Promise<SpjUjEntity> {
    const uj = await this.getOrCreateUj(spjId);

    const amount = MoneyHelper.toAmount(dto.amount);
    if (MoneyHelper.toDecimal(amount).lte(0)) {
      throw new BadRequestException('Nominal pengembalian UJ harus lebih besar dari 0.');
    }

    const returnRecord = this.returnRepo.create({
      spjUjId: uj.id,
      crewAssignmentId: dto.crewAssignmentId,
      amount,
      paymentMethod: dto.paymentMethod,
      cashAccountId: dto.cashAccountId,
      bankAccountId: dto.bankAccountId,
      receivedBy: userId,
      receiptRef: dto.receiptRef,
      notes: dto.notes,
    });

    await this.returnRepo.save(returnRecord);

    uj.totalReturned = MoneyHelper.add(uj.totalReturned, amount);
    uj.balance = MoneyHelper.sub(
      MoneyHelper.sub(uj.totalDisbursed, uj.totalSpent),
      uj.totalReturned,
    );

    if (MoneyHelper.isZero(uj.balance)) {
      uj.status = SpjUjStatus.BALANCED;
    }

    await this.ujRepo.update(uj.id, {
      totalReturned: uj.totalReturned,
      balance: uj.balance,
      status: uj.status,
    });

    return this.getOrCreateUj(spjId);
  }

  /**
   * Pengajuan Tambahan UJ oleh Kru di Tengah Perjalanan
   */
  async requestAdditionalUj(
    spjId: string,
    dto: CreateSpjUjAdditionalRequestDto,
    userId: string,
  ): Promise<SpjUjAdditionalRequestEntity> {
    const uj = await this.getOrCreateUj(spjId);

    const amount = MoneyHelper.toAmount(dto.amount);
    if (MoneyHelper.toDecimal(amount).lte(0)) {
      throw new BadRequestException('Nominal pengajuan tambahan UJ harus lebih dari 0.');
    }

    const req = this.additionalReqRepo.create({
      spjId,
      spjUjId: uj.id,
      crewAssignmentId: dto.crewAssignmentId,
      requestedBy: userId,
      amount,
      reason: dto.reason,
      status: SpjAdditionalRequestStatus.PENDING,
    });

    return this.additionalReqRepo.save(req);
  }

  /**
   * Proses Persetujuan / Penolakan Tambahan UJ oleh Finance / Dispatcher
   */
  async processAdditionalRequest(
    requestId: string,
    dto: ProcessAdditionalRequestDto,
    userId: string,
  ): Promise<SpjUjAdditionalRequestEntity> {
    const req = await this.additionalReqRepo.findOne({
      where: { id: requestId },
      relations: ['spjUj'],
    });

    if (!req) {
      throw new NotFoundException(`Pengajuan tambahan UJ ID '${requestId}' tidak ditemukan.`);
    }

    if (req.status !== SpjAdditionalRequestStatus.PENDING) {
      throw new BadRequestException('Pengajuan ini telah diproses sebelumnya.');
    }

    req.status = dto.status;
    req.processedBy = userId;
    req.processedAt = new Date();
    req.rejectionReason = dto.rejectionReason;

    await this.additionalReqRepo.save(req);

    // Jika disetujui, otomatis cairkan UJ tipe ADDITIONAL
    if (dto.status === SpjAdditionalRequestStatus.APPROVED) {
      await this.disburse(
        req.spjId,
        {
          crewAssignmentId: req.crewAssignmentId,
          disbursementType: SpjDisbursementType.ADDITIONAL,
          amount: req.amount,
          paymentMethod: SpjPaymentMethod.BANK_TRANSFER,
          notes: `Pencairan persetujuan tambahan UJ: ${req.reason}`,
        },
        userId,
      );
    }

    return req;
  }

  /**
   * Skenario 3: UJ Rollover (Estafet Sisa UJ saat Breakdown di Tol Cipali)
   */
  async rolloverUj(
    sourceSpjId: string,
    dto: UjRolloverDto,
    userId: string,
  ): Promise<{ sourceUj: SpjUjEntity; targetUj: SpjUjEntity }> {
    const sourceSpj = await this.spjRepo.findOne({ where: { id: sourceSpjId } });
    if (!sourceSpj) {
      throw new NotFoundException(`SPJ Sumber (Breakdown) ID '${sourceSpjId}' tidak ditemukan.`);
    }

    const targetSpj = await this.spjRepo.findOne({ where: { id: dto.targetSpjId } });
    if (!targetSpj) {
      throw new NotFoundException(`SPJ Tujuan (Pengganti) ID '${dto.targetSpjId}' tidak ditemukan.`);
    }

    const sourceUj = await this.getOrCreateUj(sourceSpjId);
    const targetUj = await this.getOrCreateUj(dto.targetSpjId);

    const amount = MoneyHelper.toAmount(dto.amount);
    if (MoneyHelper.toDecimal(amount).lte(0)) {
      throw new BadRequestException('Nominal estafet rollover UJ harus lebih besar dari 0.');
    }

    // 1. Catat pengeluaran estafet dari source UJ (return dengan tipe ROLLOVER)
    const returnRecord = this.returnRepo.create({
      spjUjId: sourceUj.id,
      amount,
      paymentMethod: SpjPaymentMethod.ROLLOVER,
      receivedBy: userId,
      receiptRef: `ROLLOVER-TO-${targetSpj.spjNo}`,
      notes: dto.notes || `Estafet sisa UJ fisik ke SPJ pengganti ${targetSpj.spjNo}`,
    });
    await this.returnRepo.save(returnRecord);

    sourceUj.rolloverToSpjId = targetSpj.id;
    sourceUj.totalReturned = MoneyHelper.add(sourceUj.totalReturned, amount);
    sourceUj.balance = MoneyHelper.sub(
      MoneyHelper.sub(sourceUj.totalDisbursed, sourceUj.totalSpent),
      sourceUj.totalReturned,
    );
    if (MoneyHelper.isZero(sourceUj.balance)) {
      sourceUj.status = SpjUjStatus.BALANCED;
    }

    await this.ujRepo.update(sourceUj.id, {
      rolloverToSpjId: targetSpj.id,
      totalReturned: sourceUj.totalReturned,
      balance: sourceUj.balance,
      status: sourceUj.status,
    });

    // 2. Catat penerimaan estafet pada target UJ (disbursement ROLLOVER_IN)
    const disbursement = this.disbRepo.create({
      spjUjId: targetUj.id,
      disbursementType: SpjDisbursementType.ROLLOVER_IN,
      amount,
      paymentMethod: SpjPaymentMethod.ROLLOVER,
      disbursedBy: userId,
      receiptRef: `ROLLOVER-FROM-${sourceSpj.spjNo}`,
      notes: dto.notes || `Penerimaan sisa UJ estafet dari SPJ rusak ${sourceSpj.spjNo}`,
    });
    await this.disbRepo.save(disbursement);

    targetUj.rolloverFromSpjId = sourceSpj.id;
    targetUj.totalDisbursed = MoneyHelper.add(targetUj.totalDisbursed, amount);
    targetUj.balance = MoneyHelper.sub(
      MoneyHelper.sub(targetUj.totalDisbursed, targetUj.totalSpent),
      targetUj.totalReturned,
    );
    targetUj.status = SpjUjStatus.DISBURSED;

    await this.ujRepo.update(targetUj.id, {
      rolloverFromSpjId: sourceSpj.id,
      totalDisbursed: targetUj.totalDisbursed,
      balance: targetUj.balance,
      status: SpjUjStatus.DISBURSED,
    });

    return {
      sourceUj: await this.getOrCreateUj(sourceSpjId),
      targetUj: await this.getOrCreateUj(dto.targetSpjId),
    };
  }
}
