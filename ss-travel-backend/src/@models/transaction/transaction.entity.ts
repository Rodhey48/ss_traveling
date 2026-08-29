import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
} from "typeorm";

import { BaseEntity } from "@models/base.entity";
import { UsersEntity } from "@models/user/user.entity";
import { TransactionTypeEnum } from "src/@enum/transaction/transaction.enum";

@Entity("transaction")
export class TransactionEntity extends BaseEntity {

    constructor(partial: Partial<TransactionEntity>) {
        super();
        Object.assign(this, partial);
    }

    @Column({
        type: "varchar",
        nullable: false,
    })
    date: string;

    @Column({
        type: "varchar",
        nullable: true,
        name: "transaction_detail",
    })
    transactionDetail: string;

    @Column({
        type: "enum",
        enum: TransactionTypeEnum,
        default: TransactionTypeEnum.EXPENSES,
    })
    category: TransactionTypeEnum;

    @Column({
        type: "varchar",
        nullable: true,
        name: "sub_category",
    })
    subCategory: string;

    @Column({
        type: "decimal",
        nullable: true,
    })
    amount: number;

    @Column({
        type: "varchar",
        nullable: true,
        name: "payment_method",
    })
    paymentMethod: string;

    @Column({
        type: "varchar",
        nullable: true,
        name: "source_account",
    })
    sourceAccount: string;

    @Column({
        type: "varchar",
        nullable: true,
    })
    status: string;

    @Column({
        type: "varchar",
        nullable: true,
        name: "reference_number",
    })
    referenceNumber: string;

    @Column({
        type: "varchar",
        nullable: true,
    })
    tax: string;

    @Column({
        type: "varchar",
        nullable: true,
        name: "transaction_receipt",
    })
    transactionReceipt: string;

    @ManyToOne(
        () => UsersEntity,
        (user) => user.transaction,
        {
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
    )
    @JoinColumn({
        name: "userId",
    })
    user: UsersEntity;

    @Column({
        type: "varchar",
        nullable: true,
    })
    note: string;
}