import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../errors/AppError';

const roleRank: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.TENANT_ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
};

export function ensureRole(roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Usuario nao autenticado', 401);
    }

    const minRequiredRank = Math.min(...roles.map((role) => roleRank[role]));

    if (roleRank[req.user.role] < minRequiredRank) {
      throw new AppError('Sem permissao para esta operacao', 403);
    }

    next();
  };
}
