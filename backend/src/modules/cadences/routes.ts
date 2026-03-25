import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ensureRole } from '../../shared/middlewares/ensure-role';
import { CadencesService } from './application/cadences-service';
import { CadencesController } from './controllers/cadences-controller';

export const cadencesRoutes = Router();
const cadencesController = new CadencesController(new CadencesService());

cadencesRoutes.get('/', cadencesController.list);
cadencesRoutes.post('/', ensureRole([UserRole.TENANT_ADMIN]), cadencesController.create);
cadencesRoutes.post('/:cadenceId/steps', ensureRole([UserRole.TENANT_ADMIN]), cadencesController.createStep);
cadencesRoutes.post('/assign', cadencesController.assign);
