import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { VehicleEntity } from '../@models/fleet/vehicle.entity';
import { SpjEntity } from '../@models/trips/spj.entity';
import { CashAccountEntity } from '../@models/finance/cash-account.entity';
import { BankAccountEntity } from '../@models/finance/bank-account.entity';
import { ArInvoiceEntity } from '../@models/finance/ar-invoice.entity';
import { ApInvoiceEntity } from '../@models/finance/ap-invoice.entity';
import { CrewCashDiscrepancyEntity } from '../@models/cashier/crew-cash-discrepancy.entity';
import { CashTransactionEntity } from '../@models/finance/cash-transaction.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let vehicleRepo: any;
  let spjRepo: any;
  let cashAccountRepo: any;
  let bankAccountRepo: any;
  let arInvoiceRepo: any;
  let apInvoiceRepo: any;
  let discrepancyRepo: any;
  let cashTransactionRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    vehicleRepo = {
      count: jest.fn().mockResolvedValue(10),
    };

    spjRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'spj-1',
          vehicleId: 'veh-1',
          crewAssignments: [
            { crewId: 'driver-1', role: 'DRIVER', crew: { name: 'Pak Budi' } },
            { crewId: 'cond-1', role: 'CONDUCTOR', crew: { name: 'Mas Anto' } },
          ],
        },
      ]),
      count: jest.fn().mockResolvedValue(2),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      }),
    };

    cashAccountRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 'cash-1', code: 'CASH-POOL', name: 'Kas Pool', accountId: 'acc-1' },
      ]),
    };

    bankAccountRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 'bank-1', code: 'BANK-BCA', bankName: 'BCA', accountNumber: '123', accountId: 'acc-2' },
      ]),
    };

    arInvoiceRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '3', totalRemaining: '12250000.00' }),
      }),
    };

    apInvoiceRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '2', totalRemaining: '3550000.00' }),
      }),
    };

    discrepancyRepo = {
      find: jest.fn().mockResolvedValue([{ differenceAmount: '300000.00' }]),
    };

    cashTransactionRepo = {
      count: jest.fn().mockResolvedValue(1),
    };

    dataSource = {
      query: jest.fn().mockResolvedValue([{ count: '6', balance: '5000000.00' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(VehicleEntity), useValue: vehicleRepo },
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(CashAccountEntity), useValue: cashAccountRepo },
        { provide: getRepositoryToken(BankAccountEntity), useValue: bankAccountRepo },
        { provide: getRepositoryToken(ArInvoiceEntity), useValue: arInvoiceRepo },
        { provide: getRepositoryToken(ApInvoiceEntity), useValue: apInvoiceRepo },
        { provide: getRepositoryToken(CrewCashDiscrepancyEntity), useValue: discrepancyRepo },
        { provide: getRepositoryToken(CashTransactionEntity), useValue: cashTransactionRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should include financial data when user has DIRECTOR / FINANCE role', async () => {
    const summary = await service.getSummary({ role: ['FINANCE_MANAGER'] });
    expect(summary).toBeDefined();
    expect(summary.canViewFinance).toBe(true);
    expect(summary.fleet.total).toBe(10);
    expect(summary.crew.activeDrivers).toBe(1);
    expect(summary.cashAndBank).not.toBeNull();
    expect(summary.financeAlerts).not.toBeNull();
    expect(summary.financeAlerts?.openArCount).toBe(3);
  });

  it('should OMIT sensitive financial data when user is CREW_DRIVER / non-finance', async () => {
    const summary = await service.getSummary({ role: ['CREW_DRIVER'] });
    expect(summary).toBeDefined();
    expect(summary.canViewFinance).toBe(false);
    expect(summary.fleet.total).toBe(10);
    expect(summary.crew.activeDrivers).toBe(1);
    // Sensitive financial data MUST be null for security!
    expect(summary.cashAndBank).toBeNull();
    expect(summary.financeAlerts).toBeNull();
  });
});
