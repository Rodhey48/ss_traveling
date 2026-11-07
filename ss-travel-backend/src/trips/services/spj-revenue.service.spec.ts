import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SpjRevenueService } from './spj-revenue.service';
import {
  SpjEntity,
  SpjRevenueDeclarationEntity,
  CrewMealPaymentEntity,
  SpjCrewAssignmentEntity,
  SpjRevenueDeclarationType,
  CrewMealPaymentCategory,
  CrewAssignmentRole,
} from '../../@models/trips';
import { AccountEntity } from '../../@models/finance/account.entity';
import { AgentEntity, AgentType, AgentSettlementType } from '../../@models/master-rules/agent.entity';
import { BankAccountEntity } from '../../@models/finance/bank-account.entity';
import { AccountingPostingService } from '../../finance/services/accounting-posting.service';

describe('SpjRevenueService', () => {
  let service: SpjRevenueService;
  let spjRepo: any;
  let revRepo: any;
  let mealPaymentRepo: any;
  let crewRepo: any;
  let accountRepo: any;
  let agentRepo: any;
  let bankAccountRepo: any;
  let postingService: any;

  beforeEach(async () => {
    spjRepo = {
      findOne: jest.fn(),
    };

    revRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'mock-rev-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: entity.id || 'mock-rev-id', ...entity })),
      remove: jest.fn(),
    };

    mealPaymentRepo = {
      create: jest.fn((dto) => ({ id: 'mock-meal-pay-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'mock-meal-pay-id', ...entity })),
    };

    crewRepo = {
      findOne: jest.fn(),
    };

    accountRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 'acc-12103', code: '12103' },
        { id: 'acc-41101', code: '41101' },
        { id: 'acc-54101', code: '54101' },
        { id: 'acc-22101', code: '22101' },
        { id: 'acc-11121', code: '11121' },
      ]),
      findOne: jest.fn(),
    };

    agentRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'agent-1',
        name: 'Agen Lebak Bulus',
        agentType: AgentType.OFFLINE,
        settlementType: AgentSettlementType.CASH_TO_CREW,
      }),
    };

    bankAccountRepo = {
      findOne: jest.fn(),
    };

    postingService = {
      postJournal: jest.fn().mockResolvedValue({ id: 'journal-uuid-1', journalNo: 'JV/2611/0001' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpjRevenueService,
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(SpjRevenueDeclarationEntity), useValue: revRepo },
        { provide: getRepositoryToken(CrewMealPaymentEntity), useValue: mealPaymentRepo },
        { provide: getRepositoryToken(SpjCrewAssignmentEntity), useValue: crewRepo },
        { provide: getRepositoryToken(AccountEntity), useValue: accountRepo },
        { provide: getRepositoryToken(AgentEntity), useValue: agentRepo },
        { provide: getRepositoryToken(BankAccountEntity), useValue: bankAccountRepo },
        { provide: AccountingPostingService, useValue: postingService },
      ],
    }).compile();

    service = module.get<SpjRevenueService>(SpjRevenueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('harus mencatat kargo motor dengan komisi dinamis kru 20% dan mendaftarkan hak komisi kru', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-1',
        companyId: 'comp-1',
        crewAssignments: [
          { id: 'assign-1', role: CrewAssignmentRole.DRIVER, crewId: 'driver-1-id' },
        ],
      });

      const result = await service.create(
        'spj-1',
        {
          declarationType: SpjRevenueDeclarationType.CARGO_MOTORCYCLE,
          amount: '350000.00',
          sourceReference: 'RESI-MTR-001',
          crewCommissionPercentage: '20.00',
          cargoSenderName: 'Pak Andi',
          cargoReceiverName: 'Bu Siti',
        },
        'conductor-1-id',
      );

      expect(revRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          declarationType: SpjRevenueDeclarationType.CARGO_MOTORCYCLE,
          amount: '350000.00',
          crewCommissionPercentage: '20.00',
          crewCommissionAmount: '70000.00', // 20% x 350.000 = 70.000
        }),
      );
      expect(revRepo.save).toHaveBeenCalled();

      // Otomasi pendaftaran hak komisi kru
      expect(mealPaymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          crewId: 'driver-1-id',
          paymentCategory: CrewMealPaymentCategory.CARGO_COMMISSION,
          amount: '70000.00',
        }),
      );
      expect(mealPaymentRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('harus mencatat penjualan tiket agen dan memposting jurnal otomatis secara atomik', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-1',
        spjNo: 'SPJ/AKAP/2611/0001',
        companyId: 'comp-1',
        vehicleId: 'veh-1',
        crewAssignments: [],
      });

      const result = await service.create(
        'spj-1',
        {
          declarationType: SpjRevenueDeclarationType.TICKET_AGENT,
          amount: '1250000.00',
          agentId: 'agent-1',
          ticketCount: 5,
          ticketPrice: '250000.00',
          agentCommissionAmount: '100000.00',
          settlementType: AgentSettlementType.CASH_TO_CREW,
          sourceReference: 'MNF-LBB-05',
        },
        'admin-user-1',
      );

      expect(agentRepo.findOne).toHaveBeenCalledWith({ where: { id: 'agent-1' } });
      expect(postingService.postJournal).toHaveBeenCalled();
      expect(revRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
