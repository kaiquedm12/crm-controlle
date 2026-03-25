import { UserRole } from '@prisma/client';
import { prisma } from '../../../infra/database/prisma/client';
import { AppError } from '../../../shared/errors/AppError';
import { comparePassword, hashPassword } from '../../../shared/utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../../shared/utils/jwt';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  tenantId?: string;
};

type LoginInput = {
  email: string;
  password: string;
  tenantId?: string;
};

type RefreshInput = {
  refreshToken: string;
};

async function ensureTenantDefaultPipeline(tenantId: string, userId: string) {
  const existingPipelines = await prisma.pipeline.count({ where: { tenantId } });
  if (existingPipelines > 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const recheck = await tx.pipeline.count({ where: { tenantId } });
    if (recheck > 0) {
      return;
    }

    const pipeline = await tx.pipeline.create({
      data: {
        tenantId,
        name: 'Pipeline Comercial',
        description: 'Pipeline inicial criado automaticamente',
        createdById: userId,
      },
    });

    await tx.stage.createMany({
      data: [
        { tenantId, pipelineId: pipeline.id, name: 'Leads', position: 1 },
        { tenantId, pipelineId: pipeline.id, name: 'Contato', position: 2 },
        { tenantId, pipelineId: pipeline.id, name: 'Proposta', position: 3 },
        { tenantId, pipelineId: pipeline.id, name: 'Fechado', position: 4 },
      ],
    });
  });
}

export class AuthService {
  async register(input: RegisterInput) {
    const requestedRole = input.role ?? UserRole.USER;

    if (requestedRole === UserRole.SUPER_ADMIN) {
      throw new AppError('Criacao de SUPER_ADMIN nao permitida por esta rota', 403);
    }

    if (!input.tenantId) {
      throw new AppError('tenantId e obrigatorio para usuarios de tenant', 400);
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
    if (!tenant) {
      throw new AppError('Tenant nao encontrado', 404);
    }

    const existingUser = await prisma.user.findFirst({ where: { email: input.email, tenantId: input.tenantId } });
    if (existingUser) {
      throw new AppError('Email ja cadastrado neste tenant', 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: requestedRole,
        tenantId: input.tenantId,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async login(input: LoginInput) {
    let user = null;
    let passwordAlreadyChecked = false;

    if (input.tenantId) {
      user = await prisma.user.findFirst({
        where: { email: input.email, tenantId: input.tenantId },
      });
    } else {
      const candidates = await prisma.user.findMany({ where: { email: input.email } });

      if (!candidates.length) {
        throw new AppError('Credenciais invalidas', 401);
      }

      const passwordMatchedUsers = [] as typeof candidates;
      for (const candidate of candidates) {
        const matches = await comparePassword(input.password, candidate.passwordHash);
        if (matches) {
          passwordMatchedUsers.push(candidate);
        }
      }

      if (!passwordMatchedUsers.length) {
        throw new AppError('Credenciais invalidas', 401);
      }

      if (passwordMatchedUsers.length === 1) {
        user = passwordMatchedUsers[0];
        passwordAlreadyChecked = true;
      } else {
        const activeTenantUsers = [] as typeof candidates;

        for (const candidate of passwordMatchedUsers) {
          if (!candidate.tenantId) {
            activeTenantUsers.push(candidate);
            continue;
          }

          const tenant = await prisma.tenant.findUnique({ where: { id: candidate.tenantId } });
          if ((tenant as any)?.status !== 'INACTIVE') {
            activeTenantUsers.push(candidate);
          }
        }

        if (activeTenantUsers.length === 1) {
          user = activeTenantUsers[0];
          passwordAlreadyChecked = true;
        } else {
          throw new AppError('Nao foi possivel identificar a empresa deste usuario. Contate o suporte.', 409);
        }
      }
    }

    if (!user) {
      throw new AppError('Credenciais invalidas', 401);
    }

    if ((user as any).isActive === false) {
      throw new AppError('Usuario desativado. Contate o administrador.', 403);
    }

    if (user.tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });

      if ((tenant as any)?.status === 'INACTIVE') {
        throw new AppError('Tenant inativo. Contate o suporte.', 403);
      }
    }

    if (!passwordAlreadyChecked) {
      const passwordMatches = await comparePassword(input.password, user.passwordHash);
      if (!passwordMatches) {
        throw new AppError('Credenciais invalidas', 401);
      }
    }

    if (user.tenantId && user.role !== UserRole.SUPER_ADMIN) {
      await ensureTenantDefaultPipeline(user.tenantId, user.id);
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role, tenantId: user.tenantId });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role, tenantId: user.tenantId });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        tenantId: user.tenantId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async refresh(input: RefreshInput) {
    const stored = await prisma.refreshToken.findUnique({ where: { token: input.refreshToken } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError('Refresh token invalido', 401);
    }

    const payload = verifyRefreshToken(input.refreshToken) as {
      sub: string;
      role: UserRole;
      tenantId?: string | null;
    };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new AppError('Usuario nao encontrado', 404);
    }

    return {
      accessToken: signAccessToken({ sub: user.id, role: user.role, tenantId: user.tenantId }),
    };
  }
}
