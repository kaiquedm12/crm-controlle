import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { verifyAccessToken } from '../../../shared/utils/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

type JwtPayload = {
  sub: string;
  role: UserRole;
  tenantId?: string | null;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;

    if (!authHeader) {
      throw new UnauthorizedException('Token nao informado');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token invalido');
    }

    try {
      const payload = verifyAccessToken(token) as JwtPayload;
      const requestedTenantId =
        typeof request.headers['x-tenant-id'] === 'string' ? request.headers['x-tenant-id'] : undefined;

      const tokenTenantId = payload.tenantId ?? null;
      const actingTenantId =
        payload.role === UserRole.SUPER_ADMIN ? requestedTenantId ?? tokenTenantId : tokenTenantId;

      request.user = {
        id: payload.sub,
        role: payload.role,
        tenantId: tokenTenantId,
        actingTenantId,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado');
    }
  }
}
