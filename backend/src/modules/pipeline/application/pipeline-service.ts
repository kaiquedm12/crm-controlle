import { prisma } from '../../../infra/database/prisma/client';

type CreatePipelineInput = {
  name: string;
  description?: string;
  createdById: string;
};

type CreateStageInput = {
  pipelineId: string;
  name: string;
  position: number;
};

type MoveLeadInput = {
  leadId: string;
  actorUserId: string;
  stageId: string;
  position?: number;
};

export class PipelineService {
  list() {
    return prisma.pipeline.findMany({
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(input: CreatePipelineInput) {
    return prisma.pipeline.create({
      data: {
        name: input.name,
        description: input.description,
        createdById: input.createdById,
      },
    });
  }

  createStage(input: CreateStageInput) {
    return prisma.stage.create({
      data: {
        pipelineId: input.pipelineId,
        name: input.name,
        position: input.position,
      },
    });
  }

  async moveLead(input: MoveLeadInput) {
    const lead = await prisma.lead.update({
      where: { id: input.leadId },
      data: {
        stageId: input.stageId,
        position: input.position ?? 0,
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: input.actorUserId,
        type: 'LEAD_MOVED',
        description: `Lead movido para stage ${input.stageId}`,
        metadata: {
          stageId: input.stageId,
          position: input.position ?? 0,
        },
      },
    });

    return lead;
  }
}
