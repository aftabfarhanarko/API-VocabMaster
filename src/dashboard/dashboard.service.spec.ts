import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService (User Dashboard & Analytics Engine)', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'user-001',
                fullName: 'Test Learner',
                email: 'test@vocabmaster.app',
                dailyWordGoal: 50,
                currentStreak: 5,
                longestStreak: 10,
                totalPoints: 250,
                preferredAccent: 'US',
              }),
            },
            vocabularyWord: {
              count: jest.fn().mockResolvedValue(3151),
              findMany: jest.fn().mockResolvedValue([]),
            },
            userWordProgress: {
              count: jest.fn().mockResolvedValue(45),
              findMany: jest.fn().mockResolvedValue([]),
            },
            bookmark: {
              count: jest.fn().mockResolvedValue(12),
              findMany: jest.fn().mockResolvedValue([]),
            },
            dailyActivityLog: {
              findUnique: jest.fn().mockResolvedValue({
                wordsReviewed: 20,
                wordsLearned: 10,
                goalReached: false,
              }),
              findMany: jest.fn().mockResolvedValue([]),
            },
            quizSession: {
              count: jest.fn().mockResolvedValue(8),
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compute comprehensive overview with daily goal 50', async () => {
    const overview = await service.getOverview('user-001');

    expect(overview).toBeDefined();
    expect(overview.user.fullName).toBe('Test Learner');
    expect(overview.dailyGoal.target).toBe(50);
    expect(overview.dailyGoal.completedToday).toBe(30);
    expect(overview.dailyGoal.remainingWords).toBe(20);
    expect(overview.dailyGoal.completionPercentage).toBe(60);
    expect(overview.kpis.totalCatalogWords).toBe(3151);
    expect(overview.kpis.bookmarksCount).toBe(12);
  });

  it('should generate a 3-session daily plan', async () => {
    const plan = await service.getDailyPlan('user-001');

    expect(plan).toBeDefined();
    expect(plan.dailyWordGoal).toBe(50);
    expect(plan.sessions).toHaveLength(3);
    expect(plan.sessions[0].title).toContain('Morning');
    expect(plan.sessions[1].title).toContain('Afternoon');
    expect(plan.sessions[2].title).toContain('Evening');
  });

  it('should return achievements list', async () => {
    const res = await service.getAchievements('user-001');

    expect(res).toBeDefined();
    expect(res.badges.length).toBeGreaterThan(5);
    expect(res.badges.find((b) => b.id === 'first_step')?.unlocked).toBe(true);
  });
});
