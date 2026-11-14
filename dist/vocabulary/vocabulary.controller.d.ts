import { VocabularyService } from './vocabulary.service';
import { WordFilterDto } from './dto/word-filter.dto';
import { CreateCustomWordDto } from './dto/create-custom-word.dto';
import { BulkBookmarkDto } from './dto/bulk-bookmark.dto';
import { AuthenticatedUser } from '../auth/current-user.decorator';
export declare class VocabularyController {
    private readonly vocabService;
    constructor(vocabService: VocabularyService);
    findWords(user: AuthenticatedUser, query: WordFilterDto): Promise<any>;
    getCategories(): Promise<{
        category: string;
        count: number;
    }[]>;
    getBookmarkedWords(user: AuthenticatedUser, page?: string, limit?: string, search?: string, cefrLevel?: string): Promise<{
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
    toggleBookmark(user: AuthenticatedUser, wordId: string): Promise<{
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
    removeBookmark(user: AuthenticatedUser, wordId: string): Promise<{
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
    bulkBookmark(user: AuthenticatedUser, dto: BulkBookmarkDto): Promise<{
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
    getWordDetails(user: AuthenticatedUser, wordOrId: string): Promise<{
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
    createCustomWord(user: AuthenticatedUser, dto: CreateCustomWordDto): Promise<{
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
}
