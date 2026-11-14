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
exports.CollectionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const collection_service_1 = require("./collection.service");
const create_collection_dto_1 = require("./dto/create-collection.dto");
const update_collection_dto_1 = require("./dto/update-collection.dto");
const add_word_dto_1 = require("./dto/add-word.dto");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let CollectionController = class CollectionController {
    collectionService;
    constructor(collectionService) {
        this.collectionService = collectionService;
    }
    async getCollections(user) {
        return this.collectionService.getUserCollections(user.id);
    }
    async createCollection(user, dto) {
        return this.collectionService.createCollection(user.id, dto);
    }
    async getCollectionById(user, id) {
        return this.collectionService.getCollectionById(user.id, id);
    }
    async updateCollection(user, id, dto) {
        return this.collectionService.updateCollection(user.id, id, dto);
    }
    async deleteCollection(user, id) {
        return this.collectionService.deleteCollection(user.id, id);
    }
    async addWord(user, id, dto) {
        return this.collectionService.addWordToCollection(user.id, id, dto.wordId);
    }
    async removeWord(user, id, wordId) {
        return this.collectionService.removeWordFromCollection(user.id, id, wordId);
    }
};
exports.CollectionController = CollectionController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all personal collections for the current user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CollectionController.prototype, "getCollections", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new personal vocabulary collection/deck' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_collection_dto_1.CreateCollectionDto]),
    __metadata("design:returntype", Promise)
], CollectionController.prototype, "createCollection", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get collection details and all contained vocabulary words' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CollectionController.prototype, "getCollectionById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update collection details' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_collection_dto_1.UpdateCollectionDto]),
    __metadata("design:returntype", Promise)
], CollectionController.prototype, "updateCollection", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a personal collection' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CollectionController.prototype, "deleteCollection", null);
__decorate([
    (0, common_1.Post)(':id/words'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a vocabulary word to a collection' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, add_word_dto_1.AddWordToCollectionDto]),
    __metadata("design:returntype", Promise)
], CollectionController.prototype, "addWord", null);
__decorate([
    (0, common_1.Delete)(':id/words/:wordId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a word from a collection' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('wordId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CollectionController.prototype, "removeWord", null);
exports.CollectionController = CollectionController = __decorate([
    (0, swagger_1.ApiTags)('Personal Collections'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('collections'),
    __metadata("design:paramtypes", [collection_service_1.CollectionService])
], CollectionController);
//# sourceMappingURL=collection.controller.js.map