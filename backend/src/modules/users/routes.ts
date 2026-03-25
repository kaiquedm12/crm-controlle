import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ensureRole } from '../../shared/middlewares/ensure-role';
import { UsersService } from './application/users-service';
import { UsersController } from './controllers/users-controller';

export const usersRoutes = Router();
const usersController = new UsersController(new UsersService());

usersRoutes.get('/', ensureRole([UserRole.TENANT_ADMIN]), usersController.list);
usersRoutes.post('/', ensureRole([UserRole.TENANT_ADMIN]), usersController.create);
usersRoutes.patch('/:id', ensureRole([UserRole.TENANT_ADMIN]), usersController.update);
usersRoutes.delete('/:id', ensureRole([UserRole.TENANT_ADMIN]), usersController.delete);
