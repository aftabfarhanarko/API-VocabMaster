import { SrsService } from './srs.service';
import { ReviewCardDto } from './dto/review-card.dto';
import { AuthenticatedUser } from '../auth/current-user.decorator';
export declare class SrsController {
    private readonly srsService;
    constructor(srsService: SrsService);
    getQueue(user: AuthenticatedUser): Promise<{
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
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    content: string;
                    userId: string;
                    wordId: string;
                    mnemonic: string | null;
                    personalExample: string | null;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                cefrLevel: import(".prisma/client").$Enums.CefrLevel;
                category: string;
                partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
                word: string;
                frequencyScore: number;
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
            state: import("@vocabmaster/shared").SrsState;
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
    submitReview(user: AuthenticatedUser, dto: ReviewCardDto): Promise<{
        success: boolean;
        wordId: string;
        nextReviewAt: Date;
        intervalDays: number;
        state: import("@vocabmaster/shared").SrsState.LEARNING | import("@vocabmaster/shared").SrsState.REVIEW | import("@vocabmaster/shared").SrsState.MASTERED;
        easinessFactor: number;
    }>;
    getSummary(user: AuthenticatedUser): Promise<{
        totalReviewed: number;
        masteredCount: number;
        learningCount: number;
        reviewCount: number;
        retentionRate: number;
    }>;
}
