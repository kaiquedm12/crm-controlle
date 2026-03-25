import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../shared/middlewares/error-handler';
import { authRoutes } from '../modules/auth/routes';
import { usersRoutes } from '../modules/users/routes';
import { leadsRoutes } from '../modules/leads/routes';
import { pipelineRoutes } from '../modules/pipeline/routes';
import { dealsRoutes } from '../modules/deals/routes';
import { cadencesRoutes } from '../modules/cadences/routes';
import { messagesRoutes } from '../modules/messages/routes';
import { reportsRoutes } from '../modules/reports/routes';
import { activitiesRoutes } from '../modules/activities/routes';
import { integrationsRoutes } from '../modules/integrations/routes';
import { tenantsRoutes } from '../modules/tenants/routes';
import { adminRoutes } from '../modules/admin/routes';
import { ensureAuth } from '../shared/middlewares/ensure-auth';
import { ensureTenant } from '../shared/middlewares/ensure-tenant';

export const app = express();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(globalLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authLimiter, authRoutes);
app.use('/integrations', integrationsRoutes);

app.use(ensureAuth);
app.use('/admin', adminRoutes);
app.use('/tenants', tenantsRoutes);
app.use(ensureTenant);
app.use('/users', usersRoutes);
app.use('/leads', leadsRoutes);
app.use('/pipeline', pipelineRoutes);
app.use('/deals', dealsRoutes);
app.use('/cadences', cadencesRoutes);
app.use('/messages', messagesRoutes);
app.use('/reports', reportsRoutes);
app.use('/activities', activitiesRoutes);

app.use(errorHandler);
