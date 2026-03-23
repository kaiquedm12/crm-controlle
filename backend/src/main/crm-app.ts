import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../shared/middlewares/error-handler';
import { usersRoutes } from '../modules/users/routes';
import { leadsRoutes } from '../modules/leads/routes';
import { pipelineRoutes } from '../modules/pipeline/routes';
import { dealsRoutes } from '../modules/deals/routes';
import { cadencesRoutes } from '../modules/cadences/routes';
import { messagesRoutes } from '../modules/messages/routes';
import { reportsRoutes } from '../modules/reports/routes';
import { activitiesRoutes } from '../modules/activities/routes';
import { integrationsRoutes } from '../modules/integrations/routes';
import { ensureAuth } from '../shared/middlewares/ensure-auth';

export const crmApp = express();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

crmApp.use(cors());
crmApp.use(express.json());
crmApp.use(morgan('dev'));
crmApp.use(globalLimiter);

crmApp.get('/health', (_req, res) => {
  res.json({ service: 'crm', status: 'ok', timestamp: new Date().toISOString() });
});

crmApp.use('/integrations', integrationsRoutes);

crmApp.use(ensureAuth);
crmApp.use('/users', usersRoutes);
crmApp.use('/leads', leadsRoutes);
crmApp.use('/pipeline', pipelineRoutes);
crmApp.use('/deals', dealsRoutes);
crmApp.use('/cadences', cadencesRoutes);
crmApp.use('/messages', messagesRoutes);
crmApp.use('/reports', reportsRoutes);
crmApp.use('/activities', activitiesRoutes);

crmApp.use(errorHandler);
