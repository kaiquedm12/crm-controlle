import { prisma } from '../../../infra/database/prisma/client';

export class ActivitiesService {
  list() {
    return prisma.activity.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  listByLead(leadId: string) {
    return prisma.activity.findMany({
      where: { leadId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
