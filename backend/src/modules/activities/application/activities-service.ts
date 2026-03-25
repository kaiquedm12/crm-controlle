import { prisma } from '../../../infra/database/prisma/client';

export class ActivitiesService {
  list(tenantId: string) {
    return prisma.activity.findMany({
      where: { tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  listByLead(leadId: string, tenantId: string) {
    return prisma.activity.findMany({
      where: { leadId, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
