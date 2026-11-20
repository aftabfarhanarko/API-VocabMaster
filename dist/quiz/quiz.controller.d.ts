import { QuizService } from './quiz.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { AnswerQuizDto } from './dto/answer-quiz.dto';
import { AuthenticatedUser } from '../auth/current-user.decorator';
export declare class QuizController {
    private readonly quizService;
    constructor(quizService: QuizService);
    generateQuiz(user: AuthenticatedUser, dto: GenerateQuizDto): Promise<{
        quizId: `${string}-${string}-${string}-${string}-${string}`;
        questions: any[];
    }>;
    submitQuiz(user: AuthenticatedUser, dto: SubmitQuizDto): Promise<{
        id: string;
        quizType: import("../shared").QuizType;
        totalQuestions: number;
        correctCount: number;
        scorePercentage: number;
        durationSeconds: number;
        pointsEarned: number;
        completedAt: string;
    }>;
    answer(user: AuthenticatedUser, dto: AnswerQuizDto): Promise<{
        questionId: string;
        isCorrect: boolean;
        correctAnswer: string;
        explanation: string;
    }>;
    getHistory(user: AuthenticatedUser): Promise<{
        userId: string;
        id: string;
        quizType: import(".prisma/client").$Enums.QuizType;
        durationSeconds: number;
        totalQuestions: number;
        correctCount: number;
        scorePercentage: number;
        completedAt: Date;
        details: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
}
