"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shared_1 = require("@vocabmaster/shared");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardMetrics(userId) {
        const todayStr = new Date().toISOString().split('T')[0];
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID '${userId}' not found.`);
        }
        const [totalWords, masteredCount, learningCount, reviewCount, todayActivity, activityLogs, userProgressItems,] = await Promise.all([
            this.prisma.vocabularyWord.count(),
            this.prisma.userWordProgress.count({
                where: { userId, state: shared_1.SrsState.MASTERED },
            }),
            this.prisma.userWordProgress.count({
                where: { userId, state: shared_1.SrsState.LEARNING },
            }),
            this.prisma.userWordProgress.count({
                where: { userId, state: shared_1.SrsState.REVIEW },
            }),
            this.prisma.dailyActivityLog.findUnique({
                where: { userId_date: { userId, date: todayStr } },
            }),
            this.prisma.dailyActivityLog.findMany({
                where: { userId },
                orderBy: { date: 'desc' },
                take: 30,
            }),
            this.prisma.userWordProgress.findMany({
                where: { userId },
                include: {
                    word: { select: { cefrLevel: true, category: true } },
                },
            }),
        ]);
        const totalStudied = masteredCount + learningCount + reviewCount;
        const retentionRate = totalStudied > 0
            ? Math.round(((masteredCount + reviewCount) / totalStudied) * 100)
            : 0;
        const cefrCounts = {
            A1: 0,
            A2: 0,
            B1: 0,
            B2: 0,
            C1: 0,
            C2: 0,
        };
        const categoryCounts = {};
        for (const item of userProgressItems) {
            if (item.word?.cefrLevel) {
                cefrCounts[item.word.cefrLevel] = (cefrCounts[item.word.cefrLevel] || 0) + 1;
            }
            if (item.word?.category) {
                categoryCounts[item.word.category] =
                    (categoryCounts[item.word.category] || 0) + 1;
            }
        }
        const dailyGoal = user.dailyWordGoal || 10;
        const todayWordsReviewed = todayActivity?.wordsReviewed || 0;
        const goalProgressPercent = Math.min(100, Math.round((todayWordsReviewed / dailyGoal) * 100));
        return {
            user: {
                fullName: user.fullName || 'Vocab Learner',
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                totalPoints: user.totalPoints,
                dailyGoal,
            },
            kpis: {
                totalCatalogWords: totalWords,
                totalStudied,
                masteredCount,
                learningCount,
                reviewCount,
                retentionRate,
                todayWordsReviewed,
                goalProgressPercent,
            },
            cefrBreakdown: cefrCounts,
            categoryBreakdown: categoryCounts,
            recentActivity: activityLogs.reverse(),
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map