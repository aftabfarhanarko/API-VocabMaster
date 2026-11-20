"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QuizService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const user_service_1 = require("../user/user.service");
const shared_1 = require("@vocabmaster/shared");
const redis_service_1 = require("../redis/redis.service");
let QuizService = QuizService_1 = class QuizService {
    prisma;
    userService;
    redis;
    logger = new common_1.Logger(QuizService_1.name);
    constructor(prisma, userService, redis) {
        this.prisma = prisma;
        this.userService = userService;
        this.redis = redis;
    }
    async generateQuiz(dto, userId) {
        const count = dto.questionCount || 10;
        const where = {};
        if (dto.cefrLevel)
            where.cefrLevel = dto.cefrLevel;
        if (dto.category)
            where.category = dto.category;
        if (dto.collectionId) {
            const ownedCollection = await this.prisma.collection.findFirst({
                where: { id: dto.collectionId, userId },
                select: { id: true },
            });
            if (!ownedCollection)
                throw new common_1.BadRequestException('Collection not found.');
            where.collectionItems = {
                some: { collectionId: dto.collectionId },
            };
        }
        let pool = await this.prisma.vocabularyWord.findMany({
            where,
            take: 120,
            include: { examples: true },
        });
        if (pool.length === 0) {
            pool = await this.prisma.vocabularyWord.findMany({
                take: 120,
                include: { examples: true },
            });
        }
        if (dto.quizType === shared_1.QuizType.AUDIO_LISTENING) {
            pool = pool.filter((word) => Boolean(word.audioUsUrl || word.audioUkUrl));
            if (pool.length === 0) {
                throw new common_1.BadRequestException('Audio questions are unavailable for the selected vocabulary.');
            }
        }
        if (pool.length < count && pool.length === 0) {
            throw new common_1.BadRequestException('Not enough vocabulary words in database to generate a quiz.');
        }
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        const questions = [];
        const quizId = (0, crypto_1.randomUUID)();
        const answerKey = {};
        if (dto.quizType === shared_1.QuizType.MATCHING_PAIRS) {
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
                type: shared_1.QuizType.MATCHING_PAIRS,
                prompt: 'Match each English word with its correct Bangla meaning:',
                matchingWords: pairSlice.map((w) => ({ id: w.id, word: w.word })),
                matchingMeanings: pairSlice.map((w) => w.banglaMeaning).sort(() => Math.random() - 0.5),
            };
            const pending = {
                userId, quizType: dto.quizType, answers: answerKey, answered: {}, totalQuestions: pairCount,
            };
            await this.storePendingQuiz(quizId, pending);
            return { quizId, questions: [safeQuestion] };
        }
        for (let i = 0; i < selected.length; i++) {
            const target = selected[i];
            const qId = `q-${i + 1}-${quizId}`;
            if (dto.quizType === shared_1.QuizType.MULTIPLE_CHOICE) {
                const otherPool = pool.filter((w) => w.word !== target.word);
                const shuffledOthers = [...otherPool].sort(() => 0.5 - Math.random());
                const distractors = shuffledOthers.slice(0, 3);
                const options = [
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
                    type: shared_1.QuizType.MULTIPLE_CHOICE,
                    wordId: target.id,
                    targetWord: target.word,
                    prompt: `What is the accurate Bangla meaning of "${target.word}"?`,
                    phonetic: target.phoneticUs,
                    partOfSpeech: target.partOfSpeech,
                    cefrLevel: target.cefrLevel,
                    options,
                });
            }
            else if (dto.quizType === shared_1.QuizType.AUDIO_LISTENING) {
                const otherPool = pool.filter((w) => w.word !== target.word);
                const shuffledOthers = [...otherPool].sort(() => 0.5 - Math.random());
                const distractors = shuffledOthers.slice(0, 3);
                const options = [
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
                    type: shared_1.QuizType.AUDIO_LISTENING,
                    wordId: target.id,
                    prompt: 'Listen to the audio pronunciation carefully. Which word is being spoken?',
                    audioUrl: target.audioUsUrl || target.audioUkUrl,
                    phonetic: target.phoneticUs,
                    partOfSpeech: target.partOfSpeech,
                    cefrLevel: target.cefrLevel,
                    options,
                    hint: undefined,
                });
            }
            else if (dto.quizType === shared_1.QuizType.FILL_IN_BLANK) {
                let sentence = target.examples?.[0]?.sentenceEn || '';
                if (sentence && sentence.toLowerCase().includes(target.word.toLowerCase())) {
                    sentence = sentence.replace(new RegExp(target.word, 'gi'), '_______');
                }
                else {
                    sentence = `The word meaning "${target.banglaMeaning}" is: _______`;
                }
                answerKey[qId] = { wordId: target.id, answer: target.word, explanation: target.englishMeaning };
                questions.push({
                    id: qId,
                    type: shared_1.QuizType.FILL_IN_BLANK,
                    wordId: target.id,
                    prompt: sentence,
                    phonetic: target.phoneticUs,
                    partOfSpeech: target.partOfSpeech,
                    cefrLevel: target.cefrLevel,
                    hint: `First letter: "${target.word[0].toUpperCase()}", meaning: ${target.banglaMeaning}`,
                });
            }
        }
        const safeQuestions = questions.map((question) => {
            const { correctAnswer: _correctAnswer, wordId: _wordId, ...safeQuestion } = question;
            if (safeQuestion.options) {
                safeQuestion.options = safeQuestion.options.map(({ isCorrect: _isCorrect, ...option }, index) => ({
                    id: `option-${index + 1}`,
                    label: option.label,
                }));
            }
            return safeQuestion;
        });
        const pending = {
            userId, quizType: dto.quizType, answers: answerKey, answered: {}, totalQuestions: safeQuestions.length,
        };
        await this.storePendingQuiz(quizId, pending);
        return { quizId, questions: safeQuestions };
    }
    async answerQuiz(userId, quizId, questionId, userAnswer) {
        const pending = await this.getPendingQuiz(userId, quizId);
        const key = pending.answers[questionId];
        if (!key)
            throw new common_1.NotFoundException('Question not found in this quiz.');
        if (Object.prototype.hasOwnProperty.call(pending.answered, questionId)) {
            throw new common_1.ConflictException('This question has already been answered.');
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
    async submitQuiz(userId, dto) {
        const pending = await this.getPendingQuiz(userId, dto.quizId);
        if (pending.quizType !== dto.quizType)
            throw new common_1.BadRequestException('Quiz type does not match this session.');
        const answerByQuestion = new Map(dto.answers.map((answer) => [answer.questionId, answer]));
        if (answerByQuestion.size !== dto.answers.length)
            throw new common_1.BadRequestException('Duplicate question answers are not allowed.');
        if (dto.answers.some((answer) => !pending.answers[answer.questionId])) {
            throw new common_1.BadRequestException('One or more answers do not belong to this quiz.');
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
        if (totalQuestions === 0)
            throw new common_1.BadRequestException('Quiz has no questions.');
        const correctCount = evaluatedAnswers.filter((answer) => answer.isCorrect).length;
        const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const pointsEarned = correctCount * 20 + (scorePercentage === 100 ? 50 : 0);
        const session = await this.prisma.quizSession.create({
            data: {
                userId,
                quizType: dto.quizType,
                totalQuestions,
                correctCount,
                scorePercentage,
                durationSeconds: dto.durationSeconds,
                details: evaluatedAnswers,
            },
        });
        await this.redis.delete(`vocab:quiz:${dto.quizId}`);
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
    async getPendingQuiz(userId, quizId) {
        const serialized = await this.redis.get(`vocab:quiz:${quizId}`);
        if (!serialized)
            throw new common_1.NotFoundException('Quiz session expired or not found. Generate a new quiz.');
        const pending = JSON.parse(serialized);
        if (pending.userId !== userId)
            throw new common_1.NotFoundException('Quiz session not found.');
        return pending;
    }
    async storePendingQuiz(quizId, pending) {
        const stored = await this.redis.set(`vocab:quiz:${quizId}`, JSON.stringify(pending), 60 * 60);
        if (!stored && process.env.NODE_ENV === 'production') {
            throw new common_1.ServiceUnavailableException('Quiz service is temporarily unavailable. Please retry.');
        }
    }
    answersMatch(expected, provided) {
        return expected.trim().normalize('NFKC').toLocaleLowerCase() ===
            provided.trim().normalize('NFKC').toLocaleLowerCase();
    }
    async getQuizHistory(userId) {
        return await this.prisma.quizSession.findMany({
            where: { userId },
            orderBy: { completedAt: 'desc' },
            take: 20,
        });
    }
};
exports.QuizService = QuizService;
exports.QuizService = QuizService = QuizService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_service_1.UserService,
        redis_service_1.RedisService])
], QuizService);
//# sourceMappingURL=quiz.service.js.map