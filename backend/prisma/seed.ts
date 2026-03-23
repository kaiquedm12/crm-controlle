import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@crm.local',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Pipeline Principal',
      description: 'Pipeline inicial do CRM',
      createdById: admin.id,
      stages: {
        create: [
          { name: 'Lead', position: 1 },
          { name: 'Contato', position: 2 },
          { name: 'Proposta', position: 3 },
          { name: 'Fechado', position: 4 },
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
