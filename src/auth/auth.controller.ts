import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from './current-user.decorator';

@ApiTags('Authentication & Sessions')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary:
      'Register new user with name, email & password; issues access token, refresh token & HTTP-only cookies',
  })
  @ApiResponse({ status: 201, description: 'User account created and tokens returned' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.register(dto, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Log in user with email & password; sets HTTP-only session cookies and returns tokens',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.login(dto, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Rotate access & refresh tokens via token string or HTTP-only refresh_token cookie',
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    // Read from request body OR from HTTP-only cookie
    const token = dto.refreshToken || req.cookies?.refresh_token;
    return this.authService.refreshTokens(token, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary:
      'Log out user: revokes database refresh token and wipes session cookies',
  })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.logout(user.id, res);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Get current authenticated user profile, settings and study stats',
  })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }
}
