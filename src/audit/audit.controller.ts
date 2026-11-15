import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Audit & Security Logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({
    summary: 'Get authenticated user activity and security audit trail',
  })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async getLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit: string = '50'
  ) {
    const limitNum = parseInt(limit, 10) || 50;
    return this.auditService.getUserLogs(user.id, limitNum);
  }

  @Get('security-summary')
  @ApiOperation({
    summary: 'Get account security summary: last login, device count, failed attempts',
  })
  async getSecuritySummary(@CurrentUser() user: AuthenticatedUser) {
    return this.auditService.getSecuritySummary(user.id);
  }
}
