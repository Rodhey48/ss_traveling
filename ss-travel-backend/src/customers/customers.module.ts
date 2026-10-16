import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity, CompanyEntity } from '@models';
import { CustomersService } from './services/customers.service';
import { CustomersController } from './controllers/customers.controller';
import { JWTService } from '../@services/jwt/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerEntity,
      CompanyEntity,
    ]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService, JWTService],
  exports: [CustomersService],
})
export class CustomersModule {}
