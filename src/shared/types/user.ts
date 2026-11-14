export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum AccentType {
  US = 'US',
  UK = 'UK',
}

export interface UserProfile {
  id: string;
  supabaseId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
  dailyWordGoal: number;
  preferredAccent: AccentType;
  targetLanguage: string;
  themePreference: string;
  soundEnabled: boolean;
  autoPlayAudio: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileDto {
  fullName?: string;
  avatarUrl?: string;
  dailyWordGoal?: number;
  preferredAccent?: AccentType;
  targetLanguage?: string;
  themePreference?: 'light' | 'dark' | 'system';
  soundEnabled?: boolean;
  autoPlayAudio?: boolean;
  reminderEnabled?: boolean;
  reminderTime?: string;
}
