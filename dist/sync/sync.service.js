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
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const srs_service_1 = require("../srs/srs.service");
const user_service_1 = require("../user/user.service");
let SyncService = SyncService_1 = class SyncService {
    prisma;
    srsService;
    userService;
    logger = new common_1.Logger(SyncService_1.name);
    constructor(prisma, srsService, userService) {
        this.prisma = prisma;
        this.srsService = srsService;
        this.userService = userService;
    }
    async processOfflinePush(userId, dto) {
        let syncedCount = 0;
        let conflictsResolved = 0;
        for (const item of dto.offlineReviews) {
            try {
                const itemReviewedDate = new Date(item.reviewedAt);
                const existing = await this.prisma.userWordProgress.findUnique({
                    where: {
                        userId_wordId: { userId, wordId: item.wordId },
                    },
                });
                if (existing?.lastReviewedAt && new Date(existing.lastReviewedAt) > itemReviewedDate) {
                    conflictsResolved++;
                    continue;
                }
                await this.srsService.submitReview(userId, {
                    wordId: item.wordId,
                    rating: item.rating,
                    responseTimeMs: item.responseTimeMs,
                });
                syncedCount++;
            }
            catch (err) {
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
    async pullUpdates(userId, since) {
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
        }
        catch {
            return {
                serverTimestamp: new Date().toISOString(),
                wordsUpdated: [],
                userProgressUpdated: [],
                collectionsUpdated: [],
            };
        }
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        srs_service_1.SrsService,
        user_service_1.UserService])
], SyncService);
//# sourceMappingURL=sync.service.js.map