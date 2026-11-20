import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { QuizType } from '@vocabmaster/shared';
import { RedisService } from '../redis/redis.service';

describe('QuizService (Dynamic Generation & Scoring)', () => {
  let service: QuizService;
  let quizStore: Map<string, string>;

  beforeEach(async () => {
    quizStore = new Map();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: PrismaService,
          useValue: {
            vocabularyWord: {
              findMany: jest.fn().mockImplementation(({ select }) => select
                ? [
                    { id: 'word-1', word: 'resilient', banglaMeaning: 'সহনশীল' },
                    { id: 'word-2', word: 'diligent', banglaMeaning: 'পরিশ্রমী' },
                  ]
                : [
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
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(async (key: string, value: string) => { quizStore.set(key, value); return true; }),
            get: jest.fn(async (key: string) => quizStore.get(key) || null),
            delete: jest.fn(async (key: string) => { quizStore.delete(key); }),
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
    const result = await service.generateQuiz({
      quizType: QuizType.MULTIPLE_CHOICE,
      questionCount: 5,
    }, 'user-123');
    const questions = result.questions as any[];

    expect(questions).toBeDefined();
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].options).toBeDefined();
    expect(questions[0].options!.length).toBeGreaterThanOrEqual(2);
    expect(questions[0].correctAnswer).toBeUndefined();
    expect(questions[0].options!.every((option: any) => option.isCorrect === undefined)).toBe(true);
  });

  it('should compute scores and award XP points on submitQuiz', async () => {
    const generated = await service.generateQuiz({
      quizType: QuizType.MULTIPLE_CHOICE,
      questionCount: 5,
    }, 'user-123');
    const questions = generated.questions as any[];
    const answers = questions.map((question) => ({
      questionId: question.id,
      userAnswer: question.prompt.includes('resilient') ? 'সহনশীল' : 'ভুল উত্তর',
    }));
    const res = await service.submitQuiz('user-123', {
      quizId: generated.quizId,
      quizType: QuizType.MULTIPLE_CHOICE,
      durationSeconds: 45,
      answers,
    });

    expect(res.totalQuestions).toBe(questions.length);
    expect(res.correctCount).toBe(1);
    expect(res.scorePercentage).toBe(50);
    expect(res.pointsEarned).toBe(20);
  });

  it('grades only after an answer is submitted and blocks another user from the quiz', async () => {
    const generated = await service.generateQuiz({
      quizType: QuizType.MULTIPLE_CHOICE,
      questionCount: 5,
    }, 'user-123');
    const question = (generated.questions as any[]).find((item) => item.prompt.includes('resilient'));

    await expect(service.answerQuiz('other-user', generated.quizId, question.id, 'সহনশীল'))
      .rejects.toThrow('Quiz session not found.');
    await expect(service.answerQuiz('user-123', generated.quizId, question.id, 'সহনশীল'))
      .resolves.toMatchObject({ isCorrect: true, correctAnswer: 'সহনশীল' });
    await expect(service.answerQuiz('user-123', generated.quizId, question.id, 'wrong'))
      .rejects.toThrow('already been answered');
  });
});
