import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../errors/AppError';

export function ensureTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new AppError('Usuario nao autenticado', 401);
  }

  if (req.user.role === UserRole.SUPER_ADMIN) {
    if (!req.user.actingTenantId) {
      throw new AppError('SUPER_ADMIN deve informar x-tenant-id para operacoes tenant-scoped', 400);
    }

    return next();
  }

  if (!req.user.tenantId || !req.user.actingTenantId) {
    throw new AppError('Tenant nao encontrado no token', 403);
  }

  if (req.user.tenantId !== req.user.actingTenantId) {
    throw new AppError('Tentativa de acesso cruzado entre tenants', 403);
  }

  next();
}
