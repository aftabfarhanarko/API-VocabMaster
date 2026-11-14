import { AccentType } from "@vocabmaster/shared";
export declare class UpdateUserDto {
    fullName?: string;
    avatarUrl?: string;
    dailyWordGoal?: number;
    preferredAccent?: AccentType;
    targetLanguage?: string;
    themePreference?: string;
    soundEnabled?: boolean;
    autoPlayAudio?: boolean;
    reminderEnabled?: boolean;
    reminderTime?: string;
}
