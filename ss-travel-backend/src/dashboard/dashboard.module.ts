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
import { JWTService } from '../@services/jwt/jwt.service';
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
  providers: [DashboardService, JWTService],
  exports: [DashboardService],
})
export class DashboardModule {}
