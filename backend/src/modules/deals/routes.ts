import { Router } from 'express';
import { DealsService } from './application/deals-service';
import { DealsController } from './controllers/deals-controller';

export const dealsRoutes = Router();
const dealsController = new DealsController(new DealsService());

dealsRoutes.get('/', dealsController.list);
dealsRoutes.post('/', dealsController.create);
dealsRoutes.patch('/:id', dealsController.update);
