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
var VocabularyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabularyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dictionary_service_1 = require("../dictionary/dictionary.service");
let VocabularyService = VocabularyService_1 = class VocabularyService {
    prisma;
    dictionaryService;
    logger = new common_1.Logger(VocabularyService_1.name);
    constructor(prisma, dictionaryService) {
        this.prisma = prisma;
        this.dictionaryService = dictionaryService;
    }
    async findWords(userId, query) {
        const { search, cefrLevel, category, partOfSpeech, srsState, collectionId, page = 1, limit = 20, sortBy = 'frequencyScore', sortOrder = 'desc', source = 'database', } = query;
        if (source === 'freedict') {
            return (await this.dictionaryService.listFreeDictWords(page, limit));
        }
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { word: { contains: search, mode: 'insensitive' } },
                { englishMeaning: { contains: search, mode: 'insensitive' } },
                { banglaMeaning: { contains: search } },
            ];
        }
        if (cefrLevel)
            where.cefrLevel = cefrLevel;
        if (category)
            where.category = category;
        if (partOfSpeech)
            where.partOfSpeech = partOfSpeech;
        if (collectionId) {
            where.collectionItems = {
                some: { collectionId },
            };
        }
        if (srsState) {
            where.userProgress = {
                some: {
                    userId,
                    state: srsState,
                },
            };
        }
        const orderBy = {};
        orderBy[sortBy] = sortOrder;
        const [total, words] = await Promise.all([
            this.prisma.vocabularyWord.count({ where }),
            this.prisma.vocabularyWord.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    examples: true,
                    userProgress: {
                        where: { userId },
                    },
                    notes: {
                        where: { userId },
                    },
                },
            }),
        ]);
        return {
            data: words.map((w) => ({
                ...w,
                userProgress: w.userProgress?.[0] || null,
                note: w.notes?.[0] || null,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        };
    }
    async getWordDetails(wordOrId, userId) {
        const normalized = wordOrId.trim().toLowerCase();
        const word = await this.prisma.vocabularyWord.findFirst({
            where: {
                OR: [{ id: wordOrId }, { normalizedWord: normalized }, { word: wordOrId }],
            },
            include: {
                examples: true,
                userProgress: {
                    where: { userId },
                },
                notes: {
                    where: { userId },
                },
            },
        });
        if (word) {
            return {
                ...word,
                userProgress: word.userProgress?.[0] || null,
                note: word.notes?.[0] || null,
            };
        }
        const ext = await this.dictionaryService.lookupWord(normalized);
        if (ext) {
            const firstDef = ext.definitions?.[0];
            const primaryMeaning = firstDef?.definition || 'Dictionary definition';
            const rawExamples = (ext.definitions || [])
                .filter((d) => d.example)
                .map((d) => ({
                sentenceEn: d.example,
                sentenceBn: `"${d.example}" (উদাহরণ)`,
            }));
            const bnMeaning = ext.bengaliMeaning || primaryMeaning;
            const cefr = ext.cefrLevel || 'B1';
            const savedWord = await this.prisma.vocabularyWord.create({
                data: {
                    word: ext.word,
                    normalizedWord: normalized,
                    partOfSpeech: firstDef?.partOfSpeech || 'NOUN',
                    cefrLevel: cefr,
                    category: 'General Vocabulary',
                    englishMeaning: primaryMeaning,
                    banglaMeaning: bnMeaning,
                    phoneticUs: ext.phoneticUs,
                    phoneticUk: ext.phoneticUk,
                    audioUsUrl: ext.audioUsUrl,
                    audioUkUrl: ext.audioUkUrl,
                    synonyms: ext.synonyms || [],
                    antonyms: ext.antonyms || [],
                    isSystemWord: false,
                    examples: {
                        create: rawExamples.slice(0, 3),
                    },
                },
                include: {
                    examples: true,
                },
            });
            return {
                ...savedWord,
                userProgress: null,
                note: null,
                externalDictionary: ext,
            };
        }
        throw new common_1.NotFoundException(`Word '${wordOrId}' not found in vocabulary database or external dictionary.`);
    }
    async createCustomWord(userId, dto) {
        const normalized = dto.word.trim().toLowerCase();
        const existing = await this.prisma.vocabularyWord.findFirst({
            where: {
                normalizedWord: normalized,
                createdById: userId,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Custom word '${dto.word}' already exists in your vocabulary.`);
        }
        return await this.prisma.vocabularyWord.create({
            data: {
                word: dto.word.trim(),
                normalizedWord: normalized,
                partOfSpeech: dto.partOfSpeech,
                cefrLevel: dto.cefrLevel || 'B1',
                category: dto.category || 'Custom Words',
                englishMeaning: dto.englishMeaning,
                banglaMeaning: dto.banglaMeaning,
                phoneticUs: dto.phoneticUs,
                phoneticUk: dto.phoneticUk,
                synonyms: dto.synonyms || [],
                antonyms: dto.antonyms || [],
                isSystemWord: false,
                createdById: userId,
                examples: {
                    create: (dto.examples || []).map((ex) => ({
                        sentenceEn: ex.sentenceEn,
                        sentenceBn: ex.sentenceBn,
                    })),
                },
            },
            include: {
                examples: true,
            },
        });
    }
    async getCategories() {
        const categories = [
            'Daily Life & Essentials',
            'Academic & Education',
            'Business & Career',
            'Science & Technology',
            'Travel, Culture & Food',
            'Health & Environment',
            'Emotions & Personality',
            'IELTS & GRE Master',
            'Idioms & Phrasal Verbs',
        ];
        const counts = await this.prisma.vocabularyWord.groupBy({
            by: ['category'],
            _count: { id: true },
        });
        return categories.map((cat) => {
            const found = counts.find((c) => c.category === cat);
            return {
                category: cat,
                count: found ? found._count.id : 0,
            };
        });
    }
    async toggleBookmark(userId, wordOrId) {
        const word = await this.resolveWord(wordOrId);
        const existing = await this.prisma.bookmark.findUnique({
            where: {
                userId_wordId: { userId, wordId: word.id },
            },
        });
        if (existing) {
            await this.prisma.bookmark.delete({
                where: { id: existing.id },
            });
            return {
                bookmarked: false,
                wordId: word.id,
                word: word.word,
                message: `Word '${word.word}' removed from your book list.`,
            };
        }
        else {
            const bookmark = await this.prisma.bookmark.create({
                data: {
                    userId,
                    wordId: word.id,
                },
            });
            return {
                bookmarked: true,
                wordId: word.id,
                word: word.word,
                bookmarkId: bookmark.id,
                message: `Word '${word.word}' saved to your book list!`,
            };
        }
    }
    async getBookmarkedWords(userId, query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (query.search || query.cefrLevel) {
            where.word = {};
            if (query.search) {
                where.word.OR = [
                    { word: { contains: query.search, mode: 'insensitive' } },
                    { englishMeaning: { contains: query.search, mode: 'insensitive' } },
                    { banglaMeaning: { contains: query.search } },
                ];
            }
            if (query.cefrLevel) {
                where.word.cefrLevel = query.cefrLevel;
            }
        }
        const [total, bookmarks] = await Promise.all([
            this.prisma.bookmark.count({ where }),
            this.prisma.bookmark.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    word: {
                        include: {
                            examples: true,
                            userProgress: { where: { userId } },
                            notes: { where: { userId } },
                        },
                    },
                },
            }),
        ]);
        return {
            data: bookmarks.map((b) => ({
                bookmarkId: b.id,
                bookmarkedAt: b.createdAt.toISOString(),
                ...b.word,
                userProgress: b.word.userProgress?.[0] || null,
                note: b.word.notes?.[0] || null,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        };
    }
    async bulkBookmarkWords(userId, wordIdentifiers) {
        const normalizedList = wordIdentifiers.map((w) => w.trim().toLowerCase());
        const words = await this.prisma.vocabularyWord.findMany({
            where: {
                OR: [
                    { id: { in: wordIdentifiers } },
                    { normalizedWord: { in: normalizedList } },
                ],
            },
            select: { id: true, word: true },
        });
        if (words.length === 0) {
            return {
                savedCount: 0,
                requested: wordIdentifiers.length,
                message: 'No matching words found.',
            };
        }
        const data = words.map((w) => ({
            userId,
            wordId: w.id,
        }));
        const result = await this.prisma.bookmark.createMany({
            data,
            skipDuplicates: true,
        });
        return {
            savedCount: result.count,
            totalRequested: wordIdentifiers.length,
            words: words.map((w) => w.word),
            message: `Successfully saved ${result.count} word(s) to your book list.`,
        };
    }
    async resolveWord(wordOrId) {
        const normalized = wordOrId.trim().toLowerCase();
        const word = await this.prisma.vocabularyWord.findFirst({
            where: {
                OR: [{ id: wordOrId }, { normalizedWord: normalized }, { word: wordOrId }],
            },
        });
        if (!word) {
            throw new common_1.NotFoundException(`Word '${wordOrId}' not found in vocabulary catalog.`);
        }
        return word;
    }
};
exports.VocabularyService = VocabularyService;
exports.VocabularyService = VocabularyService = VocabularyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dictionary_service_1.DictionaryService])
], VocabularyService);
//# sourceMappingURL=vocabulary.service.js.map