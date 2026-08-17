import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `[${request.method}] ${request.url} >> Status: ${status} >> Error: ${typeof message === 'object' ? JSON.stringify(message) : message}`,
      stack
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      mensagem: typeof message === 'string' ? message : exception instanceof Error ? exception.message : String(exception),
      valid: false,
      erros: [typeof message === 'string' ? message : exception instanceof Error ? exception.message : String(exception)],
      errorDetail: exception instanceof Error ? exception.message : String(exception),
      stack,
    });
  }
}
