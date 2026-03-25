import { Request, Response } from 'express';
import { ActivitiesService } from '../application/activities-service';

export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const activities = await this.service.list(req.user!.actingTenantId!);
    res.json(activities);
  };

  listByLead = async (req: Request, res: Response): Promise<void> => {
    const activities = await this.service.listByLead(req.params.leadId, req.user!.actingTenantId!);
    res.json(activities);
  };
}
