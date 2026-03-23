import { Request, Response } from 'express';
import { DealStatus } from '@prisma/client';
import { z } from 'zod';
import { DealsService } from '../application/deals-service';

const createDealSchema = z.object({
  leadId: z.string(),
  amount: z.number().positive(),
  status: z.nativeEnum(DealStatus).optional(),
});

const updateDealSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.nativeEnum(DealStatus).optional(),
});

export class DealsController {
  constructor(private readonly service: DealsService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const deals = await this.service.list();
    res.json(deals);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createDealSchema.parse(req.body);
    const deal = await this.service.create({
      ...body,
      actorUserId: req.user!.id,
    });

    res.status(201).json(deal);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateDealSchema.parse(req.body);
    const deal = await this.service.update({
      id: req.params.id,
      ...body,
      actorUserId: req.user!.id,
    });

    res.json(deal);
  };
}
