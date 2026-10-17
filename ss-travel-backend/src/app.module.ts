import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { MenusModule } from './menus/menus.module';
import { OrganizationModule } from './organization/organization.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CustomersModule } from './customers/customers.module';
import { FinanceModule } from './finance/finance.module';
import { MasterRulesModule } from './master-rules/master-rules.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Models from './@models';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: Object.values(Models).filter(
          (val) => typeof val === 'function',
        ),
        synchronize: false, // Gunakan Migrations untuk perubahan skema
      }),
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    MenusModule,
    OrganizationModule,
    VehiclesModule,
    CustomersModule,
    FinanceModule,
    MasterRulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
