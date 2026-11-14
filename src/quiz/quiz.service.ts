import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizType, QuizQuestion, QuizOption } from '@vocabmaster/shared';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService
  ) {}

  async generateQuiz(dto: GenerateQuizDto): Promise<QuizQuestion[]> {
    const count = dto.questionCount || 10;
    const where: any = {};
    if (dto.cefrLevel) where.cefrLevel = dto.cefrLevel;
    if (dto.category) where.category = dto.category;

    if (dto.collectionId) {
      where.collectionItems = {
        some: { collectionId: dto.collectionId },
      };
    }

    // Query candidates directly from Neon PostgreSQL
    let pool = await this.prisma.vocabularyWord.findMany({
      where,
      take: 120,
      include: { examples: true },
    });

    if (pool.length === 0) {
      // Fallback query across all words in database
      pool = await this.prisma.vocabularyWord.findMany({
        take: 120,
        include: { examples: true },
      });
    }

    if (pool.length < count && pool.length === 0) {
      throw new BadRequestException('Not enough vocabulary words in database to generate a quiz.');
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    const questions: QuizQuestion[] = [];

    if (dto.quizType === QuizType.MATCHING_PAIRS) {
      const pairCount = Math.min(6, selected.length);
      const pairSlice = selected.slice(0, pairCount);
      questions.push({
        id: `quiz-matching-${Date.now()}`,
        type: QuizType.MATCHING_PAIRS,
        wordId: 'matching-set',
        targetWord: 'Matching Session',
        prompt: 'Match each English word with its correct Bangla meaning:',
        correctAnswer: 'All matched',
        matchingPairs: pairSlice.map((w) => ({
          word: w.word,
          meaning: w.banglaMeaning,
        })),
      });
      return questions;
    }

    for (let i = 0; i < selected.length; i++) {
      const target = selected[i];
      const qId = `q-${i + 1}-${Date.now()}`;

      if (dto.quizType === QuizType.MULTIPLE_CHOICE) {
        const otherPool = pool.filter((w) => w.word !== target.word);
        const shuffledOthers = [...otherPool].sort(() => 0.5 - Math.random());
        const distractors = shuffledOthers.slice(0, 3);

        const options: QuizOption[] = [
          { id: 'opt-correct', label: target.banglaMeaning, isCorrect: true },
          ...distractors.map((d, dIdx) => ({
            id: `opt-${dIdx}`,
            label: d.banglaMeaning,
            isCorrect: false,
          })),
        ].sort(() => 0.5 - Math.random());

        questions.push({
          id: qId,
          type: QuizType.MULTIPLE_CHOICE,
          wordId: target.id,
          targetWord: target.word,
          prompt: `What is the accurate Bangla meaning of "${target.word}"?`,
          phonetic: target.phoneticUs,
          partOfSpeech: target.partOfSpeech as any,
          cefrLevel: target.cefrLevel as any,
          options,
          correctAnswer: target.banglaMeaning,
        });
      } else if (dto.quizType === QuizType.AUDIO_LISTENING) {
        const otherPool = pool.filter((w) => w.word !== target.word);
        const shuffledOthers = [...otherPool].sort(() => 0.5 - Math.random());
        const distractors = shuffledOthers.slice(0, 3);

        const options: QuizOption[] = [
          { id: 'opt-correct', label: target.word, isCorrect: true },
          ...distractors.map((d, dIdx) => ({
            id: `opt-${dIdx}`,
            label: d.word,
            isCorrect: false,
          })),
        ].sort(() => 0.5 - Math.random());

        questions.push({
          id: qId,
          type: QuizType.AUDIO_LISTENING,
          wordId: target.id,
          targetWord: target.word,
          prompt: 'Listen to the audio pronunciation carefully. Which word is being spoken?',
          phonetic: target.phoneticUs,
          partOfSpeech: target.partOfSpeech as any,
          cefrLevel: target.cefrLevel as any,
          options,
          correctAnswer: target.word,
          hint: target.banglaMeaning,
        });
      } else if (dto.quizType === QuizType.FILL_IN_BLANK) {
        let sentence = target.examples?.[0]?.sentenceEn || '';
        if (sentence && sentence.toLowerCase().includes(target.word.toLowerCase())) {
          sentence = sentence.replace(new RegExp(target.word, 'gi'), '_______');
        } else {
          sentence = `The word meaning "${target.banglaMeaning}" is: _______`;
        }

        questions.push({
          id: qId,
          type: QuizType.FILL_IN_BLANK,
          wordId: target.id,
          targetWord: target.word,
          prompt: sentence,
          phonetic: target.phoneticUs,
          partOfSpeech: target.partOfSpeech as any,
          cefrLevel: target.cefrLevel as any,
          correctAnswer: target.word,
          hint: `First letter: "${target.word[0].toUpperCase()}", meaning: ${target.banglaMeaning}`,
        });
      }
    }

    return questions;
  }

  async submitQuiz(userId: string, dto: SubmitQuizDto) {
    const totalQuestions = dto.answers.length;
    const correctCount = dto.answers.filter((a) => a.isCorrect).length;
    const scorePercentage =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const pointsEarned = correctCount * 20 + (scorePercentage === 100 ? 50 : 0);

    // Save session in Neon PostgreSQL database
    const session = await this.prisma.quizSession.create({
      data: {
        userId,
        quizType: dto.quizType,
        totalQuestions,
        correctCount,
        scorePercentage,
        durationSeconds: dto.durationSeconds,
        details: dto.answers as any,
      },
    });

    // Update user streak & activity in database
    await this.userService.recordActivity(userId, {
      quizzesTaken: 1,
      timeSpentSec: dto.durationSeconds,
    });

    return {
      id: session.id,
      quizType: dto.quizType,
      totalQuestions,
      correctCount,
      scorePercentage,
      durationSeconds: dto.durationSeconds,
      pointsEarned,
      completedAt: session.completedAt.toISOString(),
    };
  }

  async getQuizHistory(userId: string) {
    return await this.prisma.quizSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });
  }
}
