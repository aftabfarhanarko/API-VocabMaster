import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User profile for ID '${userId}' not found.`);
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!exists) {
      throw new NotFoundException(`User profile for ID '${userId}' not found.`);
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
      },
    });
  }

  async recordActivity(
    userId: string,
    activity: {
      wordsReviewed?: number;
      wordsLearned?: number;
      quizzesTaken?: number;
      timeSpentSec?: number;
    }
  ) {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    let currentStreak = user.currentStreak;
    let longestStreak = user.longestStreak;

    if (!user.lastActiveDate) {
      currentStreak = 1;
    } else {
      const lastDate = new Date(user.lastActiveDate);
      const lastDateStr = lastDate.toISOString().split('T')[0];

      if (lastDateStr !== todayStr) {
        const diffDays = Math.floor(
          (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      }
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // 1. Update user streak & XP in database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveDate: now,
        currentStreak,
        longestStreak,
        totalPoints: {
          increment:
            (activity.wordsReviewed || 0) * 5 +
            (activity.wordsLearned || 0) * 10 +
            (activity.quizzesTaken || 0) * 20,
        },
      },
    });

    // 2. Upsert DailyActivityLog in database
    await this.prisma.dailyActivityLog.upsert({
      where: {
        userId_date: {
          userId,
          date: todayStr,
        },
      },
      create: {
        userId,
        date: todayStr,
        wordsReviewed: activity.wordsReviewed || 0,
        wordsLearned: activity.wordsLearned || 0,
        quizzesTaken: activity.quizzesTaken || 0,
        timeSpentSec: activity.timeSpentSec || 0,
        goalReached: (activity.wordsReviewed || 0) + (activity.wordsLearned || 0) >= user.dailyWordGoal,
      },
      update: {
        wordsReviewed: { increment: activity.wordsReviewed || 0 },
        wordsLearned: { increment: activity.wordsLearned || 0 },
        quizzesTaken: { increment: activity.quizzesTaken || 0 },
        timeSpentSec: { increment: activity.timeSpentSec || 0 },
      },
    });
  }

  async getRecentActivity(userId: string, days: number = 30) {
    return await this.prisma.dailyActivityLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: days,
    });
  }

  async setDailyGoal(userId: string, dailyWordGoal: number) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { dailyWordGoal },
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = await this.prisma.dailyActivityLog.findUnique({
      where: { userId_date: { userId, date: todayStr } },
    });

    const wordsReviewed = todayLog?.wordsReviewed || 0;
    const wordsLearned = todayLog?.wordsLearned || 0;
    const totalCompleted = wordsReviewed + wordsLearned;
    const goalReached = totalCompleted >= dailyWordGoal;

    if (todayLog && todayLog.goalReached !== goalReached) {
      await this.prisma.dailyActivityLog.update({
        where: { id: todayLog.id },
        data: { goalReached },
      });
    }

    return this.buildGoalProgressResponse(
      user,
      totalCompleted,
      wordsReviewed,
      wordsLearned,
      goalReached
    );
  }

  async getDailyGoalProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = await this.prisma.dailyActivityLog.findUnique({
      where: { userId_date: { userId, date: todayStr } },
    });

    const wordsReviewed = todayLog?.wordsReviewed || 0;
    const wordsLearned = todayLog?.wordsLearned || 0;
    const totalCompleted = wordsReviewed + wordsLearned;
    const goalReached = totalCompleted >= user.dailyWordGoal;

    return this.buildGoalProgressResponse(
      user,
      totalCompleted,
      wordsReviewed,
      wordsLearned,
      goalReached
    );
  }

  private buildGoalProgressResponse(
    user: any,
    totalCompleted: number,
    wordsReviewed: number,
    wordsLearned: number,
    goalReached: boolean
  ) {
    const dailyGoal = user.dailyWordGoal;
    const remainingWords = Math.max(0, dailyGoal - totalCompleted);
    const completionPercentage = Math.min(
      100,
      Math.round((totalCompleted / dailyGoal) * 100)
    );

    let motivationalMessage = '';
    if (goalReached) {
      motivationalMessage = `🎉 Congratulations! You have smashed your daily target of ${dailyGoal} words today!`;
    } else if (completionPercentage >= 75) {
      motivationalMessage = `🔥 Almost there! Only ${remainingWords} more word${remainingWords > 1 ? 's' : ''} to reach your daily goal!`;
    } else if (completionPercentage >= 50) {
      motivationalMessage = `💪 Great momentum! You are halfway to your ${dailyGoal} words goal (${completionPercentage}%).`;
    } else if (totalCompleted > 0) {
      motivationalMessage = `🚀 Nice start! ${remainingWords} more words to complete today's plan.`;
    } else {
      motivationalMessage = `🎯 Today's target: ${dailyGoal} words. Start your study session now!`;
    }

    return {
      dailyGoal,
      wordsReviewedToday: wordsReviewed,
      wordsLearnedToday: wordsLearned,
      totalCompletedToday: totalCompleted,
      remainingWords,
      completionPercentage,
      goalReached,
      streak: user.currentStreak,
      longestStreak: user.longestStreak,
      motivationalMessage,
    };
  }
}
