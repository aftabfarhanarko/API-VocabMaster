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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_service_1 = require("./user.service");
const update_user_dto_1 = require("./dto/update-user.dto");
const update_daily_goal_dto_1 = require("./dto/update-daily-goal.dto");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async getProfile(user) {
        return this.userService.getProfile(user.id);
    }
    async updateProfile(user, dto) {
        return this.userService.updateProfile(user.id, dto);
    }
    async getDailyGoal(user) {
        return this.userService.getDailyGoalProgress(user.id);
    }
    async setDailyGoal(user, dto) {
        return this.userService.setDailyGoal(user.id, dto.dailyWordGoal);
    }
    async getActivity(user) {
        return this.userService.getRecentActivity(user.id, 30);
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile and learning settings' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user learning settings and profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('daily-goal'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current daily word goal and today progress' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getDailyGoal", null);
__decorate([
    (0, common_1.Patch)('daily-goal'),
    (0, swagger_1.ApiOperation)({ summary: 'Set custom daily target words (e.g. 10, 20, 50, 100 words/day)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_daily_goal_dto_1.UpdateDailyGoalDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "setDailyGoal", null);
__decorate([
    (0, common_1.Get)('activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent 30-day learning activity logs' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getActivity", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('User Profile'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map