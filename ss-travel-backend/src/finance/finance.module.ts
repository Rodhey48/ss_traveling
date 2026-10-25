import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AccountEntity,
  CashAccountEntity,
  BankAccountEntity,
  FiscalYearEntity,
  FiscalPeriodEntity,
  PeriodCloseCheckEntity,
  DocumentSequenceEntity,
  JournalEntryEntity,
  JournalLineEntity,
  AccountingEventEntity,
  ApInvoiceEntity,
  ApInvoiceLineEntity,
  ApPaymentEntity,
  ApAllocationEntity,
  ArInvoiceEntity,
  ArInvoiceLineEntity,
  ArReceiptEntity,
  ArAllocationEntity,
  RestaurantEntity,
  CustomerEntity,
  SpjEntity,
  SpjLegEntity,
  VehicleEntity,
  CrewCashDiscrepancyEntity,
  CashTransactionEntity,
} from '../@models';
import { AccountsService } from './services/accounts.service';
import { CashBankService } from './services/cash-bank.service';
import { FiscalPeriodsService } from './services/fiscal-periods.service';
import { DocumentSequenceService } from './services/document-sequence.service';
import { AccountingPostingService } from './services/accounting-posting.service';
import { JournalReversalService } from './services/journal-reversal.service';
import { ApService } from './services/ap.service';
import { ArService } from './services/ar.service';
import { FinancialReportsService } from './services/financial-reports.service';
import { TripProfitabilityService } from './services/trip-profitability.service';
import { PeriodClosingService } from './services/period-closing.service';
import { PettyCashService } from './services/petty-cash.service';
import { AccountsController } from './controllers/accounts.controller';
import { CashAccountsController } from './controllers/cash-accounts.controller';
import { BankAccountsController } from './controllers/bank-accounts.controller';
import { FiscalPeriodsController } from './controllers/fiscal-periods.controller';
import { DocumentSequenceController } from './controllers/document-sequence.controller';
import { JournalsController } from './controllers/journals.controller';
import { ApController } from './controllers/ap.controller';
import { ArController } from './controllers/ar.controller';
import { FinancialReportsController } from './controllers/financial-reports.controller';
import { TripProfitabilityController } from './controllers/trip-profitability.controller';
import { PeriodClosingController } from './controllers/period-closing.controller';
import { PettyCashController } from './controllers/petty-cash.controller';
import { JWTService } from '../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountEntity,
      CashAccountEntity,
      BankAccountEntity,
      FiscalYearEntity,
      FiscalPeriodEntity,
      PeriodCloseCheckEntity,
      DocumentSequenceEntity,
      JournalEntryEntity,
      JournalLineEntity,
      AccountingEventEntity,
      ApInvoiceEntity,
      ApInvoiceLineEntity,
      ApPaymentEntity,
      ApAllocationEntity,
      ArInvoiceEntity,
      ArInvoiceLineEntity,
      ArReceiptEntity,
      ArAllocationEntity,
      RestaurantEntity,
      CustomerEntity,
      SpjEntity,
      SpjLegEntity,
      VehicleEntity,
      CrewCashDiscrepancyEntity,
      CashTransactionEntity,
    ]),
  ],
  controllers: [
    AccountsController,
    CashAccountsController,
    BankAccountsController,
    FiscalPeriodsController,
    DocumentSequenceController,
    JournalsController,
    ApController,
    ArController,
    FinancialReportsController,
    TripProfitabilityController,
    PeriodClosingController,
    PettyCashController,
  ],
  providers: [
    AccountsService,
    CashBankService,
    FiscalPeriodsService,
    DocumentSequenceService,
    AccountingPostingService,
    JournalReversalService,
    ApService,
    ArService,
    FinancialReportsService,
    TripProfitabilityService,
    PeriodClosingService,
    PettyCashService,
    JWTService,
  ],
  exports: [
    AccountsService,
    CashBankService,
    FiscalPeriodsService,
    DocumentSequenceService,
    AccountingPostingService,
    JournalReversalService,
    ApService,
    ArService,
    FinancialReportsService,
    TripProfitabilityService,
    PeriodClosingService,
    PettyCashService,
  ],
})
export class FinanceModule {}
