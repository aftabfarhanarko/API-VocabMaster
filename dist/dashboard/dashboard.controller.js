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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let DashboardController = class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getOverview(user) {
        return this.dashboardService.getOverview(user.id);
    }
    async getDailyPlan(user) {
        return this.dashboardService.getDailyPlan(user.id);
    }
    async getStrugglingWords(user) {
        return this.dashboardService.getStrugglingWords(user.id);
    }
    async getAchievements(user) {
        return this.dashboardService.getAchievements(user.id);
    }
    async getHeatmap(user, days = '365') {
        return this.dashboardService.getActivityHeatmap(user.id, parseInt(days, 10) || 365);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiOperation)({
        summary: 'Complete production user dashboard: user profile, daily word goal, retention KPIs, CEFR mastery, upcoming review schedule',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('daily-plan'),
    (0, swagger_1.ApiOperation)({
        summary: 'Structured 3-session daily learning curriculum matching user daily word goal (e.g. 50 words: morning, afternoon, evening)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDailyPlan", null);
__decorate([
    (0, common_1.Get)('struggling-words'),
    (0, swagger_1.ApiOperation)({
        summary: 'List of words where user frequently lapses or has low retention, with personal mnemonics and mastery tips',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getStrugglingWords", null);
__decorate([
    (0, common_1.Get)('achievements'),
    (0, swagger_1.ApiOperation)({
        summary: 'Gamification badges, streaks, milestone achievements, and progress bars',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getAchievements", null);
__decorate([
    (0, common_1.Get)('heatmap'),
    (0, swagger_1.ApiOperation)({
        summary: 'Annual/monthly GitHub-style learning activity matrix with intensity levels',
    }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, example: 365 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getHeatmap", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('User Dashboard & Progress Engine'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map