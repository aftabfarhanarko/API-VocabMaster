import { SrsState, VocabularyWord } from './vocabulary';

export enum SrsRating {
  AGAIN = 1, // Complete blackout / failed to recall
  HARD = 2,  // Correct response after long hesitation
  GOOD = 3,  // Correct response with slight hesitation
  EASY = 4,  // Immediate, perfect recall
}

export interface SrsCalculationInput {
  rating: SrsRating;
  previousRepetition: number;
  previousInterval: number;
  previousEasinessFactor: number;
}

export interface SrsCalculationResult {
  repetition: number;
  interval: number; // Days until next review
  easinessFactor: number;
  state: SrsState;
  nextReviewAt: Date;
}

export interface SubmitReviewDto {
  wordId: string;
  rating: SrsRating;
  responseTimeMs?: number;
}

export interface SrsQueueItem {
  id: string;
  word: VocabularyWord;
  state: SrsState;
  interval: number;
  repetition: number;
  easinessFactor: number;
  nextReviewAt: string;
  dueReason: 'new' | 'learning' | 'review';
}

export interface SrsQueueSummary {
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
}
