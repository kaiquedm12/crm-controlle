import {
  AdminGlobalUser,
  AdminTenant,
  CreateTenantPayload,
  CreateUserPayload,
  CreateLeadPayload,
  DealsReport,
  FunnelStageMetric,
  Lead,
  LoginResponse,
  ManagedUser,
  MessageItem,
  PaginatedResponse,
  Pipeline,
  UpdateGlobalUserStatusPayload,
  UpdateLeadPayload,
  UpdateTenantPayload,
  UserPerformanceMetric,
} from "@/types/crm";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:3331";
const CRM_API_URL = process.env.NEXT_PUBLIC_CRM_API_URL ?? "http://localhost:3332";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const selectedTenantId =
    typeof window !== "undefined" ? window.localStorage.getItem("crm-controlle-tenant-id") : null;

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(selectedTenantId ? { "x-tenant-id": selectedTenantId } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Erro ao comunicar com a API";

    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function login(email: string, password: string, tenantId?: string): Promise<LoginResponse> {
  return request<LoginResponse>(`${AUTH_API_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password, tenantId: tenantId || undefined }),
  });
}

export function getPipelines(token: string): Promise<Pipeline[]> {
  return request<Pipeline[]>(`${CRM_API_URL}/pipeline`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createPipeline(
  token: string,
  payload: { name: string; description?: string },
): Promise<Pipeline> {
  return request<Pipeline>(`${CRM_API_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function createPipelineStage(
  token: string,
  pipelineId: string,
  payload: { name: string; position: number },
): Promise<{ id: string; name: string; position: number; pipelineId: string }> {
  return request<{ id: string; name: string; position: number; pipelineId: string }>(
    `${CRM_API_URL}/pipeline/${pipelineId}/stages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    },
  );
}

export function getLeads(token: string): Promise<Lead[]> {
  return request<Lead[]>(`${CRM_API_URL}/leads`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createLead(token: string, payload: CreateLeadPayload): Promise<Lead> {
  return request<Lead>(`${CRM_API_URL}/leads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateLead(token: string, leadId: string, payload: UpdateLeadPayload): Promise<Lead> {
  return request<Lead>(`${CRM_API_URL}/leads/${leadId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function moveLead(token: string, leadId: string, stageId: string, position: number): Promise<Lead> {
  return request<Lead>(`${CRM_API_URL}/pipeline/move-lead/${leadId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ stageId, position }),
  });
}

export function getFunnelReport(token: string): Promise<FunnelStageMetric[]> {
  return request<FunnelStageMetric[]>(`${CRM_API_URL}/reports/funnel`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getMessages(token: string): Promise<MessageItem[]> {
  return request<MessageItem[]>(`${CRM_API_URL}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getUsersPerformanceReport(token: string): Promise<UserPerformanceMetric[]> {
  return request<UserPerformanceMetric[]>(`${CRM_API_URL}/reports/performance/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getDealsReport(token: string): Promise<DealsReport> {
  return request<DealsReport>(`${CRM_API_URL}/reports/deals`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getUsers(token: string): Promise<ManagedUser[]> {
  return request<ManagedUser[]>(`${CRM_API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createUser(token: string, payload: CreateUserPayload): Promise<ManagedUser> {
  return request<ManagedUser>(`${CRM_API_URL}/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

type AdminUsersQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  tenantId?: string;
};

type AdminTenantsQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "TRIAL";
};

export function getAdminUsers(token: string, query: AdminUsersQuery = {}): Promise<PaginatedResponse<AdminGlobalUser>> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.search) params.set("search", query.search);
  if (query.tenantId) params.set("tenantId", query.tenantId);

  return request<PaginatedResponse<AdminGlobalUser>>(`${CRM_API_URL}/admin/users?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateAdminUserStatus(
  token: string,
  userId: string,
  payload: UpdateGlobalUserStatusPayload,
): Promise<AdminGlobalUser> {
  return request<AdminGlobalUser>(`${CRM_API_URL}/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function getAdminTenants(
  token: string,
  query: AdminTenantsQuery = {},
): Promise<PaginatedResponse<AdminTenant>> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);

  return request<PaginatedResponse<AdminTenant>>(`${CRM_API_URL}/admin/tenants?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createAdminTenant(token: string, payload: CreateTenantPayload) {
  return request<{
    tenant_id: string;
    company_name: string;
    plan: "BASIC" | "PRO" | "ENTERPRISE";
    status: "ACTIVE" | "INACTIVE" | "TRIAL";
    temporary_password: string;
    admin_user: {
      user_id: string;
      name: string;
      email: string;
    };
  }>(`${CRM_API_URL}/admin/tenants`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateAdminTenant(token: string, tenantId: string, payload: UpdateTenantPayload): Promise<AdminTenant> {
  return request<AdminTenant>(`${CRM_API_URL}/admin/tenants/${tenantId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function getAdminTenantUsers(token: string, tenantId: string): Promise<AdminGlobalUser[]> {
  return request<AdminGlobalUser[]>(`${CRM_API_URL}/admin/tenants/${tenantId}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
