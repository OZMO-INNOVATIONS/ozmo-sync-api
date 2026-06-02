"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNestApp = createNestApp;
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const common_1 = require("@nestjs/common");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_transform_interceptor_1 = require("./common/interceptors/response-transform.interceptor");
let adapter;
async function createNestApp() {
    if (adapter)
        return adapter.getInstance();
    adapter = new platform_express_1.ExpressAdapter();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, adapter, {
        logger: ['error', 'warn'],
    });
    app.use((0, helmet_1.default)());
    app.enableCors({ origin: '*', credentials: true });
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
    await app.init();
    return adapter.getInstance();
}
//# sourceMappingURL=lambda.js.map