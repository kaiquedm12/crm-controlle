import { MessageDirection } from '@prisma/client';
import { prisma } from '../../../infra/database/prisma/client';
import { sendWhatsappMessage } from '../../../infra/integrations/whatsapp/whatsapp-client';
import { AppError } from '../../../shared/errors/AppError';

type SendMessageInput = {
  leadId: string;
  content: string;
  actorUserId: string;
};

export class MessagesService {
  list() {
    return prisma.message.findMany({
      include: {
        lead: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  async send(input: SendMessageInput) {
    const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });

    if (!lead) {
      throw new AppError('Lead nao encontrado', 404);
    }

    if (!lead.phone) {
      throw new AppError('Lead sem telefone para envio', 400);
    }

    const providerResult = await sendWhatsappMessage({
      phone: lead.phone,
      message: input.content,
    });

    const message = await prisma.message.create({
      data: {
        leadId: lead.id,
        userId: input.actorUserId,
        direction: MessageDirection.OUTBOUND,
        content: input.content,
        providerStatus: providerResult.providerStatus,
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: input.actorUserId,
        type: 'MESSAGE_SENT',
        description: 'Mensagem enviada via WhatsApp',
        metadata: {
          providerStatus: providerResult.providerStatus,
        },
      },
    });

    return message;
  }
}
