import { Router } from 'express';
import { IntegrationsService } from './application/integrations-service';
import { IntegrationsController } from './controllers/integrations-controller';

export const integrationsRoutes = Router();
const integrationsController = new IntegrationsController(new IntegrationsService());

integrationsRoutes.post('/whatsapp/webhook', integrationsController.whatsappWebhook);
