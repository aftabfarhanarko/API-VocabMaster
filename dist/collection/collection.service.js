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
exports.CollectionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CollectionService = class CollectionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserCollections(userId) {
        const collections = await this.prisma.collection.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { items: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        return collections.map((c) => ({
            ...c,
            wordCount: c._count.items,
        }));
    }
    async createCollection(userId, dto) {
        const existing = await this.prisma.collection.findUnique({
            where: {
                userId_name: { userId, name: dto.name.trim() },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`A collection named '${dto.name}' already exists.`);
        }
        return await this.prisma.collection.create({
            data: {
                userId,
                name: dto.name.trim(),
                description: dto.description?.trim(),
                color: dto.color || '#4F46E5',
                icon: dto.icon || 'bookmark',
            },
            include: {
                _count: { select: { items: true } },
            },
        });
    }
    async getCollectionById(userId, collectionId) {
        const collection = await this.prisma.collection.findFirst({
            where: { id: collectionId, userId },
            include: {
                items: {
                    include: {
                        word: {
                            include: { examples: true },
                        },
                    },
                },
            },
        });
        if (!collection) {
            throw new common_1.NotFoundException(`Collection with ID '${collectionId}' not found.`);
        }
        return {
            ...collection,
            words: collection.items.map((i) => i.word),
            wordCount: collection.items.length,
        };
    }
    async updateCollection(userId, collectionId, dto) {
        const collection = await this.prisma.collection.findFirst({
            where: { id: collectionId, userId },
        });
        if (!collection) {
            throw new common_1.NotFoundException(`Collection with ID '${collectionId}' not found.`);
        }
        return await this.prisma.collection.update({
            where: { id: collectionId },
            data: {
                name: dto.name?.trim(),
                description: dto.description?.trim(),
                color: dto.color,
                icon: dto.icon,
            },
        });
    }
    async deleteCollection(userId, collectionId) {
        const collection = await this.prisma.collection.findFirst({
            where: { id: collectionId, userId },
        });
        if (!collection) {
            throw new common_1.NotFoundException(`Collection with ID '${collectionId}' not found.`);
        }
        await this.prisma.collection.delete({
            where: { id: collectionId },
        });
        return { success: true, message: 'Collection deleted successfully.' };
    }
    async addWordToCollection(userId, collectionId, wordId) {
        const collection = await this.prisma.collection.findFirst({
            where: { id: collectionId, userId },
        });
        if (!collection) {
            throw new common_1.NotFoundException(`Collection with ID '${collectionId}' not found.`);
        }
        let actualWordId = wordId;
        const word = await this.prisma.vocabularyWord.findFirst({
            where: {
                OR: [{ id: wordId }, { normalizedWord: wordId.toLowerCase() }],
            },
        });
        if (word) {
            actualWordId = word.id;
        }
        else {
            throw new common_1.NotFoundException(`Word '${wordId}' not found in vocabulary.`);
        }
        const item = await this.prisma.collectionItem.upsert({
            where: {
                collectionId_wordId: { collectionId, wordId: actualWordId },
            },
            update: {},
            create: {
                collectionId,
                wordId: actualWordId,
            },
            include: {
                word: true,
            },
        });
        return { success: true, collectionId, wordId: actualWordId, item };
    }
    async removeWordFromCollection(userId, collectionId, wordId) {
        const collection = await this.prisma.collection.findFirst({
            where: { id: collectionId, userId },
        });
        if (!collection) {
            throw new common_1.NotFoundException(`Collection with ID '${collectionId}' not found.`);
        }
        await this.prisma.collectionItem.deleteMany({
            where: {
                collectionId,
                wordId,
            },
        });
        return { success: true, message: 'Word removed from collection successfully.' };
    }
};
exports.CollectionService = CollectionService;
exports.CollectionService = CollectionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CollectionService);
//# sourceMappingURL=collection.service.js.map