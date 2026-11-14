import { SrsRating } from "@vocabmaster/shared";
declare class OfflineReviewItemDto {
    clientUuid: string;
    wordId: string;
    rating: SrsRating;
    reviewedAt: string;
    responseTimeMs?: number;
}
export declare class SyncPushDto {
    lastSyncTimestamp?: string;
    offlineReviews: OfflineReviewItemDto[];
}
export {};
