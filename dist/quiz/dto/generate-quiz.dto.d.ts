import { QuizType, CefrLevel } from '@vocabmaster/shared';
export declare class GenerateQuizDto {
    quizType: QuizType;
    questionCount?: number;
    cefrLevel?: CefrLevel;
    category?: string;
    collectionId?: string;
}
