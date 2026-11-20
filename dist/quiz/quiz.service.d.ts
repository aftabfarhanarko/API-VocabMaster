import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizType } from "@vocabmaster/shared";
import { RedisService } from '../redis/redis.service';
export declare class QuizService {
    private readonly prisma;
    private readonly userService;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, userService: UserService, redis: RedisService);
    generateQuiz(dto: GenerateQuizDto, userId: string): Promise<{
        quizId: `${string}-${string}-${string}-${string}-${string}`;
        questions: any[];
    }>;
    answerQuiz(userId: string, quizId: string, questionId: string, userAnswer: string): Promise<{
        questionId: string;
        isCorrect: boolean;
        correctAnswer: string;
        explanation: string;
    }>;
    submitQuiz(userId: string, dto: SubmitQuizDto): Promise<{
        id: string;
        quizType: QuizType;
        totalQuestions: number;
        correctCount: number;
        scorePercentage: number;
        durationSeconds: number;
        pointsEarned: number;
        completedAt: string;
    }>;
    private getPendingQuiz;
    private storePendingQuiz;
    private answersMatch;
    getQuizHistory(userId: string): Promise<{
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
