import { TransactionEntity } from "@models/transaction/transaction.entity";
import {
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FilterTransactionDto } from "src/@dto/transaction/transaction-filter.dto";
import {
    CreateTransactionDto,
    UpdateTransactionDto,
} from "src/@dto/transaction/transaction.dto";
import { Repository } from "typeorm";

@Injectable()
export class TransactionService {

    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
    ) {}

    async findAll(
        filter: FilterTransactionDto,
        userId: string,
    ) {
        const {
            category,
            subCategory,
            status,
            paymentMethod,
            sourceAccount,
            startDate,
            endDate,
            search,
            page = 1,
            limit = 10,
        } = filter;

        const qb = this.transactionRepository
            .createQueryBuilder("transaction")
            .where("transaction.userId = :userId", { userId });

        if (category) {
            qb.andWhere("transaction.category = :category", { category });
        }

        if (subCategory) {
            qb.andWhere("transaction.subCategory = :subCategory", { subCategory });
        }

        if (status) {
            qb.andWhere("transaction.status = :status", { status });
        }

        if (paymentMethod) {
            qb.andWhere("transaction.paymentMethod = :paymentMethod", { paymentMethod });
        }

        if (sourceAccount) {
            qb.andWhere("transaction.sourceAccount = :sourceAccount", { sourceAccount });
        }

        if (startDate && endDate) {
            qb.andWhere("transaction.date BETWEEN :startDate AND :endDate", {
                startDate,
                endDate,
            });
        } else if (startDate) {
            qb.andWhere("transaction.date >= :startDate", { startDate });
        } else if (endDate) {
            qb.andWhere("transaction.date <= :endDate", { endDate });
        }

        if (search) {
            qb.andWhere(
                "(transaction.transactionDetail ILIKE :search OR transaction.note ILIKE :search)",
                { search: `%${search}%` },
            );
        }

        qb.orderBy("transaction.date", "DESC")
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(
        id: string,
        userId: string,
    ) {
        const transaction = await this.transactionRepository.findOne({
            where: {
                id,
                user: {
                    id: userId,
                },
            },
        });

        if (!transaction) {
            throw new NotFoundException(
                "Transaction tidak ditemukan",
            );
        }

        return transaction;
    }

    async create(
        payload: CreateTransactionDto,
        userId: string,
    ) {
        const transaction = this.transactionRepository.create({
            ...payload,
            user: {
                id: userId,
            },
        });

        return this.transactionRepository.save(transaction);
    }

    async update(
        id: string,
        payload: UpdateTransactionDto,
        userId: string,
    ) {
        const transaction = await this.findOne(id, userId);

        Object.assign(transaction, payload);

        return this.transactionRepository.save(transaction);
    }

    async delete(
        id: string,
        userId: string,
    ) {
        const transaction = await this.findOne(id, userId);

        await this.transactionRepository.remove(transaction);

        return {
            message: "Transaction berhasil dihapus",
        };
    }
}