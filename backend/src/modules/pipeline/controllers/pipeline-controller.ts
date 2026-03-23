import { Request, Response } from 'express';
import { z } from 'zod';
import { PipelineService } from '../application/pipeline-service';

const createPipelineSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

const createStageSchema = z.object({
  name: z.string().min(2),
  position: z.number().int().positive(),
});

const moveLeadSchema = z.object({
  stageId: z.string(),
  position: z.number().int().nonnegative().optional(),
});

export class PipelineController {
  constructor(private readonly service: PipelineService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const pipelines = await this.service.list();
    res.json(pipelines);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createPipelineSchema.parse(req.body);
    const pipeline = await this.service.create({
      ...body,
      createdById: req.user!.id,
    });

    res.status(201).json(pipeline);
  };

  createStage = async (req: Request, res: Response): Promise<void> => {
    const body = createStageSchema.parse(req.body);
    const stage = await this.service.createStage({
      pipelineId: req.params.pipelineId,
      ...body,
    });

    res.status(201).json(stage);
  };

  moveLead = async (req: Request, res: Response): Promise<void> => {
    const body = moveLeadSchema.parse(req.body);
    const lead = await this.service.moveLead({
      leadId: req.params.leadId,
      actorUserId: req.user!.id,
      ...body,
    });

    res.json(lead);
  };
}
