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
var SupabaseAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("../prisma/prisma.service");
let SupabaseAuthGuard = SupabaseAuthGuard_1 = class SupabaseAuthGuard {
    configService;
    prisma;
    logger = new common_1.Logger(SupabaseAuthGuard_1.name);
    supabase = null;
    accessSecret;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.accessSecret =
            this.configService.get('JWT_ACCESS_SECRET') ||
                'vocabmaster-super-secure-access-jwt-secret-key-2026-prod';
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseAnonKey = this.configService.get('SUPABASE_ANON_KEY') ||
            this.configService.get('SUPABASE_PUBLISHABLE_KEY');
        if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')) {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
        }
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (request.cookies?.access_token) {
            token = request.cookies.access_token;
        }
        if (token === 'demo-token' || token === 'guest-token') {
            request.user = await this.getOrCreateDefaultUser('demo-user-001', 'demo@vocabmaster.app', 'Demo Explorer');
            return true;
        }
        if (token) {
            try {
                const payload = jwt.verify(token, this.accessSecret);
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
            }
            catch {
            }
            if (this.supabase) {
                try {
                    const { data: { user }, error, } = await this.supabase.auth.getUser(token);
                    if (!error && user) {
                        request.user = await this.getOrCreateDefaultUser(user.id, user.email || `${user.id}@vocabmaster.app`, user.user_metadata?.full_name || user.email?.split('@')[0] || 'Vocab Learner');
                        return true;
                    }
                }
                catch (err) {
                    this.logger.debug(`Supabase token check failed: ${err.message}`);
                }
            }
            throw new common_1.UnauthorizedException('Invalid or expired authentication session. Please log in.');
        }
        request.user = await this.getOrCreateDefaultUser('guest-user-001', 'guest@vocabmaster.app', 'Guest Learner');
        return true;
    }
    async getOrCreateDefaultUser(supabaseId, email, fullName) {
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
        }
        catch (err) {
            this.logger.error(`Database error in getOrCreateDefaultUser: ${err.message}`);
            throw new common_1.UnauthorizedException(`Authentication failed: unable to verify or create user account in database.`);
        }
    }
};
exports.SupabaseAuthGuard = SupabaseAuthGuard;
exports.SupabaseAuthGuard = SupabaseAuthGuard = SupabaseAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], SupabaseAuthGuard);
//# sourceMappingURL=supabase-auth.guard.js.map