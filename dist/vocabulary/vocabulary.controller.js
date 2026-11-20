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
exports.VocabularyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const vocabulary_service_1 = require("./vocabulary.service");
const word_filter_dto_1 = require("./dto/word-filter.dto");
const create_custom_word_dto_1 = require("./dto/create-custom-word.dto");
const bulk_bookmark_dto_1 = require("./dto/bulk-bookmark.dto");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let VocabularyController = class VocabularyController {
    vocabService;
    constructor(vocabService) {
        this.vocabService = vocabService;
    }
    async findWords(user, query) {
        return this.vocabService.findWords(user.id, query);
    }
    async getCategories(user) {
        return this.vocabService.getCategories(user.id);
    }
    async getBookmarkedWords(user, page = '1', limit = '20', search, cefrLevel) {
        return this.vocabService.getBookmarkedWords(user.id, {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20,
            search,
            cefrLevel,
        });
    }
    async toggleBookmark(user, wordId) {
        return this.vocabService.toggleBookmark(user.id, wordId);
    }
    async removeBookmark(user, wordId) {
        return this.vocabService.toggleBookmark(user.id, wordId);
    }
    async bulkBookmark(user, dto) {
        return this.vocabService.bulkBookmarkWords(user.id, dto.wordIds);
    }
    async getWordDetails(user, wordOrId) {
        return this.vocabService.getWordDetails(wordOrId, user.id);
    }
    async createCustomWord(user, dto) {
        return this.vocabService.createCustomWord(user.id, dto);
    }
};
exports.VocabularyController = VocabularyController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search and filter 3,000+ words with pagination' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, word_filter_dto_1.WordFilterDto]),
    __metadata("design:returntype", Promise)
], VocabularyController.prototype, "findWords", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of categories with word counts' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VocabularyController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('bookmarks'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of bookmarked/saved words in user book list' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'cefrLevel', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('cefrLevel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], VocabularyController.prototype, "getBookmarkedWords", null);
__decorate([
    (0, common_1.Post)('bookmark/:wordId'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle bookmark on a word (save to/remove from book list)' }),
    (0, swagger_1.ApiParam)({ name: 'wordId', example: 'peace' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('wordId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VocabularyController.prototype, "toggleBookmark", null);
__decorate([
    (0, common_1.Delete)('bookmark/:wordId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a word from user book list' }),
    (0, swagger_1.ApiParam)({ name: 'wordId', example: 'peace' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('wordId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VocabularyController.prototype, "removeBookmark", null);
__decorate([
    (0, common_1.Post)('bookmarks/bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Save multiple words to book list at once' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, bulk_bookmark_dto_1.BulkBookmarkDto]),
    __metadata("design:returntype", Promise)
], VocabularyController.prototype, "bulkBookmark", null);
__decorate([
    (0, common_1.Get)(':wordOrId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed vocabulary entry by word or UUID' }),
    (0, swagger_1.ApiParam)({ name: 'wordOrId', example: 'serendipity' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('wordOrId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VocabularyController.prototype, "getWordDetails", null);
__decorate([
    (0, common_1.Post)('custom'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a user custom word to personal vocabulary' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_custom_word_dto_1.CreateCustomWordDto]),
    __metadata("design:returntype", Promise)
], VocabularyController.prototype, "createCustomWord", null);
exports.VocabularyController = VocabularyController = __decorate([
    (0, swagger_1.ApiTags)('Vocabulary Management'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('vocabulary'),
    __metadata("design:paramtypes", [vocabulary_service_1.VocabularyService])
], VocabularyController);
//# sourceMappingURL=vocabulary.controller.js.map