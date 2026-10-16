import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  VehicleEntity,
  VehicleSeatClassEntity,
  SeatClassEntity,
  VehicleImageEntity,
  CompanyEntity,
} from '@models';
import { VehiclesService } from './services/vehicles.service';
import { VehiclesController } from './controllers/vehicles.controller';
import { SeatClassesController } from './controllers/seat-classes.controller';
import { JWTService } from '../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VehicleEntity,
      VehicleSeatClassEntity,
      SeatClassEntity,
      VehicleImageEntity,
      CompanyEntity,
    ]),
  ],
  controllers: [VehiclesController, SeatClassesController],
  providers: [VehiclesService, JWTService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
