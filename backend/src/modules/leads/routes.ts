import { Router } from 'express';
import { LeadsService } from './application/leads-service';
import { LeadsController } from './controllers/leads-controller';

export const leadsRoutes = Router();
const leadsController = new LeadsController(new LeadsService());

leadsRoutes.get('/', leadsController.list);
leadsRoutes.post('/', leadsController.create);
leadsRoutes.patch('/:id', leadsController.update);
leadsRoutes.delete('/:id', leadsController.delete);
