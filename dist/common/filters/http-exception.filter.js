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
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let HttpExceptionFilter = class HttpExceptionFilter {
    constructor(configService) {
        this.configService = configService;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Something went wrong';
        let errors;
        if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const exBody = exception.getResponse();
            if (typeof exBody === 'string') {
                message = exBody;
            }
            else if (typeof exBody === 'object' && exBody !== null) {
                const body = exBody;
                if (Array.isArray(body.message)) {
                    errors = body.message;
                    message = 'Validation failed';
                }
                else {
                    message = body.message || message;
                }
            }
        }
        if (statusCode >= 500) {
            console.error(`[ERROR] ${request.method} ${request.url} → ${statusCode}`, exception);
        }
        const body = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
        };
        if (errors)
            body.errors = errors;
        if (this.configService.get('NODE_ENV') === 'development' &&
            exception instanceof Error) {
            body.stack = exception.stack;
        }
        response.status(statusCode).json(body);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map