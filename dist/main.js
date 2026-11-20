"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cookieParser = require('cookie-parser');
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
    app.getHttpAdapter().getInstance().set('trust proxy', Number.isFinite(trustProxyHops) ? trustProxyHops : 1);
    app.enableShutdownHooks();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    const envOrigins = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map((o) => o.trim().replace(/\/$/, ''))
        .filter(Boolean);
    const allowedOrigins = [
        'https://vocab-master-ivory-mu.vercel.app',
        'https://vocabmaster.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        ...envOrigins,
    ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            const normalizedOrigin = origin.replace(/\/$/, '');
            const isAllowed = allowedOrigins.includes(normalizedOrigin) ||
                normalizedOrigin.endsWith('.vercel.app') ||
                process.env.NODE_ENV !== 'production';
            if (isAllowed) {
                callback(null, true);
            }
            else {
                logger.warn(`CORS blocked for origin: ${origin}`);
                callback(new Error(`Origin ${origin} is not allowed by CORS`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
        ],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('VocabMaster API')
        .setDescription('REST API documentation for VocabMaster — Personal English Vocabulary Learning Platform & PWA')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide Supabase JWT Token',
    }, 'JWT-auth')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 4000;
    await app.listen(port);
    logger.log(`VocabMaster Backend running on http://localhost:${port}/api`);
    logger.log(`Swagger Docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map