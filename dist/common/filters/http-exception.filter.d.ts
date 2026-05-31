import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly configService;
    constructor(configService: ConfigService);
    catch(exception: unknown, host: ArgumentsHost): void;
}
