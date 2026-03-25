import { FormEvent, useEffect, useState } from "react";
import { createUser, getUsers } from "@/services/api";
import { AuthUser, ManagedUser, UserRole } from "@/types/crm";

type NewUserForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type Params = {
  token: string;
  currentUser: AuthUser;
  activeSection: string;
  canAccessAdmin: boolean;
  onError: (message: string) => void;
};

export function useTenantAdminPage({ token, currentUser, activeSection, canAccessAdmin, onError }: Params) {
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (activeSection !== "admin" || !canAccessAdmin || currentUser.role === "SUPER_ADMIN") {
        return;
      }

      setLoading(true);
      try {
        const users = await getUsers(token);
        if (!cancelled) {
          setManagedUsers(users);
        }
      } catch (error) {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : "Nao foi possivel carregar usuarios");
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
  }, [activeSection, canAccessAdmin, currentUser.role, onError, token]);

  async function handleCreateUserAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canAccessAdmin || currentUser.role === "SUPER_ADMIN") {
      return;
    }

    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      onError("Preencha nome, email e senha para criar usuario.");
      return;
    }

    const roleToCreate: UserRole = currentUser.role === "TENANT_ADMIN" ? "USER" : newUser.role;

    setCreateUserLoading(true);

    try {
      const createdUser = await createUser(token, {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        role: roleToCreate,
      });

      setManagedUsers((prev) => [createdUser, ...prev]);
      setNewUser({ name: "", email: "", password: "", role: "USER" });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nao foi possivel criar usuario");
    } finally {
      setCreateUserLoading(false);
    }
  }

  return {
    managedUsers,
    loading,
    createUserLoading,
    newUser,
    setNewUser,
    handleCreateUserAccount,
  };
}
