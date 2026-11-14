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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shared_1 = require("@vocabmaster/shared");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID '${userId}' not found.`);
        }
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const [totalCatalogWords, totalStudied, masteredCount, learningCount, reviewCount, dueTodayCount, bookmarksCount, todayLog, quizSessionsCount, progressItems,] = await Promise.all([
            this.prisma.vocabularyWord.count(),
            this.prisma.userWordProgress.count({ where: { userId } }),
            this.prisma.userWordProgress.count({
                where: { userId, state: shared_1.SrsState.MASTERED },
            }),
            this.prisma.userWordProgress.count({
                where: { userId, state: shared_1.SrsState.LEARNING },
            }),
            this.prisma.userWordProgress.count({
                where: { userId, state: shared_1.SrsState.REVIEW },
            }),
            this.prisma.userWordProgress.count({
                where: { userId, nextReviewAt: { lte: now } },
            }),
            this.prisma.bookmark.count({ where: { userId } }),
            this.prisma.dailyActivityLog.findUnique({
                where: { userId_date: { userId, date: todayStr } },
            }),
            this.prisma.quizSession.count({ where: { userId } }),
            this.prisma.userWordProgress.findMany({
                where: { userId },
                include: { word: { select: { cefrLevel: true, category: true } } },
            }),
        ]);
        const dailyGoal = user.dailyWordGoal || 10;
        const wordsReviewedToday = todayLog?.wordsReviewed || 0;
        const wordsLearnedToday = todayLog?.wordsLearned || 0;
        const totalCompletedToday = wordsReviewedToday + wordsLearnedToday;
        const remainingWords = Math.max(0, dailyGoal - totalCompletedToday);
        const completionPercentage = Math.min(100, Math.round((totalCompletedToday / dailyGoal) * 100));
        const goalReached = totalCompletedToday >= dailyGoal;
        const retentionRate = totalStudied > 0
            ? Math.round(((masteredCount + reviewCount) / totalStudied) * 100)
            : 0;
        const upcomingSchedule = await this.getUpcomingReviewForecast(userId, now);
        const cefrProgress = {
            A1: { total: 0, mastered: 0, learning: 0 },
            A2: { total: 0, mastered: 0, learning: 0 },
            B1: { total: 0, mastered: 0, learning: 0 },
            B2: { total: 0, mastered: 0, learning: 0 },
            C1: { total: 0, mastered: 0, learning: 0 },
            C2: { total: 0, mastered: 0, learning: 0 },
        };
        for (const item of progressItems) {
            const lvl = item.word?.cefrLevel;
            if (lvl && cefrProgress[lvl]) {
                cefrProgress[lvl].total += 1;
                if (item.state === shared_1.SrsState.MASTERED)
                    cefrProgress[lvl].mastered += 1;
                if (item.state === shared_1.SrsState.LEARNING)
                    cefrProgress[lvl].learning += 1;
            }
        }
        const gamification = this.calculateGamificationLevel(user.totalPoints);
        return {
            user: {
                id: user.id,
                fullName: user.fullName || "Vocabulary Learner",
                email: user.email,
                avatarUrl: user.avatarUrl,
                streak: user.currentStreak,
                longestStreak: user.longestStreak,
                totalPoints: user.totalPoints,
                preferredAccent: user.preferredAccent,
                level: gamification.level,
                rankTitle: gamification.rankTitle,
                xpCurrentLevel: gamification.currentXP,
                xpForNextLevel: gamification.nextLevelXP,
                xpProgressPercent: gamification.progressPercent,
            },
            dailyGoal: {
                target: dailyGoal,
                completedToday: totalCompletedToday,
                wordsReviewedToday,
                wordsLearnedToday,
                remainingWords,
                completionPercentage,
                goalReached,
                statusText: goalReached
                    ? "Daily Target Completed! 🎉"
                    : `${remainingWords} word(s) remaining for today`,
            },
            kpis: {
                totalCatalogWords,
                totalStudied,
                masteredCount,
                learningCount,
                reviewCount,
                dueForReviewToday: dueTodayCount,
                bookmarksCount,
                quizSessionsCount,
                retentionRate,
            },
            cefrProgress,
            upcomingSchedule,
        };
    }
    async getDailyPlan(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException("User not found.");
        const targetCount = user.dailyWordGoal || 10;
        const now = new Date();
        const dueReviews = await this.prisma.userWordProgress.findMany({
            where: {
                userId,
                nextReviewAt: { lte: now },
            },
            include: {
                word: { include: { examples: true } },
            },
            take: Math.min(targetCount, 30),
            orderBy: { nextReviewAt: "asc" },
        });
        const dueWordIds = dueReviews.map((r) => r.wordId);
        const bookmarkedWords = await this.prisma.bookmark.findMany({
            where: {
                userId,
                wordId: { notIn: dueWordIds },
            },
            include: {
                word: { include: { examples: true } },
            },
            take: 15,
            orderBy: { createdAt: "desc" },
        });
        const bookmarkedWordIds = bookmarkedWords.map((b) => b.wordId);
        const excludedIds = [...dueWordIds, ...bookmarkedWordIds];
        const neededNew = Math.max(0, targetCount - (dueReviews.length + bookmarkedWords.length));
        let newCatalogWords = [];
        if (neededNew > 0) {
            newCatalogWords = await this.prisma.vocabularyWord.findMany({
                where: {
                    id: { notIn: excludedIds },
                },
                take: neededNew,
                orderBy: { frequencyScore: "desc" },
                include: { examples: true },
            });
        }
        const planItems = [
            ...dueReviews.map((r) => ({
                id: r.word.id,
                word: r.word.word,
                banglaMeaning: r.word.banglaMeaning,
                cefrLevel: r.word.cefrLevel,
                partOfSpeech: r.word.partOfSpeech,
                phoneticUs: r.word.phoneticUs,
                type: "SRS_REVIEW",
                priority: 1,
                examples: r.word.examples,
            })),
            ...bookmarkedWords.map((b) => ({
                id: b.word.id,
                word: b.word.word,
                banglaMeaning: b.word.banglaMeaning,
                cefrLevel: b.word.cefrLevel,
                partOfSpeech: b.word.partOfSpeech,
                phoneticUs: b.word.phoneticUs,
                type: "BOOKMARKED",
                priority: 2,
                examples: b.word.examples,
            })),
            ...newCatalogWords.map((w) => ({
                id: w.id,
                word: w.word,
                banglaMeaning: w.banglaMeaning,
                cefrLevel: w.cefrLevel,
                partOfSpeech: w.partOfSpeech,
                phoneticUs: w.phoneticUs,
                type: "NEW_LEARNING",
                priority: 3,
                examples: w.examples,
            })),
        ].slice(0, targetCount);
        const session1Count = Math.max(1, Math.round(planItems.length * 0.3));
        const session2Count = Math.max(1, Math.round(planItems.length * 0.4));
        const morningSession = planItems.slice(0, session1Count);
        const afternoonSession = planItems.slice(session1Count, session1Count + session2Count);
        const eveningSession = planItems.slice(session1Count + session2Count);
        const estimatedMinutes = Math.max(5, Math.round(planItems.length * 0.4));
        return {
            dailyWordGoal: targetCount,
            totalPlannedWords: planItems.length,
            estimatedMinutes,
            sessions: [
                {
                    id: "session-morning",
                    title: "🌅 Morning Kickstart",
                    subtitle: "Active recall & memory wake-up",
                    itemCount: morningSession.length,
                    words: morningSession,
                },
                {
                    id: "session-afternoon",
                    title: "☀️ Afternoon Deep Dive",
                    subtitle: "High-impact vocabulary & sentence contexts",
                    itemCount: afternoonSession.length,
                    words: afternoonSession,
                },
                {
                    id: "session-evening",
                    title: "🌙 Evening Mastery & Lock-in",
                    subtitle: "Long-term retention & quick quiz practice",
                    itemCount: eveningSession.length,
                    words: eveningSession,
                },
            ],
        };
    }
    async getStrugglingWords(userId) {
        const struggling = await this.prisma.userWordProgress.findMany({
            where: {
                userId,
                OR: [{ lapses: { gte: 2 } }, { easinessFactor: { lte: 1.8 } }],
            },
            include: {
                word: {
                    include: {
                        examples: true,
                        notes: { where: { userId } },
                    },
                },
            },
            take: 20,
            orderBy: { lapses: "desc" },
        });
        return struggling.map((item) => ({
            wordId: item.wordId,
            word: item.word.word,
            banglaMeaning: item.word.banglaMeaning,
            englishMeaning: item.word.englishMeaning,
            cefrLevel: item.word.cefrLevel,
            partOfSpeech: item.word.partOfSpeech,
            phoneticUs: item.word.phoneticUs,
            lapses: item.lapses,
            easinessFactor: item.easinessFactor,
            repetition: item.repetition,
            personalNote: item.word.notes?.[0]?.content || null,
            mnemonic: item.word.notes?.[0]?.mnemonic || null,
            recommendationTip: item.lapses >= 3
                ? "Use custom mnemonic note or write your own sentence to lock this word into memory."
                : "Review this card in the next SRS cycle with extra focus.",
        }));
    }
    async getAchievements(userId) {
        const [user, totalStudied, masteredCount, quizSessions, bookmarksCount] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.userWordProgress.count({ where: { userId } }),
            this.prisma.userWordProgress.count({
                where: { userId, state: shared_1.SrsState.MASTERED },
            }),
            this.prisma.quizSession.findMany({
                where: { userId },
                select: { scorePercentage: true },
            }),
            this.prisma.bookmark.count({ where: { userId } }),
        ]);
        if (!user)
            throw new common_1.NotFoundException("User not found.");
        const streak = user.currentStreak;
        const hasPerfectQuiz = quizSessions.some((q) => q.scorePercentage === 100);
        const badges = [
            {
                id: "first_step",
                title: "🌱 First Step",
                description: "Studied your very first vocabulary word",
                unlocked: totalStudied >= 1,
                progress: Math.min(1, totalStudied),
                maxProgress: 1,
                category: "LEARNING",
            },
            {
                id: "half_century",
                title: "🥉 50 Words Club",
                description: "Studied 50 words in your journey",
                unlocked: totalStudied >= 50,
                progress: Math.min(50, totalStudied),
                maxProgress: 50,
                category: "LEARNING",
            },
            {
                id: "centurion",
                title: "🥈 Centurion Scholar",
                description: "Mastered or studied 100 vocabulary words",
                unlocked: totalStudied >= 100,
                progress: Math.min(100, totalStudied),
                maxProgress: 100,
                category: "LEARNING",
            },
            {
                id: "vocab_master",
                title: "🥇 Vocabulary Titan",
                description: "Studied 500 high-frequency words",
                unlocked: totalStudied >= 500,
                progress: Math.min(500, totalStudied),
                maxProgress: 500,
                category: "LEARNING",
            },
            {
                id: "streak_fire",
                title: "🔥 3-Day Flame",
                description: "Maintained a 3-day continuous learning streak",
                unlocked: streak >= 3,
                progress: Math.min(3, streak),
                maxProgress: 3,
                category: "STREAK",
            },
            {
                id: "streak_titan",
                title: "⚡ 7-Day Unstoppable",
                description: "Kept the fire burning for 7 full consecutive days",
                unlocked: streak >= 7,
                progress: Math.min(7, streak),
                maxProgress: 7,
                category: "STREAK",
            },
            {
                id: "streak_legend",
                title: "👑 30-Day Legend",
                description: "Achieved an extraordinary 30-day continuous streak",
                unlocked: streak >= 30,
                progress: Math.min(30, streak),
                maxProgress: 30,
                category: "STREAK",
            },
            {
                id: "srs_virtuoso",
                title: "🧠 Memory Virtuoso",
                description: "Locked 25 words into long-term memory (Mastered status)",
                unlocked: masteredCount >= 25,
                progress: Math.min(25, masteredCount),
                maxProgress: 25,
                category: "MASTERY",
            },
            {
                id: "perfect_quiz",
                title: "🎯 Bullseye Prodigy",
                description: "Scored 100% accuracy on a quiz session",
                unlocked: hasPerfectQuiz,
                progress: hasPerfectQuiz ? 1 : 0,
                maxProgress: 1,
                category: "QUIZ",
            },
            {
                id: "bookworm",
                title: "📚 Bookworm Curator",
                description: "Saved 10 or more words to your personal book list",
                unlocked: bookmarksCount >= 10,
                progress: Math.min(10, bookmarksCount),
                maxProgress: 10,
                category: "COLLECTION",
            },
        ];
        const unlockedCount = badges.filter((b) => b.unlocked).length;
        return {
            unlockedCount,
            totalBadges: badges.length,
            completionRate: Math.round((unlockedCount / badges.length) * 100),
            badges,
        };
    }
    async getActivityHeatmap(userId, days = 365) {
        const logs = await this.prisma.dailyActivityLog.findMany({
            where: { userId },
            orderBy: { date: "asc" },
            take: days,
        });
        return logs.map((l) => {
            const totalActivities = l.wordsReviewed + l.wordsLearned + l.quizzesTaken;
            let intensityLevel = 0;
            if (totalActivities >= 50)
                intensityLevel = 4;
            else if (totalActivities >= 25)
                intensityLevel = 3;
            else if (totalActivities >= 10)
                intensityLevel = 2;
            else if (totalActivities >= 1)
                intensityLevel = 1;
            return {
                date: l.date,
                count: totalActivities,
                wordsReviewed: l.wordsReviewed,
                wordsLearned: l.wordsLearned,
                quizzesTaken: l.quizzesTaken,
                goalReached: l.goalReached,
                intensityLevel,
            };
        });
    }
    async getUpcomingReviewForecast(userId, fromDate) {
        const forecast = [];
        for (let i = 1; i <= 7; i++) {
            const targetDay = new Date(fromDate);
            targetDay.setDate(targetDay.getDate() + i);
            const startOfDay = new Date(targetDay);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDay);
            endOfDay.setHours(23, 59, 59, 999);
            const dueCount = await this.prisma.userWordProgress.count({
                where: {
                    userId,
                    nextReviewAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });
            forecast.push({
                date: targetDay.toISOString().split("T")[0],
                dueCount,
            });
        }
        return forecast;
    }
    calculateGamificationLevel(totalPoints) {
        const level = Math.floor(Math.sqrt(totalPoints / 25)) + 1;
        const currentLevelBaseXP = Math.pow(level - 1, 2) * 25;
        const nextLevelXP = Math.pow(level, 2) * 25;
        const xpSpan = nextLevelXP - currentLevelBaseXP;
        const currentXP = totalPoints - currentLevelBaseXP;
        const progressPercent = Math.min(100, Math.round((currentXP / Math.max(1, xpSpan)) * 100));
        let rankTitle = "Novice Explorer";
        if (level >= 25)
            rankTitle = "Supreme Polyglot 👑";
        else if (level >= 18)
            rankTitle = "Vocabulary Master 🏆";
        else if (level >= 12)
            rankTitle = "Wordsmith Virtuoso 🎖️";
        else if (level >= 7)
            rankTitle = "Linguistic Pioneer ⚡";
        else if (level >= 4)
            rankTitle = "Knowledge Seeker 🌟";
        return {
            level,
            rankTitle,
            currentXP,
            nextLevelXP,
            progressPercent,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map