import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ensureRole } from '../../shared/middlewares/ensure-role';
import { UsersService } from './application/users-service';
import { UsersController } from './controllers/users-controller';

export const usersRoutes = Router();
const usersController = new UsersController(new UsersService());

usersRoutes.get('/', ensureRole([UserRole.ADMIN, UserRole.MANAGER]), usersController.list);
usersRoutes.post('/', ensureRole([UserRole.ADMIN]), usersController.create);
usersRoutes.patch('/:id', ensureRole([UserRole.ADMIN]), usersController.update);
usersRoutes.delete('/:id', ensureRole([UserRole.ADMIN]), usersController.delete);
