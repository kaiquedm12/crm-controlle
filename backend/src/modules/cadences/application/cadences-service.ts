import { CadenceExecutionStatus, CadenceStepType } from '@prisma/client';
import { prisma } from '../../../infra/database/prisma/client';

type CreateCadenceInput = {
  tenantId: string;
  name: string;
  isActive?: boolean;
  createdBy: string;
};

type CreateStepInput = {
  tenantId: string;
  cadenceId: string;
  order: number;
  dayOffset: number;
  type: CadenceStepType;
  template: string;
};

type AssignCadenceInput = {
  tenantId: string;
  leadId: string;
  cadenceId: string;
  startInMinutes?: number;
  actorUserId: string;
};

export class CadencesService {
  list(tenantId: string) {
    return prisma.cadence.findMany({
      where: { tenantId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        executions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(input: CreateCadenceInput) {
    return prisma.cadence.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        isActive: input.isActive ?? true,
        createdBy: input.createdBy,
      },
    });
  }

  createStep(input: CreateStepInput) {
    return prisma.cadenceStep.create({
      data: {
        tenantId: input.tenantId,
        cadenceId: input.cadenceId,
        order: input.order,
        dayOffset: input.dayOffset,
        type: input.type,
        template: input.template,
      },
    });
  }

  async assign(input: AssignCadenceInput) {
    const execution = await prisma.cadenceExecution.upsert({
      where: {
        cadenceId_leadId: {
          cadenceId: input.cadenceId,
          leadId: input.leadId,
        },
      },
      update: {
        status: CadenceExecutionStatus.ACTIVE,
        stepIndex: 0,
        nextRunAt: new Date(Date.now() + (input.startInMinutes ?? 1) * 60 * 1000),
        lastError: null,
      },
      create: {
        tenantId: input.tenantId,
        cadenceId: input.cadenceId,
        leadId: input.leadId,
        status: CadenceExecutionStatus.ACTIVE,
        stepIndex: 0,
        nextRunAt: new Date(Date.now() + (input.startInMinutes ?? 1) * 60 * 1000),
      },
    });

    await prisma.activity.create({
      data: {
        tenantId: input.tenantId,
        leadId: input.leadId,
        userId: input.actorUserId,
        type: 'CADENCE_ASSIGNED',
        description: `Cadencia ${input.cadenceId} atribuida ao lead`,
      },
    });

    return execution;
  }
}
