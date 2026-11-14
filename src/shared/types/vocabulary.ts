export enum CefrLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

export enum PartOfSpeech {
  NOUN = 'NOUN',
  VERB = 'VERB',
  ADJECTIVE = 'ADJECTIVE',
  ADVERB = 'ADVERB',
  PRONOUN = 'PRONOUN',
  PREPOSITION = 'PREPOSITION',
  CONJUNCTION = 'CONJUNCTION',
  INTERJECTION = 'INTERJECTION',
  PHRASE = 'PHRASE',
  IDIOM = 'IDIOM',
}

export enum SrsState {
  NEW = 'NEW',
  LEARNING = 'LEARNING',
  REVIEW = 'REVIEW',
  MASTERED = 'MASTERED',
}

export interface WordExample {
  id?: string;
  wordId?: string;
  sentenceEn: string;
  sentenceBn: string;
  source?: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  normalizedWord: string;
  phoneticUk?: string | null;
  phoneticUs?: string | null;
  audioUkUrl?: string | null;
  audioUsUrl?: string | null;
  partOfSpeech: PartOfSpeech;
  cefrLevel: CefrLevel;
  category: string;
  englishMeaning: string;
  banglaMeaning: string;
  englishContext?: string | null;
  banglaContext?: string | null;
  examples: WordExample[];
  synonyms: string[];
  antonyms: string[];
  frequencyScore: number;
  isSystemWord: boolean;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  userProgress?: UserWordProgress | null;
  note?: WordNote | null;
}

export interface UserWordProgress {
  id: string;
  userId: string;
  wordId: string;
  state: SrsState;
  easinessFactor: number;
  interval: number;
  repetition: number;
  lapses: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WordNote {
  id: string;
  userId: string;
  wordId: string;
  content: string;
  mnemonic?: string | null;
  personalExample?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WordFilterQuery {
  search?: string;
  cefrLevel?: CefrLevel;
  category?: string;
  partOfSpeech?: PartOfSpeech;
  srsState?: SrsState;
  collectionId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'word' | 'frequencyScore' | 'createdAt' | 'nextReviewAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreateCustomWordDto {
  word: string;
  partOfSpeech: PartOfSpeech;
  cefrLevel?: CefrLevel;
  category?: string;
  englishMeaning: string;
  banglaMeaning: string;
  phoneticUs?: string;
  phoneticUk?: string;
  englishContext?: string;
  banglaContext?: string;
  examples?: { sentenceEn: string; sentenceBn: string }[];
  synonyms?: string[];
  antonyms?: string[];
}
