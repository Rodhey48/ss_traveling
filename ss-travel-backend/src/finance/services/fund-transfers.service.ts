import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FundTransferEntity } from '../../@models/finance/fund-transfer.entity';
import { BankAccountEntity } from '../../@models/finance/bank-account.entity';
import { CashAccountEntity } from '../../@models/finance/cash-account.entity';
import { FundTransferStatus, FundTransferType } from '../../@models/finance/finance.enums';
import { DocumentSequenceService } from './document-sequence.service';
import { AccountingPostingService } from './accounting-posting.service';
import {
  CreateFundTransferDto,
  RejectFundTransferDto,
  FundTransferQueryFilterDto,
} from '../../@dto/finance/fund-transfer.dto';

@Injectable()
export class FundTransfersService {
  constructor(
    @InjectRepository(FundTransferEntity)
    private readonly fundTransferRepo: Repository<FundTransferEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepo: Repository<BankAccountEntity>,
    @InjectRepository(CashAccountEntity)
    private readonly cashAccountRepo: Repository<CashAccountEntity>,
    private readonly documentSeqService: DocumentSequenceService,
    private readonly accountingPostingService: AccountingPostingService,
    private readonly dataSource: DataSource,
  ) {}

  async create(user: any, dto: CreateFundTransferDto): Promise<FundTransferEntity> {
    let sourceAccId: string = null;
    let targetAccId: string = null;

    if (dto.sourceBankAccountId) {
      const b = await this.bankAccountRepo.findOne({ where: { id: dto.sourceBankAccountId } });
      if (!b) throw new NotFoundException('Source bank account not found');
      sourceAccId = b.accountId;
    } else if (dto.sourceCashAccountId) {
      const c = await this.cashAccountRepo.findOne({ where: { id: dto.sourceCashAccountId } });
      if (!c) throw new NotFoundException('Source cash account not found');
      sourceAccId = c.accountId;
    } else {
      throw new BadRequestException('Source account is required');
    }

    if (dto.targetBankAccountId) {
      const b = await this.bankAccountRepo.findOne({ where: { id: dto.targetBankAccountId } });
      if (!b) throw new NotFoundException('Target bank account not found');
      targetAccId = b.accountId;
    } else if (dto.targetCashAccountId) {
      const c = await this.cashAccountRepo.findOne({ where: { id: dto.targetCashAccountId } });
      if (!c) throw new NotFoundException('Target cash account not found');
      targetAccId = c.accountId;
    } else {
      throw new BadRequestException('Target account is required');
    }

    if (Number(dto.amount) <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const now = new Date();
    const periodKey = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const transferNo = await this.documentSeqService.getNextDocumentNumber(
      'FUND_TRANSFER',
      periodKey,
      `TRF/${periodKey}`
    );

    const transfer = this.fundTransferRepo.create({
      transferNo,
      companyId: user.companyId || 'b8429ed0-7389-406a-aee1-4d1fb2f6efba',
      transferType: dto.transferType,
      sourceBankAccountId: dto.sourceBankAccountId,
      sourceCashAccountId: dto.sourceCashAccountId,
      targetBankAccountId: dto.targetBankAccountId,
      targetCashAccountId: dto.targetCashAccountId,
      amount: dto.amount,
      purpose: dto.purpose,
      referenceDoc: dto.referenceDoc,
      status: FundTransferStatus.PENDING_APPROVAL,
      requestedById: user.id,
    });

    return await this.fundTransferRepo.save(transfer);
  }

  async findAll(filter: FundTransferQueryFilterDto): Promise<FundTransferEntity[]> {
    const qb = this.fundTransferRepo
      .createQueryBuilder('ft')
      .leftJoinAndSelect('ft.sourceBankAccount', 'sba')
      .leftJoinAndSelect('ft.sourceCashAccount', 'sca')
      .leftJoinAndSelect('ft.targetBankAccount', 'tba')
      .leftJoinAndSelect('ft.targetCashAccount', 'tca')
      .leftJoinAndSelect('ft.requestedBy', 'req')
      .leftJoinAndSelect('ft.approvedBy', 'app')
      .orderBy('ft.createdAt', 'DESC');

    if (filter.status) {
      qb.andWhere('ft.status = :status', { status: filter.status });
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(ft.transferNo) LIKE LOWER(:search) OR LOWER(ft.purpose) LIKE LOWER(:search))',
        { search: `%${filter.search}%` },
      );
    }

    return await qb.getMany();
  }

  async findOne(id: string): Promise<FundTransferEntity> {
    const ft = await this.fundTransferRepo.findOne({
      where: { id },
      relations: [
        'sourceBankAccount', 'sourceBankAccount.account',
        'sourceCashAccount', 'sourceCashAccount.account',
        'targetBankAccount', 'targetBankAccount.account',
        'targetCashAccount', 'targetCashAccount.account',
        'requestedBy',
        'approvedBy',
        'journalEntry',
      ],
    });
    if (!ft) throw new NotFoundException('Fund transfer not found');
    return ft;
  }

  async approve(id: string, user: any): Promise<FundTransferEntity> {
    return await this.dataSource.transaction(async (em) => {
      const ft = await em.findOne(FundTransferEntity, {
        where: { id },
        relations: [
          'sourceBankAccount', 'sourceCashAccount',
          'targetBankAccount', 'targetCashAccount',
        ],
      });
      if (!ft) throw new NotFoundException('Fund transfer not found');
      if (ft.status !== FundTransferStatus.PENDING_APPROVAL) {
        throw new BadRequestException('Transfer is not pending approval');
      }

      const sourceGlId = ft.sourceBankAccount ? ft.sourceBankAccount.accountId : ft.sourceCashAccount.accountId;
      const targetGlId = ft.targetBankAccount ? ft.targetBankAccount.accountId : ft.targetCashAccount.accountId;

      const jv = await this.accountingPostingService.postJournal(
        {
          sourceType: 'BANK_TRANSACTION',
          journalDate: new Date().toISOString().slice(0, 10),
          description: `Mutasi Kas/Bank: ${ft.transferNo} - ${ft.purpose}`,
          idempotencyKey: `fund_transfer_${ft.id}`,
          lines: [
            { accountId: targetGlId, debit: ft.amount, credit: '0', description: 'Penerimaan Mutasi Kas/Bank' },
            { accountId: sourceGlId, debit: '0', credit: ft.amount, description: 'Pengeluaran Mutasi Kas/Bank' },
          ],
        } as any,
        user.id,
        em
      );

      ft.status = FundTransferStatus.APPROVED;
      ft.approvedById = user.id;
      ft.approvedAt = new Date();
      ft.journalEntryId = jv.id;

      return await em.save(FundTransferEntity, ft);
    });
  }

  async reject(id: string, user: any, dto: RejectFundTransferDto): Promise<FundTransferEntity> {
    const ft = await this.findOne(id);
    if (ft.status !== FundTransferStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Transfer is not pending approval');
    }
    ft.status = FundTransferStatus.REJECTED;
    ft.rejectionReason = dto.rejectionReason;
    ft.approvedById = user.id;
    ft.approvedAt = new Date();
    return await this.fundTransferRepo.save(ft);
  }
}
