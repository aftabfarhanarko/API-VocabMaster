import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DictionaryService } from '../dictionary/dictionary.service';
import { WordFilterDto } from './dto/word-filter.dto';
import { CreateCustomWordDto } from './dto/create-custom-word.dto';

@Injectable()
export class VocabularyService {
  private readonly logger = new Logger(VocabularyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dictionaryService: DictionaryService
  ) {}

  async findWords(userId: string, query: WordFilterDto) {
    const {
      search,
      cefrLevel,
      category,
      partOfSpeech,
      srsState,
      collectionId,
      page = 1,
      limit = 20,
      sortBy = 'frequencyScore',
      sortOrder = 'desc',
      source = 'database',
    } = query;

    // If caller explicitly requested live FreeDict API feed
    if (source === 'freedict') {
      return (await this.dictionaryService.listFreeDictWords(page, limit)) as any;
    }

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        { englishMeaning: { contains: search, mode: 'insensitive' } },
        { banglaMeaning: { contains: search } },
      ];
    }

    if (cefrLevel) where.cefrLevel = cefrLevel;
    if (category) where.category = category;
    if (partOfSpeech) where.partOfSpeech = partOfSpeech;

    if (collectionId) {
      where.collectionItems = {
        some: { collectionId },
      };
    }

    if (srsState) {
      where.userProgress = {
        some: {
          userId,
          state: srsState,
        },
      };
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [total, words] = await Promise.all([
      this.prisma.vocabularyWord.count({ where }),
      this.prisma.vocabularyWord.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          examples: true,
          userProgress: {
            where: { userId },
          },
          notes: {
            where: { userId },
          },
        },
      }),
    ]);

    return {
      data: words.map((w) => ({
        ...w,
        userProgress: w.userProgress?.[0] || null,
        note: w.notes?.[0] || null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getWordDetails(wordOrId: string, userId: string) {
    const normalized = wordOrId.trim().toLowerCase();

    // 1. Search database first
    const word = await this.prisma.vocabularyWord.findFirst({
      where: {
        OR: [{ id: wordOrId }, { normalizedWord: normalized }, { word: wordOrId }],
      },
      include: {
        examples: true,
        userProgress: {
          where: { userId },
        },
        notes: {
          where: { userId },
        },
      },
    });

    if (word) {
      return {
        ...word,
        userProgress: word.userProgress?.[0] || null,
        note: word.notes?.[0] || null,
      };
    }

    // 2. Fallback to external dictionary (FreeDict & OpenDictionary) if word is not yet in database
    const ext = await this.dictionaryService.lookupWord(normalized);
    if (ext) {
      const firstDef = ext.definitions?.[0];
      const primaryMeaning = firstDef?.definition || 'Dictionary definition';
      const rawExamples = (ext.definitions || [])
        .filter((d: any) => d.example)
        .map((d: any) => ({
          sentenceEn: d.example,
          sentenceBn: `"${d.example}" (উদাহরণ)`,
        }));

      const bnMeaning = ext.bengaliMeaning || primaryMeaning;
      const cefr = (ext.cefrLevel as any) || 'B1';

      // Persist newly discovered word to Neon PostgreSQL database
      const savedWord = await this.prisma.vocabularyWord.create({
        data: {
          word: ext.word,
          normalizedWord: normalized,
          partOfSpeech: (firstDef?.partOfSpeech as any) || 'NOUN',
          cefrLevel: cefr,
          category: 'General Vocabulary',
          englishMeaning: primaryMeaning,
          banglaMeaning: bnMeaning,
          phoneticUs: ext.phoneticUs,
          phoneticUk: ext.phoneticUk,
          audioUsUrl: ext.audioUsUrl,
          audioUkUrl: ext.audioUkUrl,
          synonyms: ext.synonyms || [],
          antonyms: ext.antonyms || [],
          isSystemWord: false,
          examples: {
            create: rawExamples.slice(0, 3),
          },
        },
        include: {
          examples: true,
        },
      });

      return {
        ...savedWord,
        userProgress: null,
        note: null,
        externalDictionary: ext,
      };
    }

    throw new NotFoundException(
      `Word '${wordOrId}' not found in vocabulary database or external dictionary.`
    );
  }

  async createCustomWord(userId: string, dto: CreateCustomWordDto) {
    const normalized = dto.word.trim().toLowerCase();

    // Check if word already exists for user
    const existing = await this.prisma.vocabularyWord.findFirst({
      where: {
        normalizedWord: normalized,
        createdById: userId,
      },
    });

    if (existing) {
      throw new BadRequestException(`Custom word '${dto.word}' already exists in your vocabulary.`);
    }

    return await this.prisma.vocabularyWord.create({
      data: {
        word: dto.word.trim(),
        normalizedWord: normalized,
        partOfSpeech: dto.partOfSpeech,
        cefrLevel: dto.cefrLevel || 'B1',
        category: dto.category || 'Custom Words',
        englishMeaning: dto.englishMeaning,
        banglaMeaning: dto.banglaMeaning,
        phoneticUs: dto.phoneticUs,
        phoneticUk: dto.phoneticUk,
        synonyms: dto.synonyms || [],
        antonyms: dto.antonyms || [],
        isSystemWord: false,
        createdById: userId,
        examples: {
          create: (dto.examples || []).map((ex) => ({
            sentenceEn: ex.sentenceEn,
            sentenceBn: ex.sentenceBn,
          })),
        },
      },
      include: {
        examples: true,
      },
    });
  }

  async getCategories() {
    const categories = [
      'Daily Life & Essentials',
      'Academic & Education',
      'Business & Career',
      'Science & Technology',
      'Travel, Culture & Food',
      'Health & Environment',
      'Emotions & Personality',
      'IELTS & GRE Master',
      'Idioms & Phrasal Verbs',
    ];

    const counts = await this.prisma.vocabularyWord.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    return categories.map((cat) => {
      const found = counts.find((c) => c.category === cat);
      return {
        category: cat,
        count: found ? found._count.id : 0,
      };
    });
  }

  async toggleBookmark(userId: string, wordOrId: string) {
    const word = await this.resolveWord(wordOrId);

    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_wordId: { userId, wordId: word.id },
      },
    });

    if (existing) {
      await this.prisma.bookmark.delete({
        where: { id: existing.id },
      });
      return {
        bookmarked: false,
        wordId: word.id,
        word: word.word,
        message: `Word '${word.word}' removed from your book list.`,
      };
    } else {
      const bookmark = await this.prisma.bookmark.create({
        data: {
          userId,
          wordId: word.id,
        },
      });
      return {
        bookmarked: true,
        wordId: word.id,
        word: word.word,
        bookmarkId: bookmark.id,
        message: `Word '${word.word}' saved to your book list!`,
      };
    }
  }

  async getBookmarkedWords(
    userId: string,
    query: { page?: number; limit?: number; search?: string; cefrLevel?: string }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.search || query.cefrLevel) {
      where.word = {};
      if (query.search) {
        where.word.OR = [
          { word: { contains: query.search, mode: 'insensitive' } },
          { englishMeaning: { contains: query.search, mode: 'insensitive' } },
          { banglaMeaning: { contains: query.search } },
        ];
      }
      if (query.cefrLevel) {
        where.word.cefrLevel = query.cefrLevel;
      }
    }

    const [total, bookmarks] = await Promise.all([
      this.prisma.bookmark.count({ where }),
      this.prisma.bookmark.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          word: {
            include: {
              examples: true,
              userProgress: { where: { userId } },
              notes: { where: { userId } },
            },
          },
        },
      }),
    ]);

    return {
      data: bookmarks.map((b) => ({
        bookmarkId: b.id,
        bookmarkedAt: b.createdAt.toISOString(),
        ...b.word,
        userProgress: b.word.userProgress?.[0] || null,
        note: b.word.notes?.[0] || null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async bulkBookmarkWords(userId: string, wordIdentifiers: string[]) {
    const normalizedList = wordIdentifiers.map((w) => w.trim().toLowerCase());

    const words = await this.prisma.vocabularyWord.findMany({
      where: {
        OR: [
          { id: { in: wordIdentifiers } },
          { normalizedWord: { in: normalizedList } },
        ],
      },
      select: { id: true, word: true },
    });

    if (words.length === 0) {
      return {
        savedCount: 0,
        requested: wordIdentifiers.length,
        message: 'No matching words found.',
      };
    }

    const data = words.map((w) => ({
      userId,
      wordId: w.id,
    }));

    const result = await this.prisma.bookmark.createMany({
      data,
      skipDuplicates: true,
    });

    return {
      savedCount: result.count,
      totalRequested: wordIdentifiers.length,
      words: words.map((w) => w.word),
      message: `Successfully saved ${result.count} word(s) to your book list.`,
    };
  }

  private async resolveWord(wordOrId: string) {
    const normalized = wordOrId.trim().toLowerCase();
    const word = await this.prisma.vocabularyWord.findFirst({
      where: {
        OR: [{ id: wordOrId }, { normalizedWord: normalized }, { word: wordOrId }],
      },
    });

    if (!word) {
      throw new NotFoundException(`Word '${wordOrId}' not found in vocabulary catalog.`);
    }

    return word;
  }
}
