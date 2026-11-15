import { AnalyticsService } from './analytics.service';
import { AuthenticatedUser } from '../auth/current-user.decorator';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(user: AuthenticatedUser): Promise<{
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
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            date: string;
            wordsReviewed: number;
            wordsLearned: number;
            quizzesTaken: number;
            timeSpentSec: number;
            goalReached: boolean;
        }[];
    }>;
}
