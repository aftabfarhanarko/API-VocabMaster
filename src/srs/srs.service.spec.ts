import { Test, TestingModule } from '@nestjs/testing';
import { SrsService } from './srs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { SrsRating, SrsState, SM2_CONFIG } from '@vocabmaster/shared';

describe('SrsService (SuperMemo-2 Algorithm)', () => {
  let service: SrsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SrsService,
        {
          provide: PrismaService,
          useValue: {
            userWordProgress: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn().mockResolvedValue(10),
            },
            vocabularyWord: {
              findMany: jest.fn(),
            },
            reviewHistory: {
              create: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
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

    service = module.get<SrsService>(SrsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateNextReview SM-2 algorithm', () => {
    it('should handle AGAIN rating by resetting repetition to 0 and interval to 1 day', () => {
      const result = service.calculateNextReview(SrsRating.AGAIN, 3, 15, 2.5);
      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(SM2_CONFIG.FIRST_INTERVAL_DAYS);
      expect(result.easinessFactor).toBe(2.3); // 2.5 - 0.2
      expect(result.state).toBe(SrsState.LEARNING);
    });

    it('should never lower Easiness Factor below MIN_EASINESS_FACTOR (1.3)', () => {
      const result = service.calculateNextReview(SrsRating.AGAIN, 0, 1, 1.35);
      expect(result.easinessFactor).toBe(1.3);
    });

    it('should calculate first successful review (GOOD) as 1 day', () => {
      const result = service.calculateNextReview(SrsRating.GOOD, 0, 0, 2.5);
      expect(result.repetition).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.easinessFactor).toBe(2.5);
    });

    it('should calculate second successful review (GOOD) as 6 days', () => {
      const result = service.calculateNextReview(SrsRating.GOOD, 1, 1, 2.5);
      expect(result.repetition).toBe(2);
      expect(result.interval).toBe(6);
      expect(result.easinessFactor).toBe(2.5);
    });

    it('should calculate subsequent reviews (GOOD) by multiplying interval by EF', () => {
      const result = service.calculateNextReview(SrsRating.GOOD, 2, 6, 2.5);
      expect(result.repetition).toBe(3);
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
    });

    it('should calculate EASY rating with bonus interval and increased EF', () => {
      const result = service.calculateNextReview(SrsRating.EASY, 0, 0, 2.5);
      expect(result.repetition).toBe(1);
      expect(result.interval).toBe(3);
      expect(result.easinessFactor).toBe(2.6); // 2.5 + 0.1
    });

    it('should mark card as MASTERED when repetition >= 5 and interval >= 21', () => {
      const result = service.calculateNextReview(SrsRating.GOOD, 4, 15, 2.5);
      expect(result.repetition).toBe(5);
      expect(result.interval).toBeGreaterThanOrEqual(21);
      expect(result.state).toBe(SrsState.MASTERED);
    });
  });
});
