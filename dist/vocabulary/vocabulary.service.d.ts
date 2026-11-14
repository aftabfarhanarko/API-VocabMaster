import { PrismaService } from '../prisma/prisma.service';
import { DictionaryService } from '../dictionary/dictionary.service';
import { WordFilterDto } from './dto/word-filter.dto';
import { CreateCustomWordDto } from './dto/create-custom-word.dto';
export declare class VocabularyService {
    private readonly prisma;
    private readonly dictionaryService;
    private readonly logger;
    constructor(prisma: PrismaService, dictionaryService: DictionaryService);
    findWords(userId: string, query: WordFilterDto): Promise<any>;
    getWordDetails(wordOrId: string, userId: string): Promise<{
        userProgress: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            nextReviewAt: Date;
            userId: string;
            wordId: string;
            state: import(".prisma/client").$Enums.SrsState;
            easinessFactor: number;
            interval: number;
            repetition: number;
            lapses: number;
            lastReviewedAt: Date | null;
        };
        note: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            userId: string;
            wordId: string;
            mnemonic: string | null;
            personalExample: string | null;
        };
        examples: {
            id: string;
            createdAt: Date;
            source: string | null;
            sentenceEn: string;
            sentenceBn: string;
            wordId: string;
        }[];
        notes: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            userId: string;
            wordId: string;
            mnemonic: string | null;
            personalExample: string | null;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        frequencyScore: number;
        cefrLevel: import(".prisma/client").$Enums.CefrLevel;
        category: string;
        partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
        englishMeaning: string;
        banglaMeaning: string;
        phoneticUs: string | null;
        phoneticUk: string | null;
        synonyms: string[];
        antonyms: string[];
        normalizedWord: string;
        audioUkUrl: string | null;
        audioUsUrl: string | null;
        englishContext: string | null;
        banglaContext: string | null;
        isSystemWord: boolean;
        createdById: string | null;
    } | {
        userProgress: any;
        note: any;
        externalDictionary: any;
        examples: {
            id: string;
            createdAt: Date;
            source: string | null;
            sentenceEn: string;
            sentenceBn: string;
            wordId: string;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        frequencyScore: number;
        cefrLevel: import(".prisma/client").$Enums.CefrLevel;
        category: string;
        partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
        englishMeaning: string;
        banglaMeaning: string;
        phoneticUs: string | null;
        phoneticUk: string | null;
        synonyms: string[];
        antonyms: string[];
        normalizedWord: string;
        audioUkUrl: string | null;
        audioUsUrl: string | null;
        englishContext: string | null;
        banglaContext: string | null;
        isSystemWord: boolean;
        createdById: string | null;
    }>;
    createCustomWord(userId: string, dto: CreateCustomWordDto): Promise<{
        examples: {
            id: string;
            createdAt: Date;
            source: string | null;
            sentenceEn: string;
            sentenceBn: string;
            wordId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        frequencyScore: number;
        cefrLevel: import(".prisma/client").$Enums.CefrLevel;
        category: string;
        partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
        englishMeaning: string;
        banglaMeaning: string;
        phoneticUs: string | null;
        phoneticUk: string | null;
        synonyms: string[];
        antonyms: string[];
        normalizedWord: string;
        audioUkUrl: string | null;
        audioUsUrl: string | null;
        englishContext: string | null;
        banglaContext: string | null;
        isSystemWord: boolean;
        createdById: string | null;
    }>;
    getCategories(): Promise<{
        category: string;
        count: number;
    }[]>;
    toggleBookmark(userId: string, wordOrId: string): Promise<{
        bookmarked: boolean;
        wordId: string;
        word: string;
        message: string;
        bookmarkId?: undefined;
    } | {
        bookmarked: boolean;
        wordId: string;
        word: string;
        bookmarkId: string;
        message: string;
    }>;
    getBookmarkedWords(userId: string, query: {
        page?: number;
        limit?: number;
        search?: string;
        cefrLevel?: string;
    }): Promise<{
        data: {
            userProgress: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                nextReviewAt: Date;
                userId: string;
                wordId: string;
                state: import(".prisma/client").$Enums.SrsState;
                easinessFactor: number;
                interval: number;
                repetition: number;
                lapses: number;
                lastReviewedAt: Date | null;
            };
            note: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                userId: string;
                wordId: string;
                mnemonic: string | null;
                personalExample: string | null;
            };
            examples: {
                id: string;
                createdAt: Date;
                source: string | null;
                sentenceEn: string;
                sentenceBn: string;
                wordId: string;
            }[];
            notes: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                userId: string;
                wordId: string;
                mnemonic: string | null;
                personalExample: string | null;
            }[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
            word: string;
            frequencyScore: number;
            cefrLevel: import(".prisma/client").$Enums.CefrLevel;
            category: string;
            partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
            englishMeaning: string;
            banglaMeaning: string;
            phoneticUs: string | null;
            phoneticUk: string | null;
            synonyms: string[];
            antonyms: string[];
            normalizedWord: string;
            audioUkUrl: string | null;
            audioUsUrl: string | null;
            englishContext: string | null;
            banglaContext: string | null;
            isSystemWord: boolean;
            createdById: string | null;
            bookmarkId: string;
            bookmarkedAt: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    bulkBookmarkWords(userId: string, wordIdentifiers: string[]): Promise<{
        savedCount: number;
        requested: number;
        message: string;
        totalRequested?: undefined;
        words?: undefined;
    } | {
        savedCount: number;
        totalRequested: number;
        words: string[];
        message: string;
        requested?: undefined;
    }>;
    private resolveWord;
}
