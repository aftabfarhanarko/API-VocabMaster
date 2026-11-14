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
const prisma_service_1 = require("../prisma/prisma.service");
const user_service_1 = require("../user/user.service");
const shared_1 = require("@vocabmaster/shared");
let QuizService = QuizService_1 = class QuizService {
    prisma;
    userService;
    logger = new common_1.Logger(QuizService_1.name);
    constructor(prisma, userService) {
        this.prisma = prisma;
        this.userService = userService;
    }
    async generateQuiz(dto) {
        const count = dto.questionCount || 10;
        const where = {};
        if (dto.cefrLevel)
            where.cefrLevel = dto.cefrLevel;
        if (dto.category)
            where.category = dto.category;
        if (dto.collectionId) {
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
        if (pool.length < count && pool.length === 0) {
            throw new common_1.BadRequestException('Not enough vocabulary words in database to generate a quiz.');
        }
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        const questions = [];
        if (dto.quizType === shared_1.QuizType.MATCHING_PAIRS) {
            const pairCount = Math.min(6, selected.length);
            const pairSlice = selected.slice(0, pairCount);
            questions.push({
                id: `quiz-matching-${Date.now()}`,
                type: shared_1.QuizType.MATCHING_PAIRS,
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
                    correctAnswer: target.banglaMeaning,
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
                questions.push({
                    id: qId,
                    type: shared_1.QuizType.AUDIO_LISTENING,
                    wordId: target.id,
                    targetWord: target.word,
                    prompt: 'Listen to the audio pronunciation carefully. Which word is being spoken?',
                    phonetic: target.phoneticUs,
                    partOfSpeech: target.partOfSpeech,
                    cefrLevel: target.cefrLevel,
                    options,
                    correctAnswer: target.word,
                    hint: target.banglaMeaning,
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
                questions.push({
                    id: qId,
                    type: shared_1.QuizType.FILL_IN_BLANK,
                    wordId: target.id,
                    targetWord: target.word,
                    prompt: sentence,
                    phonetic: target.phoneticUs,
                    partOfSpeech: target.partOfSpeech,
                    cefrLevel: target.cefrLevel,
                    correctAnswer: target.word,
                    hint: `First letter: "${target.word[0].toUpperCase()}", meaning: ${target.banglaMeaning}`,
                });
            }
        }
        return questions;
    }
    async submitQuiz(userId, dto) {
        const totalQuestions = dto.answers.length;
        const correctCount = dto.answers.filter((a) => a.isCorrect).length;
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
                details: dto.answers,
            },
        });
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
        user_service_1.UserService])
], QuizService);
//# sourceMappingURL=quiz.service.js.map