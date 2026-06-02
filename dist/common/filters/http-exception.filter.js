"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const configuration_1 = require("../../config/configuration");
const config = (0, configuration_1.configuration)();
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const timestamp = new Date().toISOString();
        let status;
        let message;
        let errors;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse;
                if (Array.isArray(resp.message)) {
                    const firstItem = resp.message[0];
                    if (typeof firstItem === 'object' &&
                        firstItem !== null &&
                        'property' in firstItem) {
                        errors = resp.message.map((err) => {
                            const e = err;
                            const constraints = e.constraints;
                            const firstConstraint = constraints
                                ? Object.values(constraints)[0]
                                : 'Invalid value';
                            return { field: e.property, message: firstConstraint };
                        });
                        message = 'Validation failed';
                    }
                    else {
                        message = resp.message.join('; ');
                    }
                }
                else {
                    message = resp.message || exception.message;
                }
            }
            else {
                message = exception.message;
            }
        }
        else if (exception instanceof Error) {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message =
                config.nodeEnv === 'production' ? 'Something went wrong' : exception.message;
        }
        else {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Something went wrong';
        }
        if (status >= 500) {
            this.logger.error(`[${request.method}] ${request.url} — ${status} ${message}`, exception instanceof Error ? exception.stack : undefined);
        }
        const body = { success: false, message, timestamp };
        if (errors)
            body.errors = errors;
        response.status(status).json(body);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map