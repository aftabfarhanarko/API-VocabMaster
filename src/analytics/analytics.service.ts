import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SrsState } from '@vocabmaster/shared';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(userId: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    const [
      totalWords,
      masteredCount,
      learningCount,
      reviewCount,
      todayActivity,
      activityLogs,
      userProgressItems,
    ] = await Promise.all([
      this.prisma.vocabularyWord.count(),
      this.prisma.userWordProgress.count({
        where: { userId, state: SrsState.MASTERED },
      }),
      this.prisma.userWordProgress.count({
        where: { userId, state: SrsState.LEARNING },
      }),
      this.prisma.userWordProgress.count({
        where: { userId, state: SrsState.REVIEW },
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
    const retentionRate =
      totalStudied > 0
        ? Math.round(((masteredCount + reviewCount) / totalStudied) * 100)
        : 0;

    // Real CEFR level breakdown from database
    const cefrCounts: Record<string, number> = {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
    };

    // Real Category breakdown from database
    const categoryCounts: Record<string, number> = {};

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
    const goalProgressPercent = Math.min(
      100,
      Math.round((todayWordsReviewed / dailyGoal) * 100)
    );

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
}
