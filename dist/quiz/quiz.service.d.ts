import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizType, QuizQuestion } from "@vocabmaster/shared";
export declare class QuizService {
    private readonly prisma;
    private readonly userService;
    private readonly logger;
    constructor(prisma: PrismaService, userService: UserService);
    generateQuiz(dto: GenerateQuizDto): Promise<QuizQuestion[]>;
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
