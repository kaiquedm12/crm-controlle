import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Erro de validacao',
      errors: error.flatten(),
    });
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Erro interno do servidor' });
}
