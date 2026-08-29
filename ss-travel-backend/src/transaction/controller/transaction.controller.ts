import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import {
    CreateTransactionDto,
    UpdateTransactionDto,
} from "src/@dto/transaction/transaction.dto";
import { RequestInterface } from "@interfaces";

import { TransactionService } from "../services/transaction.service";
import { FilterTransactionDto } from "src/@dto/transaction/transaction-filter.dto";

@Controller("transaction")
@UseGuards(JwtAuthGuard)
export class TransactionController {

    constructor(
        private readonly transactionService: TransactionService,
    ) {}

    @Get()
    async findAll(
        @Req() req: RequestInterface,
        @Query() filter: FilterTransactionDto,
    ) {
        return this.transactionService.findAll(
            filter,
            req.user.id,
        );
    }

    @Get(":id")
    async findOne(
        @Req() req: RequestInterface,
        @Param("id") id: string,
    ) {
        return this.transactionService.findOne(
            id,
            req.user.id,
        );
    }

    @Post()
    async create(
        @Req() req: RequestInterface,
        @Body() payload: CreateTransactionDto,
    ) {
        return this.transactionService.create(
            payload,
            req.user.id,
        );
    }

    @Patch(":id")
    async update(
        @Req() req: RequestInterface,
        @Param("id") id: string,
        @Body() payload: UpdateTransactionDto,
    ) {
        return this.transactionService.update(
            id,
            payload,
            req.user.id,
        );
    }

    @Delete(":id")
    async delete(
        @Req() req: RequestInterface,
        @Param("id") id: string,
    ) {
        return this.transactionService.delete(
            id,
            req.user.id,
        );
    }
}