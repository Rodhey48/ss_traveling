import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  SpjEntity,
  SpjRevenueDeclarationEntity,
  CrewMealPaymentEntity,
  SpjCrewAssignmentEntity,
  SpjRevenueDeclarationType,
  SpjRevenueDeclarationStatus,
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
import { AccountingPostingService } from '../../finance/services/accounting-posting.service';
import { AccountEntity } from '../../@models/finance/account.entity';
import { AgentEntity, AgentType, AgentSettlementType } from '../../@models/master-rules/agent.entity';
import { BankAccountEntity } from '../../@models/finance/bank-account.entity';
import { JournalSourceType } from '../../@models/finance/journal-entry.entity';

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
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(AgentEntity)
    private readonly agentRepo: Repository<AgentEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepo: Repository<BankAccountEntity>,
    private readonly accountingPostingService: AccountingPostingService,
  ) {}

  /**
   * Menampilkan seluruh deklarasi penerimaan tiket/kargo pada SPJ terkait
   */
  async findBySpjId(spjId: string): Promise<SpjRevenueDeclarationEntity[]> {
    return this.revRepo.find({
      where: { spjId },
      relations: [
        'declarer',
        'verifier',
        'spjLeg',
        'agent',
        'seatClass',
        'bankAccount',
        'journal',
      ],
      order: {
        declaredAt: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Kru/Dispatcher mendeklarasikan penerimaan kas atau penjualan tiket agen
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
      if (dto.crewCommissionAmount !== undefined && Number(dto.crewCommissionAmount) >= 0) {
        commissionAmount = MoneyHelper.toAmount(dto.crewCommissionAmount);
        const grossNum = Number(amount);
        const commNum = Number(commissionAmount);
        commissionPercentage =
          grossNum > 0
            ? MoneyHelper.toAmount((commNum / grossNum) * 100)
            : '0.00';
      } else {
        commissionPercentage = dto.crewCommissionPercentage
          ? MoneyHelper.toAmount(dto.crewCommissionPercentage)
          : '20.00'; // Default 20% komisi kru kargo

        // Hitung nominal hak komisi kru = amount * (percentage / 100)
        const pctDecimal = MoneyHelper.div(commissionPercentage, 100, 4);
        commissionAmount = MoneyHelper.mul(amount, pctDecimal);
      }
    }

    const isAgentTicket =
      dto.declarationType === SpjRevenueDeclarationType.TICKET_AGENT ||
      dto.declarationType === SpjRevenueDeclarationType.AGENT_DEPOSIT ||
      !!dto.agentId;

    let agentEntity: AgentEntity | null = null;
    if (dto.agentId) {
      agentEntity = await this.agentRepo.findOne({ where: { id: dto.agentId } });
    }

    const agentCommission = dto.agentCommissionAmount
      ? MoneyHelper.toAmount(dto.agentCommissionAmount)
      : '0.00';

    const settlementType =
      dto.settlementType ||
      agentEntity?.settlementType ||
      AgentSettlementType.CASH_TO_CREW;

    const initialStatus =
      settlementType === AgentSettlementType.BANK_TRANSFER
        ? SpjRevenueDeclarationStatus.VERIFIED
        : SpjRevenueDeclarationStatus.DECLARED;

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
      agentId: dto.agentId,
      seatClassId: dto.seatClassId,
      ticketCount: dto.ticketCount,
      ticketPrice: dto.ticketPrice ? MoneyHelper.toAmount(dto.ticketPrice) : undefined,
      agentCommissionAmount: agentCommission,
      settlementType,
      bankAccountId: dto.bankAccountId,
      status: initialStatus,
      notes: dto.notes,
    });

    const savedDeclaration = await this.revRepo.save(declaration);

    // Jika ada komisi kargo kru, otomatis daftarkan hak kompensasi kru di crew_meal_payments
    if (isCargo && MoneyHelper.toDecimal(commissionAmount).gt(0)) {
      let recipientCrew = dto.recipientCrewAssignmentId
        ? spj.crewAssignments?.find((c) => c.id === dto.recipientCrewAssignmentId)
        : undefined;

      if (!recipientCrew) {
        recipientCrew =
          spj.crewAssignments?.find((c) => c.role === CrewAssignmentRole.DRIVER) ||
          spj.crewAssignments?.[0];
      }

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

    // --- OTOMASI JURNAL PENJUALAN TIKET AGENT (Blueprint Skenario 1 & Addendum v1.7) ---
    if (isAgentTicket && dto.agentId) {
      try {
        const isOnlineOta = agentEntity?.agentType === AgentType.ONLINE_OTA;
        const piutangCode = isOnlineOta ? '12102' : '12103';

        const accounts = await this.accountRepo.find({
          where: {
            code: In([piutangCode, '41101', '54101', '22101', '11121']),
          },
        });

        const accMap = new Map<string, AccountEntity>();
        for (const a of accounts) {
          accMap.set(a.code, a);
        }

        const piutangAcc = accMap.get(piutangCode);
        const revenueAcc = accMap.get('41101');
        const commExpenseAcc = accMap.get('54101');
        const commPayableAcc = accMap.get('22101');

        if (piutangAcc && revenueAcc) {
          const lines: any[] = [
            {
              accountId: piutangAcc.id,
              debit: Number(amount),
              credit: 0,
              description: `Piutang Penjualan Tiket Agen: ${agentEntity?.name || 'Mitra Agen'} (${dto.ticketCount || 1} Pax) SPJ ${spj.spjNo}`,
              tripId: spj.id,
              vehicleId: spj.vehicleId,
              costCenterId: spj.costCenterId,
              businessUnitId: spj.businessUnitId,
              profitCenterId: spj.profitCenterId,
            },
            {
              accountId: revenueAcc.id,
              debit: 0,
              credit: Number(amount),
              description: `Pendapatan Tiket AKAP Bruto: ${agentEntity?.name || 'Mitra Agen'} (${dto.ticketCount || 1} Pax) SPJ ${spj.spjNo}`,
              tripId: spj.id,
              vehicleId: spj.vehicleId,
              costCenterId: spj.costCenterId,
              businessUnitId: spj.businessUnitId,
              profitCenterId: spj.profitCenterId,
            },
          ];

          // Jika ada komisi agen, tambahkan baris Beban Komisi (D) vs Utang Komisi (K)
          if (
            commExpenseAcc &&
            commPayableAcc &&
            MoneyHelper.toDecimal(agentCommission).gt(0)
          ) {
            lines.push(
              {
                accountId: commExpenseAcc.id,
                debit: Number(agentCommission),
                credit: 0,
                description: `Beban Komisi Tiket Agen: ${agentEntity?.name || 'Mitra Agen'} SPJ ${spj.spjNo}`,
                tripId: spj.id,
                vehicleId: spj.vehicleId,
                costCenterId: spj.costCenterId,
                businessUnitId: spj.businessUnitId,
                profitCenterId: spj.profitCenterId,
              },
              {
                accountId: commPayableAcc.id,
                debit: 0,
                credit: Number(agentCommission),
                description: `Utang Komisi Tiket Agen: ${agentEntity?.name || 'Mitra Agen'} SPJ ${spj.spjNo}`,
                tripId: spj.id,
                vehicleId: spj.vehicleId,
                costCenterId: spj.costCenterId,
                businessUnitId: spj.businessUnitId,
                profitCenterId: spj.profitCenterId,
              },
            );
          }

          const jv = await this.accountingPostingService.postJournal(
            {
              journalDate: new Date().toISOString().split('T')[0],
              sourceType: JournalSourceType.SPJ,
              sourceId: savedDeclaration.id,
              description: `Penjualan Tiket Agen: ${agentEntity?.name || 'Mitra Agen'} SPJ ${spj.spjNo}`,
              lines,
              idempotencyKey: `SPJ-AGENT-REV-${savedDeclaration.id}`,
            },
            userId,
          );

          savedDeclaration.journalId = jv.id;

          // Jika Agen langsung transfer bank (BANK_TRANSFER), buat Jurnal 2 Pelunasan Piutang via Bank
          if (
            settlementType === AgentSettlementType.BANK_TRANSFER &&
            dto.bankAccountId
          ) {
            const bankAcc = await this.bankAccountRepo.findOne({
              where: { id: dto.bankAccountId },
            });
            const bankGlId = bankAcc?.accountId || accMap.get('11121')?.id;

            if (bankGlId) {
              await this.accountingPostingService.postJournal(
                {
                  journalDate: new Date().toISOString().split('T')[0],
                  sourceType: JournalSourceType.BANK_TRANSACTION,
                  sourceId: savedDeclaration.id,
                  description: `Pelunasan Transfer Bank Tiket Agen: ${agentEntity?.name || 'Mitra Agen'} SPJ ${spj.spjNo}`,
                  lines: [
                    {
                      accountId: bankGlId,
                      debit: Number(amount),
                      credit: 0,
                      description: `Penerimaan Rekening Bank dari Agen: ${agentEntity?.name || 'Mitra Agen'}`,
                      tripId: spj.id,
                      vehicleId: spj.vehicleId,
                      costCenterId: spj.costCenterId,
                      businessUnitId: spj.businessUnitId,
                      profitCenterId: spj.profitCenterId,
                    },
                    {
                      accountId: piutangAcc.id,
                      debit: 0,
                      credit: Number(amount),
                      description: `Pelunasan Piutang Tiket Agen via Bank: ${agentEntity?.name || 'Mitra Agen'}`,
                      tripId: spj.id,
                      vehicleId: spj.vehicleId,
                      costCenterId: spj.costCenterId,
                      businessUnitId: spj.businessUnitId,
                      profitCenterId: spj.profitCenterId,
                    },
                  ],
                  idempotencyKey: `SPJ-AGENT-BANK-SETTLE-${savedDeclaration.id}`,
                },
                userId,
              );
            }
          }

          await this.revRepo.save(savedDeclaration);
        }
      } catch (err) {
        // Log jurnal error tanpa membatalkan simpan data deklarasi agar operasional tidak crash
        console.error('Error posting automatic agent ticket journal:', err);
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
