import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { CustomersService } from '../services/customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryFilterDto,
} from '../../@dto/customer/customer.dto';
import { ResponseInterface } from '@interfaces';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Get all customers with pagination and filter' })
  async findAll(
    @Query() query: CustomerQueryFilterDto,
  ): Promise<ResponseInterface> {
    return this.customersService.findAll(query);
  }

  @Get('autocomplete')
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Quick search customer autocomplete for schedules & booking' })
  async autocomplete(
    @Query('search') search?: string,
  ): Promise<ResponseInterface> {
    return this.customersService.autocomplete(search);
  }

  @Get(':id')
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Get single customer details' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    return this.customersService.findOne(id);
  }

  @Post()
  @RequirePermissions('customers:create')
  @ApiOperation({ summary: 'Create new customer / lead' })
  async create(@Body() dto: CreateCustomerDto): Promise<ResponseInterface> {
    return this.customersService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('customers:update')
  @ApiOperation({ summary: 'Update customer details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<ResponseInterface> {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('customers:delete')
  @ApiOperation({ summary: 'Delete customer' })
  async remove(@Param('id') id: string): Promise<ResponseInterface> {
    return this.customersService.remove(id);
  }
}
