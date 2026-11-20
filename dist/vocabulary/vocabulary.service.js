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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VocabularyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabularyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dictionary_service_1 = require("../dictionary/dictionary.service");
const audit_service_1 = require("../audit/audit.service");
const audit_actions_1 = require("../audit/audit-actions");
let VocabularyService = VocabularyService_1 = class VocabularyService {
    prisma;
    dictionaryService;
    auditService;
    logger = new common_1.Logger(VocabularyService_1.name);
    constructor(prisma, dictionaryService, auditService) {
        this.prisma = prisma;
        this.dictionaryService = dictionaryService;
        this.auditService = auditService;
    }
    async findWords(userId, query) {
        const { search, cefrLevel, category, partOfSpeech, srsState, collectionId, page = 1, limit = 20, sortBy = 'frequencyScore', sortOrder = 'desc', source = 'database', } = query;
        if (collectionId) {
            const ownedCollection = await this.prisma.collection.findFirst({
                where: { id: collectionId, userId },
                select: { id: true },
            });
            if (!ownedCollection)
                throw new common_1.NotFoundException('Collection not found.');
        }
        const safeSortBy = ['word', 'frequencyScore', 'createdAt'].includes(sortBy)
            ? sortBy
            : 'frequencyScore';
        if (source === 'freedict') {
            return (await this.dictionaryService.listFreeDictWords(page, limit));
        }
        const skip = (page - 1) * limit;
        const where = {
            AND: [{ OR: [{ isSystemWord: true }, { createdById: userId }] }],
        };
        if (search) {
            where.AND.push({ OR: [
                    { word: { contains: search, mode: 'insensitive' } },
                    { englishMeaning: { contains: search, mode: 'insensitive' } },
                    { banglaMeaning: { contains: search } },
                ] });
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
        orderBy[safeSortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
        const [total, words] = await Promise.all([
            this.prisma.vocabularyWord.count({ where }),
            this.prisma.vocabularyWord.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    examples: true,
                    definitions: { orderBy: { senseNumber: 'asc' } },
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
                AND: [
                    { OR: [{ id: wordOrId }, { normalizedWord: normalized }, { word: wordOrId }] },
                    { OR: [{ isSystemWord: true }, { createdById: userId }] },
                ],
            },
            include: {
                examples: true,
                definitions: { orderBy: { senseNumber: 'asc' } },
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
            const primaryMeaning = firstDef?.definition || ext.word;
            const rawExamples = (ext.definitions || [])
                .filter((d) => d.example)
                .map((d) => ({
                sentenceEn: d.example,
                sentenceBn: '',
            }));
            const bnMeaning = ext.bengaliMeaning || '';
            const cefr = ext.cefrLevel || null;
            const posMap = {
                NOUN: 'NOUN', VERB: 'VERB', ADJECTIVE: 'ADJECTIVE', ADVERB: 'ADVERB',
                PRONOUN: 'PRONOUN', PREPOSITION: 'PREPOSITION', CONJUNCTION: 'CONJUNCTION',
                INTERJECTION: 'INTERJECTION', PHRASE: 'PHRASE', IDIOM: 'IDIOM',
            };
            const savedWord = await this.prisma.vocabularyWord.create({
                data: {
                    word: ext.word,
                    normalizedWord: normalized,
                    partOfSpeech: (posMap[String(firstDef?.partOfSpeech || '').toUpperCase()] || 'NOUN'),
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
                    etymology: ext.etymology || null,
                    dictionarySource: ext.freeDict ? 'FreeDict' : 'Free Dictionary API',
                    isSystemWord: true,
                    definitions: {
                        create: (ext.definitions || []).map((definition, index) => ({
                            partOfSpeech: this.normalizePartOfSpeech(definition.partOfSpeech || firstDef?.partOfSpeech),
                            definitionEn: definition.definition,
                            exampleEn: definition.example || null,
                            senseNumber: index,
                            source: ext.freeDict ? 'FreeDict' : 'Free Dictionary API',
                        })),
                    },
                    examples: {
                        create: rawExamples.slice(0, 3),
                    },
                },
                include: {
                    examples: true,
                    definitions: { orderBy: { senseNumber: 'asc' } },
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
        const created = await this.prisma.vocabularyWord.create({
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
        if (this.auditService) {
            this.auditService.logEvent({
                action: audit_actions_1.AuditAction.CUSTOM_WORD_CREATED,
                userId,
                entity: 'VOCABULARY',
                entityId: created.id,
                metadata: { word: created.word, cefrLevel: created.cefrLevel },
            });
        }
        return created;
    }
    normalizePartOfSpeech(value) {
        const normalized = (value || '').toUpperCase();
        const supported = new Set([
            'NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PRONOUN', 'PREPOSITION',
            'CONJUNCTION', 'INTERJECTION', 'PHRASE', 'IDIOM',
        ]);
        return supported.has(normalized) ? normalized : 'NOUN';
    }
    async getCategories(userId) {
        const standardCategories = [
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
            where: { OR: [{ isSystemWord: true }, { createdById: userId }] },
            by: ['category'],
            _count: { id: true },
        });
        const categories = new Set([
            ...standardCategories,
            ...counts.map((entry) => entry.category),
        ]);
        return Array.from(categories).map((category) => ({
            category,
            count: counts.find((entry) => entry.category === category)?._count.id || 0,
        }));
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
            if (this.auditService) {
                this.auditService.logEvent({
                    action: audit_actions_1.AuditAction.WORD_UNBOOKMARKED,
                    userId,
                    entity: 'VOCABULARY',
                    entityId: word.id,
                    metadata: { word: word.word },
                });
            }
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
            if (this.auditService) {
                this.auditService.logEvent({
                    action: audit_actions_1.AuditAction.WORD_BOOKMARKED,
                    userId,
                    entity: 'VOCABULARY',
                    entityId: word.id,
                    metadata: { word: word.word },
                });
            }
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
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dictionary_service_1.DictionaryService,
        audit_service_1.AuditService])
], VocabularyService);
//# sourceMappingURL=vocabulary.service.js.map