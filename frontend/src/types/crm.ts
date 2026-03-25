export type UserRole = "SUPER_ADMIN" | "USER" | "TENANT_ADMIN";
export type TenantPlan = "BASIC" | "PRO" | "ENTERPRISE";
export type TenantStatus = "ACTIVE" | "INACTIVE" | "TRIAL";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type Stage = {
  id: string;
  name: string;
  position: number;
  pipelineId: string;
};

export type Pipeline = {
  id: string;
  name: string;
  description?: string | null;
  createdById: string;
  stages: Stage[];
};

export type Lead = {
  id: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  pipelineId?: string | null;
  stageId?: string | null;
  position: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  deal?: {
    status: DealStatus;
    amount: number;
    closedAt?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type DealStatus = "OPEN" | "WON" | "LOST";

export type CreateLeadPayload = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  pipelineId?: string;
  stageId?: string;
  dealStatus?: DealStatus;
  dealAmount?: number;
  tags?: string[];
};

export type UpdateLeadPayload = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  pipelineId?: string;
  stageId?: string;
  dealStatus?: DealStatus;
  dealAmount?: number;
};

export type FunnelStageMetric = {
  stageId: string;
  stageName: string;
  pipelineId: string;
  pipelineName: string;
  leads: number;
};

export type MessageItem = {
  id: string;
  leadId: string;
  userId: string;
  content: string;
  providerStatus?: string | null;
  createdAt: string;
  lead?: {
    id: string;
    name: string;
    phone?: string | null;
  };
  user?: {
    id: string;
    name: string;
  };
};

export type UserPerformanceMetric = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  _count: {
    leads: number;
    activities: number;
    messages: number;
  };
};

export type DealsReport = {
  openCount: number;
  wonCount: number;
  lostCount: number;
  wonRevenue: number;
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  tenantId?: string | null;
  tenantName?: string | null;
  createdAt: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type PaginatedResponse<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

export type AdminGlobalUser = {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  tenant_id: string | null;
  tenant_name: string | null;
  created_at: string;
};

export type AdminTenant = {
  tenant_id: string;
  company_name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  plan: TenantPlan;
  status: TenantStatus;
  created_at: string;
  users_count: number;
};

export type CreateTenantPayload = {
  companyName: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  plan: TenantPlan;
  status: TenantStatus;
  adminName: string;
  adminEmail: string;
  temporaryPassword?: string;
};

export type UpdateTenantPayload = {
  companyName?: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  plan?: TenantPlan;
  status?: TenantStatus;
};

export type UpdateGlobalUserStatusPayload = {
  isActive: boolean;
};

