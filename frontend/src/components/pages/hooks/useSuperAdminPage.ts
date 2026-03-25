import { useEffect, useState } from "react";
import { createAdminTenant, getAdminTenantUsers, getAdminTenants, getAdminUsers, updateAdminTenant, updateAdminUserStatus } from "@/services/api";
import { AdminGlobalUser, AdminTenant, AuthUser, CreateTenantPayload } from "@/types/crm";

type AdminTab = "users" | "tenants";

type Params = {
  token: string;
  currentUser: AuthUser;
  activeSection: string;
  onError: (message: string) => void;
  onInfo: (message: string) => void;
};

export function useSuperAdminPage({ token, currentUser, activeSection, onError, onInfo }: Params) {
  const [loading, setLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("users");
  const [adminUserSearch, setAdminUserSearch] = useState("");
  const [adminTenantFilter, setAdminTenantFilter] = useState("");
  const [adminUsersPage, setAdminUsersPage] = useState(1);
  const [adminTenantsPage, setAdminTenantsPage] = useState(1);
  const [globalUsers, setGlobalUsers] = useState<AdminGlobalUser[]>([]);
  const [globalUsersTotal, setGlobalUsersTotal] = useState(0);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [tenantsTotal, setTenantsTotal] = useState(0);
  const [selectedTenantUsers, setSelectedTenantUsers] = useState<AdminGlobalUser[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [createTenantLoading, setCreateTenantLoading] = useState(false);
  const [newTenant, setNewTenant] = useState<CreateTenantPayload>({
    companyName: "",
    cnpj: "",
    email: "",
    phone: "",
    plan: "BASIC",
    status: "TRIAL",
    adminName: "",
    adminEmail: "",
    temporaryPassword: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (activeSection !== "admin" || currentUser.role !== "SUPER_ADMIN") {
        return;
      }

      setLoading(true);
      try {
        const [usersResponse, tenantsResponse] = await Promise.all([
          getAdminUsers(token, {
            page: adminUsersPage,
            pageSize: 10,
            search: adminUserSearch || undefined,
            tenantId: adminTenantFilter || undefined,
          }),
          getAdminTenants(token, {
            page: adminTenantsPage,
            pageSize: 10,
            search: adminUserSearch || undefined,
          }),
        ]);

        if (!cancelled) {
          setGlobalUsers(usersResponse.items);
          setGlobalUsersTotal(usersResponse.total);
          setTenants(tenantsResponse.items);
          setTenantsTotal(tenantsResponse.total);
        }
      } catch (error) {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : "Nao foi possivel carregar dados de admin");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    activeSection,
    adminTenantFilter,
    adminTenantsPage,
    adminUserSearch,
    adminUsersPage,
    currentUser.role,
    onError,
    token,
  ]);

  async function handleCreateTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (currentUser.role !== "SUPER_ADMIN") {
      return;
    }

    setCreateTenantLoading(true);

    try {
      const created = await createAdminTenant(token, {
        ...newTenant,
        cnpj: newTenant.cnpj || undefined,
        email: newTenant.email || undefined,
        phone: newTenant.phone || undefined,
        temporaryPassword: newTenant.temporaryPassword || undefined,
      });

      setNewTenant({
        companyName: "",
        cnpj: "",
        email: "",
        phone: "",
        plan: "BASIC",
        status: "TRIAL",
        adminName: "",
        adminEmail: "",
        temporaryPassword: "",
      });

      onInfo(`Tenant criado: ${created.company_name}. Senha temporaria do admin: ${created.temporary_password}`);

      const [usersResponse, tenantsResponse] = await Promise.all([
        getAdminUsers(token, {
          page: adminUsersPage,
          pageSize: 10,
          search: adminUserSearch || undefined,
          tenantId: adminTenantFilter || undefined,
        }),
        getAdminTenants(token, {
          page: adminTenantsPage,
          pageSize: 10,
          search: adminUserSearch || undefined,
        }),
      ]);

      setGlobalUsers(usersResponse.items);
      setGlobalUsersTotal(usersResponse.total);
      setTenants(tenantsResponse.items);
      setTenantsTotal(tenantsResponse.total);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nao foi possivel criar tenant");
    } finally {
      setCreateTenantLoading(false);
    }
  }

  async function handleToggleGlobalUser(userId: string, nextIsActive: boolean) {
    try {
      await updateAdminUserStatus(token, userId, { isActive: nextIsActive });
      setGlobalUsers((prev) => prev.map((user) => (user.user_id === userId ? { ...user, is_active: nextIsActive } : user)));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nao foi possivel atualizar status do usuario");
    }
  }

  async function handleUpdateTenantQuick(
    tenantId: string,
    payload: {
      status?: "ACTIVE" | "INACTIVE" | "TRIAL";
      plan?: "BASIC" | "PRO" | "ENTERPRISE";
    },
  ) {
    try {
      const updated = await updateAdminTenant(token, tenantId, payload);
      setTenants((prev) => prev.map((tenant) => (tenant.tenant_id === tenantId ? updated : tenant)));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nao foi possivel atualizar tenant");
    }
  }

  async function handleViewTenantUsers(tenantId: string) {
    try {
      const users = await getAdminTenantUsers(token, tenantId);
      setSelectedTenantId(tenantId);
      setSelectedTenantUsers(users);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nao foi possivel carregar usuarios");
    }
  }

  return {
    loading,
    adminTab,
    setAdminTab,
    adminUserSearch,
    setAdminUserSearch,
    adminTenantFilter,
    setAdminTenantFilter,
    adminUsersPage,
    setAdminUsersPage,
    adminTenantsPage,
    setAdminTenantsPage,
    globalUsers,
    globalUsersTotal,
    tenants,
    tenantsTotal,
    selectedTenantUsers,
    selectedTenantId,
    createTenantLoading,
    newTenant,
    setNewTenant,
    handleCreateTenant,
    handleToggleGlobalUser,
    handleUpdateTenantQuick,
    handleViewTenantUsers,
  };
}
