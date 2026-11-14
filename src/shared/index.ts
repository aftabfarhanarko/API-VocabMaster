export * from './types/user';
export * from './types/vocabulary';
export * from './types/srs';
export * from './types/quiz';
export * from './types/sync';

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const VOCABULARY_CATEGORIES = [
  'Daily Life & Essentials',
  'Academic & Education',
  'Business & Career',
  'Science & Technology',
  'Travel, Culture & Food',
  'Health & Environment',
  'Emotions & Personality',
  'IELTS & GRE Master',
  'Idioms & Phrasal Verbs',
] as const;

export const SM2_CONFIG = {
  MIN_EASINESS_FACTOR: 1.3,
  INITIAL_EASINESS_FACTOR: 2.5,
  FIRST_INTERVAL_DAYS: 1,
  SECOND_INTERVAL_DAYS: 6,
  MASTERED_REPETITION_THRESHOLD: 5,
};
