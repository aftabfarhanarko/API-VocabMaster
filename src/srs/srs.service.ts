import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { ReviewCardDto } from './dto/review-card.dto';
import { SrsRating, SrsState, SM2_CONFIG } from '@vocabmaster/shared';

@Injectable()
export class SrsService {
  private readonly logger = new Logger(SrsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService
  ) {}

  /**
   * Pure SuperMemo-2 (SM-2) algorithm calculator
   */
  public calculateNextReview(
    rating: SrsRating,
    currentRepetition: number,
    currentInterval: number,
    currentEF: number
  ) {
    let nextRepetition = currentRepetition;
    let nextInterval = currentInterval;
    let nextEF = currentEF;
    let nextState: SrsState = SrsState.LEARNING;

    if (rating === SrsRating.AGAIN) {
      nextRepetition = 0;
      nextInterval = SM2_CONFIG.FIRST_INTERVAL_DAYS;
      nextEF = Math.max(SM2_CONFIG.MIN_EASINESS_FACTOR, currentEF - 0.2);
      nextState = SrsState.LEARNING;
    } else if (rating === SrsRating.HARD) {
      nextRepetition = currentRepetition + 1;
      nextInterval = Math.max(1, Math.round(currentInterval * 1.2));
      nextEF = Math.max(SM2_CONFIG.MIN_EASINESS_FACTOR, currentEF - 0.15);
      nextState = nextRepetition >= 3 ? SrsState.REVIEW : SrsState.LEARNING;
    } else if (rating === SrsRating.GOOD) {
      if (currentRepetition === 0) {
        nextInterval = SM2_CONFIG.FIRST_INTERVAL_DAYS;
      } else if (currentRepetition === 1) {
        nextInterval = SM2_CONFIG.SECOND_INTERVAL_DAYS;
      } else {
        nextInterval = Math.round(currentInterval * currentEF);
      }
      nextRepetition = currentRepetition + 1;
      nextEF = Math.max(SM2_CONFIG.MIN_EASINESS_FACTOR, currentEF + 0.0);
      nextState =
        nextRepetition >= SM2_CONFIG.MASTERED_REPETITION_THRESHOLD && nextInterval >= 21
          ? SrsState.MASTERED
          : nextRepetition >= 2
          ? SrsState.REVIEW
          : SrsState.LEARNING;
    } else if (rating === SrsRating.EASY) {
      if (currentRepetition === 0) {
        nextInterval = 3;
      } else if (currentRepetition === 1) {
        nextInterval = 8;
      } else {
        nextInterval = Math.round(currentInterval * currentEF * 1.3);
      }
      nextRepetition = currentRepetition + 1;
      nextEF = Math.max(SM2_CONFIG.MIN_EASINESS_FACTOR, currentEF + 0.1);
      nextState =
        nextRepetition >= 3 && nextInterval >= 21 ? SrsState.MASTERED : SrsState.REVIEW;
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

  async getReviewQueue(userId: string) {
    const now = new Date();

    // 1. Fetch due reviews scheduled for today or earlier from PostgreSQL
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

    // 2. Fetch new words from catalog if due count is low
    const existingWordIds = await this.prisma.userWordProgress.findMany({
      where: { userId },
      select: { wordId: true },
    });
    const studiedIds = existingWordIds.map((e) => e.wordId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const dailyGoal = user?.dailyWordGoal || 10;
    const neededNewWords = Math.max(0, dailyGoal - dueProgress.length);

    let newWords: any[] = [];
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

    // Combine queue items
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
        state: SrsState.NEW,
        interval: 0,
        repetition: 0,
        easinessFactor: 2.5,
        nextReviewAt: now.toISOString(),
        isNew: true,
      })),
    ];

    // Real summary counts directly from PostgreSQL
    const [dueTodayCount, masteredCount, learningCount] = await Promise.all([
      this.prisma.userWordProgress.count({
        where: { userId, nextReviewAt: { lte: now } },
      }),
      this.prisma.userWordProgress.count({
        where: { userId, state: SrsState.MASTERED },
      }),
      this.prisma.userWordProgress.count({
        where: { userId, state: SrsState.LEARNING },
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

  async submitReview(userId: string, dto: ReviewCardDto) {
    const { rating, responseTimeMs } = dto;
    let actualWordId = dto.wordId;

    // Resolve wordId if word name was passed
    const word = await this.prisma.vocabularyWord.findFirst({
      where: {
        OR: [{ id: dto.wordId }, { normalizedWord: dto.wordId.toLowerCase() }],
      },
    });

    if (word) {
      actualWordId = word.id;
    } else {
      throw new NotFoundException(`Word with ID '${dto.wordId}' not found.`);
    }

    // Fetch or initialize user word progress
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
          lapses: rating === SrsRating.AGAIN ? 1 : 0,
          lastReviewedAt: new Date(),
          nextReviewAt: calc.nextReviewAt,
        },
      });
    } else {
      progress = await this.prisma.userWordProgress.update({
        where: { id: progress.id },
        data: {
          state: calc.state,
          easinessFactor: calc.easinessFactor,
          interval: calc.interval,
          repetition: calc.repetition,
          lapses: rating === SrsRating.AGAIN ? { increment: 1 } : undefined,
          lastReviewedAt: new Date(),
          nextReviewAt: calc.nextReviewAt,
        },
      });
    }

    // Record ReviewHistory in PostgreSQL
    await this.prisma.reviewHistory.create({
      data: {
        userProgressId: progress.id,
        rating,
        interval: calc.interval,
        easinessFactor: calc.easinessFactor,
        responseTimeMs,
      },
    });

    // Update User Activity and Streak in PostgreSQL
    await this.userService.recordActivity(userId, {
      wordsReviewed: 1,
      wordsLearned: calc.state === SrsState.MASTERED ? 1 : 0,
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

  async getSummary(userId: string) {
    const [totalReviewed, masteredCount, learningCount, reviewCount] = await Promise.all([
      this.prisma.userWordProgress.count({ where: { userId } }),
      this.prisma.userWordProgress.count({ where: { userId, state: SrsState.MASTERED } }),
      this.prisma.userWordProgress.count({ where: { userId, state: SrsState.LEARNING } }),
      this.prisma.userWordProgress.count({ where: { userId, state: SrsState.REVIEW } }),
    ]);

    const retentionRate =
      totalReviewed > 0 ? Math.round(((masteredCount + reviewCount) / totalReviewed) * 100) : 0;

    return {
      totalReviewed,
      masteredCount,
      learningCount,
      reviewCount,
      retentionRate,
    };
  }
}
