import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class SupabaseAuthGuard implements CanActivate {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private supabase;
    private readonly accessSecret;
    constructor(configService: ConfigService, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getOrCreateDefaultUser;
}
