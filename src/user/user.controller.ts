import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateDailyGoalDto } from './dto/update-daily-goal.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('User Profile')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile and learning settings' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user learning settings and profile' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto
  ) {
    return this.userService.updateProfile(user.id, dto);
  }

  @Get('daily-goal')
  @ApiOperation({ summary: 'Get current daily word goal and today progress' })
  async getDailyGoal(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getDailyGoalProgress(user.id);
  }

  @Patch('daily-goal')
  @ApiOperation({ summary: 'Set custom daily target words (e.g. 10, 20, 50, 100 words/day)' })
  async setDailyGoal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDailyGoalDto
  ) {
    return this.userService.setDailyGoal(user.id, dto.dailyWordGoal);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent 30-day learning activity logs' })
  async getActivity(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getRecentActivity(user.id, 30);
  }
}
