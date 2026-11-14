import { PrismaService } from "../prisma/prisma.service";
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOverview(userId: string): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            avatarUrl: string;
            streak: number;
            longestStreak: number;
            totalPoints: number;
            preferredAccent: import(".prisma/client").$Enums.AccentType;
            level: number;
            rankTitle: string;
            xpCurrentLevel: number;
            xpForNextLevel: number;
            xpProgressPercent: number;
        };
        dailyGoal: {
            target: number;
            completedToday: number;
            wordsReviewedToday: number;
            wordsLearnedToday: number;
            remainingWords: number;
            completionPercentage: number;
            goalReached: boolean;
            statusText: string;
        };
        kpis: {
            totalCatalogWords: number;
            totalStudied: number;
            masteredCount: number;
            learningCount: number;
            reviewCount: number;
            dueForReviewToday: number;
            bookmarksCount: number;
            quizSessionsCount: number;
            retentionRate: number;
        };
        cefrProgress: Record<string, {
            total: number;
            mastered: number;
            learning: number;
        }>;
        upcomingSchedule: {
            date: string;
            dueCount: number;
        }[];
    }>;
    getDailyPlan(userId: string): Promise<{
        dailyWordGoal: number;
        totalPlannedWords: number;
        estimatedMinutes: number;
        sessions: {
            id: string;
            title: string;
            subtitle: string;
            itemCount: number;
            words: ({
                id: string;
                word: string;
                banglaMeaning: string;
                cefrLevel: import(".prisma/client").$Enums.CefrLevel;
                partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
                phoneticUs: string;
                type: "SRS_REVIEW";
                priority: number;
                examples: {
                    id: string;
                    createdAt: Date;
                    source: string | null;
                    sentenceEn: string;
                    sentenceBn: string;
                    wordId: string;
                }[];
            } | {
                id: string;
                word: string;
                banglaMeaning: string;
                cefrLevel: import(".prisma/client").$Enums.CefrLevel;
                partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
                phoneticUs: string;
                type: "BOOKMARKED";
                priority: number;
                examples: {
                    id: string;
                    createdAt: Date;
                    source: string | null;
                    sentenceEn: string;
                    sentenceBn: string;
                    wordId: string;
                }[];
            } | {
                id: any;
                word: any;
                banglaMeaning: any;
                cefrLevel: any;
                partOfSpeech: any;
                phoneticUs: any;
                type: "NEW_LEARNING";
                priority: number;
                examples: any;
            })[];
        }[];
    }>;
    getStrugglingWords(userId: string): Promise<{
        wordId: string;
        word: string;
        banglaMeaning: string;
        englishMeaning: string;
        cefrLevel: import(".prisma/client").$Enums.CefrLevel;
        partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
        phoneticUs: string;
        lapses: number;
        easinessFactor: number;
        repetition: number;
        personalNote: string;
        mnemonic: string;
        recommendationTip: string;
    }[]>;
    getAchievements(userId: string): Promise<{
        unlockedCount: number;
        totalBadges: number;
        completionRate: number;
        badges: {
            id: string;
            title: string;
            description: string;
            unlocked: boolean;
            progress: number;
            maxProgress: number;
            category: string;
        }[];
    }>;
    getActivityHeatmap(userId: string, days?: number): Promise<{
        date: string;
        count: number;
        wordsReviewed: number;
        wordsLearned: number;
        quizzesTaken: number;
        goalReached: boolean;
        intensityLevel: number;
    }[]>;
    private getUpcomingReviewForecast;
    private calculateGamificationLevel;
}
