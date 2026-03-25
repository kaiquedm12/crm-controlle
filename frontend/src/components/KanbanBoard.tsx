"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FolderKanban,
  Home,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  WalletCards,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPage } from "@/components/pages/AdminPage";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { FinancePage } from "@/components/pages/FinancePage";
import { useFinancePageData } from "@/components/pages/hooks/useFinancePageData";
import { useDashboardPageData } from "@/components/pages/hooks/useDashboardPageData";
import { useMessagesPageData } from "@/components/pages/hooks/useMessagesPageData";
import { useSuperAdminPage } from "@/components/pages/hooks/useSuperAdminPage";
import { useTeamPageData } from "@/components/pages/hooks/useTeamPageData";
import { useTenantAdminPage } from "@/components/pages/hooks/useTenantAdminPage";
import { MessagesPage } from "@/components/pages/MessagesPage";
import { TeamPage } from "@/components/pages/TeamPage";
import { Input } from "@/components/ui/input";
import {
  ApiError,
  createLead,
  getDealsReport,
  moveLead,
  updateLead,
} from "@/services/api";
import {
  AuthUser,
  DealStatus,
  Lead,
  Pipeline,
  UserRole,
} from "@/types/crm";

const BOARD_FILTERS_STORAGE_KEY = "crm-controlle-board-filters";
const PROFILE_STORAGE_KEY_PREFIX = "crm-controlle-profile-";
const TENANT_STORAGE_KEY = "crm-controlle-tenant-id";

type KanbanBoardProps = {
  token: string;
  currentUser: AuthUser;
  pipelines: Pipeline[];
  leads: Lead[];
  loading: boolean;
  onLogout: () => void;
  onLeadsChange: (leads: Lead[]) => void;
};

type NewLeadForm = {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  dealStatus: "" | DealStatus;
  dealAmount: string;
};

type EditLeadForm = {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  stageId: string;
  dealStatus: "" | DealStatus;
  dealAmount: string;
};

type UserProfileForm = {
  name: string;
  email: string;
  title: string;
  phone: string;
};

type AppSection = "home" | "messages" | "team" | "finance" | "admin";

function MessagesListSkeleton() {
  return (
    <Card className="border-blue-100 bg-white/95 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-slate-100 p-3">
            <div className="mb-2 h-3 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mb-2 h-2.5 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MessagesSummarySkeleton() {
  return (
    <Card className="border-blue-100 bg-white/95 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-52 animate-pulse rounded bg-slate-200" />
      </CardContent>
    </Card>
  );
}

function TeamListSkeleton() {
  return (
    <Card className="border-blue-100 bg-white/95 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TeamSummarySkeleton() {
  return (
    <Card className="border-blue-100 bg-white/95 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-44 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
      </CardContent>
    </Card>
  );
}

function FinanceMetricSkeleton() {
  return (
    <Card className="border-blue-100 bg-white/95 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
      </CardContent>
    </Card>
  );
}

function AdminPanelSkeleton() {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card className="border-blue-100 bg-white/95 shadow-sm lg:col-span-2">
        <CardContent className="space-y-3 p-5">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-40 animate-pulse rounded bg-slate-200" />
        </CardContent>
      </Card>
      <Card className="border-blue-100 bg-white/95 shadow-sm">
        <CardContent className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-6 w-full animate-pulse rounded bg-slate-200" />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function sortByPosition(leads: Lead[]) {
  return [...leads].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isClosedStageName(stageName: string) {
  const normalized = normalizeText(stageName);
  return normalized.includes("fechado") || normalized.includes("closed");
}

function stageDropId(stageId: string, dealStatus?: DealStatus) {
  return dealStatus ? `stage:${stageId}:${dealStatus}` : `stage:${stageId}`;
}

function parseStageDropTarget(overId: string): { stageId: string; dealStatus?: DealStatus } | null {
  if (!overId.startsWith("stage:")) {
    return null;
  }

  const parts = overId.split(":");
  if (parts.length < 2) {
    return null;
  }

  const stageId = parts[1];
  const dealStatus = parts[2] as DealStatus | undefined;

  if (!stageId) {
    return null;
  }

  if (dealStatus && !["OPEN", "WON", "LOST"].includes(dealStatus)) {
    return { stageId };
  }

  return { stageId, dealStatus };
}

function getStageObservationHint(stageName: string) {
  const normalized = normalizeText(stageName);

  if (normalized.includes("lead")) {
    return "Informe origem do lead e principal dor inicial.";
  }
  if (normalized.includes("contato")) {
    return "Registre resumo do contato e proximo passo combinado.";
  }
  if (normalized.includes("proposta")) {
    return "Descreva proposta enviada, prazo e chance de fechamento.";
  }
  if (
    normalized.includes("fechado") ||
    normalized.includes("ganho") ||
    normalized.includes("perdido") ||
    normalized.includes("won") ||
    normalized.includes("lost")
  ) {
    return "Informe se foi vendido, valor final e, se nao vendeu, motivo da perda.";
  }

  return "Registre o contexto atual da etapa e o proximo passo.";
}

function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function buildWhatsAppUrl(phone: string, leadName: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const normalized = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  const safeName = leadName.trim() || "tudo bem";
  const text = `Ola ${safeName}, tudo bem?`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

function StageDropZone({ stageId, dealStatus }: { stageId: string; dealStatus?: DealStatus }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageDropId(stageId, dealStatus) });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border border-dashed px-3 py-2 text-center text-xs transition ${
        isOver ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-400"
      }`}
    >
      Solte aqui
    </div>
  );
}

function LeadCard({ lead, stageName, onOpen }: { lead: Lead; stageName: string; onOpen: (lead: Lead) => void }) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });
  const isContactStage = normalizeText(stageName).includes("contato");
  const whatsappUrl = lead.phone ? buildWhatsAppUrl(lead.phone, lead.name) : null;

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`space-y-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition ${
        isDragging ? "ring-2 ring-blue-300" : "hover:border-blue-200 hover:shadow"
      }`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{lead.name}</h4>
          {lead.company ? <p className="text-xs text-slate-500">{lead.company}</p> : null}
        </div>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100"
          title="Arrastar"
          aria-label="Arrastar"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
        >
          :::
        </button>
      </header>
      <dl className="space-y-0.5 text-xs">
        {lead.email ? (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-400">Email</dt>
            <dd className="truncate text-slate-700">{lead.email}</dd>
          </div>
        ) : null}
        {lead.phone ? (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-400">Telefone</dt>
            <dd className="text-slate-700">{lead.phone}</dd>
          </div>
        ) : null}
      </dl>
      {lead.deal?.status === "WON" ? (
        <div className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
          Valor vendido: {formatCurrencyBRL(Number(lead.deal.amount) || 0)}
        </div>
      ) : null}
      {lead.deal?.status === "LOST" ? (
        <div className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">Perda registrada</div>
      ) : null}
      {lead.notes ? <p className="line-clamp-2 text-[11px] text-slate-500">{lead.notes}</p> : null}
      {isContactStage && whatsappUrl ? (
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="block">
          <Button type="button" variant="secondary" size="sm" className="w-full">
            Abrir WhatsApp
          </Button>
        </a>
      ) : null}
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onOpen(lead)}>
        Ver detalhes
      </Button>
    </article>
  );
}

function reorderLocally(
  allLeads: Lead[],
  activeLeadId: string,
  targetStageId: string,
  targetIndex: number,
  pipelineId: string,
  targetDealStatus?: DealStatus,
) {
  const activeLead = allLeads.find((lead) => lead.id === activeLeadId);
  if (!activeLead || !activeLead.stageId) {
    return allLeads;
  }

  const activeDealStatus = activeLead.deal?.status;
  const sourceStageId = activeLead.stageId;

  const sameBucket = sourceStageId === targetStageId && (activeDealStatus ?? "OPEN") === (targetDealStatus ?? "OPEN");

  const inBucket = (lead: Lead, stageId: string, dealStatus?: DealStatus) => {
    if (lead.pipelineId !== pipelineId || lead.stageId !== stageId || lead.id === activeLead.id) {
      return false;
    }

    if (!dealStatus) {
      return true;
    }

    return (lead.deal?.status ?? "OPEN") === dealStatus;
  };

  const sourceList = sortByPosition(allLeads.filter((lead) => inBucket(lead, sourceStageId, activeDealStatus)));

  const targetList =
    sameBucket
      ? [...sourceList]
      : sortByPosition(allLeads.filter((lead) => inBucket(lead, targetStageId, targetDealStatus)));

  const boundedIndex = Math.max(0, Math.min(targetIndex, targetList.length));

  if (sameBucket) {
    targetList.splice(boundedIndex, 0, {
      ...activeLead,
      stageId: targetStageId,
      pipelineId,
      deal: activeLead.deal ? { ...activeLead.deal, status: targetDealStatus ?? activeDealStatus ?? "OPEN" } : undefined,
    });

    const positionMap = new Map<string, number>(targetList.map((lead, index) => [lead.id, index]));

    return allLeads.map((lead) => {
      if (lead.pipelineId !== pipelineId || lead.stageId !== targetStageId) {
        return lead;
      }

      if ((lead.deal?.status ?? "OPEN") !== (targetDealStatus ?? "OPEN")) {
        return lead;
      }

      const nextPosition = positionMap.get(lead.id);
      return nextPosition === undefined ? lead : { ...lead, position: nextPosition };
    });
  }

  targetList.splice(boundedIndex, 0, {
    ...activeLead,
    stageId: targetStageId,
    pipelineId,
    deal: activeLead.deal ? { ...activeLead.deal, status: targetDealStatus ?? activeDealStatus ?? "OPEN" } : undefined,
  });

  const sourcePositionMap = new Map<string, number>(sourceList.map((lead, index) => [lead.id, index]));
  const targetPositionMap = new Map<string, number>(targetList.map((lead, index) => [lead.id, index]));

  return allLeads.map((lead) => {
    if (lead.id === activeLead.id) {
      return {
        ...lead,
        pipelineId,
        stageId: targetStageId,
        position: targetPositionMap.get(lead.id) ?? boundedIndex,
        deal: lead.deal
          ? { ...lead.deal, status: targetDealStatus ?? lead.deal.status }
          : targetDealStatus
            ? { status: targetDealStatus, amount: 0 }
            : lead.deal,
      };
    }

    if (lead.pipelineId !== pipelineId || !lead.stageId) {
      return lead;
    }

    if (lead.stageId === sourceStageId && (lead.deal?.status ?? "OPEN") === (activeDealStatus ?? "OPEN")) {
      const nextPosition = sourcePositionMap.get(lead.id);
      return nextPosition === undefined ? lead : { ...lead, position: nextPosition };
    }

    if (lead.stageId === targetStageId && (lead.deal?.status ?? "OPEN") === (targetDealStatus ?? "OPEN")) {
      const nextPosition = targetPositionMap.get(lead.id);
      return nextPosition === undefined ? lead : { ...lead, position: nextPosition };
    }

    return lead;
  });
}

export function KanbanBoard({
  token,
  currentUser,
  pipelines,
  leads,
  loading,
  onLogout,
  onLeadsChange,
}: KanbanBoardProps) {
  const [activeSection, setActiveSection] = useState<AppSection>("home");
  const [activePipelineId, setActivePipelineId] = useState<string | null>(pipelines[0]?.id ?? null);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [timeAnchorMs, setTimeAnchorMs] = useState<number>(() => Date.now());
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<EditLeadForm | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sectionDataError, setSectionDataError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<UserProfileForm>({
    name: currentUser.name,
    email: currentUser.email,
    title: "",
    phone: "",
  });
  const [superAdminTenantId, setSuperAdminTenantId] = useState<string>(currentUser.tenantId ?? "");
  const [newLead, setNewLead] = useState<NewLeadForm>({
    name: "",
    company: "",
    email: "",
    phone: "",
    notes: "",
    dealStatus: "",
    dealAmount: "",
  });

  const canAccessAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "TENANT_ADMIN";

  const handleAuthError = useCallback((message: string) => setError(message), []);
  const handleSectionDataError = useCallback((message: string) => setSectionDataError(message), []);
  const handleSectionInfo = useCallback((message: string) => setSectionDataError(message), []);

  const superAdminPage = useSuperAdminPage({
    token,
    currentUser,
    activeSection,
    onError: handleAuthError,
    onInfo: handleSectionInfo,
  });

  const messagesPage = useMessagesPageData({
    token,
    activeSection,
    onError: handleSectionDataError,
  });

  const teamPage = useTeamPageData({
    token,
    activeSection,
    onError: handleSectionDataError,
  });

  const financePage = useFinancePageData({
    token,
    activeSection,
    onError: handleSectionDataError,
  });

  const tenantAdminPage = useTenantAdminPage({
    token,
    currentUser,
    activeSection,
    canAccessAdmin,
    onError: handleAuthError,
  });

  const dashboardPage = useDashboardPageData({
    pipelines,
    leads,
    activePipelineId,
    ownerFilter,
    periodFilter,
    timeAnchorMs,
    isClosedStageName,
  });

  const sectionDataLoading =
    (activeSection === "messages" && messagesPage.loading) ||
    (activeSection === "team" && teamPage.loading) ||
    (activeSection === "finance" && financePage.loading) ||
    (activeSection === "admin" &&
      canAccessAdmin &&
      (currentUser.role === "SUPER_ADMIN" ? superAdminPage.loading : tenantAdminPage.loading));

  const profileStorageKey = useMemo(() => `${PROFILE_STORAGE_KEY_PREFIX}${currentUser.id}`, [currentUser.id]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const {
    activePipeline,
    activePipelineLeads,
    ownerOptions,
    stageLeadMap,
    boardColumns,
    dashboardData,
    ownerStats,
    estimatedRevenue,
    soldRevenueFromLeads,
  } = dashboardPage;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BOARD_FILTERS_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as { ownerFilter?: string; periodFilter?: string };
      if (parsed.ownerFilter) {
        setOwnerFilter(parsed.ownerFilter);
      }
      if (parsed.periodFilter) {
        setPeriodFilter(parsed.periodFilter);
      }
    } catch {
      localStorage.removeItem(BOARD_FILTERS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      BOARD_FILTERS_STORAGE_KEY,
      JSON.stringify({
        ownerFilter,
        periodFilter,
      }),
    );
  }, [ownerFilter, periodFilter]);

  useEffect(() => {
    setTimeAnchorMs(Date.now());
  }, [ownerFilter, periodFilter]);

  useEffect(() => {
    if (ownerFilter === "all") {
      return;
    }

    const ownerExists = ownerOptions.some((owner) => owner.id === ownerFilter);
    if (!ownerExists) {
      setOwnerFilter("all");
    }
  }, [ownerFilter, ownerOptions]);

  useEffect(() => {
    const defaultProfile: UserProfileForm = {
      name: currentUser.name,
      email: currentUser.email,
      title: "",
      phone: "",
    };

    try {
      const raw = localStorage.getItem(profileStorageKey);
      if (!raw) {
        setProfileForm(defaultProfile);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<UserProfileForm>;
      setProfileForm({
        name: parsed.name ?? defaultProfile.name,
        email: parsed.email ?? defaultProfile.email,
        title: parsed.title ?? "",
        phone: parsed.phone ?? "",
      });
    } catch {
      localStorage.removeItem(profileStorageKey);
      setProfileForm(defaultProfile);
    }
  }, [currentUser.email, currentUser.name, profileStorageKey]);

  const selectedLead = useMemo(() => {
    if (!selectedLeadId) {
      return null;
    }

    return leads.find((lead) => lead.id === selectedLeadId) ?? null;
  }, [leads, selectedLeadId]);

  const userInitials = useMemo(() => {
    const source = profileForm.name.trim() || currentUser.name;
    const parts = source.split(" ").filter(Boolean);
    const initials = (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
    return initials.toUpperCase();
  }, [currentUser.name, profileForm.name]);

  const editStageOptions = useMemo(() => {
    if (!selectedLead?.pipelineId) {
      return activePipeline?.stages ?? [];
    }

    const leadPipeline = pipelines.find((pipeline) => pipeline.id === selectedLead.pipelineId);
    return leadPipeline?.stages.slice().sort((a, b) => a.position - b.position) ?? [];
  }, [activePipeline, pipelines, selectedLead]);

  const editStageObservationHint = useMemo(() => {
    const stageName = editStageOptions.find((stage) => stage.id === editLead?.stageId)?.name;
    return getStageObservationHint(stageName ?? "");
  }, [editLead?.stageId, editStageOptions]);

  const sectionTitle = useMemo(() => {
    if (activeSection === "messages") {
      return "Mensagens";
    }
    if (activeSection === "team") {
      return "Equipe";
    }
    if (activeSection === "finance") {
      return "Financeiro";
    }
    if (activeSection === "admin") {
      return "Painel Admin";
    }
    return "Leadfy";
  }, [activeSection]);

  const sectionSubtitle = useMemo(() => {
    if (activeSection === "messages") {
      return "Acompanhe contatos e proximos retornos";
    }
    if (activeSection === "team") {
      return "Visao de distribuicao dos leads por owner";
    }
    if (activeSection === "finance") {
      return "Indicadores rapidos de pipeline e conversao";
    }
    if (activeSection === "admin") {
      return "Gerencie pessoas, papeis e crescimento do time";
    }
    return "Kanban Comercial";
  }, [activeSection]);

  const adminSummary = useMemo(() => {
    const sourceUsers = currentUser.role === "SUPER_ADMIN" ? superAdminPage.globalUsers : tenantAdminPage.managedUsers;
    return {
      totalUsers: sourceUsers.length,
      admins: sourceUsers.filter((user) => user.role === "SUPER_ADMIN").length,
      managers: sourceUsers.filter((user) => user.role === "TENANT_ADMIN").length,
      sellers: sourceUsers.filter((user) => user.role === "USER").length,
      activeLeads: activePipelineLeads.length,
      activeConversations: messagesPage.messagesData.length,
    };
  }, [
    activePipelineLeads.length,
    currentUser.role,
    messagesPage.messagesData.length,
    superAdminPage.globalUsers,
    tenantAdminPage.managedUsers,
  ]);

  useEffect(() => {
    if (currentUser.role !== "SUPER_ADMIN") {
      if (currentUser.tenantId) {
        localStorage.setItem(TENANT_STORAGE_KEY, currentUser.tenantId);
      }
      return;
    }

    const fromStorage = localStorage.getItem(TENANT_STORAGE_KEY);
    if (fromStorage) {
      setSuperAdminTenantId(fromStorage);
      return;
    }

    if (currentUser.tenantId) {
      setSuperAdminTenantId(currentUser.tenantId);
      localStorage.setItem(TENANT_STORAGE_KEY, currentUser.tenantId);
    }
  }, [currentUser.role, currentUser.tenantId]);

  useEffect(() => {
    if (currentUser.role !== "SUPER_ADMIN") {
      return;
    }

    if (!superAdminTenantId) {
      localStorage.removeItem(TENANT_STORAGE_KEY);
      return;
    }

    localStorage.setItem(TENANT_STORAGE_KEY, superAdminTenantId);
  }, [currentUser.role, superAdminTenantId]);

  useEffect(() => {
    if (activeSection === "admin" && !canAccessAdmin) {
      setActiveSection("home");
    }
  }, [activeSection, canAccessAdmin]);

  useEffect(() => {
    setSectionDataError(null);
  }, [activeSection]);

  async function handleCreateLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activePipeline || !activePipeline.stages.length) {
      setError("Crie estagios no pipeline antes de adicionar leads.");
      return;
    }

    if (!newLead.name.trim()) {
      setError("Informe o nome do lead.");
      return;
    }

    const firstStage = [...activePipeline.stages].sort((a, b) => a.position - b.position)[0];
    if (!newLead.notes.trim()) {
      setError(`Adicione a observacao da etapa \"${firstStage.name}\".`);
      return;
    }

    setError(null);
    setCreateLoading(true);

    try {
      const created = await createLead(token, {
        name: newLead.name.trim(),
        company: newLead.company.trim() || undefined,
        email: newLead.email.trim() || undefined,
        phone: newLead.phone.trim() || undefined,
        notes: newLead.notes.trim() || undefined,
        pipelineId: activePipeline.id,
        stageId: firstStage.id,
      });

      onLeadsChange([created, ...leads]);
      setNewLead({ name: "", company: "", email: "", phone: "", notes: "", dealStatus: "", dealAmount: "" });
      void getDealsReport(token)
        .then((report) => financePage.setDealsReportData(report))
        .catch(() => undefined);
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Nao foi possivel criar lead";
      setError(message);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!activePipeline) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId) {
      return;
    }

    const activeLead = leads.find((lead) => lead.id === activeId);
    if (!activeLead) {
      return;
    }

    const parsedDropTarget = parseStageDropTarget(overId);
    let targetStageId = parsedDropTarget?.stageId ?? null;
    let targetDealStatus = parsedDropTarget?.dealStatus;

    if (!targetStageId) {
      const overLead = leads.find((lead) => lead.id === overId);
      targetStageId = overLead?.stageId ?? null;
      targetDealStatus = overLead?.deal?.status;
    }

    if (!targetStageId) {
      return;
    }

    const targetStageLeads = sortByPosition(
      leads.filter(
        (lead) =>
          lead.pipelineId === activePipeline.id &&
          lead.stageId === targetStageId &&
          lead.id !== activeLead.id &&
          (targetDealStatus ? (lead.deal?.status ?? "OPEN") === targetDealStatus : true),
      ),
    );

    let targetIndex = targetStageLeads.length;

    const overLeadIndex = targetStageLeads.findIndex((lead) => lead.id === overId);
    if (overLeadIndex >= 0) {
      targetIndex = overLeadIndex;
    }

    const previousLeads = leads;
    const updatedLeads = reorderLocally(
      leads,
      activeLead.id,
      targetStageId,
      targetIndex,
      activePipeline.id,
      targetDealStatus,
    );

    onLeadsChange(updatedLeads);
    setMovingLeadId(activeLead.id);
    setError(null);

    try {
      await moveLead(token, activeLead.id, targetStageId, targetIndex);

      if (targetDealStatus && targetDealStatus !== activeLead.deal?.status) {
        await updateLead(token, activeLead.id, { dealStatus: targetDealStatus });
      }

      void getDealsReport(token)
        .then((report) => financePage.setDealsReportData(report))
        .catch(() => undefined);
    } catch (moveError) {
      onLeadsChange(previousLeads);
      const message =
        moveError instanceof ApiError && moveError.status === 401
          ? "Sessao expirada. Faca login novamente."
          : moveError instanceof Error
            ? moveError.message
            : "Nao foi possivel mover o lead.";

      setError(message);
    } finally {
      setMovingLeadId(null);
    }
  }

  function openLeadModal(lead: Lead) {
    setSelectedLeadId(lead.id);
    setEditLead({
      name: lead.name,
      company: lead.company ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      notes: lead.notes ?? "",
      stageId: lead.stageId ?? "",
      dealStatus: lead.deal?.status === "OPEN" ? "" : (lead.deal?.status ?? ""),
      dealAmount: lead.deal?.amount ? String(lead.deal.amount) : "",
    });
  }

  function closeLeadModal() {
    setSelectedLeadId(null);
    setEditLead(null);
  }

  function clearFilters() {
    setOwnerFilter("all");
    setPeriodFilter("all");
  }

  function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(profileStorageKey, JSON.stringify(profileForm));
    setProfileOpen(false);
  }

  async function handleUpdateLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedLead || !editLead) {
      return;
    }

    if (!editLead.notes.trim()) {
      const stageName = editStageOptions.find((stage) => stage.id === editLead.stageId)?.name ?? "etapa selecionada";
      setError(`Adicione a observacao da etapa \"${stageName}\".`);
      return;
    }

    const selectedStageName = editStageOptions.find((stage) => stage.id === editLead.stageId)?.name ?? "";
    const isClosedStage = isClosedStageName(selectedStageName);
    if (isClosedStage && !editLead.dealStatus) {
      setError("Selecione se o lead foi Vendido ou Perda para etapas de fechamento.");
      return;
    }

    const parsedDealAmount = editLead.dealAmount ? Number(editLead.dealAmount.replace(",", ".")) : undefined;
    if (editLead.dealAmount && (!Number.isFinite(parsedDealAmount) || parsedDealAmount! < 0)) {
      setError("Informe um valor de venda valido.");
      return;
    }

    if (editLead.dealStatus === "WON" && (!parsedDealAmount || parsedDealAmount <= 0)) {
      setError("Para lead vendido, informe um valor de venda maior que zero.");
      return;
    }

    setError(null);
    setEditLoading(true);

    try {
      const updated = await updateLead(token, selectedLead.id, {
        name: editLead.name.trim() || undefined,
        company: editLead.company.trim() || undefined,
        email: editLead.email.trim() || undefined,
        phone: editLead.phone.trim() || undefined,
        notes: editLead.notes.trim() || undefined,
        stageId: editLead.stageId || undefined,
        dealStatus: editLead.dealStatus || (isClosedStage ? undefined : "OPEN"),
        dealAmount: parsedDealAmount,
      });

      onLeadsChange(leads.map((lead) => (lead.id === updated.id ? { ...lead, ...updated } : lead)));
      void getDealsReport(token)
        .then((report) => financePage.setDealsReportData(report))
        .catch(() => undefined);
      closeLeadModal();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Nao foi possivel atualizar o lead";
      setError(message);
    } finally {
      setEditLoading(false);
    }
  }

  if (!activePipeline) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <Card className="w-full max-w-lg border-blue-100 shadow-xl">
          <CardContent className="space-y-4 py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900">Nenhum pipeline cadastrado</h2>
            <p className="text-slate-600">Crie um pipeline no backend para liberar o board.</p>
            <Button type="button" onClick={onLogout}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#eaf0f7]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[64px] shrink-0 flex-col justify-between bg-blue-900 px-2 py-3 text-blue-100 md:flex">
          <div className="space-y-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-blue-700 shadow-sm">
              <FolderKanban className="h-4 w-4" />
            </div>
            <nav className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                className={`rounded-xl px-2.5 py-2.5 ${
                  activeSection === "home" ? "bg-white text-blue-700" : "text-blue-100/90 hover:bg-white/10"
                }`}
                aria-label="Inicio"
                onClick={() => setActiveSection("home")}
              >
                <Home className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`rounded-xl px-2.5 py-2.5 ${
                  activeSection === "messages" ? "bg-white text-blue-700" : "text-blue-100/90 hover:bg-white/10"
                }`}
                aria-label="Mensagens"
                onClick={() => setActiveSection("messages")}
              >
                <MessageSquare className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`rounded-xl px-2.5 py-2.5 ${
                  activeSection === "team" ? "bg-white text-blue-700" : "text-blue-100/90 hover:bg-white/10"
                }`}
                aria-label="Equipe"
                onClick={() => setActiveSection("team")}
              >
                <Users className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`rounded-xl px-2.5 py-2.5 ${
                  activeSection === "finance" ? "bg-white text-blue-700" : "text-blue-100/90 hover:bg-white/10"
                }`}
                aria-label="Financeiro"
                onClick={() => setActiveSection("finance")}
              >
                <WalletCards className="h-4 w-4" />
              </button>
              {canAccessAdmin ? (
                <button
                  type="button"
                  className={`rounded-xl px-2.5 py-2.5 ${
                    activeSection === "admin" ? "bg-white text-blue-700" : "text-blue-100/90 hover:bg-white/10"
                  }`}
                  aria-label="Admin"
                  onClick={() => setActiveSection("admin")}
                >
                  <ShieldCheck className="h-4 w-4" />
                </button>
              ) : null}
            </nav>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="group mx-auto flex w-full items-center justify-center"
              aria-label="Abrir perfil do usuario"
            >
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-blue-700 shadow">
                  {userInitials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-blue-900 bg-emerald-400" />
              </div>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-blue-100/90 hover:bg-white/10"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <section className="flex-1 p-2.5 md:p-3">
          <div className="mx-auto max-w-[1600px] space-y-2.5">
            <Card className="border-blue-100/90 bg-white shadow-sm">
              <CardContent className="space-y-2.5 p-2.5 md:p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Kanban Comercial</p>
                    <h1 className="text-xl font-semibold text-slate-900">{sectionTitle}</h1>
                    <p className="text-xs text-slate-500">{sectionSubtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Buscar"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Criar"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-700"
                      aria-label="Kanban"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600"
                      aria-label="Filtros"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>

                    {activeSection === "home" ? (
                      <select
                        value={activePipeline.id}
                        onChange={(event) => setActivePipelineId(event.target.value)}
                        aria-label="Selecionar pipeline"
                        className="h-9 rounded-md border border-blue-200 bg-white px-3 text-sm text-slate-700 shadow-sm"
                      >
                        {pipelines.map((pipeline) => (
                          <option key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                          </option>
                        ))}
                      </select>
                    ) : null}

                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                  {currentUser.role === "SUPER_ADMIN" ? (
                    <Input
                      value={superAdminTenantId}
                      onChange={(event) => setSuperAdminTenantId(event.target.value)}
                      placeholder="tenant id"
                      className="h-9 w-44"
                    />
                  ) : null}
                  {activeSection === "home" ? (
                    <>
                      <Button type="button" variant="outline" onClick={() => setShowMetrics((prev) => !prev)}>
                        {showMetrics ? "Ocultar indicadores" : "Mostrar indicadores"}
                      </Button>
                    </>
                  ) : null}
                </div>
                </div>
              </CardContent>
            </Card>

            {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            {sectionDataError ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{sectionDataError}</p>
            ) : null}
            {sectionDataLoading && activeSection === "messages" ? (
              <section className="grid gap-4 lg:grid-cols-2">
                <MessagesListSkeleton />
                <MessagesSummarySkeleton />
              </section>
            ) : null}

            {sectionDataLoading && activeSection === "team" ? (
              <section className="grid gap-4 lg:grid-cols-2">
                <TeamListSkeleton />
                <TeamSummarySkeleton />
              </section>
            ) : null}

            {sectionDataLoading && activeSection === "finance" ? (
              <section className="grid gap-4 lg:grid-cols-3">
                <FinanceMetricSkeleton />
                <FinanceMetricSkeleton />
                <FinanceMetricSkeleton />
              </section>
            ) : null}

            {sectionDataLoading && activeSection === "admin" ? <AdminPanelSkeleton /> : null}

            {activeSection === "home" ? (
              <DashboardPage
                metricsSection={showMetrics ? (
              <section className="grid gap-2.5 md:grid-cols-3 lg:grid-cols-7">
                <Card className="border-blue-100 shadow-sm lg:col-span-2">
                  <CardContent className="grid gap-2.5 p-3 md:grid-cols-2">
                    <label className="grid gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Owner
                      <select
                        value={ownerFilter}
                        onChange={(event) => setOwnerFilter(event.target.value)}
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-normal uppercase tracking-normal text-slate-700"
                      >
                        <option value="all">Todos</option>
                        {ownerOptions.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Periodo
                      <select
                        value={periodFilter}
                        onChange={(event) => setPeriodFilter(event.target.value)}
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-normal uppercase tracking-normal text-slate-700"
                      >
                        <option value="all">Todo periodo</option>
                        <option value="7d">Ultimos 7 dias</option>
                        <option value="30d">Ultimos 30 dias</option>
                        <option value="90d">Ultimos 90 dias</option>
                      </select>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs md:col-span-2"
                    >
                      Limpar filtros
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-blue-100 shadow-sm">
                  <CardContent className="space-y-1 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Total no pipeline</p>
                    <p className="text-xl font-semibold text-slate-900">{dashboardData.totalLeads}</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-100 shadow-sm">
                  <CardContent className="space-y-1 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Entrada</p>
                    <p className="text-xl font-semibold text-slate-900">{dashboardData.firstCount}</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-100 shadow-sm">
                  <CardContent className="space-y-1 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Vendido</p>
                    <p className="text-xl font-semibold text-slate-900">{dashboardData.soldCount}</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-100 shadow-sm">
                  <CardContent className="space-y-1 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Perda</p>
                    <p className="text-xl font-semibold text-slate-900">{dashboardData.lostCount}</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-100 shadow-sm">
                  <CardContent className="space-y-1 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Conversao</p>
                    <p className="text-xl font-semibold text-slate-900">{dashboardData.conversion}%</p>
                  </CardContent>
                </Card>
              </section>
                ) : null}
                createLeadSection={<Card className="border-blue-100/90 bg-white shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-base text-slate-900">Novo lead</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleCreateLead} className="grid max-w-[1360px] gap-2 md:grid-cols-12">
                    <Input
                      placeholder="Nome do lead"
                      value={newLead.name}
                      onChange={(event) => setNewLead((prev) => ({ ...prev, name: event.target.value }))}
                      required
                      className="h-9 text-[13px] md:col-span-3"
                    />
                    <Input
                      placeholder="Empresa"
                      value={newLead.company}
                      onChange={(event) => setNewLead((prev) => ({ ...prev, company: event.target.value }))}
                      className="h-9 text-[13px] md:col-span-2"
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newLead.email}
                      onChange={(event) => setNewLead((prev) => ({ ...prev, email: event.target.value }))}
                      className="h-9 text-[13px] md:col-span-2"
                    />
                    <Input
                      placeholder="Telefone"
                      value={newLead.phone}
                      onChange={(event) => setNewLead((prev) => ({ ...prev, phone: event.target.value }))}
                      className="h-9 text-[13px] md:col-span-2"
                    />
                    <Input
                      placeholder="Observacoes"
                      value={newLead.notes}
                      onChange={(event) => setNewLead((prev) => ({ ...prev, notes: event.target.value }))}
                      className="h-9 text-[13px] md:col-span-2"
                    />
                    <Button type="submit" size="sm" className="md:col-span-1" disabled={createLoading || loading}>
                      {createLoading ? "Salvando..." : "Adicionar"}
                    </Button>
                  </form>
                </CardContent>
              </Card>}
                boardSection={<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <section className="overflow-x-auto pb-2">
                  <div className="flex min-w-max gap-3">
                  {boardColumns.map((column) => {
                      const stageLeads = (stageLeadMap.get(column.stageId) ?? []).filter((lead) => {
                        if (!column.dealStatus) {
                          return true;
                        }

                        return (lead.deal?.status ?? "OPEN") === column.dealStatus;
                      });

                      return (
                        <Card key={column.id} className="w-[268px] border-slate-200 bg-[#eef2f7] shadow-sm">
                          <CardHeader className="pb-1.5 pt-2.5">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg leading-none font-semibold text-slate-900">{column.title}</CardTitle>
                              <Badge variant="secondary">{stageLeads.length}</Badge>
                            </div>
                            <p className="pt-1 text-[11px] text-slate-500">{getStageObservationHint(column.stageName)}</p>
                          </CardHeader>
                          <CardContent className="space-y-1.5">
                            <SortableContext items={stageLeads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-2">
                                {stageLeads.map((lead) => (
                                  <LeadCard key={lead.id} lead={lead} stageName={column.stageName} onOpen={openLeadModal} />
                                ))}
                                <StageDropZone stageId={column.stageId} dealStatus={column.dealStatus} />
                              </div>
                            </SortableContext>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              </DndContext>}
              />
            ) : null}

            {activeSection === "messages" && !sectionDataLoading ? (
              <MessagesPage messagesData={messagesPage.messagesData} />
            ) : null}

            {activeSection === "team" && !sectionDataLoading ? (
              <TeamPage
                teamPerformanceData={teamPage.teamPerformanceData}
                ownerStats={ownerStats}
                activePipelineLeadsLength={activePipelineLeads.length}
                busiestStageName={dashboardData.busiestStage?.stageName}
              />
            ) : null}

            {activeSection === "finance" && !sectionDataLoading ? (
              <FinancePage
                wonRevenue={(financePage.dealsReportData?.wonRevenue ?? soldRevenueFromLeads) || estimatedRevenue}
                conversion={dashboardData.conversion}
                wonCount={financePage.dealsReportData?.wonCount ?? 0}
                openCount={financePage.dealsReportData?.openCount ?? dashboardData.lastCount}
                lostCount={financePage.dealsReportData?.lostCount ?? 0}
                formatCurrencyBRL={formatCurrencyBRL}
              />
            ) : null}

            {activeSection === "admin" && !sectionDataLoading && canAccessAdmin ? (
              <AdminPage content={currentUser.role === "SUPER_ADMIN" ? (
                <section className="space-y-4">
                  <Card className="border-blue-100 bg-white/95 shadow-sm">
                    <CardContent className="flex flex-wrap items-center gap-2 p-3">
                      <Button
                        type="button"
                        variant={superAdminPage.adminTab === "users" ? "default" : "outline"}
                        size="sm"
                        onClick={() => superAdminPage.setAdminTab("users")}
                      >
                        Users (Global)
                      </Button>
                      <Button
                        type="button"
                        variant={superAdminPage.adminTab === "tenants" ? "default" : "outline"}
                        size="sm"
                        onClick={() => superAdminPage.setAdminTab("tenants")}
                      >
                        Tenants
                      </Button>
                      <Input
                        placeholder="Buscar por nome ou email"
                        value={superAdminPage.adminUserSearch}
                        onChange={(event) => {
                          superAdminPage.setAdminUserSearch(event.target.value);
                          superAdminPage.setAdminUsersPage(1);
                          superAdminPage.setAdminTenantsPage(1);
                        }}
                        className="h-9 w-full sm:ml-auto sm:max-w-sm"
                      />
                    </CardContent>
                  </Card>

                  {superAdminPage.adminTab === "users" ? (
                    <Card className="border-blue-100 bg-white/95 shadow-sm">
                      <CardHeader>
                        <CardTitle>Usuarios globais</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input
                          placeholder="Filtrar por tenant_id"
                          value={superAdminPage.adminTenantFilter}
                          onChange={(event) => {
                            superAdminPage.setAdminTenantFilter(event.target.value);
                            superAdminPage.setAdminUsersPage(1);
                          }}
                          className="h-9 max-w-xs"
                        />
                        {superAdminPage.globalUsers.map((user) => (
                          <div
                            key={user.user_id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                              <p className="text-xs text-slate-500">Tenant: {user.tenant_name ?? "GLOBAL"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{user.role}</Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => superAdminPage.handleToggleGlobalUser(user.user_id, !user.is_active)}
                              >
                                {user.is_active ? "Desativar" : "Ativar"}
                              </Button>
                            </div>
                          </div>
                        ))}
                        {!superAdminPage.globalUsers.length ? <p className="text-sm text-slate-500">Nenhum usuario encontrado.</p> : null}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500">Total: {superAdminPage.globalUsersTotal}</p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={superAdminPage.adminUsersPage <= 1}
                              onClick={() => superAdminPage.setAdminUsersPage((prev) => Math.max(1, prev - 1))}
                            >
                              Anterior
                            </Button>
                            <span className="text-xs text-slate-600">Pag. {superAdminPage.adminUsersPage}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={superAdminPage.adminUsersPage * 10 >= superAdminPage.globalUsersTotal}
                              onClick={() => superAdminPage.setAdminUsersPage((prev) => prev + 1)}
                            >
                              Proxima
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <section className="grid gap-4 xl:grid-cols-3">
                      <Card className="border-blue-100 bg-white/95 shadow-sm xl:col-span-2">
                        <CardHeader>
                          <CardTitle>Criar tenant (empresa)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={superAdminPage.handleCreateTenant} className="grid gap-3 md:grid-cols-2">
                            <Input
                              placeholder="Company name"
                              value={superAdminPage.newTenant.companyName}
                              onChange={(event) =>
                                superAdminPage.setNewTenant((prev) => ({ ...prev, companyName: event.target.value }))
                              }
                              required
                            />
                            <Input
                              placeholder="CNPJ (opcional)"
                              value={superAdminPage.newTenant.cnpj}
                              onChange={(event) => superAdminPage.setNewTenant((prev) => ({ ...prev, cnpj: event.target.value }))}
                            />
                            <Input
                              placeholder="Email"
                              type="email"
                              value={superAdminPage.newTenant.email}
                              onChange={(event) => superAdminPage.setNewTenant((prev) => ({ ...prev, email: event.target.value }))}
                            />
                            <Input
                              placeholder="Telefone"
                              value={superAdminPage.newTenant.phone}
                              onChange={(event) => superAdminPage.setNewTenant((prev) => ({ ...prev, phone: event.target.value }))}
                            />
                            <label className="grid gap-1 text-sm text-slate-600">
                              Plano
                              <select
                                value={superAdminPage.newTenant.plan}
                                onChange={(event) =>
                                  superAdminPage.setNewTenant((prev) => ({
                                    ...prev,
                                    plan: event.target.value as "BASIC" | "PRO" | "ENTERPRISE",
                                  }))
                                }
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                              >
                                <option value="BASIC">BASIC</option>
                                <option value="PRO">PRO</option>
                                <option value="ENTERPRISE">ENTERPRISE</option>
                              </select>
                            </label>
                            <label className="grid gap-1 text-sm text-slate-600">
                              Status
                              <select
                                value={superAdminPage.newTenant.status}
                                onChange={(event) =>
                                  superAdminPage.setNewTenant((prev) => ({
                                    ...prev,
                                    status: event.target.value as "TRIAL" | "ACTIVE" | "INACTIVE",
                                  }))
                                }
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                              >
                                <option value="TRIAL">TRIAL</option>
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                              </select>
                            </label>
                            <Input
                              placeholder="Nome do admin do tenant"
                              value={superAdminPage.newTenant.adminName}
                              onChange={(event) =>
                                superAdminPage.setNewTenant((prev) => ({ ...prev, adminName: event.target.value }))
                              }
                              required
                            />
                            <Input
                              placeholder="Email do admin do tenant"
                              type="email"
                              value={superAdminPage.newTenant.adminEmail}
                              onChange={(event) =>
                                superAdminPage.setNewTenant((prev) => ({ ...prev, adminEmail: event.target.value }))
                              }
                              required
                            />
                            <Input
                              placeholder="Senha temporaria (opcional)"
                              type="text"
                              value={superAdminPage.newTenant.temporaryPassword}
                              onChange={(event) =>
                                superAdminPage.setNewTenant((prev) => ({ ...prev, temporaryPassword: event.target.value }))
                              }
                            />
                            <div className="md:col-span-2">
                              <Button type="submit" disabled={superAdminPage.createTenantLoading}>
                                {superAdminPage.createTenantLoading ? "Criando..." : "Criar tenant"}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-100 bg-white/95 shadow-sm">
                        <CardHeader>
                          <CardTitle>Resumo global</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-slate-700">
                          <p>Usuarios totais: {adminSummary.totalUsers}</p>
                          <p>Admins: {adminSummary.admins}</p>
                          <p>Gestores: {adminSummary.managers}</p>
                          <p>Sellers: {adminSummary.sellers}</p>
                          <p>Tenants: {superAdminPage.tenantsTotal}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-100 bg-white/95 shadow-sm xl:col-span-3">
                        <CardHeader>
                          <CardTitle>Tenants</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {superAdminPage.tenants.map((tenant) => (
                            <div
                              key={tenant.tenant_id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-900">{tenant.company_name}</p>
                                <p className="text-xs text-slate-500">{tenant.email || "sem email"}</p>
                                <p className="text-xs text-slate-500">Usuarios: {tenant.users_count}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">{tenant.plan}</Badge>
                                <Badge variant="secondary">{tenant.status}</Badge>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    superAdminPage.handleUpdateTenantQuick(tenant.tenant_id, {
                                      status: tenant.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                                    })
                                  }
                                >
                                  {tenant.status === "ACTIVE" ? "Desativar" : "Ativar"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    superAdminPage.handleUpdateTenantQuick(tenant.tenant_id, {
                                      plan:
                                        tenant.plan === "BASIC"
                                          ? "PRO"
                                          : tenant.plan === "PRO"
                                            ? "ENTERPRISE"
                                            : "BASIC",
                                    })
                                  }
                                >
                                  Trocar plano
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => superAdminPage.handleViewTenantUsers(tenant.tenant_id)}
                                >
                                  Ver usuarios
                                </Button>
                              </div>
                            </div>
                          ))}
                          {!superAdminPage.tenants.length ? <p className="text-sm text-slate-500">Nenhum tenant encontrado.</p> : null}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500">Total: {superAdminPage.tenantsTotal}</p>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={superAdminPage.adminTenantsPage <= 1}
                                onClick={() => superAdminPage.setAdminTenantsPage((prev) => Math.max(1, prev - 1))}
                              >
                                Anterior
                              </Button>
                              <span className="text-xs text-slate-600">Pag. {superAdminPage.adminTenantsPage}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={superAdminPage.adminTenantsPage * 10 >= superAdminPage.tenantsTotal}
                                onClick={() => superAdminPage.setAdminTenantsPage((prev) => prev + 1)}
                              >
                                Proxima
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {superAdminPage.selectedTenantId ? (
                        <Card className="border-blue-100 bg-white/95 shadow-sm xl:col-span-3">
                          <CardHeader>
                            <CardTitle>Usuarios do tenant {superAdminPage.selectedTenantId}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {superAdminPage.selectedTenantUsers.map((user) => (
                              <div
                                key={user.user_id}
                                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                  <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{user.role}</Badge>
                                  <Badge variant="secondary">{user.is_active ? "ATIVO" : "INATIVO"}</Badge>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ) : null}
                    </section>
                  )}
                </section>
              ) : (
                <section className="grid gap-4 xl:grid-cols-3">
                  <Card className="border-blue-100 bg-white/95 shadow-sm xl:col-span-2">
                    <CardHeader>
                      <CardTitle>Criar conta de funcionario</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={tenantAdminPage.handleCreateUserAccount} className="grid gap-3 md:grid-cols-2">
                        <Input
                          placeholder="Nome"
                          value={tenantAdminPage.newUser.name}
                          onChange={(event) =>
                            tenantAdminPage.setNewUser((prev) => ({ ...prev, name: event.target.value }))
                          }
                          required
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={tenantAdminPage.newUser.email}
                          onChange={(event) =>
                            tenantAdminPage.setNewUser((prev) => ({ ...prev, email: event.target.value }))
                          }
                          required
                        />
                        <Input
                          placeholder="Senha inicial"
                          type="password"
                          value={tenantAdminPage.newUser.password}
                          onChange={(event) =>
                            tenantAdminPage.setNewUser((prev) => ({ ...prev, password: event.target.value }))
                          }
                          required
                        />
                        <label className="grid gap-1 text-sm text-slate-600">
                          Perfil
                          <select
                            value={tenantAdminPage.newUser.role}
                            onChange={(event) =>
                              tenantAdminPage.setNewUser((prev) => ({ ...prev, role: event.target.value as UserRole }))
                            }
                            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                          >
                            <option value="USER">SELLER</option>
                          </select>
                        </label>
                        <div className="md:col-span-2">
                          <Button type="submit" disabled={tenantAdminPage.createUserLoading}>
                            {tenantAdminPage.createUserLoading ? "Criando..." : "Criar conta"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-100 bg-white/95 shadow-sm">
                    <CardHeader>
                      <CardTitle>Metricas de gestao</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-700">
                      <p>Usuarios totais: {adminSummary.totalUsers}</p>
                      <p>Gestores: {adminSummary.managers}</p>
                      <p>Sellers: {adminSummary.sellers}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-100 bg-white/95 shadow-sm xl:col-span-3">
                    <CardHeader>
                      <CardTitle>Equipe cadastrada</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {tenantAdminPage.managedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{user.role}</Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      ))}
                      {!tenantAdminPage.managedUsers.length ? <p className="text-sm text-slate-500">Nenhum usuario cadastrado.</p> : null}
                    </CardContent>
                  </Card>
                </section>
              )} />
            ) : null}

            {activeSection === "home" && movingLeadId ? <p className="text-sm text-slate-500">Movendo lead...</p> : null}
          </div>
        </section>
      </div>

      {selectedLead && editLead ? (
        <section className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" onClick={closeLeadModal}>
          <Card className="w-full max-w-xl border-blue-100 bg-white" onClick={(event) => event.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Editar lead</CardTitle>
                <Button type="button" variant="ghost" size="icon" onClick={closeLeadModal} aria-label="Fechar modal">
                  x
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateLead} className="space-y-3">
                <label className="grid gap-1 text-sm text-slate-600">
                  Nome
                  <Input
                    value={editLead.name}
                    onChange={(event) => setEditLead((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                    required
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-600">
                    Empresa
                    <Input
                      value={editLead.company}
                      onChange={(event) =>
                        setEditLead((prev) => (prev ? { ...prev, company: event.target.value } : prev))
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-slate-600">
                    Telefone
                    <Input
                      value={editLead.phone}
                      onChange={(event) => setEditLead((prev) => (prev ? { ...prev, phone: event.target.value } : prev))}
                    />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-600">
                    Email
                    <Input
                      type="email"
                      value={editLead.email}
                      onChange={(event) => setEditLead((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-slate-600">
                    Etapa
                    <select
                      value={editLead.stageId}
                      onChange={(event) => setEditLead((prev) => (prev ? { ...prev, stageId: event.target.value } : prev))}
                      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      {editStageOptions.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-600">
                    Resultado
                    <select
                      value={editLead.dealStatus}
                      onChange={(event) =>
                        setEditLead((prev) =>
                          prev ? { ...prev, dealStatus: event.target.value as "" | DealStatus } : prev,
                        )
                      }
                      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    >
                      <option value="">Nao definido</option>
                      <option value="WON">Vendido</option>
                      <option value="LOST">Perda</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm text-slate-600">
                    Valor da venda
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editLead.dealAmount}
                      onChange={(event) =>
                        setEditLead((prev) => (prev ? { ...prev, dealAmount: event.target.value } : prev))
                      }
                      placeholder="Ex: 1000,00"
                    />
                  </label>
                </div>
                <label className="grid gap-1 text-sm text-slate-600">
                  Observacoes
                  <span className="text-xs text-slate-500">{editStageObservationHint}</span>
                  <textarea
                    value={editLead.notes}
                    onChange={(event) => setEditLead((prev) => (prev ? { ...prev, notes: event.target.value } : prev))}
                    placeholder={editStageObservationHint}
                    required
                    className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  />
                </label>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={closeLeadModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={editLoading}>
                    {editLoading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {profileOpen ? (
        <section className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" onClick={() => setProfileOpen(false)}>
          <Card className="w-full max-w-lg border-blue-100 bg-white" onClick={(event) => event.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Perfil do usuario</CardTitle>
                <Button type="button" variant="ghost" size="icon" onClick={() => setProfileOpen(false)} aria-label="Fechar perfil">
                  x
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-3">
                <label className="grid gap-1 text-sm text-slate-600">
                  Nome
                  <Input
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>
                <label className="grid gap-1 text-sm text-slate-600">
                  Email
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-600">
                    Cargo
                    <Input
                      value={profileForm.title}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Ex: SDR"
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-slate-600">
                    Telefone
                    <Input
                      value={profileForm.phone}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar perfil</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  );
}

