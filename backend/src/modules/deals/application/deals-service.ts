import { DealStatus } from '@prisma/client';
import { prisma } from '../../../infra/database/prisma/client';

type CreateDealInput = {
  leadId: string;
  amount: number;
  status?: DealStatus;
  actorUserId: string;
};

type UpdateDealInput = {
  id: string;
  amount?: number;
  status?: DealStatus;
  actorUserId: string;
};

export class DealsService {
  list() {
    return prisma.deal.findMany({
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
        leadId: input.leadId,
        amount: input.amount,
        status: input.status ?? DealStatus.OPEN,
        closedAt: input.status && input.status !== DealStatus.OPEN ? new Date() : null,
      },
    });

    await prisma.activity.create({
      data: {
        leadId: input.leadId,
        userId: input.actorUserId,
        type: 'DEAL_CREATED',
        description: `Deal criado com valor ${input.amount}`,
      },
    });

    return deal;
  }

  async update(input: UpdateDealInput) {
    const deal = await prisma.deal.update({
      where: { id: input.id },
      data: {
        amount: input.amount,
        status: input.status,
        closedAt: input.status && input.status !== DealStatus.OPEN ? new Date() : undefined,
      },
    });

    await prisma.activity.create({
      data: {
        leadId: deal.leadId,
        userId: input.actorUserId,
        type: 'DEAL_UPDATED',
        description: `Deal atualizado para status ${deal.status}`,
      },
    });

    return deal;
  }
}
