import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AccountEntity,
  CashAccountEntity,
  BankAccountEntity,
  FiscalYearEntity,
  FiscalPeriodEntity,
  DocumentSequenceEntity,
} from '../@models';
import { AccountsService } from './services/accounts.service';
import { CashBankService } from './services/cash-bank.service';
import { FiscalPeriodsService } from './services/fiscal-periods.service';
import { DocumentSequenceService } from './services/document-sequence.service';
import { AccountsController } from './controllers/accounts.controller';
import { CashAccountsController } from './controllers/cash-accounts.controller';
import { BankAccountsController } from './controllers/bank-accounts.controller';
import { FiscalPeriodsController } from './controllers/fiscal-periods.controller';
import { DocumentSequenceController } from './controllers/document-sequence.controller';
import { JWTService } from '../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountEntity,
      CashAccountEntity,
      BankAccountEntity,
      FiscalYearEntity,
      FiscalPeriodEntity,
      DocumentSequenceEntity,
    ]),
  ],
  controllers: [
    AccountsController,
    CashAccountsController,
    BankAccountsController,
    FiscalPeriodsController,
    DocumentSequenceController,
  ],
  providers: [
    AccountsService,
    CashBankService,
    FiscalPeriodsService,
    DocumentSequenceService,
    JWTService,
  ],
  exports: [
    AccountsService,
    CashBankService,
    FiscalPeriodsService,
    DocumentSequenceService,
  ],
})
export class FinanceModule {}
