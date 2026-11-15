"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const audit_actions_1 = require("../audit/audit-actions");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    configService;
    auditService;
    logger = new common_1.Logger(AuthService_1.name);
    accessSecret;
    refreshSecret;
    accessExpiresIn;
    refreshExpiresIn;
    constructor(prisma, configService, auditService) {
        this.prisma = prisma;
        this.configService = configService;
        this.auditService = auditService;
        this.accessSecret =
            this.configService.get('JWT_ACCESS_SECRET') ||
                'vocabmaster-super-secure-access-jwt-secret-key-2026-prod';
        this.refreshSecret =
            this.configService.get('JWT_REFRESH_SECRET') ||
                'vocabmaster-super-secure-refresh-jwt-secret-key-2026-prod';
        this.accessExpiresIn = this.configService.get('JWT_ACCESS_EXPIRES_IN') || '1h';
        this.refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';
    }
    async register(dto, res) {
        const email = dto.email.trim().toLowerCase();
        const existing = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            throw new common_1.ConflictException('An account with this email address already exists. Please log in instead.');
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(dto.password, saltRounds);
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
        const tokens = this.generateTokenPair(user.id, user.email, user.role);
        const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, saltRounds);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshTokenHash },
        });
        if (res) {
            this.setCookies(res, tokens.accessToken, tokens.refreshToken);
        }
        if (this.auditService) {
            this.auditService.logEvent({
                action: audit_actions_1.AuditAction.AUTH_REGISTER,
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
    async login(dto, res) {
        const email = dto.email.trim().toLowerCase();
        let user = await this.prisma.user.findUnique({
            where: { email },
        });
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
            }
            else if (!user.passwordHash) {
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
                    action: audit_actions_1.AuditAction.AUTH_LOGIN_FAILED,
                    status: 'FAILURE',
                    metadata: { email, reason: 'User not found' },
                });
            }
            throw new common_1.UnauthorizedException('Invalid email or password. Please try again.');
        }
        const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatch) {
            if (this.auditService) {
                this.auditService.logEvent({
                    action: audit_actions_1.AuditAction.AUTH_LOGIN_FAILED,
                    userId: user.id,
                    status: 'FAILURE',
                    metadata: { email, reason: 'Incorrect password' },
                });
            }
            throw new common_1.UnauthorizedException('Invalid email or password. Please try again.');
        }
        const tokens = this.generateTokenPair(user.id, user.email, user.role);
        const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshTokenHash,
                lastActiveDate: new Date(),
            },
        });
        if (res) {
            this.setCookies(res, tokens.accessToken, tokens.refreshToken);
        }
        if (this.auditService) {
            this.auditService.logEvent({
                action: audit_actions_1.AuditAction.AUTH_LOGIN,
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
    async refreshTokens(refreshToken, res) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token is required.');
        }
        let payload;
        try {
            payload = jwt.verify(refreshToken, this.refreshSecret);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token session. Please log in again.');
        }
        if (payload.type !== 'refresh') {
            throw new common_1.UnauthorizedException('Invalid token type provided for refresh.');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Session expired or revoked. Please log in again.');
        }
        const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!tokenMatches) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { refreshTokenHash: null },
            });
            throw new common_1.UnauthorizedException('Security alert: refresh token invalidated. Please log in again.');
        }
        const tokens = this.generateTokenPair(user.id, user.email, user.role);
        const newHash = await bcrypt.hash(tokens.refreshToken, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshTokenHash: newHash },
        });
        if (res) {
            this.setCookies(res, tokens.accessToken, tokens.refreshToken);
        }
        if (this.auditService) {
            this.auditService.logEvent({
                action: audit_actions_1.AuditAction.AUTH_REFRESH,
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
    async logout(userId, res) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { refreshTokenHash: null },
            });
        }
        catch (err) {
            this.logger.warn(`Could not clear refreshTokenHash for user ${userId}: ${err.message}`);
        }
        if (res) {
            this.clearCookies(res);
        }
        if (this.auditService) {
            this.auditService.logEvent({
                action: audit_actions_1.AuditAction.AUTH_LOGOUT,
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
    async getMe(userId) {
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
            throw new common_1.NotFoundException(`User with ID '${userId}' not found.`);
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
    generateTokenPair(userId, email, role) {
        const accessPayload = {
            sub: userId,
            email,
            role,
            type: 'access',
        };
        const refreshPayload = {
            sub: userId,
            email,
            role,
            type: 'refresh',
        };
        const accessToken = jwt.sign(accessPayload, this.accessSecret, {
            expiresIn: this.accessExpiresIn,
        });
        const refreshToken = jwt.sign(refreshPayload, this.refreshSecret, {
            expiresIn: this.refreshExpiresIn,
        });
        return { accessToken, refreshToken };
    }
    setCookies(res, accessToken, refreshToken) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/',
            maxAge: 3600 * 1000,
        });
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 3600 * 1000,
        });
    }
    clearCookies(res) {
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
    sanitizeUser(user) {
        const { passwordHash, refreshTokenHash, ...safe } = user;
        return safe;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map