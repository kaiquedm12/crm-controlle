import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ensureRole } from '../../shared/middlewares/ensure-role';
import { PipelineService } from './application/pipeline-service';
import { PipelineController } from './controllers/pipeline-controller';

export const pipelineRoutes = Router();
const pipelineController = new PipelineController(new PipelineService());

pipelineRoutes.get('/', pipelineController.list);
pipelineRoutes.post('/', ensureRole([UserRole.ADMIN, UserRole.MANAGER]), pipelineController.create);
pipelineRoutes.post('/:pipelineId/stages', ensureRole([UserRole.ADMIN, UserRole.MANAGER]), pipelineController.createStage);
pipelineRoutes.post('/move-lead/:leadId', pipelineController.moveLead);
