import { Router } from 'express';
import { ActivitiesService } from './application/activities-service';
import { ActivitiesController } from './controllers/activities-controller';

export const activitiesRoutes = Router();
const activitiesController = new ActivitiesController(new ActivitiesService());

activitiesRoutes.get('/', activitiesController.list);
activitiesRoutes.get('/lead/:leadId', activitiesController.listByLead);
