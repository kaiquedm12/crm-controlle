import { prisma } from '../../../infra/database/prisma/client';

type CreateTenantInput = {
  name: string;
  slug: string;
};

type UpdateTenantInput = {
  name?: string;
  slug?: string;
};

export class TenantsService {
  list() {
    return prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            leads: true,
          },
        },
      },
    });
  }

  create(input: CreateTenantInput) {
    return prisma.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
      },
    });
  }

  update(id: string, input: UpdateTenantInput) {
    return prisma.tenant.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.tenant.delete({ where: { id } });
  }
}
