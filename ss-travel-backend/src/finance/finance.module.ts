import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AccountEntity,
  CashAccountEntity,
  BankAccountEntity,
  FiscalYearEntity,
  FiscalPeriodEntity,
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
} from '../@models';
import { AccountsService } from './services/accounts.service';
import { CashBankService } from './services/cash-bank.service';
import { FiscalPeriodsService } from './services/fiscal-periods.service';
import { DocumentSequenceService } from './services/document-sequence.service';
import { AccountingPostingService } from './services/accounting-posting.service';
import { JournalReversalService } from './services/journal-reversal.service';
import { ApService } from './services/ap.service';
import { ArService } from './services/ar.service';
import { AccountsController } from './controllers/accounts.controller';
import { CashAccountsController } from './controllers/cash-accounts.controller';
import { BankAccountsController } from './controllers/bank-accounts.controller';
import { FiscalPeriodsController } from './controllers/fiscal-periods.controller';
import { DocumentSequenceController } from './controllers/document-sequence.controller';
import { JournalsController } from './controllers/journals.controller';
import { ApController } from './controllers/ap.controller';
import { ArController } from './controllers/ar.controller';
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
  ],
})
export class FinanceModule {}
