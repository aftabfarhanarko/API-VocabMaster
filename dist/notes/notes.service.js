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
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotesService = class NotesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNote(userId, wordId) {
        let actualWordId = wordId;
        const word = await this.prisma.vocabularyWord.findFirst({
            where: {
                OR: [{ id: wordId }, { normalizedWord: wordId.toLowerCase() }],
            },
        });
        if (word)
            actualWordId = word.id;
        return await this.prisma.wordNote.findUnique({
            where: {
                userId_wordId: { userId, wordId: actualWordId },
            },
        });
    }
    async saveNote(userId, wordId, dto) {
        let actualWordId = wordId;
        const word = await this.prisma.vocabularyWord.findFirst({
            where: {
                OR: [{ id: wordId }, { normalizedWord: wordId.toLowerCase() }],
            },
        });
        if (word) {
            actualWordId = word.id;
        }
        else {
            throw new common_1.NotFoundException(`Word '${wordId}' not found in vocabulary.`);
        }
        return await this.prisma.wordNote.upsert({
            where: {
                userId_wordId: { userId, wordId: actualWordId },
            },
            create: {
                userId,
                wordId: actualWordId,
                content: dto.content,
                mnemonic: dto.mnemonic,
                personalExample: dto.personalExample,
            },
            update: {
                content: dto.content,
                mnemonic: dto.mnemonic,
                personalExample: dto.personalExample,
            },
        });
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotesService);
//# sourceMappingURL=notes.service.js.map