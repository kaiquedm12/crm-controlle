import { Request, Response } from 'express';
import { ReportsService } from '../application/reports-service';

export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  funnel = async (req: Request, res: Response): Promise<void> => {
    const report = await this.service.funnel(req.user!.actingTenantId!);
    res.json(report);
  };

  deals = async (req: Request, res: Response): Promise<void> => {
    const report = await this.service.deals(req.user!.actingTenantId!);
    res.json(report);
  };

  performanceUsers = async (req: Request, res: Response): Promise<void> => {
    const report = await this.service.performanceUsers(req.user!.actingTenantId!);
    res.json(report);
  };
}
