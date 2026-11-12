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
      const rows = await manager.query(
        `INSERT INTO "document_sequences" ("id", "document_type", "period_key", "prefix", "last_number", "padding", "company_id", "is_active", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, 1, $4, $5, true, NOW(), NOW())
         ON CONFLICT ("document_type", "period_key")
         DO UPDATE SET 
           "last_number" = "document_sequences"."last_number" + 1,
           "prefix" = CASE WHEN $3 != '' THEN $3 ELSE "document_sequences"."prefix" END,
           "updatedAt" = NOW()
         RETURNING "last_number", "prefix", "padding"`,
        [documentType, periodKey, prefix, padding, companyId || null],
      );

      const row = rows[0];
      const nextNumber = Number(row.last_number ?? row.lastNumber);
      const rowPrefix = row.prefix || prefix;
      const rowPadding = Number(row.padding) || padding;

      const formattedNumber = String(nextNumber).padStart(rowPadding, '0');
      return `${rowPrefix}/${formattedNumber}`;
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
