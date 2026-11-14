import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardMetrics(userId: string): Promise<{
        user: {
            fullName: string;
            currentStreak: number;
            longestStreak: number;
            totalPoints: number;
            dailyGoal: number;
        };
        kpis: {
            totalCatalogWords: number;
            totalStudied: number;
            masteredCount: number;
            learningCount: number;
            reviewCount: number;
            retentionRate: number;
            todayWordsReviewed: number;
            goalProgressPercent: number;
        };
        cefrBreakdown: Record<string, number>;
        categoryBreakdown: Record<string, number>;
        recentActivity: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            date: string;
            wordsReviewed: number;
            wordsLearned: number;
            quizzesTaken: number;
            timeSpentSec: number;
            goalReached: boolean;
        }[];
    }>;
}
