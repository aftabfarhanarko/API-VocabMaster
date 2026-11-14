import { Test, TestingModule } from '@nestjs/testing';
import { VocabularyService } from './vocabulary.service';
import { PrismaService } from '../prisma/prisma.service';
import { DictionaryService } from '../dictionary/dictionary.service';

describe('VocabularyService (Search, Filter, Pagination)', () => {
  let service: VocabularyService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabularyService,
        {
          provide: PrismaService,
          useValue: {
            vocabularyWord: {
              count: jest.fn().mockResolvedValue(1),
              findMany: jest.fn().mockResolvedValue([
                {
                  id: 'word-1',
                  word: 'serendipity',
                  normalizedWord: 'serendipity',
                  banglaMeaning: 'দৈবক্রমে শুভ প্রাপ্তি',
                  englishMeaning: 'Finding good things by chance',
                  cefrLevel: 'C2',
                  category: 'IELTS & GRE Master',
                  partOfSpeech: 'NOUN',
                  examples: [],
                  userProgress: [],
                  notes: [],
                },
              ]),
              findFirst: jest.fn(),
              create: jest.fn(),
              groupBy: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: DictionaryService,
          useValue: {
            lookupWord: jest.fn().mockResolvedValue(null),
            lookupFreeDict: jest.fn().mockResolvedValue(null),
            getRawEntries: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<VocabularyService>(VocabularyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return paginated vocabulary list', async () => {
    const res = await service.findWords('user-123', { page: 1, limit: 10 });
    expect(res).toBeDefined();
    expect(res.data).toBeDefined();
    expect(res.meta).toBeDefined();
    expect(res.meta.page).toBe(1);
  });

  it('should get categories list with word counts', async () => {
    const categories = await service.getCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].category).toBeDefined();
  });
});
