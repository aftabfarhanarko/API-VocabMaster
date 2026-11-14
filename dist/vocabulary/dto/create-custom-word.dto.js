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
exports.CreateCustomWordDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@vocabmaster/shared");
class ExampleDto {
    sentenceEn;
    sentenceBn;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'The scientist observed the stars at night.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExampleDto.prototype, "sentenceEn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'বিজ্ঞানী রাতে তারাগুলো পর্যবেক্ষণ করেছিলেন।' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExampleDto.prototype, "sentenceBn", void 0);
class CreateCustomWordDto {
    word;
    partOfSpeech;
    cefrLevel;
    category;
    englishMeaning;
    banglaMeaning;
    phoneticUs;
    phoneticUk;
    examples;
    synonyms;
    antonyms;
}
exports.CreateCustomWordDto = CreateCustomWordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ephemeral' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCustomWordDto.prototype, "word", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: shared_1.PartOfSpeech, example: shared_1.PartOfSpeech.ADJECTIVE }),
    (0, class_validator_1.IsEnum)(shared_1.PartOfSpeech),
    __metadata("design:type", String)
], CreateCustomWordDto.prototype, "partOfSpeech", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: shared_1.CefrLevel, example: shared_1.CefrLevel.C1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(shared_1.CefrLevel),
    __metadata("design:type", String)
], CreateCustomWordDto.prototype, "cefrLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Academic & Education' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCustomWordDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Lasting for a very short time.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCustomWordDto.prototype, "englishMeaning", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ক্ষণস্থায়ী বা স্বল্পস্থায়ী।' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCustomWordDto.prototype, "banglaMeaning", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '/ɪˈfem.ər.əl/' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCustomWordDto.prototype, "phoneticUs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '/ɪˈfem.ər.əl/' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCustomWordDto.prototype, "phoneticUk", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ExampleDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExampleDto),
    __metadata("design:type", Array)
], CreateCustomWordDto.prototype, "examples", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['fleeting', 'transient'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateCustomWordDto.prototype, "synonyms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['permanent', 'enduring'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateCustomWordDto.prototype, "antonyms", void 0);
//# sourceMappingURL=create-custom-word.dto.js.map