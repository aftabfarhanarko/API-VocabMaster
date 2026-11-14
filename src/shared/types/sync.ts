import { SrsRating } from './srs';
import { SrsState } from './vocabulary';

export interface OfflineReviewRecord {
  id: string; // client UUID
  wordId: string;
  rating: SrsRating;
  reviewedAt: string;
  responseTimeMs?: number;
  synced: boolean;
}

export interface SyncPullResponse {
  serverTimestamp: string;
  wordsUpdated: any[];
  userProgressUpdated: any[];
  collectionsUpdated: any[];
}

export interface SyncPushPayload {
  lastSyncTimestamp?: string;
  offlineReviews: {
    clientUuid: string;
    wordId: string;
    rating: SrsRating;
    reviewedAt: string;
    responseTimeMs?: number;
  }[];
}

export interface SyncPushResponse {
  success: boolean;
  syncedCount: number;
  conflictsResolved: number;
  serverTimestamp: string;
}
