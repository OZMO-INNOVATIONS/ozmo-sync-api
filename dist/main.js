"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = require("helmet");
const morgan = require("morgan");
const express_rate_limit_1 = require("express-rate-limit");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_transform_interceptor_1 = require("./common/interceptors/response-transform.interceptor");
const configuration_1 = require("./config/configuration");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = (0, configuration_1.configuration)();
    app.use((0, helmet_1.default)());
    if (config.nodeEnv === 'development') {
        app.use(morgan('dev'));
    }
    app.enableCors({
        origin: config.corsOrigin.split(',').map((o) => o.trim()),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    app.use((0, express_rate_limit_1.default)({
        windowMs: config.rateLimit.global.windowMs,
        max: config.rateLimit.global.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests — please try again later' },
    }));
    app.use('/api/v1/auth/login', (0, express_rate_limit_1.default)({
        windowMs: config.rateLimit.login.windowMs,
        max: config.rateLimit.login.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many login attempts — please try again in 15 minutes',
        },
    }));
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (errors) => new common_1.UnprocessableEntityException(errors),
    }));
    app.useGlobalInterceptors(new response_transform_interceptor_1.ResponseTransformInterceptor());
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    await app.listen(config.port);
    console.log(`[OZMO SYNC] Running on http://localhost:${config.port}/api/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map