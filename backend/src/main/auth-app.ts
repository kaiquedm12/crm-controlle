import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../shared/middlewares/error-handler';
import { authRoutes } from '../modules/auth/routes';

export const authApp = express();

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

authApp.use(cors());
authApp.use(express.json());
authApp.use(morgan('dev'));
authApp.use(globalLimiter);

authApp.get('/health', (_req, res) => {
  res.json({ service: 'auth', status: 'ok', timestamp: new Date().toISOString() });
});

authApp.use('/auth', authLimiter, authRoutes);

authApp.use(errorHandler);
