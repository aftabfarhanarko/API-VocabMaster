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
var SrsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SrsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const user_service_1 = require("../user/user.service");
const shared_1 = require("@vocabmaster/shared");
let SrsService = SrsService_1 = class SrsService {
    prisma;
    userService;
    logger = new common_1.Logger(SrsService_1.name);
    constructor(prisma, userService) {
        this.prisma = prisma;
        this.userService = userService;
    }
    calculateNextReview(rating, currentRepetition, currentInterval, currentEF) {
        let nextRepetition = currentRepetition;
        let nextInterval = currentInterval;
        let nextEF = currentEF;
        let nextState = shared_1.SrsState.LEARNING;
        if (rating === shared_1.SrsRating.AGAIN) {
            nextRepetition = 0;
            nextInterval = shared_1.SM2_CONFIG.FIRST_INTERVAL_DAYS;
            nextEF = Math.max(shared_1.SM2_CONFIG.MIN_EASINESS_FACTOR, currentEF - 0.2);
            nextState = shared_1.SrsState.LEARNING;
        }
        else if (rating === shared_1.SrsRating.HARD) {
            nextRepetition = currentRepetition + 1;
            nextInterval = Math.max(1, Math.round(currentInterval * 1.2));
            nextEF = Math.max(shared_1.SM2_CONFIG.MIN_EASINESS_FACTOR, currentEF - 0.15);
            nextState = nextRepetition >= 3 ? shared_1.SrsState.REVIEW : shared_1.SrsState.LEARNING;
        }
        else if (rating === shared_1.SrsRating.GOOD) {
            if (currentRepetition === 0) {
                nextInterval = shared_1.SM2_CONFIG.FIRST_INTERVAL_DAYS;
            }
            else if (currentRepetition === 1) {
                nextInterval = shared_1.SM2_CONFIG.SECOND_INTERVAL_DAYS;
            }
            else {
                nextInterval = Math.round(currentInterval * currentEF);
            }
            nextRepetition = currentRepetition + 1;
            nextEF = Math.max(shared_1.SM2_CONFIG.MIN_EASINESS_FACTOR, currentEF + 0.0);
            nextState =
                nextRepetition >= shared_1.SM2_CONFIG.MASTERED_REPETITION_THRESHOLD && nextInterval >= 21
                    ? shared_1.SrsState.MASTERED
                    : nextRepetition >= 2
                        ? shared_1.SrsState.REVIEW
                        : shared_1.SrsState.LEARNING;
        }
        else if (rating === shared_1.SrsRating.EASY) {
            if (currentRepetition === 0) {
                nextInterval = 3;
            }
            else if (currentRepetition === 1) {
                nextInterval = 8;
            }
            else {
                nextInterval = Math.round(currentInterval * currentEF * 1.3);
            }
            nextRepetition = currentRepetition + 1;
            nextEF = Math.max(shared_1.SM2_CONFIG.MIN_EASINESS_FACTOR, currentEF + 0.1);
            nextState =
                nextRepetition >= 3 && nextInterval >= 21 ? shared_1.SrsState.MASTERED : shared_1.SrsState.REVIEW;
        }
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);
        return {
            repetition: nextRepetition,
            interval: nextInterval,
            easinessFactor: parseFloat(nextEF.toFixed(2)),
            state: nextState,
            nextReviewAt: nextReviewDate,
        };
    }
    async getReviewQueue(userId) {
        const now = new Date();
        const dueProgress = await this.prisma.userWordProgress.findMany({
            where: {
                userId,
                nextReviewAt: { lte: now },
            },
            include: {
                word: {
                    include: { examples: true, notes: { where: { userId } } },
                },
            },
            take: 30,
            orderBy: { nextReviewAt: 'asc' },
        });
        const existingWordIds = await this.prisma.userWordProgress.findMany({
            where: { userId },
            select: { wordId: true },
        });
        const studiedIds = existingWordIds.map((e) => e.wordId);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const dailyGoal = user?.dailyWordGoal || 10;
        const neededNewWords = Math.max(0, dailyGoal - dueProgress.length);
        let newWords = [];
        if (neededNewWords > 0) {
            newWords = await this.prisma.vocabularyWord.findMany({
                where: {
                    id: { notIn: studiedIds },
                },
                take: neededNewWords,
                orderBy: { frequencyScore: 'desc' },
                include: { examples: true },
            });
        }
        const queue = [
            ...dueProgress.map((p) => ({
                id: p.id,
                wordId: p.wordId,
                word: p.word,
                state: p.state,
                interval: p.interval,
                repetition: p.repetition,
                easinessFactor: p.easinessFactor,
                nextReviewAt: p.nextReviewAt.toISOString(),
                isNew: false,
            })),
            ...newWords.map((w) => ({
                id: `new-${w.id}`,
                wordId: w.id,
                word: w,
                state: shared_1.SrsState.NEW,
                interval: 0,
                repetition: 0,
                easinessFactor: 2.5,
                nextReviewAt: now.toISOString(),
                isNew: true,
            })),
        ];
        const [dueTodayCount, masteredCount, learningCount] = await Promise.all([
            this.prisma.userWordProgress.count({
                where: { userId, nextReviewAt: { lte: now } },
            }),
            this.prisma.userWordProgress.count({
                where: { userId, state: shared_1.SrsState.MASTERED },
            }),
            this.prisma.userWordProgress.count({
                where: { userId, state: shared_1.SrsState.LEARNING },
            }),
        ]);
        return {
            queue,
            summary: {
                dueTodayCount,
                newWordsCount: newWords.length,
                learningCount,
                masteredCount,
                totalWordsLearned: studiedIds.length,
                dailyGoalProgress: {
                    target: dailyGoal,
                    completed: dueProgress.length,
                    percentage: Math.min(100, Math.round((dueProgress.length / dailyGoal) * 100)),
                },
            },
        };
    }
    async submitReview(userId, dto) {
        const { rating, responseTimeMs } = dto;
        let actualWordId = dto.wordId;
        const word = await this.prisma.vocabularyWord.findFirst({
            where: {
                OR: [{ id: dto.wordId }, { normalizedWord: dto.wordId.toLowerCase() }],
            },
        });
        if (word) {
            actualWordId = word.id;
        }
        else {
            throw new common_1.NotFoundException(`Word with ID '${dto.wordId}' not found.`);
        }
        let progress = await this.prisma.userWordProgress.findUnique({
            where: {
                userId_wordId: { userId, wordId: actualWordId },
            },
        });
        const currentRep = progress ? progress.repetition : 0;
        const currentInt = progress ? progress.interval : 0;
        const currentEF = progress ? progress.easinessFactor : 2.5;
        const calc = this.calculateNextReview(rating, currentRep, currentInt, currentEF);
        if (!progress) {
            progress = await this.prisma.userWordProgress.create({
                data: {
                    userId,
                    wordId: actualWordId,
                    state: calc.state,
                    easinessFactor: calc.easinessFactor,
                    interval: calc.interval,
                    repetition: calc.repetition,
                    lapses: rating === shared_1.SrsRating.AGAIN ? 1 : 0,
                    lastReviewedAt: new Date(),
                    nextReviewAt: calc.nextReviewAt,
                },
            });
        }
        else {
            progress = await this.prisma.userWordProgress.update({
                where: { id: progress.id },
                data: {
                    state: calc.state,
                    easinessFactor: calc.easinessFactor,
                    interval: calc.interval,
                    repetition: calc.repetition,
                    lapses: rating === shared_1.SrsRating.AGAIN ? { increment: 1 } : undefined,
                    lastReviewedAt: new Date(),
                    nextReviewAt: calc.nextReviewAt,
                },
            });
        }
        await this.prisma.reviewHistory.create({
            data: {
                userProgressId: progress.id,
                rating,
                interval: calc.interval,
                easinessFactor: calc.easinessFactor,
                responseTimeMs,
            },
        });
        await this.userService.recordActivity(userId, {
            wordsReviewed: 1,
            wordsLearned: calc.state === shared_1.SrsState.MASTERED ? 1 : 0,
        });
        return {
            success: true,
            wordId: actualWordId,
            nextReviewAt: calc.nextReviewAt,
            intervalDays: calc.interval,
            state: calc.state,
            easinessFactor: calc.easinessFactor,
        };
    }
    async getSummary(userId) {
        const [totalReviewed, masteredCount, learningCount, reviewCount] = await Promise.all([
            this.prisma.userWordProgress.count({ where: { userId } }),
            this.prisma.userWordProgress.count({ where: { userId, state: shared_1.SrsState.MASTERED } }),
            this.prisma.userWordProgress.count({ where: { userId, state: shared_1.SrsState.LEARNING } }),
            this.prisma.userWordProgress.count({ where: { userId, state: shared_1.SrsState.REVIEW } }),
        ]);
        const retentionRate = totalReviewed > 0 ? Math.round(((masteredCount + reviewCount) / totalReviewed) * 100) : 0;
        return {
            totalReviewed,
            masteredCount,
            learningCount,
            reviewCount,
            retentionRate,
        };
    }
};
exports.SrsService = SrsService;
exports.SrsService = SrsService = SrsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_service_1.UserService])
], SrsService);
//# sourceMappingURL=srs.service.js.map