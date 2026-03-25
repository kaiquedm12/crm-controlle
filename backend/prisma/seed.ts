import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: { name: 'Acme Inc' },
    create: {
      name: 'Acme Inc',
      slug: 'acme',
    },
  });

  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@crm.local',
      },
    },
    update: {
      role: UserRole.TENANT_ADMIN,
      passwordHash,
    },
    create: {
      name: 'Admin',
      email: 'admin@crm.local',
      passwordHash,
      role: UserRole.TENANT_ADMIN,
      tenantId: tenant.id,
    },
  });

  const root = await prisma.user.findFirst({
    where: {
      email: 'root@crm.local',
      tenantId: null,
    },
  });

  if (root) {
    await prisma.user.update({
      where: { id: root.id },
      data: {
        role: UserRole.SUPER_ADMIN,
        passwordHash,
        tenantId: null,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        name: 'Root',
        email: 'root@crm.local',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
      },
    });
  }

  const pipeline = await prisma.pipeline.create({
    data: {
      tenantId: tenant.id,
      name: 'Pipeline Principal',
      description: 'Pipeline inicial do CRM',
      createdById: admin.id,
      stages: {
        create: [
          { tenantId: tenant.id, name: 'Lead', position: 1 },
          { tenantId: tenant.id, name: 'Contato', position: 2 },
          { tenantId: tenant.id, name: 'Proposta', position: 3 },
          { tenantId: tenant.id, name: 'Fechado', position: 4 },
        ],
      },
    },
  });

  console.log('Seed concluido:', { admin: admin.email, pipeline: pipeline.name });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
