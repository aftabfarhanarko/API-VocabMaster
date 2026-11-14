import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SrsService } from '../srs/srs.service';
import { UserService } from '../user/user.service';
import { SyncPushDto } from './dto/sync-push.dto';
import { SyncPushResponse, SyncPullResponse } from '@vocabmaster/shared';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly srsService: SrsService,
    private readonly userService: UserService
  ) {}

  async processOfflinePush(userId: string, dto: SyncPushDto): Promise<SyncPushResponse> {
    let syncedCount = 0;
    let conflictsResolved = 0;

    for (const item of dto.offlineReviews) {
      try {
        const itemReviewedDate = new Date(item.reviewedAt);

        // Check if there is existing progress
        const existing = await this.prisma.userWordProgress.findUnique({
          where: {
            userId_wordId: { userId, wordId: item.wordId },
          },
        });

        if (existing?.lastReviewedAt && new Date(existing.lastReviewedAt) > itemReviewedDate) {
          // Conflict: Server has newer review timestamp
          conflictsResolved++;
          continue;
        }

        // Apply review using SRS calculation
        await this.srsService.submitReview(userId, {
          wordId: item.wordId,
          rating: item.rating,
          responseTimeMs: item.responseTimeMs,
        });

        syncedCount++;
      } catch (err: any) {
        this.logger.warn(`Failed to sync item ${item.clientUuid}: ${err.message}`);
      }
    }

    return {
      success: true,
      syncedCount,
      conflictsResolved,
      serverTimestamp: new Date().toISOString(),
    };
  }

  async pullUpdates(userId: string, since?: string): Promise<SyncPullResponse> {
    const sinceDate = since ? new Date(since) : new Date(0);

    try {
      const [wordsUpdated, userProgressUpdated, collectionsUpdated] = await Promise.all([
        this.prisma.vocabularyWord.findMany({
          where: { updatedAt: { gte: sinceDate } },
          take: 50,
        }),
        this.prisma.userWordProgress.findMany({
          where: { userId, updatedAt: { gte: sinceDate } },
        }),
        this.prisma.collection.findMany({
          where: { userId, updatedAt: { gte: sinceDate } },
          include: { items: true },
        }),
      ]);

      return {
        serverTimestamp: new Date().toISOString(),
        wordsUpdated,
        userProgressUpdated,
        collectionsUpdated,
      };
    } catch {
      return {
        serverTimestamp: new Date().toISOString(),
        wordsUpdated: [],
        userProgressUpdated: [],
        collectionsUpdated: [],
      };
    }
  }
}
