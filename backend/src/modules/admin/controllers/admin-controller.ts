import { Request, Response } from 'express';
import { z } from 'zod';
import { AdminService } from '../application/admin-service';

const listGlobalUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tenantId: z.string().optional(),
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

const listTenantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRIAL']).optional(),
});

const createTenantSchema = z.object({
  companyName: z.string().min(2),
  cnpj: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).default('BASIC'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRIAL']).default('TRIAL'),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  temporaryPassword: z.string().min(8).optional(),
});

const updateTenantSchema = z
  .object({
    companyName: z.string().min(2).optional(),
    cnpj: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'TRIAL']).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, 'Informe ao menos um campo para atualizar');

export class AdminController {
  constructor(private readonly service: AdminService) {}

  listGlobalUsers = async (req: Request, res: Response): Promise<void> => {
    const query = listGlobalUsersQuerySchema.parse(req.query);
    const result = await this.service.listGlobalUsers(query);
    res.json(result);
  };

  updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    const body = updateUserStatusSchema.parse(req.body);
    const result = await this.service.updateUserStatus(req.params.id, body.isActive);
    res.json(result);
  };

  listTenants = async (req: Request, res: Response): Promise<void> => {
    const query = listTenantsQuerySchema.parse(req.query);
    const result = await this.service.listTenants(query);
    res.json(result);
  };

  createTenant = async (req: Request, res: Response): Promise<void> => {
    const body = createTenantSchema.parse(req.body);
    const result = await this.service.createTenant(body);
    res.status(201).json(result);
  };

  updateTenant = async (req: Request, res: Response): Promise<void> => {
    const body = updateTenantSchema.parse(req.body);
    const result = await this.service.updateTenant(req.params.id, body);
    res.json(result);
  };

  listTenantUsers = async (req: Request, res: Response): Promise<void> => {
    const users = await this.service.listTenantUsers(req.params.id);
    res.json(users);
  };
}
