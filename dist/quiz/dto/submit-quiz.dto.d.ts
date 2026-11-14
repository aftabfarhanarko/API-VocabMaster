import { QuizType } from "@vocabmaster/shared";
declare class QuizAnswerItemDto {
    questionId: string;
    wordId: string;
    userAnswer: string;
    isCorrect: boolean;
    responseTimeMs?: number;
}
export declare class SubmitQuizDto {
    quizType: QuizType;
    durationSeconds: number;
    answers: QuizAnswerItemDto[];
}
export {};
