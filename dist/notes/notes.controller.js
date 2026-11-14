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
exports.NotesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notes_service_1 = require("./notes.service");
const save_note_dto_1 = require("./dto/save-note.dto");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let NotesController = class NotesController {
    notesService;
    constructor(notesService) {
        this.notesService = notesService;
    }
    async getNote(user, wordId) {
        return this.notesService.getNote(user.id, wordId);
    }
    async saveNote(user, wordId, dto) {
        return this.notesService.saveNote(user.id, wordId, dto);
    }
};
exports.NotesController = NotesController;
__decorate([
    (0, common_1.Get)(':wordId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user personal note and mnemonic for a word' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('wordId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "getNote", null);
__decorate([
    (0, common_1.Post)(':wordId'),
    (0, swagger_1.ApiOperation)({ summary: 'Save or update user personal note and mnemonic for a word' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('wordId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, save_note_dto_1.SaveNoteDto]),
    __metadata("design:returntype", Promise)
], NotesController.prototype, "saveNote", null);
exports.NotesController = NotesController = __decorate([
    (0, swagger_1.ApiTags)('Word Notes & Mnemonics'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('notes'),
    __metadata("design:paramtypes", [notes_service_1.NotesService])
], NotesController);
//# sourceMappingURL=notes.controller.js.map