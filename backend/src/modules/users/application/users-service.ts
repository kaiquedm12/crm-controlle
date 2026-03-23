import { UserRole } from '@prisma/client';
import { prisma } from '../../../infra/database/prisma/client';
import { hashPassword } from '../../../shared/utils/password';

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type UpdateUserInput = {
  name?: string;
  role?: UserRole;
};

export class UsersService {
  list() {
    return prisma.user.findMany({
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
    return prisma.user.update({
      where: { id },
      data: {
        name: input.name,
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

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
