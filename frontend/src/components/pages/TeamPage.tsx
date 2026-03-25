import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPerformanceMetric } from "@/types/crm";

type OwnerStat = { id: string; name: string; leads: number };

type TeamPageProps = {
  teamPerformanceData: UserPerformanceMetric[];
  ownerStats: OwnerStat[];
  activePipelineLeadsLength: number;
  busiestStageName?: string;
};

export function TeamPage({
  teamPerformanceData,
  ownerStats,
  activePipelineLeadsLength,
  busiestStageName,
}: TeamPageProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card className="border-blue-100 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle>Distribuicao por owner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamPerformanceData.length
            ? teamPerformanceData.map((user) => (
                <div key={user.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-800">{user.name}</span>
                    <Badge variant="secondary">{user._count.leads} leads</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{user._count.messages} mensagens</p>
                </div>
              ))
            : ownerStats.map((owner) => (
                <div key={owner.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-sm font-medium text-slate-800">{owner.name}</span>
                  <Badge variant="secondary">{owner.leads} leads</Badge>
                </div>
              ))}
          {!teamPerformanceData.length && !ownerStats.length ? (
            <p className="text-sm text-slate-500">Nenhum owner com leads neste pipeline.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle>Resumo da equipe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Total de owners ativos: {teamPerformanceData.length || ownerStats.length}</p>
          <p>
            Leads em acompanhamento: {" "}
            {teamPerformanceData.length
              ? teamPerformanceData.reduce((sum, user) => sum + user._count.leads, 0)
              : activePipelineLeadsLength}
          </p>
          <p>Etapa mais carregada: {busiestStageName ?? "-"}</p>
        </CardContent>
      </Card>
    </section>
  );
}
