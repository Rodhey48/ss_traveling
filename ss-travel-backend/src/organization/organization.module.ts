import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CompanyEntity,
  BusinessUnitEntity,
  CostCenterEntity,
  ProfitCenterEntity,
} from '@models';
import { OrganizationService } from './services/organization.service';
import { OrganizationController } from './controllers/organization.controller';
import { JWTService } from '../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      BusinessUnitEntity,
      CostCenterEntity,
      ProfitCenterEntity,
    ]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, JWTService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
