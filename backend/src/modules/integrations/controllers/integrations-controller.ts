import { Request, Response } from 'express';
import { z } from 'zod';
import { IntegrationsService } from '../application/integrations-service';
import { AppError } from '../../../shared/errors/AppError';

const webhookSchema = z.object({
  leadId: z.string(),
  content: z.string().min(1),
  providerStatus: z.string().optional(),
});

export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  whatsappWebhook = async (req: Request, res: Response): Promise<void> => {
    const body = webhookSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'];

    if (typeof tenantId !== 'string' || !tenantId) {
      throw new AppError('Header x-tenant-id obrigatorio no webhook', 400);
    }

    const result = await this.service.handleWhatsappWebhook({ ...body, tenantId });
    res.status(201).json(result);
  };
}
