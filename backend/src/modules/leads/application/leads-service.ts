import { prisma } from '../../../infra/database/prisma/client';
import { DealStatus, Prisma } from '@prisma/client';

type CreateLeadInput = {
  tenantId: string;
  ownerId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  pipelineId?: string;
  stageId?: string;
  dealStatus?: DealStatus;
  dealAmount?: number;
  tags?: string[];
};

type UpdateLeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  pipelineId?: string;
  stageId?: string;
  dealStatus?: DealStatus;
  dealAmount?: number;
};

async function syncLeadDeal(
  tx: Prisma.TransactionClient,
  tenantId: string,
  leadId: string,
  dealStatus?: DealStatus,
  dealAmount?: number,
) {
  if (dealStatus === undefined && dealAmount === undefined) {
    return;
  }

  const existing = await tx.deal.findUnique({
    where: { leadId },
    select: { amount: true, status: true },
  });

  const nextStatus = dealStatus ?? existing?.status ?? DealStatus.OPEN;
  const nextAmount = dealAmount ?? (existing ? Number(existing.amount) : 0);

  await tx.deal.upsert({
    where: { leadId },
    create: {
      tenantId,
      leadId,
      status: nextStatus,
      amount: new Prisma.Decimal(nextAmount),
      closedAt: nextStatus === DealStatus.OPEN ? null : new Date(),
    },
    update: {
      status: nextStatus,
      amount: new Prisma.Decimal(nextAmount),
      closedAt: nextStatus === DealStatus.OPEN ? null : new Date(),
    },
  });
}

export class LeadsService {
  list(tenantId: string) {
    return prisma.lead.findMany({
      where: { tenantId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        pipeline: true,
        deal: true,
        leadTags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateLeadInput) {
    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          tenantId: input.tenantId,
          ownerId: input.ownerId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          notes: input.notes,
          pipelineId: input.pipelineId,
          stageId: input.stageId,
          leadTags: input.tags
            ? {
                create: input.tags.map((tagName) => ({
                  tag: {
                    connectOrCreate: {
                      where: {
                        tenantId_name: {
                          tenantId: input.tenantId,
                          name: tagName,
                        },
                      },
                      create: { tenantId: input.tenantId, name: tagName },
                    },
                  },
                  tenant: {
                    connect: {
                      id: input.tenantId,
                    },
                  },
                })),
              }
            : undefined,
        },
      });

      await syncLeadDeal(tx, input.tenantId, createdLead.id, input.dealStatus, input.dealAmount);

      return tx.lead.findUniqueOrThrow({
        where: { id: createdLead.id },
        include: {
          deal: true,
          leadTags: { include: { tag: true } },
        },
      });
    });

    await prisma.activity.create({
      data: {
        tenantId: input.tenantId,
        leadId: lead.id,
        userId: input.ownerId,
        type: 'LEAD_CREATED',
        description: `Lead ${lead.name} criado`,
      },
    });

    return lead;
  }

  async update(id: string, actorUserId: string, tenantId: string, input: UpdateLeadInput) {
    await prisma.$transaction(async (tx) => {
      await tx.lead.updateMany({
        where: { id, tenantId },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          notes: input.notes,
          pipelineId: input.pipelineId,
          stageId: input.stageId,
        },
      });

      await syncLeadDeal(tx, tenantId, id, input.dealStatus, input.dealAmount);
    });

    const lead = await prisma.lead.findFirstOrThrow({
      where: { id, tenantId },
      include: {
        deal: true,
        leadTags: { include: { tag: true } },
        stage: true,
        pipeline: true,
      },
    });

    await prisma.activity.create({
      data: {
        tenantId,
        leadId: lead.id,
        userId: actorUserId,
        type: 'LEAD_UPDATED',
        description: `Lead ${lead.name} atualizado`,
      },
    });

    return lead;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.lead.deleteMany({ where: { id, tenantId } });
  }
}
