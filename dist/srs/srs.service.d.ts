import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { ReviewCardDto } from './dto/review-card.dto';
import { SrsRating, SrsState } from "@vocabmaster/shared";
export declare class SrsService {
    private readonly prisma;
    private readonly userService;
    private readonly logger;
    constructor(prisma: PrismaService, userService: UserService);
    calculateNextReview(rating: SrsRating, currentRepetition: number, currentInterval: number, currentEF: number): {
        repetition: number;
        interval: number;
        easinessFactor: number;
        state: SrsState.LEARNING | SrsState.REVIEW | SrsState.MASTERED;
        nextReviewAt: Date;
    };
    getReviewQueue(userId: string): Promise<{
        queue: ({
            id: string;
            wordId: string;
            word: {
                examples: {
                    id: string;
                    createdAt: Date;
                    source: string | null;
                    sentenceEn: string;
                    sentenceBn: string;
                    wordId: string;
                }[];
                notes: {
                    userId: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    content: string;
                    wordId: string;
                    mnemonic: string | null;
                    personalExample: string | null;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                word: string;
                frequencyScore: number;
                synonyms: string[];
                antonyms: string[];
                cefrLevel: import(".prisma/client").$Enums.CefrLevel | null;
                category: string;
                partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
                englishMeaning: string;
                banglaMeaning: string;
                phoneticUs: string | null;
                phoneticUk: string | null;
                normalizedWord: string;
                audioUkUrl: string | null;
                audioUsUrl: string | null;
                etymology: string | null;
                dictionarySource: string | null;
                englishContext: string | null;
                banglaContext: string | null;
                isSystemWord: boolean;
                createdById: string | null;
            };
            state: import(".prisma/client").$Enums.SrsState;
            interval: number;
            repetition: number;
            easinessFactor: number;
            nextReviewAt: string;
            isNew: boolean;
        } | {
            id: string;
            wordId: any;
            word: any;
            state: SrsState;
            interval: number;
            repetition: number;
            easinessFactor: number;
            nextReviewAt: string;
            isNew: boolean;
        })[];
        summary: {
            dueTodayCount: number;
            newWordsCount: number;
            learningCount: number;
            masteredCount: number;
            totalWordsLearned: number;
            dailyGoalProgress: {
                target: number;
                completed: number;
                percentage: number;
            };
        };
    }>;
    submitReview(userId: string, dto: ReviewCardDto): Promise<{
        success: boolean;
        wordId: string;
        nextReviewAt: Date;
        intervalDays: number;
        state: SrsState.LEARNING | SrsState.REVIEW | SrsState.MASTERED;
        easinessFactor: number;
    }>;
    getSummary(userId: string): Promise<{
        totalReviewed: number;
        masteredCount: number;
        learningCount: number;
        reviewCount: number;
        retentionRate: number;
    }>;
}
