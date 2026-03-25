import { useMemo } from "react";
import { DealStatus, Lead, Pipeline } from "@/types/crm";

export type BoardColumn = {
  id: string;
  stageId: string;
  stageName: string;
  title: string;
  dealStatus?: DealStatus;
};

type Params = {
  pipelines: Pipeline[];
  leads: Lead[];
  activePipelineId: string | null;
  ownerFilter: string;
  periodFilter: string;
  timeAnchorMs: number;
  isClosedStageName: (stageName: string) => boolean;
};

function sortByPosition(leads: Lead[]) {
  return [...leads].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

export function useDashboardPageData({
  pipelines,
  leads,
  activePipelineId,
  ownerFilter,
  periodFilter,
  timeAnchorMs,
  isClosedStageName,
}: Params) {
  const activePipeline = useMemo(() => {
    if (!pipelines.length) {
      return null;
    }

    const selected = pipelines.find((pipeline) => pipeline.id === activePipelineId);
    return selected ?? pipelines[0];
  }, [activePipelineId, pipelines]);

  const activePipelineLeads = useMemo(() => {
    if (!activePipeline) {
      return [] as Lead[];
    }

    return leads.filter((lead) => lead.pipelineId === activePipeline.id);
  }, [activePipeline, leads]);

  const ownerOptions = useMemo(() => {
    const ownerMap = new Map<string, string>();
    for (const lead of activePipelineLeads) {
      const ownerName = lead.owner?.name ?? "Owner sem nome";
      ownerMap.set(lead.ownerId, ownerName);
    }

    return [...ownerMap.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activePipelineLeads]);

  const filteredDashboardLeads = useMemo(() => {
    const cutoffMs =
      periodFilter === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : periodFilter === "30d"
          ? 30 * 24 * 60 * 60 * 1000
          : periodFilter === "90d"
            ? 90 * 24 * 60 * 60 * 1000
            : null;

    return activePipelineLeads.filter((lead) => {
      if (ownerFilter !== "all" && lead.ownerId !== ownerFilter) {
        return false;
      }

      if (!cutoffMs) {
        return true;
      }

      const createdAtMs = new Date(lead.createdAt).getTime();
      return Number.isFinite(createdAtMs) && createdAtMs >= timeAnchorMs - cutoffMs;
    });
  }, [activePipelineLeads, ownerFilter, periodFilter, timeAnchorMs]);

  const stageLeadMap = useMemo(() => {
    const map = new Map<string, Lead[]>();

    if (!activePipeline) {
      return map;
    }

    const currentLeads = filteredDashboardLeads.filter((lead) => lead.stageId);

    for (const stage of activePipeline.stages) {
      map.set(stage.id, sortByPosition(currentLeads.filter((lead) => lead.stageId === stage.id)));
    }

    return map;
  }, [activePipeline, filteredDashboardLeads]);

  const boardColumns = useMemo(() => {
    if (!activePipeline) {
      return [] as BoardColumn[];
    }

    return activePipeline.stages
      .slice()
      .sort((a, b) => a.position - b.position)
      .flatMap((stage): BoardColumn[] => {
        if (!isClosedStageName(stage.name)) {
          return [
            {
              id: stage.id,
              stageId: stage.id,
              stageName: stage.name,
              title: stage.name,
              dealStatus: undefined,
            },
          ];
        }

        return [
          {
            id: `${stage.id}:WON`,
            stageId: stage.id,
            stageName: stage.name,
            title: "Vendido",
            dealStatus: "WON",
          },
          {
            id: `${stage.id}:LOST`,
            stageId: stage.id,
            stageName: stage.name,
            title: "Perda",
            dealStatus: "LOST",
          },
        ];
      });
  }, [activePipeline, isClosedStageName]);

  const activeFunnelMetrics = useMemo(() => {
    if (!activePipeline) {
      return [];
    }

    const countByStage = new Map<string, number>();
    for (const lead of filteredDashboardLeads) {
      if (lead.stageId) {
        countByStage.set(lead.stageId, (countByStage.get(lead.stageId) ?? 0) + 1);
      }
    }

    return activePipeline.stages
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((stage) => ({
        stageId: stage.id,
        stageName: stage.name,
        leads: countByStage.get(stage.id) ?? 0,
      }));
  }, [activePipeline, filteredDashboardLeads]);

  const dashboardData = useMemo(() => {
    const closedStageIds = new Set(
      (activePipeline?.stages ?? []).filter((stage) => isClosedStageName(stage.name)).map((stage) => stage.id),
    );

    const soldCount = filteredDashboardLeads.filter((lead) => {
      if (!lead.stageId || !closedStageIds.has(lead.stageId)) {
        return false;
      }

      if (lead.deal?.status === "WON") {
        return true;
      }

      return Number(lead.deal?.amount ?? 0) > 0;
    }).length;

    const lostCount = filteredDashboardLeads.filter(
      (lead) => lead.stageId && closedStageIds.has(lead.stageId) && lead.deal?.status === "LOST",
    ).length;

    const totalLeads = activeFunnelMetrics.reduce((sum, metric) => sum + metric.leads, 0);
    const firstCount = activeFunnelMetrics[0]?.leads ?? 0;
    const fallbackLastCount = activeFunnelMetrics[activeFunnelMetrics.length - 1]?.leads ?? 0;
    const lastCount = soldCount + lostCount > 0 ? soldCount + lostCount : fallbackLastCount;
    const conversion = firstCount > 0 ? ((soldCount / firstCount) * 100).toFixed(1) : "0.0";
    const busiestStage = [...activeFunnelMetrics].sort((a, b) => b.leads - a.leads)[0];

    return {
      totalLeads,
      firstCount,
      lastCount,
      soldCount,
      lostCount,
      conversion,
      busiestStage,
    };
  }, [activeFunnelMetrics, activePipeline?.stages, filteredDashboardLeads, isClosedStageName]);

  const ownerStats = useMemo(() => {
    return ownerOptions.map((owner) => ({
      ...owner,
      leads: activePipelineLeads.filter((lead) => lead.ownerId === owner.id).length,
    }));
  }, [activePipelineLeads, ownerOptions]);

  const estimatedRevenue = useMemo(() => {
    const avgTicket = 5000;
    const openLeads = activePipelineLeads.filter(
      (lead) => lead.stageId !== activePipeline?.stages[activePipeline.stages.length - 1]?.id,
    ).length;
    return openLeads * avgTicket;
  }, [activePipeline, activePipelineLeads]);

  const soldRevenueFromLeads = useMemo(() => {
    return activePipelineLeads
      .filter((lead) => lead.deal?.status === "WON")
      .reduce((sum, lead) => sum + Number(lead.deal?.amount ?? 0), 0);
  }, [activePipelineLeads]);

  return {
    activePipeline,
    activePipelineLeads,
    ownerOptions,
    filteredDashboardLeads,
    stageLeadMap,
    boardColumns,
    activeFunnelMetrics,
    dashboardData,
    ownerStats,
    estimatedRevenue,
    soldRevenueFromLeads,
  };
}
