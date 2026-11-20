import { QuizType } from "@vocabmaster/shared";
declare class QuizAnswerItemDto {
    questionId: string;
    wordId?: string;
    userAnswer: string;
    responseTimeMs?: number;
}
export declare class SubmitQuizDto {
    quizId: string;
    quizType: QuizType;
    durationSeconds: number;
    answers: QuizAnswerItemDto[];
}
export {};
