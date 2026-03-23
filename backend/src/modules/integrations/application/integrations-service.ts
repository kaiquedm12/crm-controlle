import { MessageDirection } from '@prisma/client';
import { prisma } from '../../../infra/database/prisma/client';

type WhatsappWebhookInput = {
  leadId: string;
  content: string;
  providerStatus?: string;
};

export class IntegrationsService {
  async handleWhatsappWebhook(input: WhatsappWebhookInput) {
    const message = await prisma.message.create({
      data: {
        leadId: input.leadId,
        direction: MessageDirection.INBOUND,
        content: input.content,
        providerStatus: input.providerStatus ?? 'received',
      },
    });

    await prisma.activity.create({
      data: {
        leadId: input.leadId,
        type: 'WHATSAPP_RECEIVED',
        description: 'Mensagem recebida pelo webhook',
      },
    });

    return { ok: true, messageId: message.id };
  }
}
