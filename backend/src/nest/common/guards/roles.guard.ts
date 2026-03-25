import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

const roleRank: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.TENANT_ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const currentRole = request.user?.role as UserRole | undefined;

    if (!currentRole) {
      throw new ForbiddenException('Perfil do usuario nao encontrado');
    }

    const currentRank = roleRank[currentRole] ?? 0;
    const minimumRank = Math.min(...requiredRoles.map((role) => roleRank[role] ?? Number.MAX_SAFE_INTEGER));

    if (currentRank < minimumRank) {
      throw new ForbiddenException('Permissao insuficiente');
    }

    return true;
  }
}
