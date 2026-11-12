import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FareSeasonEntity } from '../@models/master-rules/fare-season.entity';
import { FareMatrixEntity } from '../@models/master-rules/fare-matrix.entity';
import { AgentEntity } from '../@models/master-rules/agent.entity';
import { AgentCommissionRuleEntity } from '../@models/master-rules/agent-commission-rule.entity';
import { CrewRateRuleEntity } from '../@models/master-rules/crew-rate-rule.entity';
import { RestaurantEntity } from '../@models/master-rules/restaurant.entity';
import { CoordinatorEntity } from '../@models/master-rules/coordinator.entity';
import { CoordinatorFeeRuleEntity } from '../@models/master-rules/coordinator-fee-rule.entity';
import { RouteEntity } from '../@models/master-rules/route.entity';
import { SeatClassEntity } from '../@models/fleet/seat-class.entity';
import { UsersEntity } from '../@models/user/user.entity';

import { FaresService } from './services/fares.service';
import { AgentsService } from './services/agents.service';
import { CrewRatesService } from './services/crew-rates.service';
import { PartnersService } from './services/partners.service';
import { RoutesService } from './services/routes.service';

import { FaresController } from './controllers/fares.controller';
import { AgentsController } from './controllers/agents.controller';
import { CrewRatesController } from './controllers/crew-rates.controller';
import { PartnersController } from './controllers/partners.controller';
import { RoutesController } from './controllers/routes.controller';
import { JWTService } from '../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FareSeasonEntity,
      FareMatrixEntity,
      AgentEntity,
      AgentCommissionRuleEntity,
      CrewRateRuleEntity,
      RestaurantEntity,
      CoordinatorEntity,
      CoordinatorFeeRuleEntity,
      RouteEntity,
      SeatClassEntity,
      UsersEntity,
    ]),
  ],
  controllers: [
    FaresController,
    AgentsController,
    CrewRatesController,
    PartnersController,
    RoutesController,
  ],
  providers: [
    FaresService,
    AgentsService,
    CrewRatesService,
    PartnersService,
    RoutesService,
    JWTService,
  ],
  exports: [
    FaresService,
    AgentsService,
    CrewRatesService,
    PartnersService,
    RoutesService,
  ],
})
export class MasterRulesModule {}
