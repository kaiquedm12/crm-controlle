import { Request, Response } from 'express';
import { z } from 'zod';
import { TenantsService } from '../application/tenants-service';

const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
});

const updateTenantSchema = createTenantSchema.partial();

export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const tenants = await this.service.list();
    res.json(tenants);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createTenantSchema.parse(req.body);
    const tenant = await this.service.create(body);
    res.status(201).json(tenant);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateTenantSchema.parse(req.body);
    const tenant = await this.service.update(req.params.id, body);
    res.json(tenant);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id);
    res.status(204).send();
  };
}
