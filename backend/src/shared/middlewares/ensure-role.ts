import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../errors/AppError';

export function ensureRole(roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Usuario nao autenticado', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Sem permissao para esta operacao', 403);
    }

    next();
  };
}
