import { ApiProperty } from "@nestjs/swagger";
import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from "class-validator";

import { TransactionTypeEnum } from "src/@enum/transaction/transaction.enum";

export class CreateTransactionDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    date: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    transactionDetail?: string;

    @ApiProperty({
        enum: TransactionTypeEnum,
    })
    @IsNotEmpty()
    @IsEnum(TransactionTypeEnum)
    category: TransactionTypeEnum;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    subCategory?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    sourceAccount?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    tax?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    transactionReceipt?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateTransactionDto {

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    date?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    transactionDetail?: string;

    @ApiProperty({
        required: false,
        enum: TransactionTypeEnum,
    })
    @IsOptional()
    @IsEnum(TransactionTypeEnum)
    category?: TransactionTypeEnum;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    subCategory?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    sourceAccount?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    tax?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    transactionReceipt?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    note?: string;
}