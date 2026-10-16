import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity, AccountType, NormalBalance } from '../../@models/finance/account.entity';
import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountQueryFilterDto,
} from '../../@dto/finance/account.dto';

export type AccountTreeNode = Omit<AccountEntity, 'generateUUID'> & {
  children: AccountTreeNode[];
};

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
  ) {}

  async create(dto: CreateAccountDto): Promise<AccountEntity> {
    const existing = await this.accountRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Kode akun '${dto.code}' sudah digunakan.`);
    }

    if (dto.parentId) {
      const parent = await this.accountRepo.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Akun induk dengan ID '${dto.parentId}' tidak ditemukan.`);
      }
    }

    const account = this.accountRepo.create({
      ...dto,
      isPostable: dto.isPostable ?? true,
      isActive: dto.isActive ?? true,
    });

    return await this.accountRepo.save(account);
  }

  async findAll(filter: AccountQueryFilterDto): Promise<AccountEntity[] | AccountTreeNode[]> {
    const isTree = filter.tree === true || filter.tree === 'true';

    const qb = this.accountRepo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.parent', 'parent')
      .orderBy('account.code', 'ASC');

    if (filter.type) {
      qb.andWhere('account.type = :type', { type: filter.type });
    }

    if (filter.isPostable !== undefined) {
      const isPostableVal = filter.isPostable === true || filter.isPostable === 'true';
      qb.andWhere('account.isPostable = :isPostable', { isPostable: isPostableVal });
    }

    if (filter.parentId) {
      qb.andWhere('account.parentId = :parentId', { parentId: filter.parentId });
    }

    const includeInactive =
      filter.includeInactive === true || filter.includeInactive === 'true';
    if (!includeInactive) {
      qb.andWhere('account.isActive = true');
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(account.code) LIKE LOWER(:search) OR LOWER(account.name) LIKE LOWER(:search))',
        { search: `%${filter.search}%` },
      );
    }

    const accounts = await qb.getMany();

    if (isTree) {
      return this.buildTree(accounts);
    }

    return accounts;
  }

  async findOne(id: string): Promise<AccountEntity> {
    const account = await this.accountRepo.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!account) {
      throw new NotFoundException(`Akun dengan ID '${id}' tidak ditemukan.`);
    }

    return account;
  }

  async findByCode(code: string): Promise<AccountEntity> {
    const account = await this.accountRepo.findOne({
      where: { code },
      relations: ['parent'],
    });

    if (!account) {
      throw new NotFoundException(`Akun dengan kode '${code}' tidak ditemukan.`);
    }

    return account;
  }

  async update(id: string, dto: UpdateAccountDto): Promise<AccountEntity> {
    const account = await this.findOne(id);

    if (dto.code && dto.code !== account.code) {
      const existing = await this.accountRepo.findOne({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Kode akun '${dto.code}' sudah digunakan.`);
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Akun tidak dapat menjadi induk bagi dirinya sendiri.');
      }
      // Check circular reference: ensure dto.parentId is not a descendant of account
      const isDescendant = await this.checkIsDescendant(id, dto.parentId);
      if (isDescendant) {
        throw new BadRequestException(
          'Tidak dapat memindahkan akun ke dalam sub-akunya sendiri (circular reference).',
        );
      }
      const parent = await this.accountRepo.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Akun induk dengan ID '${dto.parentId}' tidak ditemukan.`);
      }
    }

    Object.assign(account, dto);
    return await this.accountRepo.save(account);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const account = await this.findOne(id);

    // Prevent deletion if account has children
    const childCount = await this.accountRepo.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus akun '${account.code}' karena masih memiliki ${childCount} sub-akun.`,
      );
    }

    // Soft delete by setting isActive to false
    account.isActive = false;
    await this.accountRepo.save(account);

    return {
      success: true,
      message: `Akun '${account.code} - ${account.name}' berhasil dinonaktifkan.`,
    };
  }

  private buildTree(accounts: AccountEntity[]): AccountTreeNode[] {
    const map = new Map<string, AccountTreeNode>();
    const roots: AccountTreeNode[] = [];

    // Initialize map
    for (const acc of accounts) {
      map.set(acc.id, { ...acc, children: [] });
    }

    // Connect parents and children
    for (const acc of accounts) {
      const node = map.get(acc.id)!;
      if (acc.parentId && map.has(acc.parentId)) {
        map.get(acc.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private async checkIsDescendant(ancestorId: string, potentialDescendantId: string): Promise<boolean> {
    let currentId: string | undefined = potentialDescendantId;

    while (currentId) {
      if (currentId === ancestorId) {
        return true;
      }
      const current = await this.accountRepo.findOne({
        where: { id: currentId },
        select: ['id', 'parentId'],
      });
      if (!current || !current.parentId) {
        break;
      }
      currentId = current.parentId;
    }

    return false;
  }
}
