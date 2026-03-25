"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LoginPanel } from "@/components/LoginPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError, createPipeline, createPipelineStage, getLeads, getPipelines, login } from "@/services/api";
import { AuthUser, Lead, Pipeline } from "@/types/crm";

const AUTH_STORAGE_KEY = "crm-controlle-auth";

type Session = {
  accessToken: string;
  user: AuthUser;
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bootLoading, setBootLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const hasSession = useMemo(() => Boolean(session?.accessToken), [session]);

  const bootstrapDefaultPipeline = useCallback(async (token: string) => {
    const pipeline = await createPipeline(token, {
      name: "Pipeline Comercial",
      description: "Pipeline inicial criado automaticamente",
    });

    const defaultStages = ["Leads", "Contato", "Proposta", "Fechado"];
    await Promise.all(
      defaultStages.map((name, index) =>
        createPipelineStage(token, pipeline.id, {
          name,
          position: index + 1,
        }),
      ),
    );

    return getPipelines(token);
  }, []);

  const loadBoardData = useCallback(async (token: string, currentUser?: AuthUser) => {
    setLoadingData(true);
    setDataError(null);

    try {
      const [pipelineResponse, leadResponse] = await Promise.all([getPipelines(token), getLeads(token)]);

      if (!pipelineResponse.length && currentUser?.role === "TENANT_ADMIN") {
        const recoveredPipelines = await bootstrapDefaultPipeline(token);
        if (recoveredPipelines.length) {
          setPipelines(recoveredPipelines);
          setLeads(leadResponse.length ? leadResponse : []);
          return;
        }
      }

      if (!pipelineResponse.length) {
        setPipelines([]);
        setLeads([]);
        setDataError(null);
        return;
      }

      setPipelines(pipelineResponse);
      setLeads(leadResponse.length ? leadResponse : []);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSession(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setDataError("Sessao expirada. Faca login novamente.");
        return;
      }

      setPipelines([]);
      setLeads([]);
      setDataError("Backend indisponivel. Verifique os servicos de auth e crm.");
    } finally {
      setLoadingData(false);
    }
  }, [bootstrapDefaultPipeline]);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!saved) {
      setBootLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Session;
      setSession(parsed);
      void loadBoardData(parsed.accessToken, parsed.user);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setSession(null);
    } finally {
      setBootLoading(false);
    }
  }, [loadBoardData]);

  async function handleLogin(email: string, password: string) {
    setLoadingLogin(true);

    try {
      const response = await login(email, password);
      const nextSession: Session = {
        accessToken: response.accessToken,
        user: response.user,
      };

      setSession(nextSession);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
      await loadBoardData(response.accessToken, response.user);
    } finally {
      setLoadingLogin(false);
    }
  }

  function handleLogout() {
    setSession(null);
    setPipelines([]);
    setLeads([]);
    setDataError(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  if (bootLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <Card className="w-full max-w-md border-blue-100 shadow-xl">
          <CardContent className="py-10 text-center text-slate-700">Carregando workspace...</CardContent>
        </Card>
      </section>
    );
  }

  if (!hasSession || !session) {
    return (
      <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 px-6 py-8">
        <div className="mx-auto w-full max-w-7xl">
          <LoginPanel loading={loadingLogin} onSubmit={handleLogin} />
        </div>
      </section>
    );
  }

  return (
    <>
      {dataError ? (
        <aside className="mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p>{dataError}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => loadBoardData(session.accessToken)}>
              Tentar novamente
            </Button>
          </div>
        </aside>
      ) : null}

      <KanbanBoard
        token={session.accessToken}
        currentUser={session.user}
        pipelines={pipelines}
        leads={leads}
        loading={loadingData}
        onLeadsChange={setLeads}
        onLogout={handleLogout}
      />
    </>
  );
}
