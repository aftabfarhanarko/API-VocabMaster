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
exports.SaveNoteDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SaveNoteDto {
    mnemonic;
    content;
    personalExample;
}
exports.SaveNoteDto = SaveNoteDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Associated with serenity...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveNoteDto.prototype, "mnemonic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Personal notes on usage...' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveNoteDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'My personal sample sentence...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveNoteDto.prototype, "personalExample", void 0);
//# sourceMappingURL=save-note.dto.js.map