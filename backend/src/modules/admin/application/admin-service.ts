import { prisma } from '../../../infra/database/prisma/client';
import { hashPassword } from '../../../shared/utils/password';

type ListGlobalUsersInput = {
  page: number;
  pageSize: number;
  search?: string;
  tenantId?: string;
};

type ListTenantsInput = {
  page: number;
  pageSize: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'TRIAL';
};

type CreateTenantInput = {
  companyName: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL';
  adminName: string;
  adminEmail: string;
  temporaryPassword?: string;
};

type UpdateTenantInput = {
  companyName?: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  plan?: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status?: 'ACTIVE' | 'INACTIVE' | 'TRIAL';
};

function buildSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40);
}

function generateTempPassword() {
  return `Temp#${Math.random().toString(36).slice(2, 10)}A1`;
}

export class AdminService {
  async listGlobalUsers(input: ListGlobalUsersInput) {
    const where = {
      tenantId: input.tenantId ?? undefined,
      OR: input.search
        ? [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { email: { contains: input.search, mode: 'insensitive' as const } },
          ]
        : undefined,
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      items: users.map((user) => ({
        user_id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: (user as any).isActive ?? true,
        tenant_id: user.tenantId,
        tenant_name: (user as any).tenant?.name ?? null,
        created_at: user.createdAt,
      })),
    };
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive } as any,
    });

    const tenant = user.tenantId ? await prisma.tenant.findUnique({ where: { id: user.tenantId } }) : null;

    return {
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: (user as any).isActive ?? true,
      tenant_id: user.tenantId,
      tenant_name: tenant?.name ?? null,
      created_at: user.createdAt,
    };
  }

  async listTenants(input: ListTenantsInput) {
    const where: any = {
      status: input.status,
      OR: input.search
        ? [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { email: { contains: input.search, mode: 'insensitive' as const } },
          ]
        : undefined,
    };

    const [total, tenants] = await Promise.all([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      items: tenants.map((tenant) => ({
        tenant_id: tenant.id,
        company_name: tenant.name,
        cnpj: (tenant as any).cnpj,
        email: (tenant as any).email,
        phone: (tenant as any).phone,
        plan: (tenant as any).plan,
        status: (tenant as any).status,
        created_at: tenant.createdAt,
        users_count: tenant._count.users,
      })),
    };
  }

  async createTenant(input: CreateTenantInput) {
    const temporaryPassword = input.temporaryPassword || generateTempPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    const baseSlug = buildSlug(input.companyName) || 'tenant';

    const result = await prisma.$transaction(async (tx) => {
      let slug = baseSlug;
      let cursor = 1;

      // Generate unique slug without extra DB constraints handling in app layer.
      while (await tx.tenant.findUnique({ where: { slug } })) {
        cursor += 1;
        slug = `${baseSlug}-${cursor}`;
      }

      const tenant = await tx.tenant.create({
        data: {
          name: input.companyName,
          slug,
          cnpj: input.cnpj,
          email: input.email,
          phone: input.phone,
          plan: input.plan,
          status: input.status,
        } as any,
      });

      const adminUser = await tx.user.create({
        data: {
          name: input.adminName,
          email: input.adminEmail,
          passwordHash,
          role: 'TENANT_ADMIN',
          tenantId: tenant.id,
          isActive: true,
        } as any,
      });

      const defaultPipeline = await tx.pipeline.create({
        data: {
          tenantId: tenant.id,
          name: 'Pipeline Comercial',
          description: 'Pipeline inicial criado automaticamente',
          createdById: adminUser.id,
        },
      });

      await tx.stage.createMany({
        data: [
          { tenantId: tenant.id, pipelineId: defaultPipeline.id, name: 'Leads', position: 1 },
          { tenantId: tenant.id, pipelineId: defaultPipeline.id, name: 'Contato', position: 2 },
          { tenantId: tenant.id, pipelineId: defaultPipeline.id, name: 'Proposta', position: 3 },
          { tenantId: tenant.id, pipelineId: defaultPipeline.id, name: 'Fechado', position: 4 },
        ],
      });

      return { tenant, adminUser };
    });

    return {
      tenant_id: result.tenant.id,
      company_name: result.tenant.name,
      plan: (result.tenant as any).plan ?? 'BASIC',
      status: (result.tenant as any).status ?? 'TRIAL',
      created_at: result.tenant.createdAt,
      users_count: 1,
      admin_user: {
        user_id: result.adminUser.id,
        name: result.adminUser.name,
        email: result.adminUser.email,
      },
      temporary_password: temporaryPassword,
    };
  }

  async updateTenant(tenantId: string, input: UpdateTenantInput) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: input.companyName,
        cnpj: input.cnpj,
        email: input.email,
        phone: input.phone,
        plan: input.plan,
        status: input.status,
      } as any,
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return {
      tenant_id: tenant.id,
      company_name: tenant.name,
      cnpj: (tenant as any).cnpj,
      email: (tenant as any).email,
      phone: (tenant as any).phone,
      plan: (tenant as any).plan,
      status: (tenant as any).status,
      created_at: tenant.createdAt,
      users_count: tenant._count.users,
    };
  }

  async listTenantUsers(tenantId: string) {
    const users = await prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: (user as any).isActive ?? true,
      created_at: user.createdAt,
    }));
  }
}
