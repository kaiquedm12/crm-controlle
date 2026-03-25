import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ensureRole } from '../../shared/middlewares/ensure-role';
import { TenantsService } from './application/tenants-service';
import { TenantsController } from './controllers/tenants-controller';

export const tenantsRoutes = Router();
const tenantsController = new TenantsController(new TenantsService());

tenantsRoutes.get('/', ensureRole([UserRole.SUPER_ADMIN]), tenantsController.list);
tenantsRoutes.post('/', ensureRole([UserRole.SUPER_ADMIN]), tenantsController.create);
tenantsRoutes.patch('/:id', ensureRole([UserRole.SUPER_ADMIN]), tenantsController.update);
tenantsRoutes.delete('/:id', ensureRole([UserRole.SUPER_ADMIN]), tenantsController.delete);
