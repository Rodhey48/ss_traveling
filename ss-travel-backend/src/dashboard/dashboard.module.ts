import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  VehicleEntity,
  SpjEntity,
  CashAccountEntity,
  BankAccountEntity,
  ArInvoiceEntity,
  ApInvoiceEntity,
  CrewCashDiscrepancyEntity,
  CashTransactionEntity,
} from '../@models';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VehicleEntity,
      SpjEntity,
      CashAccountEntity,
      BankAccountEntity,
      ArInvoiceEntity,
      ApInvoiceEntity,
      CrewCashDiscrepancyEntity,
      CashTransactionEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
