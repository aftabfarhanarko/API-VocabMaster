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
exports.SyncPushDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@vocabmaster/shared");
class OfflineReviewItemDto {
    clientUuid;
    wordId;
    rating;
    reviewedAt;
    responseTimeMs;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'client-uuid-123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OfflineReviewItemDto.prototype, "clientUuid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'word-uuid-456' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OfflineReviewItemDto.prototype, "wordId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: [1, 2, 3, 4], example: 3 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], OfflineReviewItemDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-11-14T07:45:00.000Z' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OfflineReviewItemDto.prototype, "reviewedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1400 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], OfflineReviewItemDto.prototype, "responseTimeMs", void 0);
class SyncPushDto {
    lastSyncTimestamp;
    offlineReviews;
}
exports.SyncPushDto = SyncPushDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-11-14T00:00:00.000Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncPushDto.prototype, "lastSyncTimestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [OfflineReviewItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => OfflineReviewItemDto),
    __metadata("design:type", Array)
], SyncPushDto.prototype, "offlineReviews", void 0);
//# sourceMappingURL=sync-push.dto.js.map