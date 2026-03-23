import { Router } from 'express';
import { ReportsService } from './application/reports-service';
import { ReportsController } from './controllers/reports-controller';

export const reportsRoutes = Router();
const reportsController = new ReportsController(new ReportsService());

reportsRoutes.get('/funnel', reportsController.funnel);
reportsRoutes.get('/deals', reportsController.deals);
reportsRoutes.get('/performance/users', reportsController.performanceUsers);
