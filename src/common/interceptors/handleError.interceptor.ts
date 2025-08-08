import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ErrorUniqueConstraint } from './handleErrorUniqueConstraint.interceptor';
import { OrderNotFoundError } from './handleErrorOrderNotFound.interceptor';
import { JsonWebTokenError } from 'jsonwebtoken';

export interface ErrorResponse {
  name: string;
  message: string;
  statusCode: number;
  code?: string;
  table?: string;
  column?: string;
  detail?: string;
  query?: string;
  constraint?: string;
}

@Catch()
export class HandleError implements ExceptionFilter {
  catch(exception, host: ArgumentsHost) {
    console.log('👻 ~ HandleError ~ catch ~ exception:', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const resError: ErrorResponse = {
      name: exception?.response?.error || 'Internal Server Error',
      message: exception?.response?.message || 'Internal Server Error',
      statusCode: exception?.response?.statusCode || 500,
    };

    if (exception instanceof OrderNotFoundError) {
      resError.name = 'NotFoundError';
      resError.message = exception.message;
      resError.statusCode = exception.statusCode;
      resError.detail = exception.details;
    } else if (exception instanceof ErrorUniqueConstraint) {
      resError.name = 'NotFoundError';
      resError.message = exception.message;
      resError.statusCode = exception.statusCode;
      resError.detail = exception.details;
    } else if (exception instanceof JsonWebTokenError) {
      resError.name = 'Unauthorized';
      resError.message = exception.message;
      resError.statusCode = 401;
    }
    response.status(resError.statusCode).json(resError);
  }
}
