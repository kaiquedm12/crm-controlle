import { UserRole } from '@prisma/client';
import { prisma } from '../../../infra/database/prisma/client';
import { hashPassword } from '../../../shared/utils/password';

type CreateUserInput = {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type UpdateUserInput = {
  tenantId: string;
  name?: string;
  role?: UserRole;
};

export class UsersService {
  list(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateUserInput) {
    const passwordHash = await hashPassword(input.password);

    return prisma.user.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  update(id: string, input: UpdateUserInput) {
    return prisma.user
      .updateMany({
        where: { id, tenantId: input.tenantId },
        data: {
          name: input.name,
          role: input.role,
        },
      })
      .then(() =>
        prisma.user.findFirstOrThrow({
          where: { id, tenantId: input.tenantId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        }),
      );
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.user.deleteMany({ where: { id, tenantId } });
  }
}
