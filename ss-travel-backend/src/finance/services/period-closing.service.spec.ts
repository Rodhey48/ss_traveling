import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { PeriodClosingService } from './period-closing.service';
import { FiscalPeriodEntity, FiscalPeriodStatus } from '../../@models/finance/fiscal-period.entity';
import { PeriodCloseCheckEntity, PeriodCheckStatus } from '../../@models/finance/period-close-check.entity';
import { JournalEntryEntity } from '../../@models/finance/journal-entry.entity';
import { SpjEntity } from '../../@models/trips/spj.entity';
import { CrewCashDiscrepancyEntity } from '../../@models/cashier/crew-cash-discrepancy.entity';
import { DiscrepancyResolutionStatus } from '../../@models/cashier/cashier.enums';
import { ApInvoiceEntity } from '../../@models/finance/ap-invoice.entity';
import { ArInvoiceEntity } from '../../@models/finance/ar-invoice.entity';
import { FinancialReportsService } from './financial-reports.service';

describe('PeriodClosingService', () => {
  let service: PeriodClosingService;
  let periodRepo: any;
  let checkRepo: any;
  let journalRepo: any;
  let spjRepo: any;
  let discrepancyRepo: any;
  let apInvoiceRepo: any;
  let arInvoiceRepo: any;
  let financialReportsService: any;
  let dataSource: any;

  const mockPeriod = {
    id: 'period-2026-10',
    periodNo: 10,
    name: 'Oktober 2026',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    status: FiscalPeriodStatus.OPEN,
  };

  beforeEach(async () => {
    periodRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockImplementation(async (e) => e),
      createQueryBuilder: jest.fn(),
    };
    checkRepo = {
      create: jest.fn().mockImplementation((e) => e),
      save: jest.fn().mockImplementation(async (e) => e),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    journalRepo = {
      find: jest.fn(),
    };
    spjRepo = {
      createQueryBuilder: jest.fn(),
    };
    discrepancyRepo = {
      find: jest.fn(),
    };
    apInvoiceRepo = {
      createQueryBuilder: jest.fn(),
    };
    arInvoiceRepo = {
      createQueryBuilder: jest.fn(),
    };
    financialReportsService = {
      getTrialBalance: jest.fn(),
    };
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeriodClosingService,
        { provide: getRepositoryToken(FiscalPeriodEntity), useValue: periodRepo },
        { provide: getRepositoryToken(PeriodCloseCheckEntity), useValue: checkRepo },
        { provide: getRepositoryToken(JournalEntryEntity), useValue: journalRepo },
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(CrewCashDiscrepancyEntity), useValue: discrepancyRepo },
        { provide: getRepositoryToken(ApInvoiceEntity), useValue: apInvoiceRepo },
        { provide: getRepositoryToken(ArInvoiceEntity), useValue: arInvoiceRepo },
        { provide: FinancialReportsService, useValue: financialReportsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<PeriodClosingService>(PeriodClosingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runChecklist (Skenario 4: Kemerdekaan Tutup Buku Unblocked)', () => {
    it('should allow period closing even if account 11999 has open discrepancy (WARNING, unblocked)', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod);

      // Check 1: Journals balance
      journalRepo.find.mockResolvedValue([
        {
          id: 'j-1',
          journalNo: 'J-1',
          status: 'POSTED',
          totalDebit: '1000000.00',
          totalCredit: '1000000.00',
        },
      ]);

      // Check 2: Cashier SPJ
      const spjQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      spjRepo.createQueryBuilder.mockReturnValue(spjQb);

      // Check 3: Skenario 4 - Akun 11999 memiliki saldo Rp 50.000 karena sengketa selisih kas
      dataSource.query
        .mockResolvedValueOnce([{ balance: '50000.00' }]) // Akun 11999
        .mockResolvedValueOnce([
          { code: '11101', name: 'Kas Pool Ciputat', balance: '12000000.00' },
          { code: '11104', name: 'Bank Operasional', balance: '50000000.00' },
        ]); // Kas & Bank

      discrepancyRepo.find.mockResolvedValue([
        {
          id: 'disc-1',
          discrepancyNo: 'DISC/2610/0001',
          differenceAmount: 50000.0,
          reason: 'Selisih setor tiket malam',
          resolutionStatus: DiscrepancyResolutionStatus.PENDING_INVESTIGATION,
        },
      ]);

      // Check 5: AR/AP
      const arQb: any = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(0) };
      const apQb: any = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(0) };
      arInvoiceRepo.createQueryBuilder.mockReturnValue(arQb);
      apInvoiceRepo.createQueryBuilder.mockReturnValue(apQb);

      // Check 6: Trial Balance Equal
      financialReportsService.getTrialBalance.mockResolvedValue({
        totals: {
          endingDebit: '62050000.00',
          endingCredit: '62050000.00',
          isBalanced: true,
        },
      });

      const result = await service.runChecklist('period-2026-10');

      expect(result.canClose).toBe(true); // HARUS BISA TUTUP BUKU!
      expect(result.blockerReasons).toHaveLength(0);

      const check11999 = result.checks.find((c) => c.checkCode === 'UNRESOLVED_DISCREPANCY_11999');
      expect(check11999).toBeDefined();
      expect(check11999?.status).toBe(PeriodCheckStatus.WARNING); // Status WARNING, BUKAN BLOCKED!
      expect(result.warningReasons).toHaveLength(1);
    });

    it('should block closing if trial balance is unbalanced', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod);
      journalRepo.find.mockResolvedValue([]);

      const spjQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      spjRepo.createQueryBuilder.mockReturnValue(spjQb);

      dataSource.query
        .mockResolvedValueOnce([{ balance: '0.00' }])
        .mockResolvedValueOnce([]);

      discrepancyRepo.find.mockResolvedValue([]);

      const arQb: any = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(0) };
      const apQb: any = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(0) };
      arInvoiceRepo.createQueryBuilder.mockReturnValue(arQb);
      apInvoiceRepo.createQueryBuilder.mockReturnValue(apQb);

      // Trial balance TIDAK seimbang
      financialReportsService.getTrialBalance.mockResolvedValue({
        totals: {
          endingDebit: '10000000.00',
          endingCredit: '9000000.00',
          isBalanced: false,
        },
      });

      const result = await service.runChecklist('period-2026-10');

      expect(result.canClose).toBe(false);
      expect(result.blockerReasons.length).toBeGreaterThan(0);

      const tbCheck = result.checks.find((c) => c.checkCode === 'TRIAL_BALANCE_EQUAL');
      expect(tbCheck?.status).toBe(PeriodCheckStatus.BLOCKED);
    });
  });

  describe('closePeriod & reopenPeriod', () => {
    it('should close period and store checklist snapshot', async () => {
      periodRepo.findOne.mockResolvedValue({ ...mockPeriod });
      jest.spyOn(service, 'runChecklist').mockResolvedValue({
        period: mockPeriod as any,
        canClose: true,
        blockerReasons: [],
        warningReasons: [],
        checks: [],
      });

      const closed = await service.closePeriod('period-2026-10', { notes: 'Penutupan Normal' }, 'user-mgr');

      expect(closed.status).toBe(FiscalPeriodStatus.CLOSED);
      expect(closed.closedBy).toBe('user-mgr');
      expect(closed.checklistSnapshot).toBeDefined();
      expect(periodRepo.save).toHaveBeenCalled();
    });

    it('should reopen closed period with required audit reason', async () => {
      periodRepo.findOne.mockResolvedValue({
        ...mockPeriod,
        status: FiscalPeriodStatus.CLOSED,
        closeReason: 'Tutup normal',
      });

      const reopened = await service.reopenPeriod(
        'period-2026-10',
        { reason: 'Audit koreksi invoice servis makan RM mitra' },
        'user-mgr',
      );

      expect(reopened.status).toBe(FiscalPeriodStatus.REOPENED);
      expect(reopened.closeReason).toContain('Audit koreksi invoice servis makan RM mitra');
      expect(periodRepo.save).toHaveBeenCalled();
    });
  });
});
