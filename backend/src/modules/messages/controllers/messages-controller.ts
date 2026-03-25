import { Request, Response } from 'express';
import { z } from 'zod';
import { MessagesService } from '../application/messages-service';

const sendMessageSchema = z.object({
  leadId: z.string(),
  content: z.string().min(1),
});

export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const messages = await this.service.list(req.user!.actingTenantId!);
    res.json(messages);
  };

  send = async (req: Request, res: Response): Promise<void> => {
    const body = sendMessageSchema.parse(req.body);
    const message = await this.service.send({
      ...body,
      tenantId: req.user!.actingTenantId!,
      actorUserId: req.user!.id,
    });

    res.status(201).json(message);
  };
}
