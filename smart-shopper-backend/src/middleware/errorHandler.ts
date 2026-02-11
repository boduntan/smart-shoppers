import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode, message, stack } = err;

  // Default to 500 Internal Server Error if no status code
  if (!statusCode || statusCode === 200) {
    statusCode = 500;
  }

  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
    stack = undefined;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack }),
      statusCode,
    },
  });
};

export default errorHandler;
