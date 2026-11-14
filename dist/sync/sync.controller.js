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
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sync_service_1 = require("./sync.service");
const sync_push_dto_1 = require("./dto/sync-push.dto");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let SyncController = class SyncController {
    syncService;
    constructor(syncService) {
        this.syncService = syncService;
    }
    async pushReviews(user, dto) {
        return this.syncService.processOfflinePush(user.id, dto);
    }
    async pullUpdates(user, since) {
        return this.syncService.pullUpdates(user.id, since);
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Post)('push'),
    (0, swagger_1.ApiOperation)({ summary: 'Reconcile offline reviews batch sent from IndexedDB upon reconnection' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, sync_push_dto_1.SyncPushDto]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "pushReviews", null);
__decorate([
    (0, common_1.Get)('pull'),
    (0, swagger_1.ApiOperation)({ summary: 'Pull delta updates (words, user progress, collections) since timestamp' }),
    (0, swagger_1.ApiQuery)({ name: 'since', required: false, example: '2026-11-14T00:00:00.000Z' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('since')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "pullUpdates", null);
exports.SyncController = SyncController = __decorate([
    (0, swagger_1.ApiTags)('Offline PWA Sync'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('sync'),
    __metadata("design:paramtypes", [sync_service_1.SyncService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map