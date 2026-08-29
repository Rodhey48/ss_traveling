import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";

import { TransactionService } from "./services/transaction.service";

import { TransactionEntity } from "@models/transaction/transaction.entity";
import { TransactionController } from "./controller/transaction.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TransactionEntity,
        ]),
        AuthModule,
    ],

    controllers: [
        TransactionController,
    ],

    providers: [
        TransactionService,
    ],

    exports: [
        TransactionService,
    ],
})
export class TransactionModule {}