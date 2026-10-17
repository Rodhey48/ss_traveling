import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { AccountingPostingService } from '../services/accounting-posting.service';
import { JournalReversalService } from '../services/journal-reversal.service';
import {
  CreateManualJournalDto,
  ReverseJournalDto,
  JournalFilterQueryDto,
} from '../../@dto/finance/journal.dto';
import { RequestInterface, ResponseInterface } from '../../@interfaces';

@ApiTags('Journals / Jurnal Umum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('journals')
export class JournalsController {
  constructor(
    private readonly accountingPostingService: AccountingPostingService,
    private readonly journalReversalService: JournalReversalService,
  ) {}

  @Get()
  @RequirePermissions('Journals:read')
  @ApiOperation({ summary: 'Daftar jurnal akuntansi terposting dengan filter dan paginasi' })
  async findAll(@Query() filter: JournalFilterQueryDto): Promise<ResponseInterface> {
    const result = await this.accountingPostingService.findAll(filter);
    return {
      status: true,
      message: 'Berhasil memuat daftar jurnal akuntansi',
      data: result,
    };
  }

  @Get(':id')
  @RequirePermissions('Journals:read')
  @ApiOperation({ summary: 'Detail jurnal akuntansi berdasarkan ID' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.accountingPostingService.findOne(id);
    return {
      status: true,
      message: 'Berhasil memuat detail jurnal akuntansi',
      data,
    };
  }

  @Post('manual')
  @RequirePermissions('Journals:create')
  @ApiOperation({ summary: 'Entri dan posting jurnal manual / memorial seimbang' })
  async createManual(
    @Body() dto: CreateManualJournalDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const actorId = req.user?.id;
    const data = await this.accountingPostingService.postJournal(dto, actorId);
    return {
      status: true,
      message: `Jurnal nomor '${data.journalNo}' berhasil diposting.`,
      data,
    };
  }

  @Post(':id/reverse')
  @RequirePermissions('Journals:update')
  @ApiOperation({ summary: 'Reversal (pembalikan) jurnal terposting dengan jejak audit' })
  async reverseJournal(
    @Param('id') id: string,
    @Body() dto: ReverseJournalDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const actorId = req.user?.id;
    const data = await this.journalReversalService.reverseJournal(id, dto, actorId);
    return {
      status: true,
      message: `Jurnal pembalik nomor '${data.journalNo}' berhasil dibuat dan diposting.`,
      data,
    };
  }
}
