import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { UsersService } from '../application/users-service';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export class UsersController {
  constructor(private readonly service: UsersService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.service.list();
    res.json(users);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createUserSchema.parse(req.body);
    const user = await this.service.create(body);
    res.status(201).json(user);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateUserSchema.parse(req.body);
    const user = await this.service.update(req.params.id, body);
    res.json(user);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id);
    res.status(204).send();
  };
}
