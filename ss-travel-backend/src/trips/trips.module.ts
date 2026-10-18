import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TripScheduleEntity,
  SpjEntity,
  SpjLegEntity,
  SpjCrewAssignmentEntity,
} from '../@models/trips';
import { VehicleEntity } from '../@models/fleet/vehicle.entity';
import { CustomerEntity } from '../@models/customer/customer.entity';
import { UsersEntity } from '../@models/user/user.entity';
import { BusinessUnitEntity } from '../@models/organization/business-unit.entity';
import { ProfitCenterEntity } from '../@models/organization/profit-center.entity';

import { FinanceModule } from '../finance/finance.module';
import { MasterRulesModule } from '../master-rules/master-rules.module';
import { TripSchedulesService } from './services/trip-schedules.service';
import { SpjService } from './services/spj.service';
import { TripSchedulesController } from './controllers/trip-schedules.controller';
import { SpjController } from './controllers/spj.controller';
import { JWTService } from '../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TripScheduleEntity,
      SpjEntity,
      SpjLegEntity,
      SpjCrewAssignmentEntity,
      VehicleEntity,
      CustomerEntity,
      UsersEntity,
      BusinessUnitEntity,
      ProfitCenterEntity,
    ]),
    FinanceModule,
    MasterRulesModule,
  ],
  controllers: [TripSchedulesController, SpjController],
  providers: [TripSchedulesService, SpjService, JWTService],
  exports: [TripSchedulesService, SpjService],
})
export class TripsModule {}
