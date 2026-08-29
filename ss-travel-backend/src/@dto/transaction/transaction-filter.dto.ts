import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
} from "class-validator";
import { TransactionTypeEnum } from "src/@enum/transaction/transaction.enum";

// ...CreateTransactionDto & UpdateTransactionDto tetap sama...

export class FilterTransactionDto {

    @ApiProperty({ required: false, enum: TransactionTypeEnum })
    @IsOptional()
    @IsEnum(TransactionTypeEnum)
    category?: TransactionTypeEnum;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    subCategory?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    sourceAccount?: string;

    @ApiProperty({ required: false, description: "Format: YYYY-MM-DD" })
    @IsOptional()
    @IsString()
    startDate?: string;

    @ApiProperty({ required: false, description: "Format: YYYY-MM-DD" })
    @IsOptional()
    @IsString()
    endDate?: string;

    @ApiProperty({ required: false, description: "Cari di transactionDetail / note" })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;
}