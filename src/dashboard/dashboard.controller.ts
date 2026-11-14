import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('User Dashboard & Progress Engine')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Complete production user dashboard: user profile, daily word goal, retention KPIs, CEFR mastery, upcoming review schedule',
  })
  async getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getOverview(user.id);
  }

  @Get('daily-plan')
  @ApiOperation({
    summary:
      'Structured 3-session daily learning curriculum matching user daily word goal (e.g. 50 words: morning, afternoon, evening)',
  })
  async getDailyPlan(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getDailyPlan(user.id);
  }

  @Get('struggling-words')
  @ApiOperation({
    summary:
      'List of words where user frequently lapses or has low retention, with personal mnemonics and mastery tips',
  })
  async getStrugglingWords(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getStrugglingWords(user.id);
  }

  @Get('achievements')
  @ApiOperation({
    summary:
      'Gamification badges, streaks, milestone achievements, and progress bars',
  })
  async getAchievements(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getAchievements(user.id);
  }

  @Get('heatmap')
  @ApiOperation({
    summary:
      'Annual/monthly GitHub-style learning activity matrix with intensity levels',
  })
  @ApiQuery({ name: 'days', required: false, example: 365 })
  async getHeatmap(
    @CurrentUser() user: AuthenticatedUser,
    @Query('days') days: string = '365'
  ) {
    return this.dashboardService.getActivityHeatmap(
      user.id,
      parseInt(days, 10) || 365
    );
  }
}
