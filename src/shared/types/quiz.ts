import { CefrLevel } from './vocabulary';

export enum QuizType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  AUDIO_LISTENING = 'AUDIO_LISTENING',
  MATCHING_PAIRS = 'MATCHING_PAIRS',
}

export interface QuizOption {
  id: string;
  label: string; // Meaning or word
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuizType;
  wordId: string;
  targetWord: string;
  prompt: string;
  audioUrl?: string | null;
  phonetic?: string | null;
  partOfSpeech?: string;
  cefrLevel?: CefrLevel;
  options?: QuizOption[];
  correctAnswer: string;
  hint?: string;
  matchingPairs?: { word: string; meaning: string }[];
}

export interface GenerateQuizDto {
  quizType: QuizType;
  questionCount?: number;
  cefrLevel?: CefrLevel;
  category?: string;
  collectionId?: string;
  onlyDueWords?: boolean;
}

export interface SubmitQuizDto {
  quizType: QuizType;
  durationSeconds: number;
  answers: {
    questionId: string;
    wordId: string;
    userAnswer: string;
    isCorrect: boolean;
    responseTimeMs?: number;
  }[];
}

export interface QuizSessionSummary {
  id: string;
  quizType: QuizType;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  durationSeconds: number;
  pointsEarned: number;
  completedAt: string;
}
