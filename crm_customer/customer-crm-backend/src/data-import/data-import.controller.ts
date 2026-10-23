// ============================================================================
// DataImportController: endpoint REST cho xuất dữ liệu JSON
// ============================================================================
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DataImportService } from './data-import.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';

@Controller('data-import')
@UseGuards(JwtAuthGuard)
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Get('export')
  async exportData(
    @CurrentUser() user: AuthUser,
    @Query('category') category?: string,
  ) {
    return this.dataImportService.exportData(user, category);
  }
}
