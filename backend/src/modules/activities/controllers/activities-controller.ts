import { Request, Response } from 'express';
import { ActivitiesService } from '../application/activities-service';

export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const activities = await this.service.list();
    res.json(activities);
  };

  listByLead = async (req: Request, res: Response): Promise<void> => {
    const activities = await this.service.listByLead(req.params.leadId);
    res.json(activities);
  };
}
