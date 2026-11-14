import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    type: 'access' | 'refresh';
}
export declare class AuthService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private readonly accessSecret;
    private readonly refreshSecret;
    private readonly accessExpiresIn;
    private readonly refreshExpiresIn;
    constructor(prisma: PrismaService, configService: ConfigService);
    register(dto: RegisterDto, res?: Response): Promise<{
        message: string;
        user: any;
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    login(dto: LoginDto, res?: Response): Promise<{
        message: string;
        user: any;
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    refreshTokens(refreshToken: string, res?: Response): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    logout(userId: string, res?: Response): Promise<{
        success: boolean;
        message: string;
    }>;
    getMe(userId: string): Promise<any>;
    private generateTokenPair;
    private setCookies;
    private clearCookies;
    private sanitizeUser;
}
