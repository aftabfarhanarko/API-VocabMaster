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
exports.WordFilterDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@vocabmaster/shared");
class WordFilterDto {
    search;
    cefrLevel;
    category;
    partOfSpeech;
    srsState;
    collectionId;
    page = 1;
    limit = 20;
    sortBy = 'frequencyScore';
    sortOrder = 'desc';
    source = 'database';
}
exports.WordFilterDto = WordFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search term for word or meaning' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WordFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: shared_1.CefrLevel, description: 'CEFR level (A1-C2)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(shared_1.CefrLevel),
    __metadata("design:type", String)
], WordFilterDto.prototype, "cefrLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Vocabulary category' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WordFilterDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: shared_1.PartOfSpeech, description: 'Part of speech' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(shared_1.PartOfSpeech),
    __metadata("design:type", String)
], WordFilterDto.prototype, "partOfSpeech", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: shared_1.SrsState, description: 'SRS learning state' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(shared_1.SrsState),
    __metadata("design:type", String)
], WordFilterDto.prototype, "srsState", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by personal collection ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WordFilterDto.prototype, "collectionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], WordFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], WordFilterDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['word', 'frequencyScore', 'createdAt'], default: 'frequencyScore' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WordFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'], default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WordFilterDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['database', 'freedict'],
        default: 'database',
        description: 'Data source (Neon PostgreSQL database or FreeDict live API)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WordFilterDto.prototype, "source", void 0);
//# sourceMappingURL=word-filter.dto.js.map