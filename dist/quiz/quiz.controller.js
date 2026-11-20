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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const quiz_service_1 = require("./quiz.service");
const generate_quiz_dto_1 = require("./dto/generate-quiz.dto");
const submit_quiz_dto_1 = require("./dto/submit-quiz.dto");
const answer_quiz_dto_1 = require("./dto/answer-quiz.dto");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let QuizController = class QuizController {
    quizService;
    constructor(quizService) {
        this.quizService = quizService;
    }
    async generateQuiz(user, dto) {
        return this.quizService.generateQuiz(dto, user.id);
    }
    async submitQuiz(user, dto) {
        return this.quizService.submitQuiz(user.id, dto);
    }
    async answer(user, dto) {
        return this.quizService.answerQuiz(user.id, dto.quizId, dto.questionId, dto.userAnswer);
    }
    async getHistory(user) {
        return this.quizService.getQuizHistory(user.id);
    }
};
exports.QuizController = QuizController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate dynamic quiz session questions based on type and filters' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_quiz_dto_1.GenerateQuizDto]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "generateQuiz", null);
__decorate([
    (0, common_1.Post)('submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit quiz responses, record session score and update activity' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, submit_quiz_dto_1.SubmitQuizDto]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "submitQuiz", null);
__decorate([
    (0, common_1.Post)('answer'),
    (0, swagger_1.ApiOperation)({ summary: 'Grade one answer server-side and return feedback after submission' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, answer_quiz_dto_1.AnswerQuizDto]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "answer", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get past quiz session history' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "getHistory", null);
exports.QuizController = QuizController = __decorate([
    (0, swagger_1.ApiTags)('Interactive Quizzes'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('quiz'),
    __metadata("design:paramtypes", [quiz_service_1.QuizService])
], QuizController);
//# sourceMappingURL=quiz.controller.js.map