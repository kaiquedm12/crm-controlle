import { DealStatus } from '@prisma/client';
import { prisma } from '../../../infra/database/prisma/client';

export class ReportsService {
  async funnel(tenantId: string) {
    const stages = await prisma.stage.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            leads: true,
          },
        },
        pipeline: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ pipelineId: 'asc' }, { position: 'asc' }],
    });

    return stages.map((stage) => ({
      stageId: stage.id,
      stageName: stage.name,
      pipelineId: stage.pipeline.id,
      pipelineName: stage.pipeline.name,
      leads: stage._count.leads,
    }));
  }

  async deals(tenantId: string) {
    const [openCount, wonCount, lostCount, deals] = await Promise.all([
      prisma.deal.count({ where: { tenantId, status: DealStatus.OPEN } }),
      prisma.deal.count({ where: { tenantId, status: DealStatus.WON } }),
      prisma.deal.count({ where: { tenantId, status: DealStatus.LOST } }),
      prisma.deal.findMany({ where: { tenantId }, select: { amount: true, status: true } }),
    ]);

    const wonRevenue = deals
      .filter((deal) => deal.status === DealStatus.WON)
      .reduce((sum, deal) => sum + Number(deal.amount), 0);

    return {
      openCount,
      wonCount,
      lostCount,
      wonRevenue,
    };
  }

  performanceUsers(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            leads: true,
            activities: true,
            messages: true,
          },
        },
      },
      orderBy: {
        leads: {
          _count: 'desc',
        },
      },
    });
  }
}
