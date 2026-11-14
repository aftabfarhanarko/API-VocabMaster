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
exports.DictionaryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dictionary_service_1 = require("./dictionary.service");
let DictionaryController = class DictionaryController {
    dictionaryService;
    constructor(dictionaryService) {
        this.dictionaryService = dictionaryService;
    }
    async freeDictWordsList(page = '1', limit = '20') {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        return await this.dictionaryService.listFreeDictWords(pageNum, limitNum);
    }
    async freeDictLookup(word) {
        const data = await this.dictionaryService.lookupFreeDict(word);
        return data || { message: `No FreeDict entry found for '${word}'` };
    }
    async lookup(word) {
        const data = await this.dictionaryService.lookupWord(word);
        return data || { message: `No definition found for '${word}'` };
    }
    async rawEntries(word) {
        const raw = await this.dictionaryService.getRawEntries(word);
        return raw || [];
    }
    async speak(text, accent = 'US') {
        const audioUrl = await this.dictionaryService.getAudioUrl(text, accent);
        return { audioUrl, text, accent };
    }
};
exports.DictionaryController = DictionaryController;
__decorate([
    (0, common_1.Get)('dictionary/freedict/words'),
    (0, swagger_1.ApiOperation)({
        summary: 'Direct paginated words feed from FreeDict API with Bengali translations & CEFR levels',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 20 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DictionaryController.prototype, "freeDictWordsList", null);
__decorate([
    (0, common_1.Get)('dictionary/freedict/:word'),
    (0, swagger_1.ApiOperation)({
        summary: 'Direct lookup via FreeDict API with authentic Bengali translations and CEFR level',
    }),
    (0, swagger_1.ApiParam)({ name: 'word', example: 'peace' }),
    __param(0, (0, common_1.Param)('word')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DictionaryController.prototype, "freeDictLookup", null);
__decorate([
    (0, common_1.Get)('dictionary/lookup/:word'),
    (0, swagger_1.ApiOperation)({
        summary: 'Unified dictionary lookup combining FreeDict (Bengali translations + CEFR) and audio phonetics',
    }),
    (0, swagger_1.ApiParam)({ name: 'word', example: 'peace' }),
    __param(0, (0, common_1.Param)('word')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DictionaryController.prototype, "lookup", null);
__decorate([
    (0, common_1.Get)('dictionary/raw/:word'),
    (0, swagger_1.ApiOperation)({
        summary: 'Direct raw OpenDictionary array payload matching https://api.opendictionaryapi.com/entries/en/:word',
    }),
    (0, swagger_1.ApiParam)({ name: 'word', example: 'hello' }),
    __param(0, (0, common_1.Param)('word')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DictionaryController.prototype, "rawEntries", null);
__decorate([
    (0, common_1.Get)('tts/speak'),
    (0, swagger_1.ApiOperation)({ summary: 'Get fallback audio pronunciation URL for English or Bengali' }),
    (0, swagger_1.ApiQuery)({ name: 'text', example: 'peace' }),
    (0, swagger_1.ApiQuery)({ name: 'accent', enum: ['US', 'UK', 'BN'], required: false }),
    __param(0, (0, common_1.Query)('text')),
    __param(1, (0, common_1.Query)('accent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DictionaryController.prototype, "speak", null);
exports.DictionaryController = DictionaryController = __decorate([
    (0, swagger_1.ApiTags)('Dictionary & Translations'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [dictionary_service_1.DictionaryService])
], DictionaryController);
//# sourceMappingURL=dictionary.controller.js.map