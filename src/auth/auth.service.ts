import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-actions';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Optional() private readonly auditService?: AuditService
  ) {
    this.accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'vocabmaster-super-secure-access-jwt-secret-key-2026-prod';
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'vocabmaster-super-secure-refresh-jwt-secret-key-2026-prod';
    this.accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '1h';
    this.refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  /**
   * Register a new user with Name, Email & Password
   */
  async register(dto: RegisterDto, res?: Response) {
    const email = dto.email.trim().toLowerCase();

    // 1. Check if email is already registered
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(
        'An account with this email address already exists. Please log in instead.'
      );
    }

    // 2. Hash password with bcrypt (10 rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 3. Create user in PostgreSQL database
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.name.trim(),
        passwordHash,
        dailyWordGoal: 10,
        preferredAccent: 'US',
        targetLanguage: 'bn',
        themePreference: 'system',
        soundEnabled: true,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date(),
      },
    });

    // 4. Generate Access and Refresh Tokens
    const tokens = this.generateTokenPair(user.id, user.email, user.role);

    // 5. Store hashed refresh token in database for rotation security
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, saltRounds);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    // 6. Set HTTP-only secure session cookies if response object is provided
    if (res) {
      this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    // 7. Audit log event
    if (this.auditService) {
      this.auditService.logEvent({
        action: AuditAction.AUTH_REGISTER,
        userId: user.id,
        entity: 'USER',
        entityId: user.id,
        metadata: { email: user.email, name: user.fullName },
      });
    }

    return {
      message: 'Account registered successfully!',
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  }

  /**
   * Log in user with Email & Password
   */
  async login(dto: LoginDto, res?: Response) {
    const email = dto.email.trim().toLowerCase();

    // 1. Find user in database
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Special handler for demo account
    if (email === 'demo@vocabmaster.app' && (dto.password === 'demo123456' || dto.password === 'demo')) {
      if (!user) {
        const passwordHash = await bcrypt.hash('demo123456', 10);
        user = await this.prisma.user.create({
          data: {
            supabaseId: 'demo-user-001',
            email: 'demo@vocabmaster.app',
            fullName: 'Demo Vocab Master',
            passwordHash,
            dailyWordGoal: 10,
            preferredAccent: 'US',
            targetLanguage: 'bn',
            themePreference: 'system',
            soundEnabled: true,
            currentStreak: 5,
            longestStreak: 12,
            lastActiveDate: new Date(),
            totalPoints: 350,
          },
        });
      } else if (!user.passwordHash) {
        const passwordHash = await bcrypt.hash('demo123456', 10);
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
      }
    }

    if (!user || !user.passwordHash) {
      if (this.auditService) {
        this.auditService.logEvent({
          action: AuditAction.AUTH_LOGIN_FAILED,
          status: 'FAILURE',
          metadata: { email, reason: 'User not found' },
        });
      }
      throw new UnauthorizedException('Invalid email or password. Please try again.');
    }

    // 2. Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      if (this.auditService) {
        this.auditService.logEvent({
          action: AuditAction.AUTH_LOGIN_FAILED,
          userId: user.id,
          status: 'FAILURE',
          metadata: { email, reason: 'Incorrect password' },
        });
      }
      throw new UnauthorizedException('Invalid email or password. Please try again.');
    }

    // 3. Generate new Access and rotated Refresh Token
    const tokens = this.generateTokenPair(user.id, user.email, user.role);

    // 4. Update hashed refresh token in DB
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
        lastActiveDate: new Date(),
      },
    });

    // 5. Set HTTP-only session cookies
    if (res) {
      this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    // 6. Audit log event
    if (this.auditService) {
      this.auditService.logEvent({
        action: AuditAction.AUTH_LOGIN,
        userId: user.id,
        entity: 'USER',
        entityId: user.id,
        metadata: { email: user.email },
      });
    }

    return {
      message: 'Logged in successfully!',
      user: this.sanitizeUser(updatedUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  }

  /**
   * Refresh expired access token using active refresh token
   */
  async refreshTokens(refreshToken: string, res?: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, this.refreshSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token session. Please log in again.'
      );
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type provided for refresh.');
    }

    // Find user by ID
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Session expired or revoked. Please log in again.');
    }

    // Verify stored refresh token hash matches incoming token
    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenMatches) {
      // Possible token reuse attack detected! Revoke all tokens immediately
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null },
      });
      throw new UnauthorizedException(
        'Security alert: refresh token invalidated. Please log in again.'
      );
    }

    // Issue rotated token pair
    const tokens = this.generateTokenPair(user.id, user.email, user.role);

    // Save newly rotated refresh token
    const newHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newHash },
    });

    // Update HTTP-only cookies
    if (res) {
      this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    if (this.auditService) {
      this.auditService.logEvent({
        action: AuditAction.AUTH_REFRESH,
        userId: user.id,
        entity: 'USER',
        entityId: user.id,
      });
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  }

  /**
   * Logout user, invalidate refresh token in database & clear HTTP session cookies
   */
  async logout(userId: string, res?: Response) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      });
    } catch (err: any) {
      this.logger.warn(`Could not clear refreshTokenHash for user ${userId}: ${err.message}`);
    }

    if (res) {
      this.clearCookies(res);
    }

    if (this.auditService) {
      this.auditService.logEvent({
        action: AuditAction.AUTH_LOGOUT,
        userId,
        entity: 'USER',
        entityId: userId,
      });
    }

    return {
      success: true,
      message: 'Logged out successfully. All sessions cleared.',
    };
  }

  /**
   * Get current authenticated user profile
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            bookmarks: true,
            collections: true,
            userWords: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    return {
      ...this.sanitizeUser(user),
      stats: {
        totalStudiedWords: user._count.userWords,
        bookmarkedWords: user._count.bookmarks,
        collectionsCount: user._count.collections,
      },
    };
  }

  /**
   * Helper: Generate Access and Refresh JWTs
   */
  private generateTokenPair(userId: string, email: string, role: string) {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };

    const accessToken = jwt.sign(accessPayload, this.accessSecret, {
      expiresIn: this.accessExpiresIn as any,
    });

    const refreshToken = jwt.sign(refreshPayload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Helper: Set secure HTTP-only cookies
   */
  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 3600 * 1000, // 1 hour
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000, // 7 days
    });
  }

  /**
   * Helper: Clear session cookies on logout
   */
  private clearCookies(res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', {
      path: '/',
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
    });
    res.clearCookie('refresh_token', {
      path: '/',
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
    });
  }

  /**
   * Helper: Sanitize user object to never leak password or refresh token hashes
   */
  private sanitizeUser(user: any) {
    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  }
}
