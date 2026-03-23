import { Request, Response } from 'express';
import { z } from 'zod';
import { LeadsService } from '../application/leads-service';

const createLeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateLeadSchema = createLeadSchema.partial();

export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const leads = await this.service.list();
    res.json(leads);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createLeadSchema.parse(req.body);
    const lead = await this.service.create({
      ...body,
      ownerId: req.user!.id,
    });
    res.status(201).json(lead);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateLeadSchema.parse(req.body);
    const lead = await this.service.update(req.params.id, req.user!.id, body);
    res.json(lead);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id);
    res.status(204).send();
  };
}
