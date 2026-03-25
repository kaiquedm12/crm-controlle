import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
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
    const user = request.user as
      | {
          id: string;
          role: UserRole;
          tenantId: string | null;
          actingTenantId: string | null;
        }
      | undefined;

    if (!user) {
      throw new ForbiddenException('Usuario nao autenticado');
    }

    if (user.role !== UserRole.SUPER_ADMIN && !user.actingTenantId) {
      throw new ForbiddenException('Tenant nao informado no token');
    }

    return true;
  }
}
