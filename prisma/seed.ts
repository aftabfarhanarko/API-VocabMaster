import { PrismaClient, CefrLevel, PartOfSpeech } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function normalizePos(pos: string): PartOfSpeech {
  const p = (pos || '').toUpperCase();
  if (p === 'DETERMINER') return PartOfSpeech.ADJECTIVE;
  if (Object.values(PartOfSpeech).includes(p as any)) {
    return p as PartOfSpeech;
  }
  return PartOfSpeech.NOUN;
}

async function main() {
  console.log('--- Starting VocabMaster Database Seeding ---');

  const jsonPath = path.join(__dirname, 'data', 'words-3000.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Words dataset not found at: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const words = JSON.parse(raw);
  console.log(`Loaded ${words.length} vocabulary entries from words-3000.json.`);

  // 1. Create or update demo user
  const demoUser = await prisma.user.upsert({
    where: { supabaseId: 'demo-user-001' },
    update: {},
    create: {
      supabaseId: 'demo-user-001',
      email: 'demo@vocabmaster.app',
      fullName: 'Demo Vocab Master',
      dailyWordGoal: 10,
      preferredAccent: 'US',
      targetLanguage: 'bn',
      themePreference: 'system',
      soundEnabled: true,
      currentStreak: 5,
      longestStreak: 12,
      lastActiveDate: new Date(),
      totalPoints: 350,
    },
  });
  console.log(`Demo user ready: ${demoUser.email} (${demoUser.id})`);

  // 2. Create default collection for demo user
  const defaultCollection = await prisma.collection.upsert({
    where: {
      userId_name: {
        userId: demoUser.id,
        name: 'Essential Daily Vocabulary',
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      name: 'Essential Daily Vocabulary',
      description: 'Foundational English words with Bangla meanings for everyday conversations.',
      color: '#4F46E5',
      icon: 'bookmark',
    },
  });

  // 3. Fast Bulk Insert in batches of 500 using createMany
  const BATCH_SIZE = 500;
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const chunk = words.slice(i, i + BATCH_SIZE);
    const wordsData = chunk.map((w: any) => ({
      word: w.word,
      normalizedWord: w.normalizedWord,
      partOfSpeech: normalizePos(w.partOfSpeech),
      cefrLevel: (w.cefrLevel || 'B1') as CefrLevel,
      category: w.category || 'General Vocabulary',
      englishMeaning: w.englishMeaning,
      banglaMeaning: w.banglaMeaning,
      phoneticUs: w.phoneticUs,
      phoneticUk: w.phoneticUk,
      synonyms: w.synonyms || [],
      antonyms: w.antonyms || [],
      frequencyScore: w.frequencyScore || 50,
      isSystemWord: true,
    }));

    await prisma.vocabularyWord.createMany({
      data: wordsData,
      skipDuplicates: true,
    });
    console.log(`Bulk inserted words ${Math.min(i + BATCH_SIZE, words.length)}/${words.length}...`);
  }

  // 4. Attach examples for all words in database
  const allDbWords = await prisma.vocabularyWord.findMany({
    select: { id: true, normalizedWord: true },
  });
  const wordMap = new Map(allDbWords.map((w) => [w.normalizedWord, w.id]));

  // Check how many examples already exist
  const existingExamplesCount = await prisma.wordExample.count();
  if (existingExamplesCount < words.length) {
    const examplesData: any[] = [];
    for (const w of words) {
      const wordId = wordMap.get(w.normalizedWord);
      if (wordId && Array.isArray(w.examples)) {
        for (const ex of w.examples) {
          if (ex.sentenceEn && ex.sentenceBn) {
            examplesData.push({
              wordId,
              sentenceEn: ex.sentenceEn,
              sentenceBn: ex.sentenceBn,
            });
          }
        }
      }
    }

    console.log(`Inserting ${examplesData.length} example sentences in batches...`);
    for (let i = 0; i < examplesData.length; i += 1000) {
      const exChunk = examplesData.slice(i, i + 1000);
      await prisma.wordExample.createMany({
        data: exChunk,
        skipDuplicates: true,
      });
    }
  }

  // 5. Ensure Demo user has 15 words in collection and SRS progress
  const sampleWords = allDbWords.slice(0, 15);
  for (let i = 0; i < sampleWords.length; i++) {
    const sw = sampleWords[i];
    await prisma.collectionItem.upsert({
      where: {
        collectionId_wordId: {
          collectionId: defaultCollection.id,
          wordId: sw.id,
        },
      },
      update: {},
      create: {
        collectionId: defaultCollection.id,
        wordId: sw.id,
      },
    });

    await prisma.userWordProgress.upsert({
      where: {
        userId_wordId: {
          userId: demoUser.id,
          wordId: sw.id,
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        wordId: sw.id,
        state: i < 5 ? 'MASTERED' : i < 10 ? 'LEARNING' : 'NEW',
        repetition: i < 5 ? 3 : 1,
        interval: i < 5 ? 6 : 1,
        easinessFactor: 2.5,
        nextReviewAt: new Date(),
      },
    });
  }

  const finalWordCount = await prisma.vocabularyWord.count();
  const finalExampleCount = await prisma.wordExample.count();
  console.log(`--- Finished Seeding! Total Words in DB: ${finalWordCount}, Examples: ${finalExampleCount} ---`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
