"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const health_module_1 = require("./health/health.module");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const vocabulary_module_1 = require("./vocabulary/vocabulary.module");
const dictionary_module_1 = require("./dictionary/dictionary.module");
const srs_module_1 = require("./srs/srs.module");
const quiz_module_1 = require("./quiz/quiz.module");
const collection_module_1 = require("./collection/collection.module");
const notes_module_1 = require("./notes/notes.module");
const analytics_module_1 = require("./analytics/analytics.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const sync_module_1 = require("./sync/sync.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '.env.local'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            vocabulary_module_1.VocabularyModule,
            dictionary_module_1.DictionaryModule,
            srs_module_1.SrsModule,
            quiz_module_1.QuizModule,
            collection_module_1.CollectionModule,
            notes_module_1.NotesModule,
            analytics_module_1.AnalyticsModule,
            dashboard_module_1.DashboardModule,
            sync_module_1.SyncModule,
            health_module_1.HealthModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map