import cron from 'node-cron';
import { CadenceExecutionStatus, CadenceStepType, MessageDirection } from '@prisma/client';
import { prisma } from '../database/prisma/client';
import { sendWhatsappMessage } from '../integrations/whatsapp/whatsapp-client';

async function executeDueCadences(): Promise<void> {
  const dueExecutions = await prisma.cadenceExecution.findMany({
    where: {
      status: CadenceExecutionStatus.ACTIVE,
      nextRunAt: { lte: new Date() },
      cadence: { isActive: true },
    },
    include: {
      cadence: {
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
      },
      lead: true,
    },
    take: 100,
  });

  for (const execution of dueExecutions) {
    const step = execution.cadence.steps[execution.stepIndex];

    if (!step) {
      await prisma.cadenceExecution.update({
        where: { id: execution.id },
        data: { status: CadenceExecutionStatus.COMPLETED },
      });
      continue;
    }

    try {
      if (step.type === CadenceStepType.WHATSAPP && execution.lead.phone) {
        const result = await sendWhatsappMessage({
          phone: execution.lead.phone,
          message: step.template,
        });

        await prisma.message.create({
          data: {
            leadId: execution.leadId,
            direction: MessageDirection.OUTBOUND,
            content: step.template,
            providerStatus: result.providerStatus,
          },
        });
      }

      await prisma.activity.create({
        data: {
          leadId: execution.leadId,
          type: 'CADENCE_STEP_EXECUTED',
          description: `Step ${execution.stepIndex + 1} executado`,
          metadata: {
            cadenceId: execution.cadenceId,
            stepType: step.type,
          },
        },
      });

      const nextStep = execution.cadence.steps[execution.stepIndex + 1];
      const nextRunAt = nextStep
        ? new Date(Date.now() + Math.max(1, nextStep.dayOffset) * 24 * 60 * 60 * 1000)
        : execution.nextRunAt;

      await prisma.cadenceExecution.update({
        where: { id: execution.id },
        data: {
          stepIndex: execution.stepIndex + 1,
          nextRunAt,
          status: nextStep ? CadenceExecutionStatus.ACTIVE : CadenceExecutionStatus.COMPLETED,
          lastError: null,
        },
      });
    } catch (error) {
      await prisma.cadenceExecution.update({
        where: { id: execution.id },
        data: {
          lastError: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });
    }
  }
}

export function startCadenceScheduler(): void {
  cron.schedule('* * * * *', () => {
    executeDueCadences().catch((error) => {
      console.error('Erro no scheduler de cadencias:', error);
    });
  });
}
