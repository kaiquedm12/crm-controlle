import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ensureRole } from '../../shared/middlewares/ensure-role';
import { AdminService } from './application/admin-service';
import { AdminController } from './controllers/admin-controller';

const adminController = new AdminController(new AdminService());

export const adminRoutes = Router();

adminRoutes.use(ensureRole([UserRole.SUPER_ADMIN]));

adminRoutes.get('/users', adminController.listGlobalUsers);
adminRoutes.patch('/users/:id/status', adminController.updateUserStatus);

adminRoutes.get('/tenants', adminController.listTenants);
adminRoutes.post('/tenants', adminController.createTenant);
adminRoutes.patch('/tenants/:id', adminController.updateTenant);
adminRoutes.get('/tenants/:id/users', adminController.listTenantUsers);
