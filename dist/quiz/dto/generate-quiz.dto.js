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
exports.GenerateQuizDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@vocabmaster/shared");
class GenerateQuizDto {
    quizType;
    questionCount = 10;
    cefrLevel;
    category;
    collectionId;
}
exports.GenerateQuizDto = GenerateQuizDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: shared_1.QuizType,
        example: shared_1.QuizType.MULTIPLE_CHOICE,
        description: 'MULTIPLE_CHOICE | FILL_IN_BLANK | AUDIO_LISTENING | MATCHING_PAIRS',
    }),
    (0, class_validator_1.IsEnum)(shared_1.QuizType),
    __metadata("design:type", String)
], GenerateQuizDto.prototype, "quizType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10, minimum: 5, maximum: 30 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], GenerateQuizDto.prototype, "questionCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: shared_1.CefrLevel }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(shared_1.CefrLevel),
    __metadata("design:type", String)
], GenerateQuizDto.prototype, "cefrLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter quiz to a category' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateQuizDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter quiz to a personal collection' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateQuizDto.prototype, "collectionId", void 0);
//# sourceMappingURL=generate-quiz.dto.js.map