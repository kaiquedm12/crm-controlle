import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { AuthService } from '../application/auth-service';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const body = registerSchema.parse(req.body);
    const result = await this.service.register(body);
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const body = loginSchema.parse(req.body);
    const result = await this.service.login(body);
    res.json(result);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const body = refreshSchema.parse(req.body);
    const result = await this.service.refresh(body);
    res.json(result);
  };
}
