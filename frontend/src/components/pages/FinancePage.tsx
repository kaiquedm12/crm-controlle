import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FinancePageProps = {
  wonRevenue: number;
  conversion: string;
  wonCount: number;
  openCount: number;
  lostCount: number;
  formatCurrencyBRL: (value: number) => string;
};

export function FinancePage({
  wonRevenue,
  conversion,
  wonCount,
  openCount,
  lostCount,
  formatCurrencyBRL,
}: FinancePageProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card className="border-blue-100 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle>Receita estimada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-slate-900">{formatCurrencyBRL(wonRevenue)}</p>
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle>Conversao atual</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-slate-900">{conversion}%</p>
          <p className="text-xs text-slate-500">Deals ganhos: {wonCount}</p>
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle>Deals abertos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-slate-900">{openCount}</p>
          <p className="text-xs text-slate-500">Deals perdidos: {lostCount}</p>
        </CardContent>
      </Card>
    </section>
  );
}
