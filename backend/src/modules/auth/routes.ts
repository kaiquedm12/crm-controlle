import { Router } from 'express';
import { AuthService } from './application/auth-service';
import { AuthController } from './controllers/auth-controller';

export const authRoutes = Router();
const authController = new AuthController(new AuthService());

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.post('/refresh', authController.refresh);
