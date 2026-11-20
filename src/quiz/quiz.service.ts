import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizType, QuizOption } from '@vocabmaster/shared';
import { RedisService } from '../redis/redis.service';

interface QuizAnswerKey {
  wordId: string;
  answer: string;
  explanation: string;
}

interface PendingQuiz {
  userId: string;
  quizType: QuizType;
  answers: Record<string, QuizAnswerKey>;
  answered: Record<string, string>;
  totalQuestions: number;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly redis: RedisService,
  ) {}

  async generateQuiz(dto: GenerateQuizDto, userId: string) {
    const count = dto.questionCount || 10;
    const where: any = {};
    if (dto.cefrLevel) where.cefrLevel = dto.cefrLevel;
    if (dto.category) where.category = dto.category;

    if (dto.collectionId) {
      const ownedCollection = await this.prisma.collection.findFirst({
        where: { id: dto.collectionId, userId },
        select: { id: true },
      });
      if (!ownedCollection) throw new BadRequestException('Collection not found.');
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

    if (dto.quizType === QuizType.AUDIO_LISTENING) {
      pool = pool.filter((word) => Boolean(word.audioUsUrl || word.audioUkUrl));
      if (pool.length === 0) {
        throw new BadRequestException('Audio questions are unavailable for the selected vocabulary.');
      }
    }

    if (pool.length < count && pool.length === 0) {
      throw new BadRequestException('Not enough vocabulary words in database to generate a quiz.');
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    const questions: any[] = [];

    const quizId = randomUUID();
    const answerKey: Record<string, QuizAnswerKey> = {};

    if (dto.quizType === QuizType.MATCHING_PAIRS) {
      const pairCount = Math.min(6, selected.length);
      const pairSlice = selected.slice(0, pairCount);
      const questionId = `matching-${quizId}`;
      for (const word of pairSlice) {
        answerKey[`match-${word.id}`] = {
          wordId: word.id,
          answer: word.banglaMeaning,
          explanation: `${word.word}: ${word.englishMeaning}`,
        };
      }
      const safeQuestion = {
        id: questionId,
        type: QuizType.MATCHING_PAIRS,
        prompt: 'Match each English word with its correct Bangla meaning:',
        matchingWords: pairSlice.map((w) => ({ id: w.id, word: w.word })),
        matchingMeanings: pairSlice.map((w) => w.banglaMeaning).sort(() => Math.random() - 0.5),
      };
      const pending: PendingQuiz = {
        userId, quizType: dto.quizType, answers: answerKey, answered: {}, totalQuestions: pairCount,
      };
      await this.storePendingQuiz(quizId, pending);
      return { quizId, questions: [safeQuestion] };
    }

    for (let i = 0; i < selected.length; i++) {
      const target = selected[i];
      const qId = `q-${i + 1}-${quizId}`;

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

        answerKey[qId] = { wordId: target.id, answer: target.banglaMeaning, explanation: target.englishMeaning };
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

        answerKey[qId] = { wordId: target.id, answer: target.word, explanation: target.englishMeaning };
        questions.push({
          id: qId,
          type: QuizType.AUDIO_LISTENING,
          wordId: target.id,
          prompt: 'Listen to the audio pronunciation carefully. Which word is being spoken?',
          audioUrl: target.audioUsUrl || target.audioUkUrl,
          phonetic: target.phoneticUs,
          partOfSpeech: target.partOfSpeech as any,
          cefrLevel: target.cefrLevel as any,
          options,
          hint: undefined,
        });
      } else if (dto.quizType === QuizType.FILL_IN_BLANK) {
        let sentence = target.examples?.[0]?.sentenceEn || '';
        if (sentence && sentence.toLowerCase().includes(target.word.toLowerCase())) {
          sentence = sentence.replace(new RegExp(target.word, 'gi'), '_______');
        } else {
          sentence = `The word meaning "${target.banglaMeaning}" is: _______`;
        }

        answerKey[qId] = { wordId: target.id, answer: target.word, explanation: target.englishMeaning };
        questions.push({
          id: qId,
          type: QuizType.FILL_IN_BLANK,
          wordId: target.id,
          prompt: sentence,
          phonetic: target.phoneticUs,
          partOfSpeech: target.partOfSpeech as any,
          cefrLevel: target.cefrLevel as any,
          hint: `First letter: "${target.word[0].toUpperCase()}", meaning: ${target.banglaMeaning}`,
        });
      }
    }

    const safeQuestions = questions.map((question: any) => {
      const { correctAnswer: _correctAnswer, wordId: _wordId, ...safeQuestion } = question;
      if (safeQuestion.options) {
        safeQuestion.options = safeQuestion.options.map(({ isCorrect: _isCorrect, ...option }: any, index: number) => ({
          id: `option-${index + 1}`,
          label: option.label,
        }));
      }
      return safeQuestion;
    });
    const pending: PendingQuiz = {
      userId, quizType: dto.quizType, answers: answerKey, answered: {}, totalQuestions: safeQuestions.length,
    };
    await this.storePendingQuiz(quizId, pending);
    return { quizId, questions: safeQuestions };
  }

  async answerQuiz(userId: string, quizId: string, questionId: string, userAnswer: string) {
    const pending = await this.getPendingQuiz(userId, quizId);
    const key = pending.answers[questionId];
    if (!key) throw new NotFoundException('Question not found in this quiz.');
    if (Object.prototype.hasOwnProperty.call(pending.answered, questionId)) {
      throw new ConflictException('This question has already been answered.');
    }
    const correct = this.answersMatch(key.answer, userAnswer);
    if (correct || !questionId.startsWith('match-')) {
      pending.answered[questionId] = userAnswer;
      await this.storePendingQuiz(quizId, pending);
    }
    return {
      questionId,
      isCorrect: correct,
      correctAnswer: key.answer,
      explanation: key.explanation,
    };
  }

  async submitQuiz(userId: string, dto: SubmitQuizDto) {
    const pending = await this.getPendingQuiz(userId, dto.quizId);
    if (pending.quizType !== dto.quizType) throw new BadRequestException('Quiz type does not match this session.');
    const answerByQuestion = new Map(dto.answers.map((answer) => [answer.questionId, answer]));
    if (answerByQuestion.size !== dto.answers.length) throw new BadRequestException('Duplicate question answers are not allowed.');
    if (dto.answers.some((answer) => !pending.answers[answer.questionId])) {
      throw new BadRequestException('One or more answers do not belong to this quiz.');
    }
    const evaluatedAnswers = Object.entries(pending.answers).map(([questionId, key]) => {
      const submitted = answerByQuestion.get(questionId)?.userAnswer || pending.answered[questionId] || '';
      return {
        questionId,
        wordId: key.wordId,
        userAnswer: submitted,
        isCorrect: this.answersMatch(key.answer, submitted),
        correctAnswer: key.answer,
        explanation: key.explanation,
      };
    });
    const totalQuestions = pending.totalQuestions;
    if (totalQuestions === 0) throw new BadRequestException('Quiz has no questions.');
    const correctCount = evaluatedAnswers.filter((answer) => answer.isCorrect).length;
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
        details: evaluatedAnswers as any,
      },
    });
    await this.redis.delete(`vocab:quiz:${dto.quizId}`);

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

  private async getPendingQuiz(userId: string, quizId: string): Promise<PendingQuiz> {
    const serialized = await this.redis.get(`vocab:quiz:${quizId}`);
    if (!serialized) throw new NotFoundException('Quiz session expired or not found. Generate a new quiz.');
    const pending = JSON.parse(serialized) as PendingQuiz;
    if (pending.userId !== userId) throw new NotFoundException('Quiz session not found.');
    return pending;
  }

  private async storePendingQuiz(quizId: string, pending: PendingQuiz): Promise<void> {
    const stored = await this.redis.set(`vocab:quiz:${quizId}`, JSON.stringify(pending), 60 * 60);
    if (!stored && process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException('Quiz service is temporarily unavailable. Please retry.');
    }
  }

  private answersMatch(expected: string, provided: string): boolean {
    return expected.trim().normalize('NFKC').toLocaleLowerCase() ===
      provided.trim().normalize('NFKC').toLocaleLowerCase();
  }

  async getQuizHistory(userId: string) {
    return await this.prisma.quizSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });
  }
}
