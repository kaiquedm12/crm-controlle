import { Request, Response } from 'express';
import { CadenceStepType } from '@prisma/client';
import { z } from 'zod';
import { CadencesService } from '../application/cadences-service';

const createCadenceSchema = z.object({
  name: z.string().min(2),
  isActive: z.boolean().optional(),
});

const createStepSchema = z.object({
  order: z.number().int().positive(),
  dayOffset: z.number().int().nonnegative(),
  type: z.nativeEnum(CadenceStepType),
  template: z.string().min(1),
});

const assignCadenceSchema = z.object({
  leadId: z.string(),
  cadenceId: z.string(),
  startInMinutes: z.number().int().nonnegative().optional(),
});

export class CadencesController {
  constructor(private readonly service: CadencesService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const cadences = await this.service.list();
    res.json(cadences);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createCadenceSchema.parse(req.body);
    const cadence = await this.service.create({
      ...body,
      createdBy: req.user!.id,
    });

    res.status(201).json(cadence);
  };

  createStep = async (req: Request, res: Response): Promise<void> => {
    const body = createStepSchema.parse(req.body);
    const step = await this.service.createStep({
      cadenceId: req.params.cadenceId,
      ...body,
    });

    res.status(201).json(step);
  };

  assign = async (req: Request, res: Response): Promise<void> => {
    const body = assignCadenceSchema.parse(req.body);
    const execution = await this.service.assign({
      ...body,
      actorUserId: req.user!.id,
    });

    res.status(201).json(execution);
  };
}
