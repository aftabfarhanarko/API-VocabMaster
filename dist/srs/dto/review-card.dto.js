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
exports.ReviewCardDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@vocabmaster/shared");
class ReviewCardDto {
    wordId;
    rating;
    responseTimeMs;
}
exports.ReviewCardDto = ReviewCardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Vocabulary word UUID or ID', example: 'word-uuid-123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReviewCardDto.prototype, "wordId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [1, 2, 3, 4],
        description: '1=Again, 2=Hard, 3=Good, 4=Easy',
        example: 3,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], ReviewCardDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Response time in milliseconds', example: 1850 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ReviewCardDto.prototype, "responseTimeMs", void 0);
//# sourceMappingURL=review-card.dto.js.map