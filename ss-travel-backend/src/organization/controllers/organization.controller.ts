import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { OrganizationService } from '../services/organization.service';
import {
  UpdateCompanyDto,
  CreateBusinessUnitDto,
  UpdateBusinessUnitDto,
  CreateCostCenterDto,
  UpdateCostCenterDto,
  CreateProfitCenterDto,
  UpdateProfitCenterDto,
} from '../../@dto/organization/organization.dto';
import { ResponseInterface } from '@interfaces';

@ApiTags('Organization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller()
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  // ==================== COMPANY ====================
  @Get('company')
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'Get active company profile' })
  async getCompanyProfile(): Promise<ResponseInterface> {
    return this.orgService.getCompanyProfile();
  }

  @Put('company/:id')
  @RequirePermissions('organization:update')
  @ApiOperation({ summary: 'Update company profile' })
  async updateCompanyProfile(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<ResponseInterface> {
    return this.orgService.updateCompanyProfile(id, dto);
  }

  // ==================== BUSINESS UNITS ====================
  @Get('business-units')
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'Get all business units' })
  async findAllBusinessUnits(): Promise<ResponseInterface> {
    return this.orgService.findAllBusinessUnits();
  }

  @Get('business-units/:id')
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'Get single business unit' })
  async findOneBusinessUnit(
    @Param('id') id: string,
  ): Promise<ResponseInterface> {
    return this.orgService.findOneBusinessUnit(id);
  }

  @Post('business-units')
  @RequirePermissions('organization:create')
  @ApiOperation({ summary: 'Create new business unit' })
  async createBusinessUnit(
    @Body() dto: CreateBusinessUnitDto,
  ): Promise<ResponseInterface> {
    return this.orgService.createBusinessUnit(dto);
  }

  @Put('business-units/:id')
  @RequirePermissions('organization:update')
  @ApiOperation({ summary: 'Update business unit' })
  async updateBusinessUnit(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessUnitDto,
  ): Promise<ResponseInterface> {
    return this.orgService.updateBusinessUnit(id, dto);
  }

  @Delete('business-units/:id')
  @RequirePermissions('organization:delete')
  @ApiOperation({ summary: 'Delete business unit' })
  async removeBusinessUnit(
    @Param('id') id: string,
  ): Promise<ResponseInterface> {
    return this.orgService.removeBusinessUnit(id);
  }

  // ==================== COST CENTERS ====================
  @Get('cost-centers')
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'Get all cost centers' })
  async findAllCostCenters(): Promise<ResponseInterface> {
    return this.orgService.findAllCostCenters();
  }

  @Get('cost-centers/:id')
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'Get single cost center' })
  async findOneCostCenter(
    @Param('id') id: string,
  ): Promise<ResponseInterface> {
    return this.orgService.findOneCostCenter(id);
  }

  @Post('cost-centers')
  @RequirePermissions('organization:create')
  @ApiOperation({ summary: 'Create new cost center' })
  async createCostCenter(
    @Body() dto: CreateCostCenterDto,
  ): Promise<ResponseInterface> {
    return this.orgService.createCostCenter(dto);
  }

  @Put('cost-centers/:id')
  @RequirePermissions('organization:update')
  @ApiOperation({ summary: 'Update cost center' })
  async updateCostCenter(
    @Param('id') id: string,
    @Body() dto: UpdateCostCenterDto,
  ): Promise<ResponseInterface> {
    return this.orgService.updateCostCenter(id, dto);
  }

  @Delete('cost-centers/:id')
  @RequirePermissions('organization:delete')
  @ApiOperation({ summary: 'Delete cost center' })
  async removeCostCenter(
    @Param('id') id: string,
  ): Promise<ResponseInterface> {
    return this.orgService.removeCostCenter(id);
  }

  // ==================== PROFIT CENTERS ====================
  @Get('profit-centers')
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'Get all profit centers' })
  async findAllProfitCenters(): Promise<ResponseInterface> {
    return this.orgService.findAllProfitCenters();
  }

  @Get('profit-centers/:id')
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'Get single profit center' })
  async findOneProfitCenter(
    @Param('id') id: string,
  ): Promise<ResponseInterface> {
    return this.orgService.findOneProfitCenter(id);
  }

  @Post('profit-centers')
  @RequirePermissions('organization:create')
  @ApiOperation({ summary: 'Create new profit center' })
  async createProfitCenter(
    @Body() dto: CreateProfitCenterDto,
  ): Promise<ResponseInterface> {
    return this.orgService.createProfitCenter(dto);
  }

  @Put('profit-centers/:id')
  @RequirePermissions('organization:update')
  @ApiOperation({ summary: 'Update profit center' })
  async updateProfitCenter(
    @Param('id') id: string,
    @Body() dto: UpdateProfitCenterDto,
  ): Promise<ResponseInterface> {
    return this.orgService.updateProfitCenter(id, dto);
  }

  @Delete('profit-centers/:id')
  @RequirePermissions('organization:delete')
  @ApiOperation({ summary: 'Delete profit center' })
  async removeProfitCenter(
    @Param('id') id: string,
  ): Promise<ResponseInterface> {
    return this.orgService.removeProfitCenter(id);
  }
}
