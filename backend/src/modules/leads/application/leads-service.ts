import { prisma } from '../../../infra/database/prisma/client';

type CreateLeadInput = {
  ownerId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  pipelineId?: string;
  stageId?: string;
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
};

export class LeadsService {
  list() {
    return prisma.lead.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        pipeline: true,
        leadTags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateLeadInput) {
    const lead = await prisma.lead.create({
      data: {
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
                    where: { name: tagName },
                    create: { name: tagName },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        leadTags: { include: { tag: true } },
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: input.ownerId,
        type: 'LEAD_CREATED',
        description: `Lead ${lead.name} criado`,
      },
    });

    return lead;
  }

  async update(id: string, actorUserId: string, input: UpdateLeadInput) {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        notes: input.notes,
        pipelineId: input.pipelineId,
        stageId: input.stageId,
      },
      include: {
        leadTags: { include: { tag: true } },
        stage: true,
        pipeline: true,
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: actorUserId,
        type: 'LEAD_UPDATED',
        description: `Lead ${lead.name} atualizado`,
      },
    });

    return lead;
  }

  async delete(id: string): Promise<void> {
    await prisma.lead.delete({ where: { id } });
  }
}
