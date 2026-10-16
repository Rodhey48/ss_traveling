import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { DocumentSequenceService } from '../services/document-sequence.service';
import { GenerateSequenceDto } from '../../@dto/finance/document-sequence.dto';
import { ResponseInterface } from '../../@interfaces';

@ApiTags('Document Sequences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('document-sequences')
export class DocumentSequenceController {
  constructor(private readonly sequenceService: DocumentSequenceService) {}

  @Get()
  @RequirePermissions('Accounts:read')
  @ApiOperation({ summary: 'Daftar counter nomor dokumen terdaftar' })
  async findAll(): Promise<ResponseInterface> {
    const data = await this.sequenceService.findAllSequences();
    return {
      status: true,
      message: 'Berhasil memuat daftar penomoran dokumen',
      data,
    };
  }

  @Get('preview')
  @RequirePermissions('Accounts:read')
  @ApiOperation({ summary: 'Preview nomor dokumen berikutnya tanpa meng-increment counter' })
  async preview(
    @Query('documentType') documentType: string,
    @Query('periodKey') periodKey: string,
  ): Promise<ResponseInterface> {
    const data = await this.sequenceService.previewNextNumber(documentType, periodKey);
    return {
      status: true,
      message: 'Berhasil menghasilkan preview nomor dokumen',
      data,
    };
  }

  @Post('reset-or-configure')
  @RequirePermissions('Accounts:create')
  @ApiOperation({ summary: 'Konfigurasi atau reset sequence penomoran dokumen' })
  async configure(@Body() dto: GenerateSequenceDto): Promise<ResponseInterface> {
    const data = await this.sequenceService.createOrResetSequence(dto);
    return {
      status: true,
      message: `Sequence untuk ${dto.documentType} (${dto.periodKey}) berhasil dikonfigurasi.`,
      data,
    };
  }
}
