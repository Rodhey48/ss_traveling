import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TripScheduleEntity,
  SpjEntity,
  SpjLegEntity,
  SpjCrewAssignmentEntity,
  SpjExpenseEntity,
  SpjUjEntity,
  SpjUjDisbursementEntity,
  SpjUjExpenseEntity,
  SpjUjReturnEntity,
  SpjUjAdditionalRequestEntity,
  SpjRevenueDeclarationEntity,
  CrewMealPaymentEntity,
} from '../@models/trips';
import { VehicleEntity } from '../@models/fleet/vehicle.entity';
import { CustomerEntity } from '../@models/customer/customer.entity';
import { UsersEntity } from '../@models/user/user.entity';
import { BusinessUnitEntity } from '../@models/organization/business-unit.entity';
import { ProfitCenterEntity } from '../@models/organization/profit-center.entity';
import { CostCenterEntity } from '../@models/organization/cost-center.entity';
import { CashAccountEntity } from '../@models/finance/cash-account.entity';
import { BankAccountEntity } from '../@models/finance/bank-account.entity';

import { FinanceModule } from '../finance/finance.module';
import { MasterRulesModule } from '../master-rules/master-rules.module';
import { TripSchedulesService } from './services/trip-schedules.service';
import { SpjService } from './services/spj.service';
import { SpjUjService } from './services/spj-uj.service';
import { SpjExpensesService } from './services/spj-expenses.service';
import { SpjRevenueService } from './services/spj-revenue.service';
import { CrewMealPaymentsService } from './services/crew-meal-payments.service';
import { TripSchedulesController } from './controllers/trip-schedules.controller';
import { SpjController } from './controllers/spj.controller';
import { SpjFinanceController } from './controllers/spj-finance.controller';
import { JWTService } from '../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TripScheduleEntity,
      SpjEntity,
      SpjLegEntity,
      SpjCrewAssignmentEntity,
      SpjExpenseEntity,
      SpjUjEntity,
      SpjUjDisbursementEntity,
      SpjUjExpenseEntity,
      SpjUjReturnEntity,
      SpjUjAdditionalRequestEntity,
      SpjRevenueDeclarationEntity,
      CrewMealPaymentEntity,
      VehicleEntity,
      CustomerEntity,
      UsersEntity,
      BusinessUnitEntity,
      ProfitCenterEntity,
      CostCenterEntity,
      CashAccountEntity,
      BankAccountEntity,
    ]),
    FinanceModule,
    MasterRulesModule,
  ],
  controllers: [
    TripSchedulesController,
    SpjController,
    SpjFinanceController,
  ],
  providers: [
    TripSchedulesService,
    SpjService,
    SpjUjService,
    SpjExpensesService,
    SpjRevenueService,
    CrewMealPaymentsService,
    JWTService,
  ],
  exports: [
    TripSchedulesService,
    SpjService,
    SpjUjService,
    SpjExpensesService,
    SpjRevenueService,
    CrewMealPaymentsService,
  ],
})
export class TripsModule {}
