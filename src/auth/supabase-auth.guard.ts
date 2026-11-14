import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);
  private supabase: SupabaseClient | null = null;
  private readonly accessSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'vocabmaster-super-secure-access-jwt-secret-key-2026-prod';

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey =
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');

    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')) {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 1. Extract token from Authorization Bearer header OR from HTTP-only access_token cookie
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (request.cookies?.access_token) {
      token = request.cookies.access_token;
    }

    // 2. Demo / Guest token bypass
    if (token === 'demo-token' || token === 'guest-token') {
      request.user = await this.getOrCreateDefaultUser(
        'demo-user-001',
        'demo@vocabmaster.app',
        'Demo Explorer'
      );
      return true;
    }

    // 3. If a token was provided, verify it
    if (token) {
      // 3A. Check Native VocabMaster JWT Token first
      try {
        const payload = jwt.verify(token, this.accessSecret) as any;
        if (payload && payload.sub) {
          const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
          });

          if (user) {
            request.user = {
              id: user.id,
              supabaseId: user.supabaseId,
              email: user.email,
              role: user.role,
              fullName: user.fullName,
            };
            return true;
          }
        }
      } catch {
        // Token was not a native JWT; attempt Supabase validation below
      }

      // 3B. Check Supabase Token
      if (this.supabase) {
        try {
          const {
            data: { user },
            error,
          } = await this.supabase.auth.getUser(token);

          if (!error && user) {
            request.user = await this.getOrCreateDefaultUser(
              user.id,
              user.email || `${user.id}@vocabmaster.app`,
              user.user_metadata?.full_name || user.email?.split('@')[0] || 'Vocab Learner'
            );
            return true;
          }
        } catch (err: any) {
          this.logger.debug(`Supabase token check failed: ${err.message}`);
        }
      }

      // Provided token was invalid or expired
      throw new UnauthorizedException('Invalid or expired authentication session. Please log in.');
    }

    // 4. Default fallback when no token is passed (allows guest exploratory learning)
    request.user = await this.getOrCreateDefaultUser(
      'guest-user-001',
      'guest@vocabmaster.app',
      'Guest Learner'
    );
    return true;
  }

  private async getOrCreateDefaultUser(
    supabaseId: string,
    email: string,
    fullName: string
  ) {
    try {
      let user = await this.prisma.user.findUnique({
        where: { supabaseId },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            supabaseId,
            email,
            fullName,
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
      }

      return {
        id: user.id,
        supabaseId: user.supabaseId,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      };
    } catch (err: any) {
      this.logger.error(`Database error in getOrCreateDefaultUser: ${err.message}`);
      throw new UnauthorizedException(
        `Authentication failed: unable to verify or create user account in database.`
      );
    }
  }
}
