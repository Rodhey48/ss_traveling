import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CrewCashSettlementEntity,
  CrewCashRemittanceEntity,
  CrewCashRemittanceAllocationEntity,
  CrewCashDiscrepancyEntity,
  SpjEntity,
  SpjRevenueDeclarationEntity,
  CrewMealPaymentEntity,
  CashAccountEntity,
  AccountEntity,
  UsersEntity,
} from '../@models';

import { FinanceModule } from '../finance/finance.module';
import { TripsModule } from '../trips/trips.module';
import { CashierSettlementService } from './services/cashier-settlement.service';
import { CashierDiscrepancyService } from './services/cashier-discrepancy.service';
import { CashierSettlementController } from './controllers/cashier-settlement.controller';
import { CashierDiscrepancyController } from './controllers/cashier-discrepancy.controller';
import { JWTService } from '../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrewCashSettlementEntity,
      CrewCashRemittanceEntity,
      CrewCashRemittanceAllocationEntity,
      CrewCashDiscrepancyEntity,
      SpjEntity,
      SpjRevenueDeclarationEntity,
      CrewMealPaymentEntity,
      CashAccountEntity,
      AccountEntity,
      UsersEntity,
    ]),
    FinanceModule,
    TripsModule,
  ],
  controllers: [
    CashierSettlementController,
    CashierDiscrepancyController,
  ],
  providers: [
    CashierSettlementService,
    CashierDiscrepancyService,
    JWTService,
  ],
  exports: [
    CashierSettlementService,
    CashierDiscrepancyService,
  ],
})
export class CashierModule {}
