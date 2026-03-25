import { prisma } from '../../../infra/database/prisma/client';

type CreatePipelineInput = {
  tenantId: string;
  name: string;
  description?: string;
  createdById: string;
};

type CreateStageInput = {
  tenantId: string;
  pipelineId: string;
  name: string;
  position: number;
};

type MoveLeadInput = {
  tenantId: string;
  leadId: string;
  actorUserId: string;
  stageId: string;
  position?: number;
};

export class PipelineService {
  list(tenantId: string) {
    return prisma.pipeline.findMany({
      where: { tenantId },
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
        tenantId: input.tenantId,
        name: input.name,
        description: input.description,
        createdById: input.createdById,
      },
    });
  }

  createStage(input: CreateStageInput) {
    return prisma.stage.create({
      data: {
        tenantId: input.tenantId,
        pipelineId: input.pipelineId,
        name: input.name,
        position: input.position,
      },
    });
  }

  async moveLead(input: MoveLeadInput) {
    const lead = await prisma.$transaction(async (tx) => {
      const currentLead = await tx.lead.findUnique({
        where: { id: input.leadId },
        select: {
          id: true,
          stageId: true,
          position: true,
          tenantId: true,
        },
      });

      if (!currentLead) {
        throw new Error('Lead nao encontrado');
      }

      if (currentLead.tenantId !== input.tenantId) {
        throw new Error('Lead fora do tenant ativo');
      }

      const targetStage = await tx.stage.findUnique({
        where: { id: input.stageId },
        select: {
          id: true,
          pipelineId: true,
          tenantId: true,
        },
      });

      if (!targetStage) {
        throw new Error('Stage de destino nao encontrado');
      }

      if (targetStage.tenantId !== input.tenantId) {
        throw new Error('Stage fora do tenant ativo');
      }

      const targetCount = await tx.lead.count({
        where: {
          stageId: input.stageId,
          id: {
            not: currentLead.id,
          },
        },
      });

      const boundedTargetPosition = Math.max(0, Math.min(input.position ?? 0, targetCount));

      if (currentLead.stageId === input.stageId) {
        if (boundedTargetPosition > currentLead.position) {
          await tx.lead.updateMany({
            where: {
              stageId: input.stageId,
              id: { not: currentLead.id },
              position: {
                gt: currentLead.position,
                lte: boundedTargetPosition,
              },
            },
            data: {
              position: {
                decrement: 1,
              },
            },
          });
        } else if (boundedTargetPosition < currentLead.position) {
          await tx.lead.updateMany({
            where: {
              stageId: input.stageId,
              id: { not: currentLead.id },
              position: {
                gte: boundedTargetPosition,
                lt: currentLead.position,
              },
            },
            data: {
              position: {
                increment: 1,
              },
            },
          });
        }
      } else {
        if (currentLead.stageId) {
          await tx.lead.updateMany({
            where: {
              stageId: currentLead.stageId,
              position: {
                gt: currentLead.position,
              },
            },
            data: {
              position: {
                decrement: 1,
              },
            },
          });
        }

        await tx.lead.updateMany({
          where: {
            stageId: input.stageId,
            id: { not: currentLead.id },
            position: {
              gte: boundedTargetPosition,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      }

      return tx.lead.update({
        where: { id: input.leadId },
        data: {
          stageId: input.stageId,
          pipelineId: targetStage.pipelineId,
          position: boundedTargetPosition,
        },
      });
    });

    await prisma.activity.create({
      data: {
        tenantId: input.tenantId,
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
