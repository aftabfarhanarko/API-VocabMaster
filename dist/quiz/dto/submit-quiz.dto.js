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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitQuizDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@vocabmaster/shared");
class QuizAnswerItemDto {
    questionId;
    wordId;
    userAnswer;
    responseTimeMs;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'q-1' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuizAnswerItemDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'word-uuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuizAnswerItemDto.prototype, "wordId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'serendipity' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuizAnswerItemDto.prototype, "userAnswer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1200 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QuizAnswerItemDto.prototype, "responseTimeMs", void 0);
class SubmitQuizDto {
    quizId;
    quizType;
    durationSeconds;
    answers;
}
exports.SubmitQuizDto = SubmitQuizDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'quiz-session-uuid' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitQuizDto.prototype, "quizId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: shared_1.QuizType, example: shared_1.QuizType.MULTIPLE_CHOICE }),
    (0, class_validator_1.IsEnum)(shared_1.QuizType),
    __metadata("design:type", String)
], SubmitQuizDto.prototype, "quizType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 65, description: 'Total duration in seconds' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SubmitQuizDto.prototype, "durationSeconds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [QuizAnswerItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuizAnswerItemDto),
    __metadata("design:type", Array)
], SubmitQuizDto.prototype, "answers", void 0);
//# sourceMappingURL=submit-quiz.dto.js.map