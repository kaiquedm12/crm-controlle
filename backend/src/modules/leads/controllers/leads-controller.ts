import { Request, Response } from 'express';
import { DealStatus } from '@prisma/client';
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
  dealStatus: z.nativeEnum(DealStatus).optional(),
  dealAmount: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
});

const updateLeadSchema = createLeadSchema.partial();

export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const leads = await this.service.list(req.user!.actingTenantId!);
    res.json(leads);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createLeadSchema.parse(req.body);
    const lead = await this.service.create({
      ...body,
      tenantId: req.user!.actingTenantId!,
      ownerId: req.user!.id,
    });
    res.status(201).json(lead);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateLeadSchema.parse(req.body);
    const lead = await this.service.update(req.params.id, req.user!.id, req.user!.actingTenantId!, body);
    res.json(lead);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id, req.user!.actingTenantId!);
    res.status(204).send();
  };
}
