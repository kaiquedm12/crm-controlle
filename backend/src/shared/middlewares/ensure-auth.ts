import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../errors/AppError';

type JwtPayload = {
  sub: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

export function ensureAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token nao informado', 401);
  }

  const [, token] = authHeader.split(' ');
  if (!token) {
    throw new AppError('Token invalido', 401);
  }

  try {
    const payload = verifyAccessToken(token) as JwtPayload;
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    next();
  } catch {
    throw new AppError('Token invalido ou expirado', 401);
  }
}
