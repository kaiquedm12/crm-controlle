import { DealStatus } from '@prisma/client';
import { prisma } from '../../../infra/database/prisma/client';

type CreateDealInput = {
  tenantId: string;
  leadId: string;
  amount: number;
  status?: DealStatus;
  actorUserId: string;
};

type UpdateDealInput = {
  tenantId: string;
  id: string;
  amount?: number;
  status?: DealStatus;
  actorUserId: string;
};

export class DealsService {
  list(tenantId: string) {
    return prisma.deal.findMany({
      where: { tenantId },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateDealInput) {
    const deal = await prisma.deal.create({
      data: {
        tenantId: input.tenantId,
        leadId: input.leadId,
        amount: input.amount,
        status: input.status ?? DealStatus.OPEN,
        closedAt: input.status && input.status !== DealStatus.OPEN ? new Date() : null,
      },
    });

    await prisma.activity.create({
      data: {
        tenantId: input.tenantId,
        leadId: input.leadId,
        userId: input.actorUserId,
        type: 'DEAL_CREATED',
        description: `Deal criado com valor ${input.amount}`,
      },
    });

    return deal;
  }

  async update(input: UpdateDealInput) {
    await prisma.deal.updateMany({
      where: { id: input.id, tenantId: input.tenantId },
      data: {
        amount: input.amount,
        status: input.status,
        closedAt: input.status && input.status !== DealStatus.OPEN ? new Date() : undefined,
      },
    });

    const deal = await prisma.deal.findFirstOrThrow({
      where: { id: input.id, tenantId: input.tenantId },
    });

    await prisma.activity.create({
      data: {
        tenantId: input.tenantId,
        leadId: deal.leadId,
        userId: input.actorUserId,
        type: 'DEAL_UPDATED',
        description: `Deal atualizado para status ${deal.status}`,
      },
    });

    return deal;
  }
}
