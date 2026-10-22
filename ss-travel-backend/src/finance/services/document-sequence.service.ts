import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { DocumentSequenceEntity } from '../../@models/finance/document-sequence.entity';
import { GenerateSequenceDto } from '../../@dto/finance/document-sequence.dto';

@Injectable()
export class DocumentSequenceService {
  constructor(
    @InjectRepository(DocumentSequenceEntity)
    private readonly sequenceRepo: Repository<DocumentSequenceEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generates next document number atomically with pessimistic write lock.
   * Can be injected into an existing database transaction via entityManager.
   * E.g. "SPJ/AKP/2610/0001" or "BKM/2610/0001"
   */
  async getNextDocumentNumber(
    documentType: string,
    periodKey: string,
    prefix: string,
    padding = 4,
    companyId?: string,
    entityManager?: EntityManager,
  ): Promise<string> {
    const executeLogic = async (manager: EntityManager): Promise<string> => {
      let sequence = await manager.findOne(DocumentSequenceEntity, {
        where: {
          documentType,
          periodKey,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sequence) {
        sequence = manager.create(DocumentSequenceEntity, {
          documentType,
          periodKey,
          prefix,
          lastNumber: 1,
          padding,
          companyId,
          isActive: true,
        });
        await manager.save(sequence);
        return `${prefix}/${String(1).padStart(padding, '0')}`;
      }

      if (prefix && sequence.prefix !== prefix) {
        sequence.prefix = prefix;
      }

      sequence.lastNumber += 1;
      await manager.save(sequence);

      const formattedNumber = String(sequence.lastNumber).padStart(
        sequence.padding || padding,
        '0',
      );
      return `${sequence.prefix}/${formattedNumber}`;
    };

    if (entityManager) {
      return await executeLogic(entityManager);
    } else {
      return await this.dataSource.transaction(async (manager) => {
        return await executeLogic(manager);
      });
    }
  }

  async previewNextNumber(
    documentType: string,
    periodKey: string,
  ): Promise<{ nextNumber: string; currentLastNumber: number }> {
    const sequence = await this.sequenceRepo.findOne({
      where: { documentType, periodKey },
    });

    if (!sequence) {
      return {
        nextNumber: `${documentType}/${periodKey}/0001`,
        currentLastNumber: 0,
      };
    }

    const nextVal = sequence.lastNumber + 1;
    const formatted = String(nextVal).padStart(sequence.padding || 4, '0');
    return {
      nextNumber: `${sequence.prefix}/${formatted}`,
      currentLastNumber: sequence.lastNumber,
    };
  }

  async findAllSequences(): Promise<DocumentSequenceEntity[]> {
    return await this.sequenceRepo.find({
      order: { documentType: 'ASC', periodKey: 'DESC' },
    });
  }

  async createOrResetSequence(
    dto: GenerateSequenceDto,
  ): Promise<DocumentSequenceEntity> {
    let sequence = await this.sequenceRepo.findOne({
      where: { documentType: dto.documentType, periodKey: dto.periodKey },
    });

    if (sequence) {
      sequence.prefix = dto.prefix;
      sequence.padding = dto.padding || 4;
    } else {
      sequence = this.sequenceRepo.create({
        ...dto,
        lastNumber: 0,
        padding: dto.padding || 4,
        isActive: true,
      });
    }

    return await this.sequenceRepo.save(sequence);
  }
}
