import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentEntity, AgentType } from '../../@models/master-rules/agent.entity';
import {
  AgentCommissionRuleEntity,
  CommissionRuleType,
} from '../../@models/master-rules/agent-commission-rule.entity';
import { SeatClassEntity } from '../../@models/fleet/seat-class.entity';

describe('AgentsService', () => {
  let service: AgentsService;
  let agentRepo: any;
  let commissionRuleRepo: any;
  let seatClassRepo: any;

  beforeEach(async () => {
    agentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    commissionRuleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    seatClassRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: getRepositoryToken(AgentEntity),
          useValue: agentRepo,
        },
        {
          provide: getRepositoryToken(AgentCommissionRuleEntity),
          useValue: commissionRuleRepo,
        },
        {
          provide: getRepositoryToken(SeatClassEntity),
          useValue: seatClassRepo,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAgentsByRoute (Smart Filter Addendum v1.7)', () => {
    it('should filter Jakarta/Tangerang agents + OTA for departure leg', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValueOnce([
          { id: 'a-1', name: 'Agen Ciputat', city: 'TANGERANG' },
          { id: 'a-2', name: 'RedBus', agentType: AgentType.ONLINE_OTA },
        ]),
      };
      agentRepo.createQueryBuilder.mockReturnValueOnce(mockQb);

      const result = await service.findAgentsByRoute('TANGERANG', 'YOGYAKARTA');

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        "(a.city IN ('JAKARTA', 'TANGERANG', 'ALL') OR a.agent_type = 'ONLINE_OTA')",
      );
      expect(result.length).toBe(2);
    });

    it('should filter Yogyakarta agents + OTA for return leg', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValueOnce([
          { id: 'a-3', name: 'Agen Giwangan', city: 'YOGYAKARTA' },
          { id: 'a-2', name: 'RedBus', agentType: AgentType.ONLINE_OTA },
        ]),
      };
      agentRepo.createQueryBuilder.mockReturnValueOnce(mockQb);

      const result = await service.findAgentsByRoute('YOGYAKARTA', 'JAKARTA');

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        "(a.city IN ('YOGYAKARTA', 'ALL') OR a.agent_type = 'ONLINE_OTA')",
      );
      expect(result.length).toBe(2);
    });
  });

  describe('calculateCommission', () => {
    const mockAgent = {
      id: 'a-1',
      name: 'Agen Pulo Gebang',
      agentType: AgentType.OFFLINE,
    };

    it('should calculate FLAT commission per ticket', async () => {
      agentRepo.findOne.mockResolvedValueOnce(mockAgent);
      seatClassRepo.findOne.mockResolvedValueOnce({
        id: 'sc-1',
        name: 'Sleeper',
      });

      commissionRuleRepo.findOne.mockResolvedValueOnce({
        id: 'r-1',
        ruleType: CommissionRuleType.FLAT_PER_TICKET,
        commissionValue: 30000,
      });

      const result = await service.calculateCommission({
        agentId: 'a-1',
        seatClassId: 'sc-1',
        ticketPrice: 420000,
      });

      expect(result.calculatedCommission).toBe(30000);
      expect(result.netPayoutToCompany).toBe(390000);
      expect(result.ruleType).toBe(CommissionRuleType.FLAT_PER_TICKET);
    });

    it('should calculate PERCENTAGE commission for OTA', async () => {
      const mockOta = {
        id: 'a-2',
        name: 'Traveloka',
        agentType: AgentType.ONLINE_OTA,
      };
      agentRepo.findOne.mockResolvedValueOnce(mockOta);

      // No seatClassId specific, looks for universal rule
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce({
          id: 'r-2',
          ruleType: CommissionRuleType.PERCENTAGE,
          commissionValue: 10, // 10%
        }),
      };
      commissionRuleRepo.createQueryBuilder.mockReturnValueOnce(mockQb);

      const result = await service.calculateCommission({
        agentId: 'a-2',
        ticketPrice: 330000,
      });

      expect(result.calculatedCommission).toBe(33000);
      expect(result.netPayoutToCompany).toBe(297000);
      expect(result.ruleType).toBe(CommissionRuleType.PERCENTAGE);
    });

    it('should throw NotFoundException if no active commission rule is found', async () => {
      agentRepo.findOne.mockResolvedValueOnce(mockAgent);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(null),
      };
      commissionRuleRepo.createQueryBuilder.mockReturnValueOnce(mockQb);

      await expect(
        service.calculateCommission({
          agentId: 'a-1',
          ticketPrice: 200000,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
