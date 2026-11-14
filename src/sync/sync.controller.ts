import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncPushDto } from './dto/sync-push.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Offline PWA Sync')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @ApiOperation({ summary: 'Reconcile offline reviews batch sent from IndexedDB upon reconnection' })
  async pushReviews(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SyncPushDto
  ) {
    return this.syncService.processOfflinePush(user.id, dto);
  }

  @Get('pull')
  @ApiOperation({ summary: 'Pull delta updates (words, user progress, collections) since timestamp' })
  @ApiQuery({ name: 'since', required: false, example: '2026-11-14T00:00:00.000Z' })
  async pullUpdates(
    @CurrentUser() user: AuthenticatedUser,
    @Query('since') since?: string
  ) {
    return this.syncService.pullUpdates(user.id, since);
  }
}
