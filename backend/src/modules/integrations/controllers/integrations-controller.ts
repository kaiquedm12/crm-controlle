import { Request, Response } from 'express';
import { z } from 'zod';
import { IntegrationsService } from '../application/integrations-service';

const webhookSchema = z.object({
  leadId: z.string(),
  content: z.string().min(1),
  providerStatus: z.string().optional(),
});

export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  whatsappWebhook = async (req: Request, res: Response): Promise<void> => {
    const body = webhookSchema.parse(req.body);
    const result = await this.service.handleWhatsappWebhook(body);
    res.status(201).json(result);
  };
}
