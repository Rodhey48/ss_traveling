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
import { ResponseInterface } from '../../@interfaces/response/response.interface';
import { AgentsService } from '../services/agents.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  AgentQueryFilterDto,
  AgentRouteFilterQueryDto,
  CreateAgentCommissionRuleDto,
  UpdateAgentCommissionRuleDto,
  CalculateCommissionQueryDto,
} from '../../@dto/master-rules/agent.dto';

@ApiTags('Master Agents & Commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  // ==========================================
  // SMART ROUTE FILTERING & SIMULATION
  // ==========================================

  @Get('by-route')
  @RequirePermissions('Agents:read')
  @ApiOperation({
    summary: 'Smart Filter Agen sesuai Arah Rute Leg (Anti-Human Error, Addendum v1.7)',
  })
  async findAgentsByRoute(
    @Query() query: AgentRouteFilterQueryDto,
  ): Promise<ResponseInterface> {
    const data = await this.agentsService.findAgentsByRoute(
      query.origin,
      query.destination,
    );
    return {
      status: true,
      message: 'Daftar agen sesuai rute berhasil diambil.',
      data,
    };
  }

  @Get('calculate-commission')
  @RequirePermissions('Agents:read')
  @ApiOperation({ summary: 'Kalkulasi komisi penjualan agen (Flat per Tiket / Persentase)' })
  async calculateCommission(
    @Query() query: CalculateCommissionQueryDto,
  ): Promise<ResponseInterface> {
    const data = await this.agentsService.calculateCommission(query);
    return {
      status: true,
      message: 'Komisi agen berhasil dikalkulasi.',
      data,
    };
  }

  // ==========================================
  // AGENTS CRUD
  // ==========================================

  @Get()
  @RequirePermissions('Agents:read')
  @ApiOperation({ summary: 'Mendapatkan daftar seluruh mitra agen (Offline & OTA)' })
  async findAll(@Query() query: AgentQueryFilterDto): Promise<ResponseInterface> {
    const data = await this.agentsService.findAll(query);
    return {
      status: true,
      message: 'Daftar agen berhasil diambil.',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('Agents:read')
  @ApiOperation({ summary: 'Mendapatkan detail agen mitra' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.agentsService.findOne(id);
    return {
      status: true,
      message: 'Detail agen berhasil diambil.',
      data,
    };
  }

  @Post()
  @RequirePermissions('Agents:create')
  @ApiOperation({ summary: 'Mendaftarkan agen mitra baru' })
  async create(@Body() dto: CreateAgentDto): Promise<ResponseInterface> {
    const data = await this.agentsService.create(dto);
    return {
      status: true,
      message: `Agen '${data.name}' berhasil didaftarkan.`,
      data,
    };
  }

  @Put(':id')
  @RequirePermissions('Agents:update')
  @ApiOperation({ summary: 'Memperbarui data agen mitra' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ): Promise<ResponseInterface> {
    const data = await this.agentsService.update(id, dto);
    return {
      status: true,
      message: `Data agen '${data.name}' berhasil diperbarui.`,
      data,
    };
  }

  @Delete(':id')
  @RequirePermissions('Agents:delete')
  @ApiOperation({ summary: 'Menghapus agen mitra' })
  async delete(@Param('id') id: string): Promise<ResponseInterface> {
    const result = await this.agentsService.delete(id);
    return {
      status: true,
      message: result.message,
    };
  }

  // ==========================================
  // AGENT COMMISSION RULES
  // ==========================================

  @Get(':id/commission-rules')
  @RequirePermissions('Agents:read')
  @ApiOperation({ summary: 'Mendapatkan aturan komisi untuk agen tertentu' })
  async findRulesByAgent(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.agentsService.findRulesByAgent(id);
    return {
      status: true,
      message: 'Daftar aturan komisi berhasil diambil.',
      data,
    };
  }

  @Post(':id/commission-rules')
  @RequirePermissions('Agents:create')
  @ApiOperation({ summary: 'Menambahkan aturan komisi untuk agen' })
  async createCommissionRule(
    @Param('id') id: string,
    @Body() dto: CreateAgentCommissionRuleDto,
  ): Promise<ResponseInterface> {
    const data = await this.agentsService.createCommissionRule(id, dto);
    return {
      status: true,
      message: 'Aturan komisi agen berhasil ditambahkan.',
      data,
    };
  }

  @Put('commission-rules/:ruleId')
  @RequirePermissions('Agents:update')
  @ApiOperation({ summary: 'Memperbarui aturan komisi agen' })
  async updateCommissionRule(
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateAgentCommissionRuleDto,
  ): Promise<ResponseInterface> {
    const data = await this.agentsService.updateCommissionRule(ruleId, dto);
    return {
      status: true,
      message: 'Aturan komisi agen berhasil diperbarui.',
      data,
    };
  }

  @Delete('commission-rules/:ruleId')
  @RequirePermissions('Agents:delete')
  @ApiOperation({ summary: 'Menghapus aturan komisi agen' })
  async deleteCommissionRule(
    @Param('ruleId') ruleId: string,
  ): Promise<ResponseInterface> {
    const result = await this.agentsService.deleteCommissionRule(ruleId);
    return {
      status: true,
      message: result.message,
    };
  }
}
