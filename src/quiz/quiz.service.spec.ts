import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { QuizType } from '@vocabmaster/shared';

describe('QuizService (Dynamic Generation & Scoring)', () => {
  let service: QuizService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: PrismaService,
          useValue: {
            vocabularyWord: {
              findMany: jest.fn().mockResolvedValue([
                {
                  id: 'word-1',
                  word: 'resilient',
                  banglaMeaning: 'সহনশীল',
                  englishMeaning: 'Able to recover quickly',
                  phoneticUs: '/rɪˈzɪl.jənt/',
                  partOfSpeech: 'ADJECTIVE',
                  cefrLevel: 'B2',
                  examples: [{ sentenceEn: 'She is resilient.' }],
                },
                {
                  id: 'word-2',
                  word: 'diligent',
                  banglaMeaning: 'পরিশ্রমী',
                  englishMeaning: 'Showing steady effort',
                  phoneticUs: '/ˈdɪl.ɪ.dʒənt/',
                  partOfSpeech: 'ADJECTIVE',
                  cefrLevel: 'B2',
                  examples: [],
                },
              ]),
            },
            quizSession: {
              create: jest.fn().mockImplementation((args) => ({
                id: 'session-123',
                completedAt: new Date(),
                ...args.data,
              })),
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: UserService,
          useValue: {
            recordActivity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate multiple choice quiz questions', async () => {
    const questions = await service.generateQuiz({
      quizType: QuizType.MULTIPLE_CHOICE,
      questionCount: 5,
    });

    expect(questions).toBeDefined();
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].options).toBeDefined();
    expect(questions[0].options!.length).toBeGreaterThanOrEqual(2);
  });

  it('should compute scores and award XP points on submitQuiz', async () => {
    const res = await service.submitQuiz('user-123', {
      quizType: QuizType.MULTIPLE_CHOICE,
      durationSeconds: 45,
      answers: [
        {
          questionId: 'q-1',
          wordId: 'word-1',
          userAnswer: 'সহনশীল',
          isCorrect: true,
        },
        {
          questionId: 'q-2',
          wordId: 'word-2',
          userAnswer: 'ভুল উত্তর',
          isCorrect: false,
        },
      ],
    });

    expect(res.totalQuestions).toBe(2);
    expect(res.correctCount).toBe(1);
    expect(res.scorePercentage).toBe(50);
    expect(res.pointsEarned).toBe(20);
  });
});
