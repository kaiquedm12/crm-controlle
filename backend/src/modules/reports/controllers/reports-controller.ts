import { Request, Response } from 'express';
import { ReportsService } from '../application/reports-service';

export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  funnel = async (_req: Request, res: Response): Promise<void> => {
    const report = await this.service.funnel();
    res.json(report);
  };

  deals = async (_req: Request, res: Response): Promise<void> => {
    const report = await this.service.deals();
    res.json(report);
  };

  performanceUsers = async (_req: Request, res: Response): Promise<void> => {
    const report = await this.service.performanceUsers();
    res.json(report);
  };
}
