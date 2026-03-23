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
};

type LoginInput = {
  email: string;
  password: string;
};

type RefreshInput = {
  refreshToken: string;
};

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
      throw new AppError('Email ja cadastrado', 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role ?? UserRole.SELLER,
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
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError('Credenciais invalidas', 401);
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError('Credenciais invalidas', 401);
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
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
      },
    };
  }

  async refresh(input: RefreshInput) {
    const stored = await prisma.refreshToken.findUnique({ where: { token: input.refreshToken } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError('Refresh token invalido', 401);
    }

    const payload = verifyRefreshToken(input.refreshToken) as { sub: string; role: UserRole };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new AppError('Usuario nao encontrado', 404);
    }

    return {
      accessToken: signAccessToken({ sub: user.id, role: user.role }),
    };
  }
}
